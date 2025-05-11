from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth import authenticate, login, logout
from django.db.models import Avg, Count, Q, F
from datetime import datetime
from .models import (
    Usuario, Profesor, Estudiante, Materia,
    ProfesorMateria, Matricula, Evaluacion, Nota
)
from .serializers import (
    UsuarioSerializer, ProfesorSerializer, EstudianteSerializer,
    MateriaSerializer, ProfesorMateriaSerializer, MatriculaSerializer,
    EvaluacionSerializer, NotaSerializer, MateriaProfesorSerializer,
    NotaEstudianteSerializer
)
from .permissions import IsProfesor, IsEstudiante

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        user = request.user
        now = datetime.now()

        if user.rol == 'profesor':
            materias = Materia.objects.filter(profesores=user.profesor)
            materias_count = materias.count()
            estudiantes_count = Estudiante.objects.filter(
                matriculas__materia__in=materias,
                matriculas__estado='activa'
            ).distinct().count()
            evaluaciones_count = Evaluacion.objects.filter(
                materia__in=materias,
                estado='pendiente'
            ).count()
            proximas_evaluaciones = Evaluacion.objects.filter(
                materia__in=materias,
                fecha__gte=now
            ).order_by('fecha')[:5].values(
                'id', 'nombre', 'fecha',
                materia=F('materia__nombre')
            )

            return Response({
                'materias_count': materias_count,
                'estudiantes_count': estudiantes_count,
                'evaluaciones_count': evaluaciones_count,
                'proximas_evaluaciones': list(proximas_evaluaciones)
            })
        else:  # estudiante
            materias = Materia.objects.filter(
                matriculas__estudiante=user.estudiante,
                matriculas__estado='activa'
            )
            materias_count = materias.count()
            evaluaciones_count = Evaluacion.objects.filter(
                materia__in=materias,
                estado='pendiente'
            ).count()
            promedio_general = Nota.objects.filter(
                estudiante=user.estudiante,
                evaluacion__materia__in=materias
            ).aggregate(
                promedio=Avg('nota')
            )['promedio'] or 0
            proximas_evaluaciones = Evaluacion.objects.filter(
                materia__in=materias,
                fecha__gte=now
            ).order_by('fecha')[:5].values(
                'id', 'nombre', 'fecha',
                materia=F('materia__nombre')
            )

            return Response({
                'materias_count': materias_count,
                'evaluaciones_count': evaluaciones_count,
                'promedio_general': promedio_general,
                'proximas_evaluaciones': list(proximas_evaluaciones)
            })

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Se requiere correo y contraseña'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not email.endswith('@unaula.edu.co'):
            return Response(
                {'error': 'El correo debe ser institucional (@unaula.edu.co)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = authenticate(request, username=email, password=password)
            
            if user is not None and user.is_active:
                login(request, user)
                # Obtener el token CSRF después del login
                from django.middleware.csrf import get_token
                csrf_token = get_token(request)
                
                serializer = self.get_serializer(user)
                response = Response({
                    'user': serializer.data,
                    'message': 'Login exitoso',
                    'csrf_token': csrf_token
                })
                
                # Asegurar que las cookies se establezcan correctamente
                response.set_cookie(
                    'csrftoken',
                    csrf_token,
                    max_age=31449600,  # 1 año
                    path='/',
                    secure=False,  # Cambiar a True en producción
                    samesite='Lax',
                    httponly=False
                )
                
                return response
            else:
                return Response(
                    {'error': 'Correo o contraseña incorrectos'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Exception as e:
            return Response(
                {'error': f'Error en el inicio de sesión: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def logout(self, request):
        if request.user.is_authenticated:
            logout(request)
            return Response({'message': 'Logout exitoso'})
        return Response({'error': 'No hay sesión activa'}, status=status.HTTP_400_BAD_REQUEST)

class ProfesorViewSet(viewsets.ModelViewSet):
    queryset = Profesor.objects.all()
    serializer_class = ProfesorSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def materias(self, request, pk=None):
        profesor = self.get_object()
        materias = Materia.objects.filter(profesores=profesor)
        serializer = MateriaProfesorSerializer(materias, many=True)
        return Response(serializer.data)

class EstudianteViewSet(viewsets.ModelViewSet):
    queryset = Estudiante.objects.all()
    serializer_class = EstudianteSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def materias(self, request, pk=None):
        estudiante = self.get_object()
        matriculas = Matricula.objects.filter(
            estudiante=estudiante,
            estado='activa'
        )
        materias = [m.materia for m in matriculas]
        serializer = MateriaSerializer(materias, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def notas(self, request, pk=None):
        estudiante = self.get_object()
        notas = Nota.objects.filter(estudiante=estudiante)
        serializer = NotaEstudianteSerializer(notas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def horario(self, request):
        """
        Retorna el horario del estudiante con sus materias matriculadas
        """
        try:
            if not hasattr(request.user, 'estudiante'):
                return Response(
                    {'error': 'El usuario no es un estudiante'},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            estudiante = request.user.estudiante
            matriculas = Matricula.objects.filter(
                estudiante=estudiante,
                estado='Activa'
            ).select_related('materia')
            
            horario_data = []
            for matricula in matriculas:
                materia = matricula.materia
                profesores = materia.profesores.all()
                profesor_nombre = f"{profesores[0].usuario.first_name} {profesores[0].usuario.last_name}" if profesores else "Sin asignar"
                
                horario_data.append({
                    'id': str(materia.id),
                    'nombre': materia.nombre,
                    'profesor': profesor_nombre,
                    'dia_clase': materia.dia_clase,
                    'hora_inicio': materia.hora_inicio.strftime('%H:%M'),
                    'hora_fin': materia.hora_fin.strftime('%H:%M'),
                    'salon': materia.salon
                })
            
            return Response(horario_data)
            
        except Exception as e:
            return Response(
                {'error': f'Error al obtener el horario: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def historial(self, request):
        """
        Retorna el historial académico del estudiante
        """
        try:
            if not hasattr(request.user, 'estudiante'):
                return Response(
                    {'error': 'El usuario no es un estudiante'},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            estudiante = request.user.estudiante
            matriculas = Matricula.objects.filter(
                estudiante=estudiante
            ).select_related('materia')
            
            # Calcular promedio general
            notas = Nota.objects.filter(
                estudiante=estudiante
            ).select_related('evaluacion')
            
            promedio_general = notas.aggregate(
                promedio=Avg('nota')
            )['promedio'] or 0.0
            
            # Obtener créditos totales y aprobados
            creditos_totales = sum(m.materia.creditos for m in matriculas)
            creditos_aprobados = sum(
                m.materia.creditos 
                for m in matriculas 
                if m.estado == 'Aprobada'
            )
            
            # Preparar datos de materias
            materias_data = []
            for matricula in matriculas:
                materia = matricula.materia
                notas_materia = notas.filter(
                    evaluacion__materia=materia
                )
                promedio_materia = notas_materia.aggregate(
                    promedio=Avg('nota')
                )['promedio'] or 0.0
                
                materias_data.append({
                    'id': str(materia.id),
                    'codigo': materia.codigo,
                    'nombre': materia.nombre,
                    'creditos': materia.creditos,
                    'estado': matricula.estado,
                    'promedio': round(promedio_materia, 2)
                })
            
            return Response({
                'materias': materias_data,
                'promedio_general': round(promedio_general, 2),
                'creditos_totales': creditos_totales,
                'creditos_aprobados': creditos_aprobados
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error al obtener el historial: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """
        Retorna el resumen académico del estudiante para el dashboard
        """
        try:
            if not hasattr(request.user, 'estudiante'):
                return Response(
                    {'error': 'El usuario no es un estudiante'},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            estudiante = request.user.estudiante
            now = datetime.now()
            
            # Obtener materias activas
            materias_actuales = Materia.objects.filter(
                matriculas__estudiante=estudiante,
                matriculas__estado='activa'
            )
            
            # Calcular promedio acumulado
            promedio_acumulado = Nota.objects.filter(
                estudiante=estudiante
            ).aggregate(
                promedio=Avg('nota')
            )['promedio'] or 0.0
            
            # Calcular créditos aprobados
            creditos_aprobados = sum(
                materia.creditos for materia in Materia.objects.filter(
                    matriculas__estudiante=estudiante,
                    matriculas__estado='aprobada'
                )
            )
            
            # Obtener próximas evaluaciones
            proximas_evaluaciones = Evaluacion.objects.filter(
                materia__in=materias_actuales,
                fecha__gte=now
            ).order_by('fecha')[:5].values(
                'id',
                'nombre',
                'fecha',
                materia_nombre=F('materia__nombre')
            )
            
            # Obtener últimas notas
            ultimas_notas = Nota.objects.filter(
                estudiante=estudiante
            ).select_related(
                'evaluacion__materia'
            ).order_by('-evaluacion__fecha')[:5]
            
            # Obtener materias con mejor y peor rendimiento
            materias_rendimiento = materias_actuales.annotate(
                promedio_materia=Avg('evaluaciones__notas__nota', 
                    filter=Q(evaluaciones__notas__estudiante=estudiante)
                )
            ).exclude(promedio_materia__isnull=True).order_by('-promedio_materia')
            
            mejor_materia = materias_rendimiento.first()
            peor_materia = materias_rendimiento.last()
            
            # Calcular progreso del semestre
            inicio_semestre = datetime(now.year, 2 if now.month < 7 else 8, 1)
            fin_semestre = datetime(now.year, 7 if now.month < 7 else 12, 31)
            dias_totales = (fin_semestre - inicio_semestre).days
            dias_transcurridos = (now - inicio_semestre).days
            progreso_semestre = min(max((dias_transcurridos / dias_totales) * 100, 0), 100)
            
            return Response({
                'promedio_acumulado': round(promedio_acumulado, 2),
                'creditos_aprobados': creditos_aprobados,
                'materias_actuales': materias_actuales.count(),
                'proximas_evaluaciones': list(proximas_evaluaciones),
                'ultimas_notas': [{
                    'nota': nota.nota,
                    'evaluacion_nombre': nota.evaluacion.nombre,
                    'materia_nombre': nota.evaluacion.materia.nombre,
                    'fecha': nota.evaluacion.fecha
                } for nota in ultimas_notas],
                'mejor_materia': {
                    'nombre': mejor_materia.nombre,
                    'promedio': round(mejor_materia.promedio_materia, 2)
                } if mejor_materia else None,
                'peor_materia': {
                    'nombre': peor_materia.nombre,
                    'promedio': round(peor_materia.promedio_materia, 2)
                } if peor_materia else None,
                'progreso_semestre': round(progreso_semestre, 1)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error al obtener el resumen: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'profesor':
            return Materia.objects.filter(profesores=user.profesor)
        elif user.rol == 'estudiante':
            return Materia.objects.filter(matriculas__estudiante=user.estudiante)
        return Materia.objects.none()

    @action(detail=False, methods=['get'], permission_classes=[IsProfesor])
    def profesor(self, request):
        materias = self.get_queryset().annotate(
            estudiantes_count=Count('matriculas'),
            evaluaciones_count=Count('evaluaciones')
        )
        serializer = MateriaProfesorSerializer(materias, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsEstudiante])
    def estudiante(self, request):
        materias = self.get_queryset().annotate(
            promedio=Avg('evaluaciones__notas__nota', filter=Q(
                evaluaciones__notas__estudiante=request.user.estudiante
            )),
            evaluaciones_pendientes=Count(
                'evaluaciones',
                filter=Q(evaluaciones__estado='pendiente')
            )
        )
        for materia in materias:
            proxima_evaluacion = materia.evaluaciones.filter(
                fecha__gte=datetime.now()
            ).order_by('fecha').first()
            if proxima_evaluacion:
                materia.proxima_evaluacion = {
                    'nombre': proxima_evaluacion.nombre,
                    'fecha': proxima_evaluacion.fecha
                }
        
        serializer = MateriaSerializer(materias, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def estudiantes(self, request, pk=None):
        materia = self.get_object()
        estudiantes = Estudiante.objects.filter(
            matriculas__materia=materia
        ).annotate(
            promedio=Avg('notas__nota', filter=Q(
                notas__evaluacion__materia=materia
            ))
        )
        serializer = EstudianteSerializer(estudiantes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def evaluaciones(self, request, pk=None):
        materia = self.get_object()
        evaluaciones = materia.evaluaciones.all()
        serializer = EvaluacionSerializer(evaluaciones, many=True)
        return Response(serializer.data)

class EvaluacionViewSet(viewsets.ModelViewSet):
    queryset = Evaluacion.objects.all()
    serializer_class = EvaluacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'profesor':
            return Evaluacion.objects.filter(materia__profesores=user.profesor)
        elif user.rol == 'estudiante':
            return Evaluacion.objects.filter(
                materia__matriculas__estudiante=user.estudiante
            )
        return Evaluacion.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[IsProfesor])
    def calificar(self, request, pk=None):
        evaluacion = self.get_object()
        notas_data = request.data.get('notas', [])
        
        with transaction.atomic():
            for nota_data in notas_data:
                estudiante_id = nota_data.get('estudiante_id')
                valor = nota_data.get('nota')
                
                if not estudiante_id or valor is None:
                    continue
                
                estudiante = get_object_or_404(Estudiante, id=estudiante_id)
                
                # Verificar que el estudiante está matriculado
                if not Matricula.objects.filter(
                    estudiante=estudiante,
                    materia=evaluacion.materia,
                    estado='activa'
                ).exists():
                    continue
                
                Nota.objects.update_or_create(
                    evaluacion=evaluacion,
                    estudiante=estudiante,
                    defaults={'nota': valor}
                )
            
            # Actualizar estado de la evaluación
            evaluacion.estado = 'calificada'
            evaluacion.save()
        
        return Response(status=status.HTTP_200_OK)

class NotaViewSet(viewsets.ModelViewSet):
    queryset = Nota.objects.all()
    serializer_class = NotaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'profesor':
            return Nota.objects.filter(evaluacion__materia__profesores=user.profesor)
        elif user.rol == 'estudiante':
            return Nota.objects.filter(estudiante=user.estudiante)
        return Nota.objects.none()

    @action(detail=False, methods=['get'], permission_classes=[IsEstudiante])
    def mis_notas(self, request):
        notas = self.get_queryset().select_related(
            'evaluacion__materia'
        ).order_by('evaluacion__fecha')
        serializer = NotaEstudianteSerializer(notas, many=True)
        return Response(serializer.data)

class MatriculaViewSet(viewsets.ModelViewSet):
    queryset = Matricula.objects.all()
    serializer_class = MatriculaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'profesor':
            return Matricula.objects.filter(materia__profesores=user.profesor)
        elif user.rol == 'estudiante':
            return Matricula.objects.filter(estudiante=user.estudiante)
        return Matricula.objects.none()

    @action(detail=False, methods=['post'])
    def matricular(self, request):
        estudiante_id = request.data.get('estudiante_id')
        materia_id = request.data.get('materia_id')
        
        if not estudiante_id or not materia_id:
            return Response(
                {'error': 'Se requiere estudiante y materia'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        estudiante = get_object_or_404(Estudiante, id=estudiante_id)
        materia = get_object_or_404(Materia, id=materia_id)
        
        # Verificar si ya existe una matrícula activa
        if Matricula.objects.filter(
            estudiante=estudiante,
            materia=materia,
            estado='activa'
        ).exists():
            return Response(
                {'error': 'El estudiante ya está matriculado en esta materia'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        matricula = Matricula.objects.create(
            estudiante=estudiante,
            materia=materia
        )
        
        serializer = self.get_serializer(matricula)
        return Response(serializer.data, status=status.HTTP_201_CREATED) 