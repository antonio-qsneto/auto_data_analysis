import pandas as pd
import json
import datetime
from bson import ObjectId, Decimal128
from dateutil import parser as date_parser
from typing import Any, Dict, List, Callable, Optional, Union

# ---------- Helpers BSON -> JSON primitivos ----------
def _convert_bson_value(v: Any) -> Any:
    """Converte tipos BSON comuns para tipos JSON/python simples."""
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, Decimal128):
        try:
            return float(v.to_decimal())
        except Exception:
            return str(v)
    if isinstance(v, datetime.datetime):
        # padroniza ISO
        return v.isoformat()
    if isinstance(v, dict):
        return {k: _convert_bson_value(val) for k, val in v.items()}
    if isinstance(v, list):
        return [_convert_bson_value(i) for i in v]
    # tipos primitivos
    return v

# ---------- Flatten dict recursion ----------
def _flatten_dict(d: Dict[str, Any], parent_key: str = "", sep: str = "_", max_depth: int = 10) -> Dict[str, Any]:
    """
    Flattens nested dicts into {parent_child: value}. Does NOT explode arrays.
    """
    items = {}
    if max_depth < 0:
        return {parent_key: d} if parent_key else d
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.update(_flatten_dict(v, new_key, sep=sep, max_depth=max_depth-1))
        else:
            items[new_key] = v
    return items

# ---------- List handling strategies ----------
def _handle_list_field(lst: List[Any], strategy: str = "most_recent", date_key_candidates: List[str] = None) -> Dict[str, Any]:
    """
    Recebe uma lista e retorna um dict com campos resumo dependendo da strategy.
    Strategies:
     - 'most_recent': tenta escolher o item com maior date (se objetos com 'date'/'timestamp'), retorna its flattened fields with suffix _most
     - 'first': pega o primeiro elemento (flattened)
     - 'count': retorna {'<field>_count': len(lst)}
     - 'json': retorna {'<field>_json': json.dumps(lst)}
     - 'aggregate': cria agregações simples (count, maybe avg for numeric keys)
    """
    date_key_candidates = date_key_candidates or ["date", "timestamp", "created_at"]
    out = {}
    if not isinstance(lst, list) or len(lst) == 0:
        return {"_list_len": 0}

    out["_list_len"] = len(lst)

    # If elements are dict-like and strategy is 'most_recent'
    if strategy == "most_recent":
        # find element with max date if possible
        def _parse_date(x):
            for k in date_key_candidates:
                if isinstance(x, dict) and k in x:
                    try:
                        return date_parser.parse(x[k]) if isinstance(x[k], str) else x[k]
                    except Exception:
                        pass
            return None

        dated = [(item, _parse_date(item)) for item in lst if isinstance(item, dict)]
        dated_with_date = [(it, dt) for (it, dt) in dated if dt is not None]
        if dated_with_date:
            most = max(dated_with_date, key=lambda t: t[1])[0]
        else:
            # fallback to last item
            most = lst[-1]

        if isinstance(most, dict):
            flat = _flatten_dict({f"most": most}, parent_key="", sep="_")
            # prefix fields with 'list_most_'
            for k, v in flat.items():
                out[f"list_most_{k}"] = v
        else:
            out["list_most_value"] = most
        return out

    if strategy == "first":
        first = lst[0]
        if isinstance(first, dict):
            flat = _flatten_dict({f"first": first}, parent_key="", sep="_")
            for k, v in flat.items():
                out[f"list_first_{k}"] = v
        else:
            out["list_first_value"] = first
        return out

    if strategy == "json":
        try:
            out["list_json"] = json.dumps(lst, default=str, ensure_ascii=False)
        except Exception:
            out["list_json"] = str(lst)
        return out

    if strategy == "count":
        return {"list_count": len(lst)}

    if strategy == "aggregate":
        # basic numeric aggregations across dict entries if present
        numeric_keys = {}
        for item in lst:
            if isinstance(item, dict):
                for k, v in item.items():
                    if isinstance(v, (int, float, Decimal128)):
                        numeric_keys.setdefault(k, []).append(float(v) if not isinstance(v, Decimal128) else float(v.to_decimal()))
        for k, vals in numeric_keys.items():
            out[f"agg_{k}_mean"] = sum(vals) / len(vals) if vals else None
            out[f"agg_{k}_sum"] = sum(vals) if vals else None
        # fallback JSON
        out["list_json"] = json.dumps(lst, default=str, ensure_ascii=False)
        return out

    # default fallback
    return {"list_json": json.dumps(lst, default=str, ensure_ascii=False), "list_count": len(lst)}

