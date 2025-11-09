import pandas as pd
from io import StringIO
import traceback
from .core import process_data


def _safe_read_bytes(uploaded_file):
    """Lê o conteúdo do arquivo (UploadedFile, BytesIO ou path) e retorna bytes."""
    try:
        if hasattr(uploaded_file, "read"):
            uploaded_file.seek(0)
            return uploaded_file.read()
        elif isinstance(uploaded_file, (bytes, bytearray)):
            return uploaded_file
        else:
            with open(uploaded_file, "rb") as f:
                return f.read()
    except Exception as e:
        raise ValueError(f"Erro ao ler arquivo: {e}")


def _decode_bytes(raw_bytes):
    """Decodifica bytes em string, tentando UTF-8 e Latin-1."""
    for enc in ("utf-8", "latin-1"):
        try:
            return raw_bytes.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw_bytes.decode("utf-8", errors="replace")


def _detect_header_and_sep(text: str, max_meta_lines: int = 60):
    """
    Detecta a primeira linha que parece ser header e o separador provável.
    Retorna (header_line_index, sep).
    """
    if not isinstance(text, str):
        text = str(text, "utf-8", errors="replace")

    lines = text.splitlines()
    for i, ln in enumerate(lines[:max_meta_lines]):
        # ignora linhas de metadados (ex: Nome: CAMPO GRANDE)
        if ":" in ln and (";" not in ln and "," not in ln):
            continue
        # primeira linha com muitos separadores é o cabeçalho
        if ln.count(";") >= 3:
            return i, ";"
        if ln.count(",") >= 3:
            return i, ","
    return 0, ","


def _normalize_cols(cols):
    """Limpa e padroniza nomes de colunas."""
    normalized = []
    for c in cols:
        c = str(c).strip().replace("\n", " ").replace(",", " ").replace("/", "_")
        c = "_".join(c.split())
        normalized.append(c)
    return normalized


def handle_csv(uploaded_file, user):
    """
    Lê CSV (mesmo com metadados no topo) e retorna DataFrame limpo para charts.
    Totalmente tolerante a separadores ';' e ',' e a encodings variados.
    """
    try:
        # === Leitura segura do arquivo ===
        raw_bytes = _safe_read_bytes(uploaded_file)
        raw = _decode_bytes(raw_bytes)

        # === Detecta cabeçalho e separador ===
        header_idx, sep = _detect_header_and_sep(raw)
        na_values = ["null", "NULL", "N/A", "-", "None", ""]

        # === Tenta ler com heurísticas ===
        def try_read(skiprows, sep, decimal):
            return pd.read_csv(
                StringIO(raw),
                skiprows=skiprows,
                sep=sep,
                decimal=decimal,
                na_values=na_values,
                nrows=2000,
                engine="python",
                on_bad_lines="skip",
            ).reset_index(drop=True)

        try:
            df = try_read(header_idx, sep, ",")
        except Exception:
            for extra_skip in range(header_idx + 1, header_idx + 15):
                try:
                    df = try_read(extra_skip, sep, ",")
                    break
                except Exception:
                    continue
            else:
                raise ValueError("Falha ao detectar o cabeçalho da tabela")

        # === Normalização e limpeza ===
        df.columns = _normalize_cols(df.columns)
        df = df.dropna(axis=1, how="all")
        df["index"] = df.index

        # === Data/Hora ===
        lc = [c.lower() for c in df.columns]
        if "data_medicao" in lc and "hora_medicao" in lc:
            data_col = df.columns[lc.index("data_medicao")]
            hora_col = df.columns[lc.index("hora_medicao")]

            def _fix_hour(h):
                try:
                    s = str(h).zfill(4)
                    return f"{s[:2]}:{s[2:]}"
                except Exception:
                    return str(h)

            df[hora_col] = df[hora_col].apply(_fix_hour)
            df["datetime"] = pd.to_datetime(
                df[data_col].astype(str) + " " + df[hora_col].astype(str),
                dayfirst=True,
                infer_datetime_format=True,
                errors="coerce",
            )

        # === Converte números com vírgula ===
        for c in df.columns:
            try:
                sample = df[c].dropna().astype(str).head(30)
                if sample.apply(lambda x: "," in x).sum() > len(sample) // 2:
                    df[c] = df[c].astype(str).str.replace(".", "", regex=False).str.replace(",", ".", regex=False)
                    df[c] = pd.to_numeric(df[c], errors="coerce")
            except Exception:
                continue

        # === Verifica se o DataFrame é válido ===
        if df.shape[1] < 2 or df.empty:
            raise ValueError("Arquivo CSV não contém dados tabulares válidos.")

        # === Chama pipeline principal ===
        return process_data(df, user=user)

    except Exception as e:
        traceback.print_exc()
        raise ValueError(f"Error processing CSV: {e}")
