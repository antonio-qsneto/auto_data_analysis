import os
import json
import pandas as pd
import numpy as np # pyright: ignore[reportMissingImports]
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv
from ydata_profiling import ProfileReport # pyright: ignore[reportMissingImports]

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

def extract_business_insights(df):
    profile = ProfileReport(df, explorative=True, minimal=True)
    profile_json = profile.to_json()
    profile_data = json.loads(profile_json)
    variables = profile_data.get("variables", {})
    correlations = profile_data.get("correlations", {})
    alerts = profile_data.get("alerts", [])
    summary_lines = []

    # 1. Correlation Between Variables
    corr_matrix = correlations.get("pearson", {})
    strongest_corr = None
    max_corr = 0
    for col1, vals in corr_matrix.items():
        for col2, val in vals.items():
            if col1 != col2 and abs(val) > abs(max_corr):
                max_corr = val
                strongest_corr = (col1, col2, val)
    if strongest_corr:
        summary_lines.append(f"**1. Correlation Between Variables**")
        summary_lines.append(f"- Strongest correlation: {strongest_corr[0]} vs {strongest_corr[1]} = {strongest_corr[2]:.2f}")
        summary_lines.append(f"- Business Insight: These variables are highly related, which may impact business decisions.")
        summary_lines.append(f"- Recommendation: Investigate how changes in one affect the other for strategic planning.\n")

    # 2. Outlier Analysis
    outlier_cols = []
    for col, meta in variables.items():
        n_outliers = meta.get("n_outliers", 0)
        if n_outliers > 0:
            outlier_cols.append((col, n_outliers))
    if outlier_cols:
        summary_lines.append("**2. Outlier Analysis**")
        for col, n_outliers in outlier_cols:
            summary_lines.append(f"- Column \"{col}\": {n_outliers} outliers detected.")
        summary_lines.append("- Insight: Outliers may represent fraud, errors, or special cases.")
        summary_lines.append("- Recommendation: Review these records for validity.\n")

    # 3. Temporal Distribution
    datetime_cols = [col for col, meta in variables.items() if meta.get("type") == "DateTime"]
    if datetime_cols:
        col = datetime_cols[0]
        df[col] = pd.to_datetime(df[col], errors='coerce')
        monthly_counts = df[col].dt.month.value_counts().sort_index()
        peak_month = monthly_counts.idxmax()
        peak_value = monthly_counts.max()
        avg_value = monthly_counts.mean()
        summary_lines.append("**3. Temporal Distribution**")
        summary_lines.append(f"- Peak activity in month {peak_month} ({peak_value} records, +{int((peak_value-avg_value)/avg_value*100)}% above average).")
        summary_lines.append("- Insight: Seasonality or time-based patterns detected.")
        summary_lines.append("- Recommendation: Adjust business strategy for peak periods.\n")

    # 4. Central Tendency and Dispersion
    numeric_cols = [col for col, meta in variables.items() if meta.get("type") == "Numeric"]
    if numeric_cols:
        col = numeric_cols[0]
        vals = df[col].dropna()
        mean = vals.mean()
        median = vals.median()
        std = vals.std()
        minv = vals.min()
        maxv = vals.max()
        summary_lines.append("**4. Central Tendency and Dispersion**")
        summary_lines.append(f"- {col}: Mean={mean:.2f} | Median={median:.2f} | Std Dev={std:.2f} | Range=({minv:.2f}, {maxv:.2f})")
        summary_lines.append("- Insight: Shows customer behavior or pricing consistency.")
        summary_lines.append("- Recommendation: Use these stats to guide pricing or marketing.\n")

    return "\n".join(summary_lines)

@csrf_exempt
def gerar_chart_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        if 'file' not in request.FILES:
            return JsonResponse({"error": "No file uploaded"}, status=400)

        uploaded_file = request.FILES['file']
        if not uploaded_file.name.endswith('.csv'):
            return JsonResponse({"error": "Only CSV files allowed"}, status=400)

        df = pd.read_csv(uploaded_file)
        df = df.reset_index(drop=True)
        df['index'] = df.index

        business_summary = extract_business_insights(df)

        prompt = gerar_prompt_dinamico(df)

        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            return JsonResponse({"error": "API key not configured"}, status=500)

        codigo_raw = chamar_openrouter(prompt, api_key)
        codigo = extrair_codigo_puro(codigo_raw)
        print(f"Generated code:\n{codigo}")

        result = executar_codigo_ia(codigo, df)
        print("Gerou result")

        charts_serializable = json.loads(json.dumps(result["charts"], default=convert_numpy))

        with open("data_output.json", "w") as f:
            json.dump(charts_serializable, f, indent=4)

        print(f"SUMMARY:\n{business_summary}")

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
