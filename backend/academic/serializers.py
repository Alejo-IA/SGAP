from rest_framework import serializers
from django.db import models
from .models import (
    Usuario, Profesor, Estudiante, Materia,
    ProfesorMateria, Matricula, Evaluacion, Nota
)

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'rol']
        read_only_fields = ['rol']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate_email(self, value):
        if not value.endswith('@unaula.edu.co'):
            raise serializers.ValidationError('El correo debe ser institucional (@unaula.edu.co)')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        validated_data['username'] = validated_data['email']  # Usar el correo como username
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password is not None:
            instance.set_password(password)
        return super().update(instance, validated_data)

class ProfesorSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    
    class Meta:
        model = Profesor
        fields = ['id', 'usuario', 'departamento']

class EstudianteSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    promedio = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Estudiante
        fields = ['id', 'usuario', 'codigo', 'promedio']

class MateriaSerializer(serializers.ModelSerializer):
    profesor = serializers.SerializerMethodField()
    promedio = serializers.FloatField(read_only=True, required=False)
    evaluaciones_pendientes = serializers.IntegerField(read_only=True, required=False)
    proxima_evaluacion = serializers.SerializerMethodField()
    
    class Meta:
        model = Materia
        fields = [
            'id', 'nombre', 'codigo', 'creditos', 'descripcion',
            'profesor', 'promedio', 'evaluaciones_pendientes',
            'proxima_evaluacion', 'horario'
        ]
    
    def get_profesor(self, obj):
        profesor = obj.profesores.first()
        if profesor:
            return {
                'nombre': f"{profesor.usuario.first_name} {profesor.usuario.last_name}",
                'email': profesor.usuario.email
            }
        return None
    
    def get_proxima_evaluacion(self, obj):
        if hasattr(obj, 'proxima_evaluacion'):
            return obj.proxima_evaluacion
        return None

class ProfesorMateriaSerializer(serializers.ModelSerializer):
    profesor = ProfesorSerializer(read_only=True)
    materia = MateriaSerializer(read_only=True)
    
    class Meta:
        model = ProfesorMateria
        fields = ['id', 'profesor', 'materia', 'fecha_asignacion']

class MatriculaSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.CharField(
        source='estudiante.usuario.get_full_name',
        read_only=True
    )
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    
    class Meta:
        model = Matricula
        fields = [
            'id', 'estudiante', 'estudiante_nombre',
            'materia', 'materia_nombre', 'estado'
        ]

class EvaluacionSerializer(serializers.ModelSerializer):
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    
    class Meta:
        model = Evaluacion
        fields = [
            'id', 'materia', 'materia_nombre', 'nombre',
            'descripcion', 'fecha', 'porcentaje', 'estado'
        ]

    def validate_porcentaje(self, value):
        materia_id = self.initial_data.get('materia')
        if not self.instance:  # Si es una nueva evaluación
            total = Evaluacion.objects.filter(materia_id=materia_id).aggregate(
                total=models.Sum('porcentaje')
            )['total'] or 0
            if total + value > 100:
                raise serializers.ValidationError(
                    'El total de porcentajes excedería el 100%'
                )
        return value

class NotaSerializer(serializers.ModelSerializer):
    evaluacion_nombre = serializers.CharField(source='evaluacion.nombre', read_only=True)
    estudiante_nombre = serializers.CharField(
        source='estudiante.usuario.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = Nota
        fields = [
            'id', 'evaluacion', 'evaluacion_nombre',
            'estudiante', 'estudiante_nombre', 'nota'
        ]

    def validate_nota(self, value):
        if value < 0 or value > 5:
            raise serializers.ValidationError(
                'La nota debe estar entre 0 y 5'
            )
        return value

# Serializers para respuestas específicas

class MateriaProfesorSerializer(MateriaSerializer):
    estudiantes_count = serializers.IntegerField(read_only=True)
    evaluaciones_count = serializers.IntegerField(read_only=True)
    
    class Meta(MateriaSerializer.Meta):
        fields = MateriaSerializer.Meta.fields + ['estudiantes_count', 'evaluaciones_count']

class NotaEstudianteSerializer(NotaSerializer):
    materia = serializers.SerializerMethodField()
    
    class Meta(NotaSerializer.Meta):
        fields = NotaSerializer.Meta.fields + ['materia']
    
    def get_materia(self, obj):
        return {
            'id': obj.evaluacion.materia.id,
            'nombre': obj.evaluacion.materia.nombre,
            'codigo': obj.evaluacion.materia.codigo
        } 