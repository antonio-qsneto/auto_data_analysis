import os
import time
from dotenv import load_dotenv
from auto_data_analysis import settings
from dashboard.views.insights import summarize_business, summarize_text_insights
from dashboard.llm_tools.app.core.prompt_engine import gerar_prompt_dinamico, generate_prompt_insight
from dashboard.llm_tools.app.core.llm_client import switch_model
from dashboard.llm_tools.app.core.code_executor import executar_codigo_ia, extrair_codigo_puro, executar_codigo_chat
from .utils import convert_numpy, save_json
from dashboard.cache import set_dataframe
from dashboard.cache import get_dataframe
load_dotenv()

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
            if settings.DEBUG:
                print(f"[DEBUG] DataFrame salvo no Redis para user:{user.id}")
        except Exception as e:
            if settings.DEBUG:
                print(f"[DEBUG] Falha ao salvar DataFrame no cache: {e}")

    # Seleciona modelo e gera resumos
    model = switch_model(model_name)
    business_summary = summarize_business(df)
    insight = summarize_text_insights(df)
    insight_prompt = generate_prompt_insight(insight)

    try:
        insight_raw = model(insight_prompt) if insight_prompt else ""
    except Exception as e:
        if settings.DEBUG:
            print(f"[DEBUG] Erro ao chamar modelo para insights: {e}")
        insight_raw = ""

    # Parâmetros de retry
    MAX_RETRIES = int(os.getenv("LLM_RETRY_COUNT", "3"))
    RETRY_DELAY_SECONDS = float(os.getenv("LLM_RETRY_DELAY_SECONDS", "1.0"))

    last_error = None
    charts_result = None
    codigo_for_debug = None
    raw_from_model = None

    # --- Validador de charts seguros ---
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

        if settings.DEBUG:
            print(f"[PROCESS_DATA] Attempt {attempt}/{MAX_RETRIES}")

        # Geração de código
        try:
            raw_from_model = model(chart_prompt)
        except Exception as e:
            last_error = str(e)
            if settings.DEBUG:
                print(f"[LLM ERROR] {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue
            else:
                break

        # Extração e execução
        codigo = extrair_codigo_puro(raw_from_model or "")
        codigo_for_debug = codigo

        try:
            result = executar_codigo_ia(codigo, df)
        except Exception as e:
            result = {"error": str(e), "charts": []}

        # Se charts vieram vazios, tenta novamente
        if not result or result.get("error") or not result.get("charts"):
            last_error = result.get("error", "unknown error")
            if settings.DEBUG:
                print(f"[RETRY] attempt={attempt}, error={last_error}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue
            else:
                break

        # Converte e filtra charts válidos
        try:
            candidate_charts = convert_numpy(result.get("charts", []))
            valid_charts = []
            for ch in candidate_charts:
                if _is_valid_chart(ch):
                    valid_charts.append(ch)
                elif settings.DEBUG:
                    print(f"[PROCESS_DATA][SKIP] Invalid chart removed: {ch}")

            if len(valid_charts) == 0:
                last_error = "All charts invalid after validation."
                if settings.DEBUG:
                    print("[PROCESS_DATA] No valid charts left, retrying...")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SECONDS)
                    continue
                else:
                    break

            charts_result = {"charts": valid_charts}
            if settings.DEBUG:
                print(f"[PROCESS_DATA] ✅ {len(valid_charts)} valid charts generated on attempt {attempt}")
            break

        except Exception as e:
            last_error = str(e)
            if settings.DEBUG:
                print(f"[VALIDATION ERROR] {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue
            else:
                break

    # --- Pós-loop ---
    if not charts_result:
        if settings.DEBUG:
            print(f"[PROCESS_DATA][ERROR] All {MAX_RETRIES} attempts failed. Last error: {last_error}")
        save_json([])  # salva JSON vazio para evitar crash do dashboard
        return {
            "business_summary": business_summary,
            "charts": [],
            "insights_text": insight_raw,
            "error": "Ocorreu um erro ao processar o arquivo. Tente novamente.",
        }

    # --- Sucesso ---
    try:
        charts_serializable = charts_result["charts"]
        save_json(charts_serializable)

        # Desconta crédito apenas se houve charts válidos
        if user and len(charts_serializable) > 0:
            user.quota = max(0, user.quota - 1)
            user.save()
            if settings.DEBUG:
                print(f"[QUOTA] 1 crédito descontado do user:{user.id}. Restante: {user.quota}")

    except Exception as e:
        if settings.DEBUG:
            print(f"[PROCESS_DATA][ERROR] Falha ao salvar charts: {e}")
        save_json([])
        return {
            "business_summary": business_summary,
            "charts": [],
            "insights_text": insight_raw,
            "error": "Ocorreu um erro ao processar o arquivo. Tente novamente.",
        }

    # Retorno final
    return {
        "business_summary": business_summary,
        "charts": charts_serializable,
        "insights_text": insight_raw,
    }





def chat_with_data(question: str, user, model_name="gemini"):
    """
    Analisa a pergunta do usuário sobre o dataframe completo já carregado.
    Mantém um histórico de conversa para contexto (por usuário).
    """

    df = get_dataframe(user.id)
    if df is None:
        return {"answer": "Nenhuma tabela foi carregada ainda."}

    # Seleciona modelo
    model = switch_model(model_name)

    # Limites e controle
    MAX_RETRIES = int(os.getenv("LLM_RETRY_COUNT", "3"))
    RETRY_DELAY_SECONDS = float(os.getenv("LLM_RETRY_DELAY_SECONDS", "1.0"))
    MAX_CONTEXT_MESSAGES = 10  # 🔒 limite de histórico por segurança

    last_error = None
    success_result = None
    codigo_for_debug = None
    raw_from_model = None

    # ✅ Recupera o histórico anterior (por usuário)
    chat_history = USER_CHAT_CONTEXT.get(user.id, [])

    # Adiciona a nova pergunta ao histórico
    chat_history.append({"role": "user", "content": question})

    # Mantém o histórico recente (limite de 10)
    chat_history = chat_history[-MAX_CONTEXT_MESSAGES:]

    # Loop de tentativas de execução
    for attempt in range(1, MAX_RETRIES + 1):
        # Base do prompt com instruções fixas
        system_instructions = """
        Você é o Xclarity, um assistente de análise de dados.
        Use o DataFrame `df` já carregado para responder perguntas do usuário.
        Regras:
        1. Gere apenas código Python válido e seguro.
        2. Use pandas, numpy e módulos leves do scikit-learn:
           LinearRegression, Ridge, Lasso, LogisticRegression,
           PolynomialFeatures, StandardScaler, MinMaxScaler, Normalizer,
           LabelEncoder, OneHotEncoder, train_test_split
        3. Não use RandomForest, DecisionTree, SVC, PCA, KMeans ou redes neurais.
        4. Sempre finalize o código com um print em linguagem natural.
        5. Se a pergunta não tiver relação com os dados, responda:
           print("Por segurança, não posso executar instruções fora do contexto dos dados carregados.")
        """

        # Adiciona amostra dos dados para o contexto
        cols = df.columns.tolist()
        sample = df.head(5).to_dict(orient="records")
        dataset_context = f"\nO DataFrame tem {len(df)} linhas e colunas: {cols}. Exemplo de dados: {sample}\n"

        # Monta o prompt incluindo histórico anterior
        previous_messages = "\n".join(
            [f"{msg['role'].upper()}: {msg['content']}" for msg in chat_history]
        )

        prompt = f"{system_instructions}\n{dataset_context}\nHistórico recente:\n{previous_messages}\n\nUsuário perguntou agora: {question}\n"

        if last_error:
            prompt += f"\nA última tentativa falhou com o erro:\n{last_error}\nCorrija e gere apenas código válido.\n"

        if settings.DEBUG:
            print(" ------------ [Prompt chat] --------------")
            print(prompt)
            print(f"[CHAT_WITH_DATA] Attempt {attempt}/{MAX_RETRIES} - Prompt length: {len(prompt)}")

        # Gera resposta via LLM
        try:
            raw_from_model = model(prompt)
        except Exception as e:
            last_error = str(e)
            if settings.DEBUG:
                print(f"[CHAT_WITH_DATA][LLM ERROR] attempt={attempt} error={e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue
            break

        # Extrai código puro e executa
        codigo = extrair_codigo_puro(raw_from_model or "")
        codigo_for_debug = codigo

        if settings.DEBUG:
            print(" ---------------- CODIGO PURO ----------------")
            print(codigo)
            print("----------------------------------------------")

        try:
            result = executar_codigo_chat(codigo, df)
        except Exception as e:
            result = {"success": False, "error": str(e), "traceback": None, "stdout": ""}
            if settings.DEBUG:
                print(f"[CHAT_WITH_DATA][EXECUTOR ERROR] {e}")

        if result and result.get("success"):
            success_result = result
            break
        else:
            last_error = result.get("traceback") or result.get("error") or "Erro desconhecido"
            if settings.DEBUG:
                print(f"[CHAT_WITH_DATA][RETRY] attempt={attempt} failed. error: {last_error}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)

    # ✅ Pós-tentativa
    if not success_result:
        if settings.DEBUG:
            print(f"[CHAT_WITH_DATA][FAIL] Erros após {MAX_RETRIES} tentativas: {last_error}")
        return {"answer": "Ocorreu um erro ao processar a pergunta. Tente novamente com outra pergunta."}

    resposta = success_result.get("stdout") or "Código executado sem saída."

    # ✅ Atualiza histórico com a resposta
    chat_history.append({"role": "assistant", "content": resposta})
    USER_CHAT_CONTEXT[user.id] = chat_history[-MAX_CONTEXT_MESSAGES:]

    return {"answer": resposta, "debug": {"codigo": codigo_for_debug, "raw": raw_from_model}}