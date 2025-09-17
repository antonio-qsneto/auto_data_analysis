from dashboard.utils.quota import require_quota
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .handle_csv import handle_csv
from .handle_db import get_tables, fetch_and_process_table

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_quota
def generate_chart_from_csv(request):
    data, status_code = handle_csv(request)
    return Response(data, status=status_code)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_quota
def list_database_tables(request):
    data, status_code = get_tables(request)
    return Response(data, status=status_code)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_quota
def get_table_data(request):
    data, status_code = fetch_and_process_table(request)
    return Response(data, status=status_code)