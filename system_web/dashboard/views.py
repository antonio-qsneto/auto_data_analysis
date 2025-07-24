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

class UploadCSVForm(forms.Form):
    file = forms.FileField()

def index(request):
    if request.method == "POST":
        form = UploadCSVForm(request.POST, request.FILES)
        if form.is_valid():
            file = form.cleaned_data["file"]
            df = pd.read_csv(file)
            preview_html = df.head(10).to_html(classes="table table-striped", index=False)
            request.session["csv_data"] = df.to_json()
            return render(request, "dashboard/resultado.html", {"preview": preview_html})
    else:
        form = UploadCSVForm()
    return render(request, "dashboard/index.html", {"form": form})

@csrf_exempt
def gerar_plot_view(request):
    if request.method == "POST":
        file = request.FILES.get("file")
        if not file:
            return JsonResponse({"error": "No file uploaded."})
        try:
            df = pd.read_csv(file)
            df = df.reset_index(drop=True)    
            df['index'] = df.index            

            prompt = gerar_prompt_dinamico(df)
            api_key = os.getenv("OPENROUTER_API_KEY")
            print('API Key na View: ', api_key)
            if not api_key:
                return JsonResponse({"error": "OPENROUTER_API_KEY not set."})
            codigo = chamar_openrouter(prompt, api_key=api_key)
            codigo_puro = extrair_codigo_puro(codigo)
            print("Código gerado pela LLM:", codigo_puro)
            plots = executar_codigo_seguro(codigo_puro, df)

            # save plots in a file:
            plots_file = "plots.json"
            with open(plots_file, "w") as f:
                import json
                json.dump(plots, f)
            print("Plots saved to:", plots_file)


            return JsonResponse({"plots": plots})
        except Exception as e:
            return JsonResponse({"error": str(e)})
    return