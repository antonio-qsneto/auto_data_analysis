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
You are a data scientist assistant.
A table was uploaded and is available as a pandas DataFrame named `df`.

{shape_info}
Columns and types:
{columns_info}

Preview of first rows:
{head_preview}
{summary}

Your task:
1. Analyze the structure and content of `df`.
2. If appropriate based on shape and columns, generate Python code to create visualizations:
   - Time Series Plot (if date/time column exists)
   - Box Plot per category
   - Correlation Heatmap
   - Top N Expenses
   - Histogram or KDE
   - Anomaly Detection
   - Summary Table by category
   - Cumulative Spending Curve
   - Pie Chart by category

3. Generate Python code for data visualization using Plotly only. Do not use matplotlib or seaborn.
4. Do NOT load the data (df is already defined).
5. Do NOT call plt.show().
6. For each plot, append the Plotly figure object (not a dict) to a list called plot_data.
   Example: plot_data.append(fig)
7. Return only valid Python code. Not comments or explanations.
8. Use plotly for plots, and ensure they are JSON-serializable.
9. If you want to use the DataFrame index as x or y, first reset the index or assign it to a new column (e.g., df['index'] = df.index), then use that column name in the plot.
10. Do not use x='index' unless 'index' is a column in df.
    """
    return prompt.strip()
