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

@csrf_exempt
def gerar_chart_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        # Validate CSV upload
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return JsonResponse({"error": "No file uploaded"}, status=400)
        if not uploaded_file.name.endswith(".csv"):
            return JsonResponse({"error": "Only CSV files allowed"}, status=400)

        # Read CSV
        df = pd.read_csv(uploaded_file).reset_index(drop=True)
        df["index"] = df.index

        # Extract business insights
        business_summary = extract_business_insights(df)

        # Generate prompt and call LLM
        prompt = gerar_prompt_dinamico(df)
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return JsonResponse({"error": "API key not configured"}, status=500)

        codigo_raw = chamar_openrouter(prompt, api_key)
        codigo = extrair_codigo_puro(codigo_raw)
        result = executar_codigo_ia(codigo, df)

        # Serialize charts
        charts_serializable = json.loads(json.dumps(result["charts"], default=convert_numpy))
        save_json(charts_serializable)

        return JsonResponse({
            "business_summary": business_summary,
            "stdout": result.get("stdout", ""),
            "charts": charts_serializable
        })

    except Exception as e:
        import traceback
        return JsonResponse({
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500)
