import numpy as np # type: ignore
import json

def convert_numpy(obj):
    """Convert NumPy types to Python native types for JSON serialization."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj)
    elif isinstance(obj, (np.ndarray,)):
        return obj.tolist()
    return obj

def save_json(data, filename="data_output.json"):
    """Save JSON data to file with indentation."""
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
