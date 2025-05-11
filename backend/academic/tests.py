from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import (
    Usuario, Profesor, Estudiante, Materia,
    ProfesorMateria, Matricula, Evaluacion, Nota
)

class ModelTests(TestCase):
    def setUp(self):
        # Crear usuario profesor
        self.profesor_user = get_user_model().objects.create_user(
            username='profesor1',
            password='testpass123',
            email='profesor1@unaula.edu.co',
            first_name='Juan',
            last_name='Pérez',
            rol='profesor'
        )
        self.profesor = Profesor.objects.create(
            usuario=self.profesor_user,
            departamento='Ingeniería'
        )

        # Crear usuario estudiante
        self.estudiante_user = get_user_model().objects.create_user(
            username='estudiante1',
            password='testpass123',
            email='estudiante1@unaula.edu.co',
            first_name='Ana',
            last_name='García',
            rol='estudiante'
        )
        self.estudiante = Estudiante.objects.create(
            usuario=self.estudiante_user,
            codigo_estudiante='EST001'
        )

        # Crear materia
        self.materia = Materia.objects.create(
            codigo='MAT101',
            nombre='Matemáticas I'
        )

    def test_crear_profesor(self):
        """Prueba la creación de un profesor"""
        self.assertEqual(self.profesor.usuario.username, 'profesor1')
        self.assertEqual(self.profesor.departamento, 'Ingeniería')

    def test_crear_estudiante(self):
        """Prueba la creación de un estudiante"""
        self.assertEqual(self.estudiante.usuario.username, 'estudiante1')
        self.assertEqual(self.estudiante.codigo_estudiante, 'EST001')

    def test_crear_materia(self):
        """Prueba la creación de una materia"""
        self.assertEqual(self.materia.codigo, 'MAT101')
        self.assertEqual(self.materia.nombre, 'Matemáticas I')

    def test_asignar_profesor_materia(self):
        """Prueba la asignación de un profesor a una materia"""
        asignacion = ProfesorMateria.objects.create(
            profesor=self.profesor,
            materia=self.materia
        )
        self.assertEqual(asignacion.profesor, self.profesor)
        self.assertEqual(asignacion.materia, self.materia)

    def test_matricular_estudiante(self):
        """Prueba la matrícula de un estudiante en una materia"""
        matricula = Matricula.objects.create(
            estudiante=self.estudiante,
            materia=self.materia
        )
        self.assertEqual(matricula.estudiante, self.estudiante)
        self.assertEqual(matricula.materia, self.materia)
        self.assertEqual(matricula.estado, 'activa')

    def test_crear_evaluacion(self):
        """Prueba la creación de una evaluación"""
        evaluacion = Evaluacion.objects.create(
            materia=self.materia,
            nombre='Parcial 1',
            porcentaje=30.0,
            fecha='2024-03-15'
        )
        self.assertEqual(evaluacion.nombre, 'Parcial 1')
        self.assertEqual(float(evaluacion.porcentaje), 30.0)

    def test_registrar_nota(self):
        """Prueba el registro de una nota"""
        evaluacion = Evaluacion.objects.create(
            materia=self.materia,
            nombre='Parcial 1',
            porcentaje=30.0,
            fecha='2024-03-15'
        )
        nota = Nota.objects.create(
            evaluacion=evaluacion,
            estudiante=self.estudiante,
            nota=4.5
        )
        self.assertEqual(float(nota.nota), 4.5)
        self.assertEqual(nota.estado, 'aprobado')  # Trigger debería cambiar esto

    def test_validacion_porcentaje_evaluaciones(self):
        """Prueba la validación del porcentaje total de evaluaciones"""
        Evaluacion.objects.create(
            materia=self.materia,
            nombre='Parcial 1',
            porcentaje=60.0,
            fecha='2024-03-15'
        )
        Evaluacion.objects.create(
            materia=self.materia,
            nombre='Parcial 2',
            porcentaje=40.0,
            fecha='2024-04-15'
        )
        
        # Intentar crear una evaluación que excede el 100%
        with self.assertRaises(Exception):
            Evaluacion.objects.create(
                materia=self.materia,
                nombre='Parcial 3',
                porcentaje=20.0,
                fecha='2024-05-15'
            ) 