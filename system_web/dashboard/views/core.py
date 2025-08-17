import os
import json
from dotenv import load_dotenv
from dashboard.views.insights import summarize_business, summarize_text_insights
from dashboard.llm_tools.app.core.prompt_engine import gerar_prompt_dinamico, generate_prompt_insight
from dashboard.llm_tools.app.core.llm_client import call_openRouter, call_openAI
from dashboard.llm_tools.app.core.code_executor import executar_codigo_ia, extrair_codigo_puro
from .utils import convert_numpy, save_json
load_dotenv()

def process_data(df):

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("API key not configured")

    # Business summary (fast central tendency stats)
    business_summary = summarize_business(df)

    # Text insights (ProfileReport -> LLM)
    insight = summarize_text_insights(df)
    insight_prompt = generate_prompt_insight(insight)
    if(insight_prompt):
        print("prompt insight gerado")
    else:
        print(f"Erro no {insight_prompt}")

    insight_raw = call_openRouter(insight_prompt, api_key, "insight")
    if(insight_raw):
        print("call_openRouter gerado")
    else:
        print(f"Erro no {insight_raw}")


    print(f"INSIGHT => {insight_raw}")

    # Charts (generate prompt -> LLM -> code -> execution)
    chart_prompt = gerar_prompt_dinamico(df)
    if(chart_prompt):
        print("prompt principal gerado!")

    codigo_raw = call_openRouter(chart_prompt, api_key, "chart")

    if(codigo_raw):
        print("Codigo gerado!")

    codigo = extrair_codigo_puro(codigo_raw)
    result = executar_codigo_ia(codigo, df)
    if(result):
        print("Codigo executado!")

    charts_serializable = json.loads(
        json.dumps(result["charts"], default=convert_numpy)
    )
    save_json(charts_serializable)

    return {
        "business_summary": business_summary,
        "charts": charts_serializable,
        "insights_text": insight_raw,
        #"stdout": result.get("stdout", ""),
    }
