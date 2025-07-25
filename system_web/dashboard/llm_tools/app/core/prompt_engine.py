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

At the top of the code "import plotly" especifically in this exactly format: "import plotly"
1. Analyzes df (don't create another DataFrame. It's the only one available) and creates only relevant Plotly visualizations based on the available columns.
2. Detect column types:
   - Date columns → time series and cumulative plots.
   - Numeric columns → histograms, box plots, correlation heatmap.
   - Categorical columns → pie charts and grouped bar charts.
3. Clean data before plotting:
   - Convert date columns: df[col] = pd.to_datetime(df[col], errors='coerce')
   - Convert numeric columns: df[col] = pd.to_numeric(df[col], errors='coerce')
   - Drop NaN values in the columns used for each plot.
4. When plotting:
   - ALWAYS extract columns as Python lists using `.dropna().tolist()`.
   - Example: `x = df['Valor'].dropna().tolist()`
5. Plot rules:
   - **Time Series:** if a date column and a numeric column exist, sort by date, convert date to ISO strings (strftime('%Y-%m-%d')), and plot with `x=date_list, y=numeric_list`.
   - **Box Plot:** use `go.Box` with lists for y-values grouped by category.
   - **Pie Chart:** use `go.Pie(labels=labels_list, values=values_list)`.
   - **Bar Chart:** use `go.Bar(x=categories_list, y=values_list)`.
   - **Correlation Heatmap:** if 2+ numeric columns exist, use `go.Heatmap` with a correlation matrix converted to lists.
6. Only create a plot if there are at least 2 valid data points for it.
7. After creating each figure:
   - Convert it to JSON-safe format using `fig.to_plotly_json()`.
   - Append it to a list called `plot_data` using `plot_data.append(fig.to_plotly_json())`.
8. Return valid Python code only, no explanations or comments.
10. Ensure all generated figures are fully JSON-serializable (no bdata, no non-serializable objects).
11. Exclude columns named 'index' or starting with 'Unnamed' from numeric or categorical analysis.
12. do not put any ```python``` or ```python``` tags in the code or ```.

"""
    return prompt.strip()
