from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, ProfesorViewSet, EstudianteViewSet,
    MateriaViewSet, EvaluacionViewSet, NotaViewSet, MatriculaViewSet
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'profesores', ProfesorViewSet)
router.register(r'estudiantes', EstudianteViewSet)
router.register(r'materias', MateriaViewSet)
router.register(r'evaluaciones', EvaluacionViewSet)
router.register(r'notas', NotaViewSet)
router.register(r'matriculas', MatriculaViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 