import pandas as pd
from typing import Optional


def gerar_prompt_dinamico(df: pd.DataFrame, profile_json: Optional[dict] = None) -> str:
    shape_info = f"The table has {df.shape[0]} rows and {df.shape[1]} columns."
    dtypes_info = df.dtypes.astype(str).to_dict()
    columns_info = "\n".join(f"- {col}: {dtype}" for col, dtype in dtypes_info.items())
    head_preview = df.head(3).to_markdown(index=False)

    summary = ""
    if profile_json:
        try:
            variables = profile_json.get("variables", {})
            resumo = [
                f"- {col}: type={meta.get('type', 'unknown')}, missing={round(meta.get('p_missing', 0)*100, 1)}%"
                for col, meta in variables.items()
            ]
            summary = "\n\nProfileReport summary:\n" + "\n".join(resumo)
        except Exception:
            pass

    prompt = f"""
You are a Python data visualization assistant. A pandas DataFrame named df is available.

{shape_info}
Columns and types:
{columns_info}

Sample data:
{head_preview}
{summary}

Your task is to generate Python code that:

1. Analyzes df (don't create another DataFrame. It's the only one available) and creates a list named `chart_data` with dictionaries formatted for Chart.js.
2. Detect column types:
   - Date columns → time series (line chart).
   - Numeric columns → bar charts, histograms, and correlation heatmaps.
   - Categorical columns → pie charts or bar charts.
3. Include at least 6 different visualizations when possible:
   - **Line charts:** For time series (if a date column exists).
   - **Bar charts:** For numeric vs category and grouped comparisons.
   - **Pie charts:** For category distributions.
   - **Histogram:** For numeric distributions.
   - **Correlation Heatmap:** For numeric correlations (use type 'heatmap').
   - **Box plot:** For numeric spread by category (use type 'boxplot').
4. Clean data before plotting:
   - Convert date columns: df[col] = pd.to_datetime(df[col], errors='coerce')
   - Convert numeric columns: df[col] = pd.to_numeric(df[col], errors='coerce')
   - Drop NaN values in the columns used for each chart.
5. Chart.js structure for each chart:
   chart_data.append({{
       "type": "bar" or "line" or "pie" or "doughnut" or "heatmap" or "boxplot",
       "data": {{
           "labels": [...],
           "datasets": [{{
               "label": "...",
               "data": [...],
               "backgroundColor": ["rgba(75,192,192,0.2)", ...],
               "borderColor": ["rgba(75,192,192,1)", ...],
               "borderWidth": 1
           }}]
       }}
   }})
6. For colors, use simple rgba strings like:
   backgroundColor = "rgba(75, 192, 192, 0.2)"
   borderColor = "rgba(75, 192, 192, 1)"
7. Only include charts with at least 2 valid points.
8. Return only valid Python code (no comments, no markdown).
9. The final result must be a variable `chart_data` (a list of chart dicts).
10. NO COMMENTS, NO EXPLANATIONS, JUST THE CODE.
11. Do not put any ```python``` or ``` tags in the code.
"""



    return prompt.strip()
