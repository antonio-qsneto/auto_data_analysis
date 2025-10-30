import pandas as pd

_cached_df = None

def set_dataframe(df: pd.DataFrame):
    global _cached_df
    _cached_df = df.copy()

def get_dataframe() -> pd.DataFrame:
    global _cached_df
    return _cached_df
