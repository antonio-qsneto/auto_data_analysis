from doctest import debug
import os
import time
from dotenv import load_dotenv
from auto_data_analysis import settings
from dashboard.views.insights import summarize_business, summarize_text_insights
from dashboard.llm_tools.app.core.prompt_engine import gerar_prompt_dinamico, generate_prompt_insight
from dashboard.llm_tools.app.core.llm_client import switch_model
from dashboard.llm_tools.app.core.code_executor import executar_codigo_ia, extrair_codigo_puro, executar_codigo_chat
from .utils import convert_numpy, save_json
from dashboard.cache import set_dataframe, get_dataframe
from django.core.cache import cache


# Carrega variáveis de ambiente
load_dotenv()

# --------------------------------------------------------
# Console inteligente com fallback (Rich opcional)
# --------------------------------------------------------
try:
    from rich.console import Console
    from rich.syntax import Syntax
    from rich.traceback import install as rich_install
    from rich.panel import Panel
    rich_install()
    console = Console()
    USE_RICH = True
except Exception:
    console = None
    USE_RICH = False

def debug_print(title=None, content=None, syntax_lang=None, style="bold blue"):
    """Imprime conteúdo com estilo Rich (se disponível)"""
    if not settings.DEBUG:
        return
    if USE_RICH:
        if title:
            console.rule(f"[{style}]{title}[/{style}]")
        if content:
            if syntax_lang:
                console.print(Syntax(content, syntax_lang, theme="monokai", line_numbers=True))
            else:
                console.print(content)
    else:
        if title:
            print(f"==== {title} ====")
        if content:
            print(content)
        print("")

# --------------------------------------------------------
# Contexto global
# --------------------------------------------------------
USER_CHAT_CONTEXT = {}


