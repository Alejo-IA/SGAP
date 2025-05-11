import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Páginas del profesor
import MateriasProfesor from './pages/profesor/MateriasProfesor';
import DetalleMateria from './pages/profesor/DetalleMateria';
import GestionEvaluaciones from './pages/profesor/GestionEvaluaciones';

// Páginas del estudiante
import MisMaterias from './pages/estudiante/MisMaterias';
import DetalleMateriaEstudiante from './pages/estudiante/DetalleMateriaEstudiante';
import HistorialAcademico from './pages/estudiante/HistorialAcademico';
import Horario from './pages/estudiante/Horario';
import DashboardEstudiante from './pages/estudiante/DashboardEstudiante';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Dashboard components for different roles
const ProfesorDashboard = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-2xl font-bold mb-4">Panel del Profesor</h2>
    <p>Bienvenido al sistema de gestión académica.</p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Materias Asignadas</h3>
        <p className="text-gray-600">Gestiona tus materias y estudiantes</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Evaluaciones</h3>
        <p className="text-gray-600">Administra las evaluaciones y calificaciones</p>
      </div>
    </div>
  </div>
);

const EstudianteDashboard = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-2xl font-bold mb-4">Panel del Estudiante</h2>
    <p>Bienvenido al sistema de gestión académica.</p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Mis Cursos</h3>
        <p className="text-gray-600">Visualiza tus materias matriculadas</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Mis Notas</h3>
        <p className="text-gray-600">Consulta tus calificaciones</p>
      </div>
    </div>
  </div>
);

// Role-based dashboard selector
const DashboardSelector = (): JSX.Element => {
  const { user } = useAuth();
  return user?.rol === 'profesor' ? <ProfesorDashboard /> : <EstudianteDashboard />;
};

const AppRoutes = (): JSX.Element => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Rutas del profesor */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['profesor']}>
              <ProfesorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materias"
          element={
            <ProtectedRoute allowedRoles={['profesor']}>
              <MateriasProfesor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materias/:id"
          element={
            <ProtectedRoute allowedRoles={['profesor']}>
              <DetalleMateria />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materias/:materiaId/evaluaciones"
          element={
            <ProtectedRoute allowedRoles={['profesor']}>
              <GestionEvaluaciones />
            </ProtectedRoute>
          }
        />
        
        {/* Rutas del estudiante */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <DashboardEstudiante />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materias"
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <MisMaterias />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materias/:id"
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <DetalleMateriaEstudiante />
            </ProtectedRoute>
          }
        />
        <Route
          path="/historial"
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <HistorialAcademico />
            </ProtectedRoute>
          }
        />
        <Route
          path="/horario"
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <Horario />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
