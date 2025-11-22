from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from dashboard.views.core import chat_with_data


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_api(request):
    question = request.data.get("question", "").strip()
    model_name = request.data.get("model", "gemini")

    if not question:
        return Response({"error": "Question not provided."}, status=400)

    result = chat_with_data(question, request.user, model_name)

    # REMOVE camp debug antes de enviar ao frontend
    if "debug" in result:
        del result["debug"]

    return Response(result)
