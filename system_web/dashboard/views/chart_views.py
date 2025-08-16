from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def generate_chart_from_csv(request):
    from .handle_csv import handle_csv
    return handle_csv(request)

@csrf_exempt
def list_database_tables(request):
    from .handle_db import get_tables
    return get_tables(request)

@csrf_exempt
def get_table_data(request):
    from .handle_db import fetch_and_process_table
    return fetch_and_process_table(request)