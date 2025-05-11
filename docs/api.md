# API Documentation - SGAP

## Autenticación

### Login
- **URL**: `/api/usuarios/login/`
- **Método**: `POST`
- **Datos**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Respuesta**:
  ```json
  {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "rol": "string"
  }
  ```

### Logout
- **URL**: `/api/usuarios/logout/`
- **Método**: `POST`
- **Autenticación**: Requerida
- **Respuesta**: `200 OK`

## Profesores

### Listar Materias del Profesor
- **URL**: `/api/profesores/{id}/materias/`
- **Método**: `GET`
- **Autenticación**: Requerida (Profesor)
- **Respuesta**:
  ```json
  [
    {
      "id": "uuid",
      "codigo": "string",
      "nombre": "string",
      "estudiantes_matriculados": [
        {
          "id": "uuid",
          "codigo_estudiante": "string",
          "usuario": {
            "id": "uuid",
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string"
          }
        }
      ]
    }
  ]
  ```

### Crear Evaluación
- **URL**: `/api/evaluaciones/`
- **Método**: `POST`
- **Autenticación**: Requerida (Profesor)
- **Datos**:
  ```json
  {
    "materia": "uuid",
    "nombre": "string",
    "porcentaje": "number",
    "fecha": "date"
  }
  ```
- **Respuesta**:
  ```json
  {
    "id": "uuid",
    "materia": "uuid",
    "nombre": "string",
    "porcentaje": "number",
    "fecha": "date",
    "fecha_creacion": "datetime"
  }
  ```

### Registrar Notas
- **URL**: `/api/evaluaciones/{id}/registrar-notas/`
- **Método**: `POST`
- **Autenticación**: Requerida (Profesor)
- **Datos**:
  ```json
  {
    "notas": [
      {
        "estudiante_id": "uuid",
        "nota": "number"
      }
    ]
  }
  ```
- **Respuesta**: `201 Created`

## Estudiantes

### Listar Materias del Estudiante
- **URL**: `/api/estudiantes/{id}/materias/`
- **Método**: `GET`
- **Autenticación**: Requerida (Estudiante)
- **Respuesta**:
  ```json
  [
    {
      "id": "uuid",
      "codigo": "string",
      "nombre": "string",
      "fecha_creacion": "datetime"
    }
  ]
  ```

### Consultar Notas
- **URL**: `/api/estudiantes/{id}/notas/`
- **Método**: `GET`
- **Autenticación**: Requerida (Estudiante)
- **Respuesta**:
  ```json
  [
    {
      "id": "uuid",
      "materia": {
        "id": "uuid",
        "nombre": "string",
        "codigo": "string"
      },
      "evaluacion": {
        "id": "uuid",
        "nombre": "string",
        "porcentaje": "number",
        "fecha": "date"
      },
      "nota": "number",
      "estado": "string"
    }
  ]
  ```

## Materias

### Listar Estudiantes de una Materia
- **URL**: `/api/materias/{id}/estudiantes/`
- **Método**: `GET`
- **Autenticación**: Requerida (Profesor)
- **Respuesta**:
  ```json
  [
    {
      "id": "uuid",
      "codigo_estudiante": "string",
      "usuario": {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string"
      }
    }
  ]
  ```

### Listar Evaluaciones de una Materia
- **URL**: `/api/materias/{id}/evaluaciones/`
- **Método**: `GET`
- **Autenticación**: Requerida
- **Respuesta**:
  ```json
  [
    {
      "id": "uuid",
      "nombre": "string",
      "porcentaje": "number",
      "fecha": "date",
      "fecha_creacion": "datetime"
    }
  ]
  ```

## Matrículas

### Matricular Estudiante
- **URL**: `/api/matriculas/matricular-estudiante/`
- **Método**: `POST`
- **Autenticación**: Requerida (Profesor)
- **Datos**:
  ```json
  {
    "estudiante_id": "uuid",
    "materia_id": "uuid"
  }
  ```
- **Respuesta**:
  ```json
  {
    "id": "uuid",
    "estudiante": {
      "id": "uuid",
      "codigo_estudiante": "string",
      "usuario": {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string"
      }
    },
    "materia": {
      "id": "uuid",
      "codigo": "string",
      "nombre": "string"
    },
    "fecha_matricula": "datetime",
    "estado": "string"
  }
  ```

## Códigos de Estado

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Error en los datos enviados
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: No autorizado
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

## Notas Adicionales

- Todas las solicitudes que requieren autenticación deben incluir el token de sesión en las cookies.
- Los campos de fecha deben estar en formato ISO 8601 (YYYY-MM-DD).
- Los porcentajes deben ser números decimales entre 0 y 100.
- Las notas deben ser números decimales entre 0 y 5.
- Los estados de matrícula pueden ser: "activa", "retirada", "finalizada".
- Los estados de nota pueden ser: "pendiente", "aprobado", "reprobado". 