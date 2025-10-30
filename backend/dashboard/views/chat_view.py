from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from dashboard.views.core import chat_with_data

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_api(request):
    """
    Endpoint: recebe pergunta e repassa ao chat_with_data()
    """
    question = request.data.get("question", "").strip()
    model_name = request.data.get("model", "gemini")

    if not question:
        return Response({"error": "Pergunta não fornecida."}, status=400)

    result = chat_with_data(question, model_name)
    return Response(result)