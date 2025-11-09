from functools import wraps
from django.http import JsonResponse

def require_quota(view_func):
    """
    Apenas verifica se o usuário tem créditos suficientes.
    O desconto real é feito dentro do fluxo (após sucesso).
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated:
            return JsonResponse({"error": "Usuário não autenticado."}, status=401)

        if user.quota <= 0:
            return JsonResponse({"error": "Você não tem créditos suficientes."}, status=403)

        # ✅ Apenas valida, sem descontar ainda
        return view_func(request, *args, **kwargs)

    return _wrapped_view
