import json
import pandas as pd
from ydata_profiling import ProfileReport  # type: ignore


def summarize_business(df) -> str:
    summary_lines = []

    excluded_cols = {"id", "index", "idx", "rowid", "Unnamed: 0"}
    numeric_cols = [
        c for c in df.columns
        if pd.api.types.is_numeric_dtype(df[c]) and c.lower() not in excluded_cols
    ]

    # Caso não haja colunas numéricas úteis
    if not numeric_cols:
        summary_lines.append("**Central Tendency and Dispersion**")
        summary_lines.append("No numeric columns detected (excluding ID and index).")
        return "\n".join(summary_lines)

    # ✅ Pega a primeira coluna numérica válida
    col = numeric_cols[0]
    vals = df[col].dropna()

    summary_lines.extend([
        "**Central Tendency and Dispersion**",
        f"- {col}: Mean={vals.mean():.2f} | Median={vals.median():.2f} | "
        f"Std Dev={vals.std():.2f} | Range=({vals.min():.2f}, {vals.max():.2f})\n"
    ])

    return "\n".join(summary_lines)


def summarize_text_insights(df: pd.DataFrame, include_index: bool = False) -> str:
    df_to_profile = df.copy()

    if not include_index:
        
        df_to_profile = df_to_profile.reset_index(drop=True)

        
        possible_index_cols = ["Unnamed: 0", "Unnamed:0", "index", "Index"]
        cols_to_drop = [c for c in possible_index_cols if c in df_to_profile.columns]
        if cols_to_drop:
            df_to_profile = df_to_profile.drop(columns=cols_to_drop)

    def extract_table_summary(j):
        t = j.get("table", {}) or {}
        parts = []
        if "n_rows" in t: parts.append(f"rows: {t['n_rows']}")
        if "n_columns" in t: parts.append(f"columns: {t['n_columns']}")
        if "n_cells" in t: parts.append(f"cells: {t['n_cells']}")
        if "n_duplicates" in t: parts.append(f"duplicate rows: {t['n_duplicates']}")
        if "memory_size" in t:
            mem = t["memory_size"]
            units = ["B", "KB", "MB", "GB", "TB"]
            i = 0
            while mem >= 1024 and i < len(units) - 1:
                mem /= 1024
                i += 1
            parts.append(f"memory: {mem:.2f} {units[i]}")
        if "missing_cells_percent" in t:
            parts.append(f"missing (%) : {t['missing_cells_percent']}")
        return "\n".join(parts) if parts else "No table metadata."

    def extract_variables_summary(j, max_vars=20):
        vars_d = j.get("variables") or {}
        lines = [f"Variables: {len(vars_d)}"]
        for name, vinfo in list(vars_d.items())[:max_vars]:
            typ = vinfo.get("type", "unknown")
            lines.append(f"  - name={name}, type={typ}")
        return "\n".join(lines)

    def extract_correlations_summary(j, threshold=0.7, max_pairs=20):
        corr_section = j.get("correlations") or {}
        if not corr_section:
            return "No correlations computed."
        pairs = []
        for method, matrix in corr_section.items():
            if isinstance(matrix, dict):
                keys = list(matrix.keys())
                for i, a in enumerate(keys):
                    for b in keys[i+1:]:
                        v = matrix.get(a, {}).get(b) or matrix.get(b, {}).get(a)
                        if v is None:
                            try:
                                v = matrix[a][b]
                            except Exception:
                                v = None
                        if v is not None and abs(v) >= threshold:
                            pairs.append((method, a, b, v))
        if not pairs:
            return f"No correlations above {threshold}."
        pairs = sorted(pairs, key=lambda x: -abs(x[3]))[:max_pairs]
        return "\n".join([f"{a} <> {b} [{m}] = {v:.4f}" for m, a, b, v in pairs])

    def extract_alerts(j):
        alerts = j.get("alerts") or []
        return "\n".join(map(str, alerts)) if alerts else "No alerts."

    profile = ProfileReport(df_to_profile, title="Data Summary", explorative=False)
    j = json.loads(profile.to_json())

    summary_full = "\n\n".join([
        "=== Dataset summary ===",
        extract_table_summary(j),
        "\n=== Variables summary (sample) ===",
        extract_variables_summary(j, max_vars=50),
        "\n=== Correlations ===",
        extract_correlations_summary(j, threshold=0.7, max_pairs=50),
        "\n=== Alerts / Warnings ===",
        extract_alerts(j)
    ])
    return summary_full
