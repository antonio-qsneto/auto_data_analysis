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
2. Based on the data, decide which visualizations are relevant and possible to generate. Only generate plots that make sense for the data provided. Consider the presence of date/time columns, numeric columns, categorical columns, and the overall shape of the data.
3. For each relevant plot type, generate Python code using Plotly to create the visualization. Possible plot types include:
   - Time Series Plot (if a date/time column exists)
   - Box Plot per category (if categorical and numeric columns exist)
   - Correlation Heatmap (if there are at least two numeric columns)
   - Top N Expenses (if there is a column representing expenses)
   - Histogram or KDE (if there are numeric columns)
   - Anomaly Detection (if time series or numeric data is present)
   - Summary Table by category (if categorical columns exist)
   - Cumulative Spending Curve (if time and expense columns exist)
   - Pie Chart by category (if categorical columns exist)

4. If a column contains date or datetime information, always convert it using pd.to_datetime before plotting. For time series plots, set the x-axis type to 'date' using fig.update_xaxes(type='date').
5. Use Plotly only for visualizations. Do NOT use matplotlib or seaborn.
6. Do NOT load the data (df is already defined).
7. Do NOT call plt.show().
8. For each plot, append the Plotly figure object to a list called `plot_data`.
   Example: `plot_data.append(fig)`
9. Return only **valid Python code**, no comments or explanations.
10. Ensure the figures are JSON-serializable.
11. If you need to use the DataFrame index, create a column like `df['index'] = df.index`.
12. Only generate code if there is data to plot; otherwise, skip that plot type.
13. If a for loop is necessary, do not generate several plots—just generate one plot for each type.
14. Import pandas if necessary.

    """
    return prompt.strip()
