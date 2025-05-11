# Documentación Técnica - SGAP

## Arquitectura del Sistema

### Backend (Django)

El backend está implementado en Django y Django REST Framework, siguiendo una arquitectura de capas:

1. **Capa de Presentación (API)**
   - Views basadas en ViewSets de DRF
   - Serializers para transformación de datos
   - Rutas definidas con DefaultRouter

2. **Capa de Lógica de Negocio**
   - Modelos Django con validaciones
   - Signals para acciones automáticas
   - Permisos personalizados

3. **Capa de Datos**
   - PostgreSQL como base de datos
   - Procedimientos almacenados
   - Triggers para reglas de negocio

### Frontend (React)

Aplicación React con TypeScript y componentes funcionales:

1. **Componentes**
   - Layout y componentes comunes
   - Páginas por funcionalidad
   - Componentes reutilizables

2. **Estado**
   - Contexto de autenticación
   - Estados locales con hooks
   - Manejo de formularios

3. **Routing**
   - React Router para navegación
   - Rutas protegidas por rol
   - Redirecciones automáticas

## Modelos de Datos

### Usuarios y Perfiles

```python
class Usuario(AbstractUser):
    id = UUIDField(primary_key=True)
    rol = CharField(choices=['profesor', 'estudiante'])
    fecha_creacion = DateTimeField(auto_now_add=True)

class Profesor(Model):
    usuario = OneToOneField(Usuario)
    departamento = CharField()

class Estudiante(Model):
    usuario = OneToOneField(Usuario)
    codigo_estudiante = CharField(unique=True)
```

### Materias y Matrículas

```python
class Materia(Model):
    id = UUIDField(primary_key=True)
    codigo = CharField(unique=True)
    nombre = CharField()
    profesores = ManyToManyField(Profesor, through='ProfesorMateria')

class ProfesorMateria(Model):
    profesor = ForeignKey(Profesor)
    materia = ForeignKey(Materia)
    fecha_asignacion = DateTimeField(auto_now_add=True)

class Matricula(Model):
    estudiante = ForeignKey(Estudiante)
    materia = ForeignKey(Materia)
    estado = CharField(choices=['activa', 'retirada', 'finalizada'])
```

### Evaluaciones y Notas

```python
class Evaluacion(Model):
    materia = ForeignKey(Materia)
    nombre = CharField()
    porcentaje = DecimalField()
    fecha = DateField()

class Nota(Model):
    evaluacion = ForeignKey(Evaluacion)
    estudiante = ForeignKey(Estudiante)
    nota = DecimalField()
    estado = CharField(choices=['pendiente', 'aprobado', 'reprobado'])

class LogNota(Model):
    nota = ForeignKey(Nota)
    usuario = ForeignKey(Usuario)
    valor_anterior = DecimalField(null=True)
    valor_nuevo = DecimalField()
    fecha_cambio = DateTimeField(auto_now_add=True)
```

## Procedimientos Almacenados

### Gestión de Usuarios

```sql
CREATE OR REPLACE FUNCTION crear_usuario(
    p_nombre VARCHAR(100),
    p_correo VARCHAR(100),
    p_contrasena VARCHAR(255),
    p_rol VARCHAR(20)
) RETURNS UUID AS $$
BEGIN
    -- Validaciones y creación de usuario
END;
$$ LANGUAGE plpgsql;
```

### Gestión de Materias

```sql
CREATE OR REPLACE FUNCTION crear_materia(
    p_nombre VARCHAR(100),
    p_codigo VARCHAR(20)
) RETURNS UUID AS $$
BEGIN
    -- Creación de materia
END;
$$ LANGUAGE plpgsql;
```

### Gestión de Evaluaciones

```sql
CREATE OR REPLACE FUNCTION crear_evaluacion(
    p_materia_id UUID,
    p_nombre VARCHAR(100),
    p_porcentaje DECIMAL(5,2),
    p_fecha DATE
) RETURNS UUID AS $$
BEGIN
    -- Validación de porcentaje total y creación
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### Validación de Porcentajes

```sql
CREATE OR REPLACE FUNCTION validar_porcentaje_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que la suma no exceda 100%
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_porcentaje_total
BEFORE INSERT OR UPDATE ON evaluaciones
FOR EACH ROW
EXECUTE FUNCTION validar_porcentaje_total();
```

### Auditoría de Notas

```sql
CREATE OR REPLACE FUNCTION auditar_cambios_notas()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar cambios en log_notas
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auditar_notas
AFTER INSERT OR UPDATE ON notas
FOR EACH ROW
EXECUTE FUNCTION auditar_cambios_notas();
```

## Seguridad

### Autenticación

- Sesiones basadas en cookies
- Contraseñas hasheadas con bcrypt
- Tokens CSRF para formularios

### Autorización

```python
class IsProfesor(BasePermission):
    def has_permission(self, request, view):
        return request.user.rol == 'profesor'

class IsEstudiante(BasePermission):
    def has_permission(self, request, view):
        return request.user.rol == 'estudiante'
```

## Validaciones

### Backend

1. **Modelos**
   - Restricciones de unicidad
   - Validadores de campo
   - Triggers de base de datos

2. **Serializers**
   - Validación de datos de entrada
   - Transformación de datos
   - Validaciones personalizadas

### Frontend

1. **Formularios**
   - Validación en tiempo real
   - Mensajes de error
   - Prevención de envíos duplicados

2. **Rutas**
   - Protección por rol
   - Redirección automática
   - Manejo de sesión

## Pruebas

### Pruebas Unitarias

```python
class ModelTests(TestCase):
    def test_crear_profesor(self):
        # Pruebas de creación de profesor

    def test_crear_estudiante(self):
        # Pruebas de creación de estudiante
```

### Pruebas de API

```python
class APITests(TestCase):
    def test_login_profesor(self):
        # Pruebas de autenticación

    def test_registrar_nota(self):
        # Pruebas de registro de notas
```

## Despliegue

### Requisitos

- Python 3.8+
- PostgreSQL 13+
- Node.js 18+
- Servidor web (nginx/Apache)

### Configuración

1. **Variables de Entorno**
   ```env
   DEBUG=False
   SECRET_KEY=your-secret-key
   DB_NAME=sgap_db
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   ```

2. **Base de Datos**
   ```bash
   psql -U postgres -d sgap_db -f init.sql
   ```

3. **Aplicación**
   ```bash
   python manage.py migrate
   python manage.py collectstatic
   ```

### Mantenimiento

1. **Backups**
   - Respaldos diarios de la base de datos
   - Rotación de logs
   - Monitoreo de espacio

2. **Actualizaciones**
   - Procedimiento de actualización
   - Rollback plan
   - Ventanas de mantenimiento 