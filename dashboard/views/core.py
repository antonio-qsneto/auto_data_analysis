from dotenv import load_dotenv
from dashboard.views.insights import summarize_business, summarize_text_insights
from dashboard.llm_tools.app.core.prompt_engine import gerar_prompt_dinamico, generate_prompt_insight
from dashboard.llm_tools.app.core.llm_client import switch_model
from dashboard.llm_tools.app.core.code_executor import executar_codigo_ia, extrair_codigo_puro
from .utils import convert_numpy, save_json
load_dotenv()



def process_data(df, model_name="gemini"):
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
        insight_raw = "" # Garante que insight_raw seja uma string

    print(f"INSIGHT => {insight_raw}")

    # Charts (generate prompt -> LLM -> code -> execution)
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