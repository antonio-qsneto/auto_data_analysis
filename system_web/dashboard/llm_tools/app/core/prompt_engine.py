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

1. Analyzes df (don't create another DataFrame. It's the only one available) and creates a list named `chart_data` where each element is a dictionary formatted for **ApexCharts**.
2. Detect column types and include at least **6 different chart types** when possible:
   - **Line charts** (type: 'line'): For time series when date columns exist.
   - **Area charts** (type: 'area'): For trends over time.
   - **Bar/Column charts** (type: 'bar' or 'column'): For numeric vs category and grouped comparisons.
   - **Pie charts** (type: 'pie'): For category distributions.
   - **Histogram** (represented as 'bar'): For numeric distributions.
   - **Correlation Heatmap** (type: 'heatmap'): For numeric correlations.
   - **Box & Whisker** (type: 'boxPlot'): For numeric spread by category.
   - Optional extra charts if possible: 'radar', 'bubble', 'scatter', 'candlestick (if candlestick, use Ticker column name as title)'.
3. Clean data before plotting:
   - Convert date columns: df[col] = pd.to_datetime(df[col], errors='coerce')
   - Convert numeric columns: df[col] = pd.to_numeric(df[col], errors='coerce')
   - Drop NaN values in the columns used for each chart.
4. Ignore columns named "index" or columns that are just DataFrame indices.
5. Use only columns with meaningful names for chart labels, series, and axes.
6. Avoid generic names like "series-1", "series-2" unless there is no better label in the data.
7. Use **ApexCharts data structure**:
   For charts like line/bar/area:
   {{
       "type": "line" or "bar" or "area",
       "title": "Chart Title",
       "labels": [...],
       "series": [{{"name": "Label", "data": [...]}}]
   }}
   For pie:
   {{
       "type": "pie",
       "title": "Chart Title",
       "labels": [...],
       "series": [...]
   }}
   For heatmap:
   {{
       "type": "heatmap",
       "title": "Chart Title",
       "series": [
           {{"name": "Row", "data": [{{"x": "Col", "y": value}}, ...]}}
       ]
   }}
   For boxPlot:
   {{
       "type": "boxPlot",
       "title": "Spread of [numeric_column] by [category_column]",
       "series": [
           {{
               "name": "[numeric_column]",
               "data": [
                   {{"x": "<category_value>", "y": [min, q1, median, q3, max]}},
                   ...
               ]
           }}
       ]
   }}
   IMPORTANT: All categories must be included inside ONE single series (not multiple series).
8. Only include charts with at least 2 valid data points.
9. The output must be valid Python code with:
   chart_data = [{{...}}, ...]
10. Do not include comments, explanations, or markdown.
11. Do not wrap code in ``` tags.
"""

    print(f"summary ----->: {summary}")


    return prompt.strip()
