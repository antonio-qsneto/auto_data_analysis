import os
import json
import pandas as pd
import numpy as np # pyright: ignore[reportMissingImports]
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv

from dashboard.llm_tools.app.core.prompt_engine import gerar_prompt_dinamico
from dashboard.llm_tools.app.core.llm_client import chamar_openrouter
from dashboard.llm_tools.app.core.code_executor import executar_codigo_ia, extrair_codigo_puro

load_dotenv()

def convert_numpy(obj):
    """Convert NumPy types to Python native types for JSON serialization."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj)
    elif isinstance(obj, (np.ndarray,)):
        return obj.tolist()
    return obj

@csrf_exempt
def gerar_chart_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        # ✅ Validate file
        if 'file' not in request.FILES:
            return JsonResponse({"error": "No file uploaded"}, status=400)

        uploaded_file = request.FILES['file']
        if not uploaded_file.name.endswith('.csv'):
            return JsonResponse({"error": "Only CSV files allowed"}, status=400)

        # ✅ Load CSV into pandas
        df = pd.read_csv(uploaded_file)
        df = df.reset_index(drop=True)
        df['index'] = df.index

        # ✅ Generate dynamic prompt
        prompt = gerar_prompt_dinamico(df)

        # ✅ Check API key
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            return JsonResponse({"error": "API key not configured"}, status=500)

        # ✅ Call LLM for Python code
        codigo_raw = chamar_openrouter(prompt, api_key)
        codigo = extrair_codigo_puro(codigo_raw)
        print(f"Generated code:\n{codigo}")

        # ✅ Execute code securely
        result = executar_codigo_ia(codigo, df)
        print("Gerou result")

        # ✅ Convert NumPy to Python before sending response
        charts_serializable = json.loads(json.dumps(result["charts"], default=convert_numpy))

        # ✅ Debug: Save output for troubleshooting
        with open("data_output.json", "w") as f:
            json.dump(charts_serializable, f, indent=4)

        return JsonResponse({
            "stdout": result.get("stdout", ""),
            "charts": charts_serializable
        })

    except Exception as e:
        import traceback
        return JsonResponse({
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500)
