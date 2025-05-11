from rest_framework import permissions

class IsProfesor(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con rol de profesor.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol == 'profesor'

class IsEstudiante(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con rol de estudiante.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol == 'estudiante'

class IsProfesorOrReadOnly(permissions.BasePermission):
    """
    Permite acceso completo a profesores y solo lectura a estudiantes.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'profesor'
        )

class IsOwnerOrProfesor(permissions.BasePermission):
    """
    Permite acceso al propietario del recurso o a profesores.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.rol == 'profesor':
            return True

        # Verificar si el usuario es el propietario del recurso
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        elif hasattr(obj, 'estudiante'):
            return obj.estudiante.usuario == request.user
        return False 