# ---------- Normalização principal ----------
def normalize_mongo_docs(
    docs: List[Dict[str, Any]],
    list_strategy: str = "most_recent",
    explode_arrays: Optional[List[str]] = None,
    sep: str = "_",
    keep_raw: bool = True,
    max_flatten_depth: int = 5
) -> pd.DataFrame:
    """
    Converte uma lista de documentos (já passados por _convert_bson_value) num DataFrame achatado.
    - list_strategy: 'most_recent'|'first'|'count'|'json'|'aggregate'
    - explode_arrays: lista de chaves (top-level) para 'explodir' (pd.DataFrame.explode) — opcional
    - keep_raw: mantém coluna 'raw_document' com JSON string para referência
    """
    rows = []
    explode_arrays = explode_arrays or []

    for doc in docs:
        # convert types
        doc = {k: _convert_bson_value(v) for k, v in doc.items()}

        base = {}
        lists_to_explode = {}

        # flatten top-level dicts but keep lists aside
        for k, v in doc.items():
            if isinstance(v, dict):
                flat = _flatten_dict({k: v}, parent_key="", sep=sep, max_depth=max_flatten_depth)
                base.update(flat)
            elif isinstance(v, list):
                # save list for special handling
                lists_to_explode[k] = v
            else:
                base[k] = v

        # handle lists with chosen strategy
        for list_field, lst in lists_to_explode.items():
            if list_field in explode_arrays:
                base[list_field] = lst  # keep original list; we'll explode later
            else:
                handled = _handle_list_field(lst, strategy=list_strategy)
                # prefix handled fields with list_field
                for hk, hv in handled.items():
                    # e.g., grades_list_most_grade  (avoid double underscores)
                    prefix = f"{list_field}{sep}{hk.lstrip('_')}" if hk.startswith("_") else f"{list_field}{sep}{hk}"
                    base[prefix] = hv

        if keep_raw:
            try:
                base["raw_document"] = json.dumps(doc, default=str, ensure_ascii=False)
            except Exception:
                base["raw_document"] = str(doc)

        rows.append(base)

    df = pd.DataFrame(rows).reset_index(drop=True)

    # If user asked to explode arrays into multiple rows:
    for col in explode_arrays:
        if col in df.columns:
            # explode but keep other columns duplicated (pandas handles)
            df = df.explode(col).reset_index(drop=True)
            # when exploded, if elements are dicts, flatten them into new columns:
            if df[col].apply(lambda x: isinstance(x, dict)).any():
                exploded_flat = df[col].apply(lambda x: _flatten_dict(x) if isinstance(x, dict) else {})
                exploded_df = pd.DataFrame(exploded_flat.tolist()).add_prefix(f"{col}{sep}")
                df = pd.concat([df.drop(columns=[col]), exploded_df], axis=1)

    return df

# ---------- Example wrapper to replace simple pd.DataFrame(docs) ----------
def docs_to_clean_dataframe(docs: List[Dict[str, Any]],
                            list_strategy: str = "most_recent",
                            explode_arrays: Optional[List[str]] = None,
                            keep_raw: bool = True) -> pd.DataFrame:
    """
    Conveniência: converte docs -> normalized df
    Use antes de enviar o df ao LLM.
    """
    return normalize_mongo_docs(docs,
                                list_strategy=list_strategy,
                                explode_arrays=explode_arrays or [],
                                keep_raw=keep_raw)
