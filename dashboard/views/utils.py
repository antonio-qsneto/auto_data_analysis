
import json
import numpy as np # type: ignore



def convert_numpy(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj)
    elif isinstance(obj, (np.bool_)):
        return bool(obj)
    elif isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [convert_numpy(v) for v in obj]
    else:
        return obj  # já é serializável

def save_json(data, filename="data_output.json"):
    """Save JSON data to file with indentation."""
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
