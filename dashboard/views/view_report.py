from rest_framework.decorators import api_view, permission_classes, parser_classes # type: ignore
from rest_framework.permissions import IsAuthenticated # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework.parsers import MultiPartParser, FormParser # type: ignore
from ..models import Report
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_report(request):
    # Debugging info (will appear in your Django logs)
    logger.info("upload_report called: user=%s, files=%s, data_keys=%s",
                getattr(request, "user", None),
                list(request.FILES.keys()),
                list(request.data.keys()))

    file = request.FILES.get("file")
    if not file:
        # Provide detailed response so client sees what's wrong
        logger.warning("No file found in request.FILES; request.FILES keys: %s", list(request.FILES.keys()))
        return Response({"error": "No file uploaded. Make sure request is multipart/form-data and 'file' key is sent."}, status=400)

    report = Report.objects.create(
        user=request.user,
        name=file.name,
        file=file
    )

    return Response({
        "id": report.id, # type: ignore
        "name": report.name,
        "url": report.file.url,
        "created_at": report.created_at.isoformat()
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_reports(request):
    reports = Report.objects.filter(user=request.user).order_by("-created_at")
    data = [
        {
            "id": report.id,   # type: ignore
            "name": report.name,
            "created_at": report.created_at,
            "url": report.file.url, 
        }
        for report in reports
    ]
    return Response(data)