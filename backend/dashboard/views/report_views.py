import boto3
import json
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Report
from ..serializers.report_serializer import ReportSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_reports(request):

    reports = Report.objects.filter(user=request.user).order_by("-created_at")
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_report_detail(request, pk):

    try:
        report = Report.objects.get(pk=pk, user=request.user)
    except Report.DoesNotExist:
        return Response({"error": "Report not found"}, status=404)

    s3 = boto3.client("s3")
    try:
        obj = s3.get_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=report.s3_key)
        content = obj["Body"].read().decode("utf-8")
        data = json.loads(content)
    except Exception as e:
        return Response({"error": "Error fetching object"}, status=500)

    return Response({
        "id": report.id,  # type: ignore
        # "created_at": report.created_at,
        # "s3_url": report.s3_url,
        "business_summary": data.get("business_summary"),
        "insights_text": data.get("insights_text"),
        "charts": data.get("charts"),
    })


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_report(request, pk):
    try:
        report = Report.objects.get(pk=pk, user=request.user)
    except Report.DoesNotExist:
        return Response({"error": "Report not found"}, status=404)

    s3 = boto3.client("s3")
    try:
        s3.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=report.s3_key)
    except Exception as e:
        return Response({"error": "Error deleting file"}, status=500)

    report.delete()
    return Response({"success": "Report successfully deleted."})
