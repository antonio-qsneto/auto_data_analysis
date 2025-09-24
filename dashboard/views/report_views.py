# dashboard/views/report_views.py
import boto3, json
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Report
from ..serializers.report_serializer import ReportSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_reports(request):
    """
    Lista relatórios do usuário (só metadados + link do S3).
    """
    reports = Report.objects.filter(user=request.user).order_by("-created_at")
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_report_detail(request, pk):
    """
    Retorna os dados completos de um report, baixando o JSON do S3.
    """
    try:
        report = Report.objects.get(pk=pk, user=request.user)
    except Report.DoesNotExist:
        return Response({"error": "Report não encontrado"}, status=404)

    s3 = boto3.client("s3")
    try:
        obj = s3.get_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=report.s3_key)
        content = obj["Body"].read().decode("utf-8")
        data = json.loads(content)
    except Exception as e:
        return Response({"error": f"Erro ao buscar JSON no S3: {str(e)}"}, status=500)

    # Junta metadados + conteúdo
    return Response({
        "id": report.id, # type: ignore
        "created_at": report.created_at,
        "s3_url": report.s3_url,
        "business_summary": data.get("business_summary"),
        "insights_text": data.get("insights_text"),
        "charts": data.get("charts"),
    })
