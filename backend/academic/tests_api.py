from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import (
    Usuario, Profesor, Estudiante, Materia,
    ProfesorMateria, Matricula, Evaluacion, Nota
)

class APITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Crear usuario profesor
        self.profesor_user = get_user_model().objects.create_user(
            username='profesor1@unaula.edu.co',
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
            username='estudiante1@unaula.edu.co',
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

        # Asignar profesor a materia
        self.profesor_materia = ProfesorMateria.objects.create(
            profesor=self.profesor,
            materia=self.materia
        )

        # Matricular estudiante
        self.matricula = Matricula.objects.create(
            estudiante=self.estudiante,
            materia=self.materia
        )

    def test_login_profesor(self):
        """Prueba el inicio de sesión de un profesor"""
        url = reverse('usuario-login')
        data = {
            'email': 'profesor1@unaula.edu.co',
            'password': 'testpass123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['rol'], 'profesor')

    def test_login_estudiante(self):
        """Prueba el inicio de sesión de un estudiante"""
        url = reverse('usuario-login')
        data = {
            'email': 'estudiante1@unaula.edu.co',
            'password': 'testpass123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['rol'], 'estudiante')

    def test_materias_profesor(self):
        """Prueba la obtención de materias de un profesor"""
        self.client.force_authenticate(user=self.profesor_user)
        url = reverse('profesor-materias', args=[self.profesor.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['codigo'], 'MAT101')

    def test_materias_estudiante(self):
        """Prueba la obtención de materias de un estudiante"""
        self.client.force_authenticate(user=self.estudiante_user)
        url = reverse('estudiante-materias', args=[self.estudiante.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['codigo'], 'MAT101')

    def test_crear_evaluacion(self):
        """Prueba la creación de una evaluación"""
        self.client.force_authenticate(user=self.profesor_user)
        url = reverse('evaluacion-list')
        data = {
            'materia': self.materia.id,
            'nombre': 'Parcial 1',
            'porcentaje': 30.0,
            'fecha': '2024-03-15'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nombre'], 'Parcial 1')
        self.assertEqual(float(response.data['porcentaje']), 30.0)

    def test_registrar_nota(self):
        """Prueba el registro de una nota"""
        self.client.force_authenticate(user=self.profesor_user)
        
        # Crear evaluación
        evaluacion = Evaluacion.objects.create(
            materia=self.materia,
            nombre='Parcial 1',
            porcentaje=30.0,
            fecha='2024-03-15'
        )
        
        url = reverse('evaluacion-registrar-notas', args=[evaluacion.id])
        data = {
            'notas': [
                {
                    'estudiante_id': str(self.estudiante.id),
                    'nota': 4.5
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verificar que la nota se creó correctamente
        nota = Nota.objects.get(
            evaluacion=evaluacion,
            estudiante=self.estudiante
        )
        self.assertEqual(float(nota.nota), 4.5)
        self.assertEqual(nota.estado, 'aprobado')

    def test_consultar_notas_estudiante(self):
        """Prueba la consulta de notas de un estudiante"""
        self.client.force_authenticate(user=self.estudiante_user)
        
        # Crear evaluación y nota
        evaluacion = Evaluacion.objects.create(
            materia=self.materia,
            nombre='Parcial 1',
            porcentaje=30.0,
            fecha='2024-03-15'
        )
        Nota.objects.create(
            evaluacion=evaluacion,
            estudiante=self.estudiante,
            nota=4.5
        )
        
        url = reverse('estudiante-notas', args=[self.estudiante.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(float(response.data[0]['nota']), 4.5)
        self.assertEqual(response.data[0]['estado'], 'aprobado') 