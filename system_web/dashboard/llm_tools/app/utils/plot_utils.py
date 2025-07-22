# app/utils/plot_utils.py
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import numpy as np

def convert_ndarray(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_ndarray(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_ndarray(v) for v in obj]
    else:
        return obj

def executar_codigo_seguro(codigo: str, df: pd.DataFrame) -> list[dict]:
    import plotly.graph_objs as go
    import plotly.express as px

    namespace = {
        "df": df,
        "px": px,
        "go": go,
        "plot_data": []
    }
    try:
        exec(codigo, namespace)
        result = []
        for plot in namespace["plot_data"]:
            if isinstance(plot, dict):
                result.append(convert_ndarray(plot))
            elif hasattr(plot, "to_plotly_json"):
                result.append(convert_ndarray(plot.to_plotly_json()))
            else:
                result.append({"error": "Invalid plot object. Must be Plotly figure or dict."})
        return result
    except Exception as e:
        return [{"error": str(e)}]