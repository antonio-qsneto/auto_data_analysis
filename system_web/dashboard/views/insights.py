import json
import pandas as pd
from ydata_profiling import ProfileReport # type: ignore

def extract_business_insights(df: pd.DataFrame) -> str:
    """Generate a textual summary of business insights from a DataFrame."""
    profile = ProfileReport(df, explorative=True, minimal=True)
    profile_data = json.loads(profile.to_json())
    variables = profile_data.get("variables", {})
    correlations = profile_data.get("correlations", {})
    summary_lines = []

    # Correlation
    corr_matrix = correlations.get("pearson", {})
    strongest_corr = None
    max_corr = 0
    for col1, vals in corr_matrix.items():
        for col2, val in vals.items():
            if col1 != col2 and abs(val) > abs(max_corr):
                max_corr = val
                strongest_corr = (col1, col2, val)
    if strongest_corr:
        summary_lines.extend([
            "**1. Correlation Between Variables**",
            f"- Strongest correlation: {strongest_corr[0]} vs {strongest_corr[1]} = {strongest_corr[2]:.2f}",
            "- Business Insight: These variables are highly related.",
            "- Recommendation: Investigate relationship for strategic planning.\n"
        ])

    # Outlier Analysis
    outlier_cols = [(col, meta.get("n_outliers", 0)) for col, meta in variables.items() if meta.get("n_outliers", 0) > 0]
    if outlier_cols:
        summary_lines.append("**2. Outlier Analysis**")
        for col, n_outliers in outlier_cols:
            summary_lines.append(f"- Column \"{col}\": {n_outliers} outliers detected.")
        summary_lines.append("- Insight: Outliers may indicate fraud or errors.\n")

    # Temporal Distribution
    datetime_cols = [col for col, meta in variables.items() if meta.get("type") == "DateTime"]
    if datetime_cols:
        col = datetime_cols[0]
        df[col] = pd.to_datetime(df[col], errors='coerce')
        monthly_counts = df[col].dt.month.value_counts().sort_index()
        if not monthly_counts.empty:
            peak_month = monthly_counts.idxmax()
            peak_value = monthly_counts.max()
            avg_value = monthly_counts.mean()
            summary_lines.extend([
                "**3. Temporal Distribution**",
                f"- Peak activity in month {peak_month} ({peak_value} records, +{int((peak_value-avg_value)/avg_value*100)}% above average).",
                "- Insight: Seasonality detected.\n"
            ])

    # Central Tendency
    numeric_cols = [col for col, meta in variables.items() if meta.get("type") == "Numeric"]
    if numeric_cols:
        col = numeric_cols[0]
        vals = df[col].dropna()
        summary_lines.extend([
            "**4. Central Tendency and Dispersion**",
            f"- {col}: Mean={vals.mean():.2f} | Median={vals.median():.2f} | Std Dev={vals.std():.2f} | Range=({vals.min():.2f}, {vals.max():.2f})\n"
        ])

    return "\n".join(summary_lines)
