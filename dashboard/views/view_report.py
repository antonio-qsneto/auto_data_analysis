from rest_framework.decorators import api_view, permission_classes # type: ignore
from rest_framework.permissions import IsAuthenticated # type: ignore
from rest_framework.response import Response # type: ignore
from django.views.decorators.csrf import csrf_exempt
from ..models import Report # type: ignore

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_report(request):
    user = request.user
    file = request.FILES.get('file')
    name = request.POST.get('name', 'report.pdf')

    if not file:
        return Response({'error': 'No file provided'}, status=400)

    report = Report.objects.create(user=user, name=name, file=file)
    return Response({
        'id': report.id, # type: ignore
        'name': report.name,
        'url': report.file.url,  # S3 URL (signed if private)
        'created_at': report.created_at.isoformat()
    }, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_reports(request):
    reports = Report.objects.filter(user=request.user).order_by('-created_at')
    data = [
        {
            'id': r.id, # type: ignore
            'name': r.name,
            'url': r.file.url,
            'created_at': r.created_at.isoformat()
        } for r in reports
    ]
    return Response(data)