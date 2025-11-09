import pandas as pd
from typing import Optional, Union, Tuple



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
        - Optional extra charts if possible: 'radar', 'bubble', 'scatter', 'candlestick (if candlestick, use Ticker column name as title)'. (if candlestick, put the candlestick first in the list)
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
        12. generate at least 10 charts. [important!]
        13. only python code as answer (no string literal) - important!
        14. generate Mixed Chart or a Combo Chart to area charts.
        15. Display charts in a 3-column grid. Wide charts ('area', 'line', 'candlestick') span 2 columns and must be placed beside normal charts.
        If a wide chart starts in one column, the next wide chart should be aligned to another column in the row above.
        """


    #print(f"summary ----->: {summary}")


    return prompt.strip()


def generate_prompt_insight(profile_report: Optional[Union[dict, str, Tuple[str, str]]] = None) -> str:
    """
    Build a prompt for a data scientist LLM from the output of `insight_text`.
    `profile_report` may be:
      - a dict (original ProfileReport JSON),
      - a single string (the full textual summary),
      - a tuple/list of two strings (summary_full, summary_central_tendency).
    Returns a prompt (str).
    """
    summary_parts = []

    if profile_report:
        try:
            # dict case: mimic previous behavior (variables listing)
            if isinstance(profile_report, dict):
                variables = profile_report.get("variables", {})
                resumo = [
                    f"- {col}: type={meta.get('type', 'unknown')}, missing={round(meta.get('p_missing', 0)*100, 1)}%"
                    for col, meta in variables.items()
                ]
                summary_parts.append("ProfileReport variables summary:\n" + "\n".join(resumo))

            # tuple/list of strings: (full_summary, central_tendency_summary)
            elif isinstance(profile_report, (list, tuple)):
                if len(profile_report) >= 1 and profile_report[0]:
                    summary_parts.append("ProfileReport (full):\n" + str(profile_report[0]))
                if len(profile_report) >= 2 and profile_report[1]:
                    summary_parts.append("Central tendency summary:\n" + str(profile_report[1]))

            # single string: treat as full textual summary
            else:
                summary_parts.append("ProfileReport text:\n" + str(profile_report))

        except Exception:
            # If anything goes wrong, continue with whatever we have (avoid breaking)
            pass

    summary_text = "\n\n".join(summary_parts).strip()

    prompt = f"""
You are an experienced data scientist. Read the information below (which comes from a ydata-profiling / ProfileReport summary) and produce a clear, concise, and actionable analysis.
Use non-technical language that a layperson can understand. The idea is that a layperson can understand.
Instructions:
- The output is in json format only! -important!
- Start with 3-6 key takeaways (one-sentence bullets).
- Call out data-quality issues (missingness, duplicates, memory/size concerns) and which columns are affected.
- Highlight important distributions and central-tendency points (means/medians/std) and mention any obvious outliers.
- Report notable correlations or multicollinearity concerns and name the variable pairs.
- Give 3 concrete next steps (e.g., cleaning actions, features to engineer, checks to run) prioritized by impact.
- Keep the whole output short and scannable (use bullets and short paragraphs). Use plain language—avoid excessive jargon.
- generate the content in json format with content keys.
- don't include the "analysis_summary" key in json.
- Don't include the empty keys or objects or arrays.
- create a very well defined hierarchy in JSON.
- dont put ```python or ```json in output. only the pure json code(important!).

Context / ProfileReport content:
{summary_text}

Produce the analysis now.
""".strip()

    return prompt