def process_data(df, model_name="gemini", user=None):
    """
    Processa o DataFrame enviado:
     - Salva no cache (Redis) se o user for informado
     - Gera resumo e insights textuais
     - Gera prompt para gráficos via gerar_prompt_dinamico
     - Chama a LLM para gerar código e executa (com retry automático)
     - Filtra charts inválidos ao invés de falhar todo o processo
     - Desconta crédito apenas se charts válidos forem gerados
    """

    # Salva DataFrame no cache (Redis)
    if user:
        try:
            set_dataframe(df, user.id)
            debug_print("CACHE", f"[DEBUG] DataFrame salvo no Redis para user:{user.id}")
        except Exception as e:
            debug_print("CACHE ERROR", f"[DEBUG] Falha ao salvar DataFrame no cache: {e}")


    df.to_csv(f"user_{user.id}_df.csv", index=False)

    # Seleciona modelo e gera resumos
    model = switch_model(model_name)
    business_summary = summarize_business(df)
    insight = summarize_text_insights(df)
    insight_prompt = generate_prompt_insight(insight)

    try:
        insight_raw = model(insight_prompt) if insight_prompt else ""
    except Exception as e:
        debug_print("INSIGHT ERROR", f"[DEBUG] Erro ao chamar modelo para insights: {e}")
        insight_raw = ""

    # Parâmetros de retry
    MAX_RETRIES = int(os.getenv("LLM_RETRY_COUNT", "3"))
    RETRY_DELAY_SECONDS = float(os.getenv("LLM_RETRY_DELAY_SECONDS", "1.0"))

    last_error = None
    charts_result = None
    codigo_for_debug = None
    raw_from_model = None

    def _is_valid_chart(ch):
        try:
            if not isinstance(ch, dict):
                return False
            if ch.get("type") not in [
                "line", "area", "bar", "column", "pie", "heatmap", 
                "boxPlot", "scatter", "bubble", "radar", "candlestick"
            ]:
                return False
            series = ch.get("series")
            if not isinstance(series, list) or len(series) == 0:
                return False
            for s in series:
                if isinstance(s, dict) and "data" in s and isinstance(s["data"], (list, tuple)) and len(s["data"]) >= 2:
                    return True
                if isinstance(s, (list, tuple)) and len(s) >= 2:
                    return True
            return False
        except Exception:
            return False

    # --- Loop de tentativas ---
    for attempt in range(1, MAX_RETRIES + 1):
        chart_prompt = gerar_prompt_dinamico(df)
        if last_error:
            chart_prompt += (
                "\n\n# Previous attempt failed with error:\n"
                f"{last_error}\n\n"
                "Return valid Python code defining `chart_data` as a list of ApexCharts-compatible dicts."
            )

        debug_print("PROCESS_DATA", f"Attempt {attempt}/{MAX_RETRIES}")

        try:
            raw_from_model = model(chart_prompt)
        except Exception as e:
            last_error = str(e)
            debug_print("LLM ERROR", f"{e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue
            else:
                break

        codigo = extrair_codigo_puro(raw_from_model or "")
        debug_print("CÓDIGO GERADO", codigo, syntax_lang="python")

        try:
            debug_print("Executando código")
            result = executar_codigo_ia(codigo, df)
        except Exception as e:
            result = {"error": str(e), "charts": []}

        if not result or result.get("error") or not result.get("charts"):
            last_error = result.get("error", "unknown error")
            debug_print("RETRY", f"attempt={attempt}, error={last_error}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue
            else:
                break

        try:
            candidate_charts = convert_numpy(result.get("charts", []))
            valid_charts = []
            for ch in candidate_charts:
                if _is_valid_chart(ch):
                    valid_charts.append(ch)
                else:
                    debug_print("CHART INVALIDO", f"[PROCESS_DATA][SKIP] {ch}")

            if len(valid_charts) == 0:
                last_error = "All charts invalid after validation."
                debug_print("PROCESS_DATA", "No valid charts left, retrying...")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SECONDS)
                    continue
                else:
                    break

            charts_result = {"charts": valid_charts}
            debug_print("PROCESS_DATA", f"✅ {len(valid_charts)} valid charts generated on attempt {attempt}")
            break

        except Exception as e:
            last_error = str(e)
            debug_print("VALIDATION ERROR", f"{e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue
            else:
                break

    if not charts_result:
        debug_print("PROCESS_DATA ERROR", f"All {MAX_RETRIES} attempts failed. Last error: {last_error}")
        save_json([])
        return {
            "business_summary": business_summary,
            "charts": [],
            "insights_text": insight_raw,
            "error": "Ocorreu um erro ao processar o arquivo. Tente novamente.",
        }

    try:
        charts_serializable = charts_result["charts"]
        save_json(charts_serializable)

        if user and len(charts_serializable) > 0:
            user.quota = max(0, user.quota - 1)
            user.save()
            debug_print("QUOTA", f"1 crédito descontado do user:{user.id}. Restante: {user.quota}")

    except Exception as e:
        debug_print("PROCESS_DATA SAVE ERROR", f"Falha ao salvar charts: {e}")
        save_json([])
        return {
            "business_summary": business_summary,
            "charts": [],
            "insights_text": insight_raw,
            "error": "Ocorreu um erro ao processar o arquivo. Tente novamente.",
        }

    return {
        "business_summary": business_summary,
        "charts": charts_serializable,
        "insights_text": insight_raw,
    }

def chat_with_data(question: str, user, model_name="gemini"):
    """
    Analisa a pergunta do usuário sobre o dataframe completo já carregado.
    Mantém um histórico de conversa para contexto (por usuário), persistente via Redis.
    """

    df = get_dataframe(user.id)
    if df is None:
        return {"answer": "Nenhuma tabela foi carregada ainda."}

    model = switch_model(model_name)

    MAX_RETRIES = int(os.getenv("LLM_RETRY_COUNT", "3"))
    RETRY_DELAY_SECONDS = float(os.getenv("LLM_RETRY_DELAY_SECONDS", "1.0"))
    MAX_CONTEXT_MESSAGES = 10

    last_error = None
    success_result = None
    codigo_for_debug = None
    raw_from_model = None

    # ✅ Recupera histórico persistente via Redis
    chat_key = f"chat_history_user_{user.id}"
    chat_history = cache.get(chat_key, [])
    if not isinstance(chat_history, list):
        chat_history = []

    # Adiciona nova mensagem do usuário
    chat_history.append({"role": "user", "content": question})
    chat_history = chat_history[-MAX_CONTEXT_MESSAGES:]  # mantém apenas o histórico recente

    for attempt in range(1, MAX_RETRIES + 1):
        system_instructions = """
        You are Xclarity, a data-analysis assistant.
        Use the preloaded DataFrame `df` to answer the user's questions.

        Rules:
        1. Generate only valid and safe Python code.
        2. Use pandas, numpy, and lightweight scikit-learn modules:
        LinearRegression, Ridge, Lasso, LogisticRegression,
        PolynomialFeatures, StandardScaler, MinMaxScaler, Normalizer,
        LabelEncoder, OneHotEncoder, train_test_split
        3. Do not use RandomForest, DecisionTree, SVC, PCA, KMeans, or neural networks.
        4. Always end the code with a print in natural language.
        5. If the question is unrelated to the data, respond with:
        print("For safety reasons, I cannot execute instructions outside the context of the loaded data.")
        6. For simple predictions, use 4th-degree polynomial regression and answer what algorithm was used.
        7. Please answer in the "print" according to the language in which it was asked.
        """

        cols = df.columns.tolist()
        sample = df.head(5).to_dict(orient="records")
        dataset_context = f"\nThe DataFrame has {len(df)} rows and columns: {cols}. Sample data: {sample}\n"

        # Gera prompt com histórico completo
        previous_messages = "\n".join(
            [f"{msg['role'].upper()}: {msg['content']}" for msg in chat_history]
        )

        prompt = (
            f"{system_instructions}\n"
            f"{dataset_context}\n"
            f"Recent history:\n{previous_messages}\n\n"
            f"User just asked: {question}\n"
        )


        if last_error:
            prompt += (
                f"\nThe last attempt failed with the following error:\n{last_error}\n"
                "Fix it and generate only valid code.\n"
            )


        debug_print("PROMPT CHAT", prompt)
        debug_print("CHAT_WITH_DATA", f"Attempt {attempt}/{MAX_RETRIES} - Prompt length: {len(prompt)}")

        try:
            raw_from_model = model(prompt)
        except Exception as e:
            last_error = str(e)
            debug_print("CHAT_WITH_DATA LLM ERROR", f"attempt={attempt} error={e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue
            break

        codigo = extrair_codigo_puro(raw_from_model or "")
        codigo_for_debug = codigo
        debug_print("CÓDIGO PURO", codigo, syntax_lang="python")

        try:
            result = executar_codigo_chat(codigo, df)
        except Exception as e:
            result = {"success": False, "error": str(e), "traceback": None, "stdout": ""}
            debug_print("CHAT_WITH_DATA EXECUTOR ERROR", str(e))

        if result and result.get("success"):
            success_result = result
            break
        else:
            last_error = result.get("traceback") or result.get("error") or "Erro desconhecido"
            debug_print("CHAT_WITH_DATA RETRY", f"attempt={attempt} failed. error: {last_error}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)

    if not success_result:
        debug_print("CHAT_WITH_DATA FAIL", f"Erros após {MAX_RETRIES} tentativas: {last_error}")
        return {"answer": "An error occurred while processing the question. Please try again with a different question."}


    resposta = success_result.get("stdout") or "Code executed with no output."

    # ✅ Atualiza histórico e salva novamente no Redisv
    chat_history.append({"role": "assistant", "content": resposta})
    chat_history = chat_history[-MAX_CONTEXT_MESSAGES:]
    cache.set(chat_key, chat_history, timeout=60 * 60 * 6)  # 1 hora

    debug_print("CHAT HISTORY", chat_history)

    return {"answer": resposta, "debug": {"codigo": codigo_for_debug, "raw": raw_from_model}}