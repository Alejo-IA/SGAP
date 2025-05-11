from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profesor, Estudiante, Nota, LogNota

@receiver(post_save, sender=get_user_model())
def create_user_profile(sender, instance, created, **kwargs):
    """
    Crea automáticamente el perfil de profesor o estudiante cuando se crea un usuario.
    """
    if created:
        if instance.rol == 'profesor':
            Profesor.objects.create(usuario=instance)
        elif instance.rol == 'estudiante':
            Estudiante.objects.create(
                usuario=instance,
                codigo_estudiante=f'EST{instance.id[:8]}'
            )

@receiver(pre_save, sender=Nota)
def actualizar_estado_nota(sender, instance, **kwargs):
    """
    Actualiza automáticamente el estado de la nota según el valor.
    """
    if instance.nota >= 3.0:
        instance.estado = 'aprobado'
    else:
        instance.estado = 'reprobado'

@receiver(post_save, sender=Nota)
def registrar_log_nota(sender, instance, created, **kwargs):
    """
    Registra los cambios en las notas en la tabla de auditoría.
    """
    if not created:
        try:
            nota_anterior = Nota.objects.get(pk=instance.pk)
            if nota_anterior.nota != instance.nota:
                LogNota.objects.create(
                    nota=instance,
                    usuario=instance.evaluacion.materia.profesores.first().usuario,
                    valor_anterior=nota_anterior.nota,
                    valor_nuevo=instance.nota
                )
        except Nota.DoesNotExist:
            pass
    else:
        LogNota.objects.create(
            nota=instance,
            usuario=instance.evaluacion.materia.profesores.first().usuario,
            valor_anterior=None,
            valor_nuevo=instance.nota
        ) 