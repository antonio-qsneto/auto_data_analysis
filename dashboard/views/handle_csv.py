# handle_csv.py
import pandas as pd
import traceback
from django.http import JsonResponse
from .core import process_data

def handle_csv(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return JsonResponse({"error": "No file uploaded"}, status=400)
        if not uploaded_file.name.endswith(".csv"):
            return JsonResponse({"error": "Only CSV files allowed"}, status=400)

        df = pd.read_csv(uploaded_file, nrows=1000).reset_index(drop=True)
        df["index"] = df.index

        data = process_data(df)
        return JsonResponse(data)

    except Exception as e:
        return JsonResponse({
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500)
