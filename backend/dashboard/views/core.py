from dotenv import load_dotenv
from dashboard.views.insights import summarize_business, summarize_text_insights
from dashboard.llm_tools.app.core.prompt_engine import gerar_prompt_dinamico, generate_prompt_insight
from dashboard.llm_tools.app.core.llm_client import switch_model
from dashboard.llm_tools.app.core.code_executor import executar_codigo_ia, extrair_codigo_puro
from .utils import convert_numpy, save_json
from dashboard.cache import set_dataframe
from dashboard.cache import get_dataframe
load_dotenv()



def process_data(df, model_name="gemini"):
    set_dataframe(df)
    model = switch_model(model_name)

    business_summary = summarize_business(df)

    insight = summarize_text_insights(df)
    insight_prompt = generate_prompt_insight(insight)
    if(insight_prompt):
        print("prompt insight gerado")
        print(insight_prompt)
        print(f"Tamanho do prompt: {len(insight_prompt)} caracteres")
    else:
        print(f"Erro no {insight_prompt}")

    try:
        insight_raw = model(insight_prompt)
    except Exception as e:
        print(f"[DEBUG] Erro ao chamar Gemini: {e}")
        insight_raw = ""


    print("insight_raw: ", insight_raw)
    if(insight_raw):
        print("model gerado para insights")
    else:
        print(f"Erro no {insight_raw}")
        insight_raw = ""

    print(f"INSIGHT => {insight_raw}")

    chart_prompt = gerar_prompt_dinamico(df)
    if(chart_prompt):
        print("prompt principal gerado!")

    codigo_raw = model(chart_prompt)

    if(codigo_raw):
        print("Codigo gerado!")

    codigo = extrair_codigo_puro(codigo_raw or "")

    print("------------------------ CODIGO ------------------------")
    print(codigo)
    print("--------------------------------------------------------")

    result = executar_codigo_ia(codigo, df)
    if(result):
        print("Codigo executado!")

    charts_serializable = convert_numpy(result["charts"])
    save_json(charts_serializable)

    return {
        "business_summary": business_summary,
        "charts": charts_serializable,
        "insights_text": insight_raw,
    }




def chat_with_data(question: str, model_name="gemini"):
    """
    Analisa a pergunta do usuário sobre o dataframe completo já carregado.
    Retorna a resposta (texto) e debug opcional.
    """
    df = get_dataframe()
    if df is None:
        return {"answer": "Nenhuma tabela foi carregada ainda."}

    model = switch_model(model_name)

    # Prompt de orientação ao modelo
    prompt = f"""
        Você é um assistente de análise de dados. 
        O usuário perguntou: "{question}"

        Regras:
        1. Use o DataFrame `df` já carregado.
        2. Gere um pequeno código Python entre os delimitadores abaixo, se necessário:
        ```python
        # BEGIN_CODE
        ...
        # END_CODE
        Se não for preciso código, responda diretamente com o resultado calculado.

        Use pandas e numpy apenas.

        Se envolver datas, use pd.to_datetime(..., dayfirst=True).
        """

    cols = df.columns.tolist()
    sample = df.head(5).to_dict(orient="records")
    prompt += f"\nO DataFrame tem {len(df)} linhas e colunas: {cols}. Exemplo de dados: {sample}\n"

    raw = model(prompt)
    codigo = extrair_codigo_puro(raw or "")
    if codigo:
        result = executar_codigo_ia(codigo, df)
        resposta = result.get("stdout") or result.get("answer") or "Código executado sem saída."
    else:
        resposta = raw
    return {"answer": resposta, "debug": {"codigo": codigo, "raw": raw}}