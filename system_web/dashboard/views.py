import os
import pandas as pd
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django import forms
from dotenv import load_dotenv


from dashboard.llm_tools.app.core.prompt_engine import gerar_prompt_dinamico
from dashboard.llm_tools.app.core.llm_client import chamar_openrouter
from dashboard.llm_tools.app.utils.plot_utils import executar_codigo_seguro
from dashboard.llm_tools.app.core.code_executor import extrair_codigo_puro

load_dotenv()


def upload_csv(request):
    if request.method == 'POST':
        file = request.FILES.get('file')
        if not file:
            return JsonResponse({"error": "No file provided"}, status=400)

        df = pd.read_csv(file)
        return JsonResponse({
            "columns": df.columns.tolist(),
            "preview": df.head(10).to_dict(orient="records")
        })