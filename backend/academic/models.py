import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg
from django.utils import timezone

class Usuario(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ROL_CHOICES = [
        ('profesor', 'Profesor'),
        ('estudiante', 'Estudiante'),
    ]
    rol = models.CharField(max_length=20, choices=ROL_CHOICES)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='usuario_groups',
        related_query_name='usuario'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='usuario_permissions',
        related_query_name='usuario'
    )

    class Meta:
        db_table = 'usuarios'

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if not self.email.endswith('@unaula.edu.co'):
            from django.core.exceptions import ValidationError
            raise ValidationError('El correo debe ser institucional (@unaula.edu.co)')

class Profesor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)
    departamento = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'profesores'

class Estudiante(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)
    codigo = models.CharField(max_length=20, unique=True, default='')
    programa = models.CharField(max_length=100, default='')
    fecha_ingreso = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.codigo} - {self.usuario.get_full_name()}"

    @property
    def promedio(self):
        notas = Nota.objects.filter(estudiante=self)
        if not notas.exists():
            return 0.0
        return notas.aggregate(Avg('nota'))['nota__avg']

class Materia(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=10, unique=True)
    nombre = models.CharField(max_length=100)
    creditos = models.IntegerField(default=0)
    profesores = models.ManyToManyField('Profesor', through='ProfesorMateria', related_name='materias_asignadas')
    dia_clase = models.CharField(max_length=10, choices=[
        ('Lunes', 'Lunes'),
        ('Martes', 'Martes'),
        ('Miércoles', 'Miércoles'),
        ('Jueves', 'Jueves'),
        ('Viernes', 'Viernes'),
        ('Sábado', 'Sábado')
    ], default='Lunes')
    hora_inicio = models.TimeField(default='07:00')
    hora_fin = models.TimeField(default='09:00')
    salon = models.CharField(max_length=50, default='Por asignar')

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def get_profesor_principal(self):
        profesor = self.profesores.first()
        if profesor:
            return f"{profesor.usuario.first_name} {profesor.usuario.last_name}"
        return "Sin asignar"

class ProfesorMateria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profesor = models.ForeignKey(Profesor, on_delete=models.CASCADE)
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'profesor_materia'
        unique_together = ('profesor', 'materia')

class Matricula(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    estudiante = models.ForeignKey('Estudiante', on_delete=models.CASCADE, related_name='matriculas')
    materia = models.ForeignKey('Materia', on_delete=models.CASCADE, related_name='matriculas')
    estado = models.CharField(max_length=20, choices=[
        ('Activa', 'Activa'),
        ('Aprobada', 'Aprobada'),
        ('Reprobada', 'Reprobada'),
        ('Retirada', 'Retirada')
    ], default='Activa')
    fecha_matricula = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('estudiante', 'materia')

    def __str__(self):
        return f"{self.estudiante} - {self.materia}"

class Evaluacion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    materia = models.ForeignKey('Materia', on_delete=models.CASCADE, related_name='evaluaciones')
    nombre = models.CharField(max_length=100)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    fecha = models.DateField()

    def __str__(self):
        return f"{self.materia} - {self.nombre}"

class Nota(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    estudiante = models.ForeignKey('Estudiante', on_delete=models.CASCADE, related_name='notas')
    evaluacion = models.ForeignKey('Evaluacion', on_delete=models.CASCADE, related_name='notas')
    nota = models.DecimalField(max_digits=3, decimal_places=1)
    fecha = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('estudiante', 'evaluacion')

    def __str__(self):
        return f"{self.estudiante} - {self.evaluacion}: {self.nota}"

class LogNota(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nota = models.ForeignKey(Nota, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    valor_anterior = models.DecimalField(max_digits=4, decimal_places=2, null=True)
    valor_nuevo = models.DecimalField(max_digits=4, decimal_places=2)
    fecha_cambio = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'log_notas' 