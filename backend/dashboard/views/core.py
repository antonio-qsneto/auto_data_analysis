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
    Aplica loop de retry similar ao process_data: re-gera código e re-executa em caso de erro.
    """
    df = get_dataframe(user.id)
    if df is None:
        return {"answer": "Nenhuma tabela foi carregada ainda."}
    
    # Seleciona modelo
    model = switch_model(model_name)
    
    # Parâmetros de retry para geração/executação de código
    MAX_RETRIES = int(os.getenv("LLM_RETRY_COUNT", "3"))
    RETRY_DELAY_SECONDS = float(os.getenv("LLM_RETRY_DELAY_SECONDS", "1.0"))
    last_error = None
    success_result = None
    codigo_for_debug = None
    raw_from_model = None
    
    # Loop de tentativas: re-gera prompt e re-chama o modelo se necessário
    for attempt in range(1, MAX_RETRIES + 1):
        # Gera o prompt base (sempre fresco a partir do df)
        prompt = f"""
        Você é o Xclarity, um assistente de análise de dados.
        O usuário perguntou: "{question}"
        Regras:
        1. Use o DataFrame `df` já carregado.
        2. Gere um código Python válido e funcional.
        3. Não insira comentários, apenas código útil.
        5. Use apenas as bibliotecas: pandas, numpy e os seguintes módulos leves do scikit-learn:
           - LinearRegression, Ridge, Lasso, LogisticRegression
           - PolynomialFeatures
           - StandardScaler, MinMaxScaler, Normalizer
           - LabelEncoder, OneHotEncoder
           - train_test_split
        6. Não use RandomForest, DecisionTree, SVC, PCA, KMeans, nem redes neurais.
        7. Se envolver datas, use pd.to_datetime(..., dayfirst=True).
        8. Sempre finalize o código com um print contendo uma resposta em linguagem natural.
        9. Se a pergunta não tiver relação com os dados, gere uma resposta de que não há relação com os dados.
        10. Nunca desvie de temas relacionados ao DataFrame. Caso o usuário insista, repreenda-o a se manter no tema.
        11. caso use algum modulo do scikit-learn, informar qual foi o algoritmo no print para o usuário.
        13. verifique o formato das datas se são YYYY-MM-DD ou DD-MM-YYYY ou outro formato.
        14. Sempre converta colunas de data para datetime com pd.to_datetime(..., infer_datetime_format=True, errors='coerce') antes de usá-las em operações.
        15. Escolha sabiamente qual algoritmo melhor se aplica aos dados, como regressão linear ou função polnomial dentre outros.
        16. Caso a pergunta não requeira código, não o faça.
        17. Jamais gere código que possa travar, rodar indefinidamente, ou consumir recursos excessivos (ex: loops infinitos, recursões sem limite, criação de grandes listas, leitura/escrita de disco, chamadas de rede ou APIs externas). 
        Caso o usuário solicite algo fora do contexto de análise do DataFrame, rejeite educadamente com uma mensagem do tipo: 
        print("Por segurança, não posso executar instruções fora do contexto dos dados carregados.")
        """
        cols = df.columns.tolist()
        sample = df.head(5).to_dict(orient="records")
        prompt += f"\nO DataFrame tem {len(df)} linhas e colunas: {cols}. Exemplo de dados: {sample}\n"
        
        # Se houve erro na tentativa anterior, anexamos contexto resumido
        if last_error:
            prompt += (
                "\n\n# Previous execution attempt failed with the following error (short):\n"
                f"{last_error}\n\n"
                "Please return only valid Python code that prints a natural language response. "
                "No explanation, no markdown."
            )
        
        if settings.DEBUG:
            print(f"[CHAT_WITH_DATA] Attempt {attempt}/{MAX_RETRIES} - Prompt length: {len(prompt)}")
        
        # Chamada ao LLM para gerar código
        try:
            raw_from_model = model(prompt)
        except Exception as e:
            # Erro ao chamar a LLM — log apenas em DEBUG e tentar novamente
            if settings.DEBUG:
                print(f"[CHAT_WITH_DATA][LLM CALL ERROR] attempt={attempt} error={e}")
            last_error = str(e)
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue
            else:
                break
        
        # Extrai o código puro recebido
        codigo = extrair_codigo_puro(raw_from_model or "")
        codigo_for_debug = codigo
        if settings.DEBUG:
            print(" ----------------- CODIGO PURO CHAT IA (attempt %s) -----------------" % attempt)
            print(codigo)
            print(" --------------------------------------------------------------------")
        
        # Executa o código de forma controlada
        try:
            result = executar_codigo_chat(codigo, df)
        except Exception as e:
            # Em teoria executar_codigo_chat já captura tracebacks e coloca em result["error"],
            # mas caso ela próprio lance exceção, tratamos aqui
            result = {"success": False, "error": str(e), "traceback": None, "stdout": ""}
            if settings.DEBUG:
                print(f"[CHAT_WITH_DATA][EXECUTOR EXCEPTION] attempt={attempt} error={e}")
        
        # Verifica resultado
        if result and result.get("success"):
            success_result = result
            if settings.DEBUG:
                print(f"[CHAT_WITH_DATA] Success on attempt {attempt}")
            break
        else:
            # coleta erro/trace para contexto da próxima tentativa
            last_error = result.get("traceback") or result.get("error") or "Unknown execution error"
            if settings.DEBUG:
                print(f"[CHAT_WITH_DATA][RETRY] attempt={attempt} failed. error: {last_error}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue
    
    # Pós-loop: sucesso ou falha final
    if not success_result:
        # Log detalhado apenas em DEBUG
        if settings.DEBUG:
            print(f"[CHAT_WITH_DATA][ERROR] All {MAX_RETRIES} attempts failed.")
            print(f"Last error (short): {last_error}")
            if codigo_for_debug:
                print("Último código enviado para execução:")
                print(codigo_for_debug)
        # Mensagem genérica para o frontend — sem dados técnicos
        generic_error_msg = "Ocorreu um erro ao processar a pergunta. Tente novamente com uma pergunta mais simples."
        return {"answer": generic_error_msg, "debug": {"codigo": codigo_for_debug, "raw": raw_from_model}}
    
    # Caso de sucesso: usa o stdout como resposta
    resposta = success_result.get("stdout") or "Código executado sem saída detalhada."
    return {"answer": resposta, "debug": {"codigo": codigo_for_debug, "raw": raw_from_model}}