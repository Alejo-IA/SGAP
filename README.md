SGAP - Academic Management System
Academic management system for teachers and students.

Prerequisites
Python 3.9+

Node.js 18+

npm 8+

Installation
Backend (Django)
Clone the repository:

bash
Copiar
Editar
git clone https://github.com/Alejo-IA/SGAP.git
cd SGAP
Create and activate a virtual environment:

bash
Copiar
Editar
# Windows
python -m venv venv
venv\Scripts\activate  

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
Install dependencies:

bash
Copiar
Editar
cd backend
pip install -r requirements.txt
Configure environment variables:

bash
Copiar
Editar
cp .env.example .env
# Edit .env with your settings
Apply migrations:

bash
Copiar
Editar
python manage.py migrate
Create superuser:

bash
Copiar
Editar
python manage.py createsuperuser
Start the server:

bash
Copiar
Editar
python manage.py runserver
Frontend (React)
Install dependencies:

bash
Copiar
Editar
cd frontend
npm install
Start the development server:

bash
Copiar
Editar
npm run dev
Access
Frontend: http://localhost:3000

Backend API: http://localhost:8000

Django Admin: http://localhost:8000/admin

Project Structure
csharp
Copiar
Editar
SGAP/
├── backend/           # Django Project
│   ├── academic/      # Main App
│   ├── backend/       # Project Configuration
│   └── requirements.txt
│
└── frontend/          # React Project
    ├── src/
    ├── public/
    └── package.json
Development
The backend uses Django 4.2 with Django REST Framework

The frontend uses React with TypeScript and Tailwind CSS

Authentication is managed with Django sessions

CORS is configured for local development

Contributing
Create a branch for the new feature

Commit your changes

Create a Pull Request
