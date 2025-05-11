# SGAP - Sistema de Gestión Académica

Sistema de gestión académica para profesores y estudiantes.

## Requisitos Previos

- Python 3.9+
- Node.js 18+
- npm 8+

## Instalación

### Backend (Django)

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd SGAP
```

2. Crear y activar entorno virtual:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. Instalar dependencias:
```bash
cd backend
pip install -r requirements.txt
```

4. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

5. Aplicar migraciones:
```bash
python manage.py migrate
```

6. Crear superusuario:
```bash
python manage.py createsuperuser
```

7. Iniciar servidor:
```bash
python manage.py runserver
```

### Frontend (React)

1. Instalar dependencias:
```bash
cd frontend
npm install
```

2. Iniciar servidor de desarrollo:
```bash
npm run dev
```

## Acceso

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Django: http://localhost:8000/admin

## Estructura del Proyecto

```
SGAP/
├── backend/             # Proyecto Django
│   ├── academic/       # App principal
│   ├── backend/       # Configuración del proyecto
│   └── requirements.txt
│
└── frontend/           # Proyecto React
    ├── src/
    ├── public/
    └── package.json
```

## Desarrollo

- El backend usa Django 4.2 con Django REST Framework
- El frontend usa React con TypeScript y Tailwind CSS
- La autenticación se maneja con sesiones de Django
- CORS está configurado para desarrollo local

## Contribuir

1. Crear rama para nueva característica
2. Hacer commit de cambios
3. Crear Pull Request 