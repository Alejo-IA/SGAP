### SGAP - Academic Management System

Academic management system for teachers and students.

---

## Prerequisites

* Python 3.9+
* Node.js 18+
* npm 8+

---

## Installation

### Backend (Django)

1. Clone the repository:

```bash
git clone https://github.com/Alejo-IA/SGAP.git
cd SGAP
```

2. Create and activate a virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your settings
```

5. Apply migrations:

```bash
python manage.py migrate
```

6. Create superuser:

```bash
python manage.py createsuperuser
```

7. Start the server:

```bash
python manage.py runserver
```

---

### Frontend (React)

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

---

## Access

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend API: [http://localhost:8000](http://localhost:8000)
* Django Admin: [http://localhost:8000/admin](http://localhost:8000/admin)

---

## Project Structure

```
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
```

---

## Development

* The backend uses Django 4.2 with Django REST Framework
* The frontend uses React with TypeScript and Tailwind CSS
* Authentication is managed with Django sessions
* CORS is configured for local development

---

## Contributing

1. Create a branch for the new feature
2. Commit your changes
3. Create a Pull Request
