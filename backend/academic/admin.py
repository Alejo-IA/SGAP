from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Usuario, Profesor, Estudiante, Materia,
    ProfesorMateria, Matricula, Evaluacion, Nota, LogNota
)

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'rol', 'is_active')
    list_filter = ('rol', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)

@admin.register(Profesor)
class ProfesorAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'departamento')
    search_fields = ('usuario__username', 'departamento')

@admin.register(Estudiante)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'get_codigo', 'get_programa')
    search_fields = ('usuario__username', 'codigo', 'programa')

    def get_codigo(self, obj):
        return obj.codigo
    get_codigo.short_description = 'Código'

    def get_programa(self, obj):
        return obj.programa
    get_programa.short_description = 'Programa'

@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'creditos', 'get_profesor_principal', 'dia_clase', 'hora_inicio', 'hora_fin', 'salon')
    list_filter = ('creditos', 'dia_clase')
    search_fields = ('codigo', 'nombre', 'profesores__usuario__first_name', 'profesores__usuario__last_name')
    filter_horizontal = ('profesores',)

    def get_profesor_principal(self, obj):
        profesor = obj.profesores.first()
        if profesor:
            return f"{profesor.usuario.first_name} {profesor.usuario.last_name}"
        return "-"
    get_profesor_principal.short_description = 'Profesor Principal'

@admin.register(ProfesorMateria)
class ProfesorMateriaAdmin(admin.ModelAdmin):
    list_display = ('profesor', 'materia', 'fecha_asignacion')
    list_filter = ('fecha_asignacion',)
    search_fields = ('profesor__usuario__username', 'materia__nombre')
    date_hierarchy = 'fecha_asignacion'

@admin.register(Matricula)
class MatriculaAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'materia', 'estado', 'fecha_matricula')
    list_filter = ('estado', 'fecha_matricula')
    search_fields = ('estudiante__usuario__username', 'materia__nombre')

@admin.register(Evaluacion)
class EvaluacionAdmin(admin.ModelAdmin):
    list_display = ('materia', 'nombre', 'porcentaje', 'fecha')
    list_filter = ('materia', 'fecha')
    search_fields = ('nombre', 'materia__nombre')

@admin.register(Nota)
class NotaAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'evaluacion', 'nota', 'fecha')
    list_filter = ('evaluacion__materia', 'fecha')
    search_fields = ('estudiante__usuario__username', 'evaluacion__nombre')
    date_hierarchy = 'fecha'

@admin.register(LogNota)
class LogNotaAdmin(admin.ModelAdmin):
    list_display = ('nota', 'usuario', 'valor_anterior', 'valor_nuevo', 'fecha_cambio')
    list_filter = ('fecha_cambio',)
    search_fields = ('nota__estudiante__usuario__username', 'usuario__username')
    date_hierarchy = 'fecha_cambio'
    readonly_fields = ('nota', 'usuario', 'valor_anterior', 'valor_nuevo', 'fecha_cambio') 