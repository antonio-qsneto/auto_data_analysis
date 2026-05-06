from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Report
from ..report_storage import delete_report_payload, load_report_payload
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

    try:
        data = load_report_payload(report.s3_key)
    except Exception:
        return Response({"error": "Error fetching object"}, status=500)

    return Response({
        "id": report.id,
        "created_at": report.created_at,
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

    try:
        delete_report_payload(report.s3_key)
    except Exception:
        return Response({"error": "Error deleting file"}, status=500)

    report.delete()
    return Response({"success": "Report successfully deleted."})
