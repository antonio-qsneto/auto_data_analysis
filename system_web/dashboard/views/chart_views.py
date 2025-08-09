# chart_views.py (updated)
import os
import json
import pandas as pd
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv

from dashboard.views.utils import convert_numpy, save_json
from dashboard.views.insights import extract_business_insights
from dashboard.llm_tools.app.core.prompt_engine import gerar_prompt_dinamico
from dashboard.llm_tools.app.core.llm_client import chamar_openrouter, openAI_call
from dashboard.llm_tools.app.core.code_executor import executar_codigo_ia, extrair_codigo_puro

load_dotenv()

def process_data(df):
    business_summary = extract_business_insights(df)
    prompt = gerar_prompt_dinamico(df)
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("API key not configured")
    codigo_raw = chamar_openrouter(prompt, api_key)
    codigo = extrair_codigo_puro(codigo_raw)
    result = executar_codigo_ia(codigo, df)
    charts_serializable = json.loads(json.dumps(result["charts"], default=convert_numpy))
    save_json(charts_serializable)
    return {
        "business_summary": business_summary,
        "stdout": result.get("stdout", ""),
        "charts": charts_serializable
    }

@csrf_exempt
def gerar_chart_view(request):
    from .handle_csv import handle_csv
    return handle_csv(request)

@csrf_exempt
def connect_database(request):
    from .handle_db import get_tables
    return get_tables(request)

@csrf_exempt
def fetch_table_data(request):
    from .handle_db import fetch_and_process_table
    return fetch_and_process_table(request)