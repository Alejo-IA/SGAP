import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import type { AxiosError } from 'axios';
import {
  BookOpenIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface StudentDashboardStats {
  promedio_acumulado: number;
  creditos_aprobados: number;
  materias_actuales: number;
  proximas_evaluaciones: Array<{
    id: string;
    nombre: string;
    materia_nombre: string;
    fecha: string;
  }>;
  ultimas_notas: Array<{
    nota: number;
    evaluacion_nombre: string;
    materia_nombre: string;
    fecha: string;
  }>;
  mejor_materia: {
    nombre: string;
    promedio: number;
  } | null;
  peor_materia: {
    nombre: string;
    promedio: number;
  } | null;
  progreso_semestre: number;
}

interface ProfessorDashboardStats {
  materias_count: number;
  estudiantes_count: number;
  evaluaciones_count: number;
  proximas_evaluaciones: Array<{
    id: string;
    nombre: string;
    materia_nombre: string;
    fecha: string;
  }>;
}

type DashboardStats = StudentDashboardStats | ProfessorDashboardStats;

interface APIError {
  error: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching dashboard data...');
        const endpoint = user?.rol === 'estudiante' 
          ? '/api/usuarios/resumen/' 
          : '/api/usuarios/dashboard/stats/';
        const response = await axios.get(endpoint);
        console.log('Dashboard response:', response.data);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const axiosError = error as AxiosError<APIError>;
        setError(axiosError.response?.data?.error || 'Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.rol]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Error cargando datos</h3>
        <p className="mt-2 text-sm text-gray-500">
          {error || 'No se pudieron cargar los datos del dashboard. Por favor, intenta de nuevo.'}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto">
            {JSON.stringify({ error, stats }, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  const statCards = user?.rol === 'profesor' ? [
    {
      name: 'Materias',
      stat: (stats as ProfessorDashboardStats).materias_count,
      icon: BookOpenIcon,
      color: 'text-blue-600',
      onClick: () => navigate('/materias'),
    },
    {
      name: 'Estudiantes',
      stat: (stats as ProfessorDashboardStats).estudiantes_count,
      icon: UserGroupIcon,
      color: 'text-green-600',
      onClick: () => navigate('/estudiantes'),
    },
    {
      name: 'Evaluaciones',
      stat: (stats as ProfessorDashboardStats).evaluaciones_count,
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      onClick: () => navigate('/evaluaciones'),
    },
  ] : [
    {
      name: 'Promedio Acumulado',
      stat: (stats as StudentDashboardStats)?.promedio_acumulado?.toFixed(2) || 'N/A',
      icon: ChartBarIcon,
      color: 'text-blue-600',
      onClick: () => navigate('/mis-notas'),
    },
    {
      name: 'Créditos Aprobados',
      stat: (stats as StudentDashboardStats)?.creditos_aprobados || 0,
      icon: BookOpenIcon,
      color: 'text-green-600',
      onClick: () => navigate('/mi-historial'),
    },
    {
      name: 'Materias Actuales',
      stat: (stats as StudentDashboardStats)?.materias_actuales || 0,
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      onClick: () => navigate('/mis-materias'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.first_name}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Aquí tienes un resumen de tu actividad académica
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <button
            key={card.name}
            onClick={card.onClick}
            className="bg-white overflow-hidden rounded-lg shadow hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <card.icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{card.stat}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Próximas evaluaciones */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Próximas Evaluaciones</h3>
          <div className="mt-6 flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {stats.proximas_evaluaciones.length > 0 ? (
                stats.proximas_evaluaciones.map((evaluacion) => (
                  <li key={evaluacion.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <CalendarIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {evaluacion.nombre}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{evaluacion.materia_nombre}</p>
                      </div>
                      <div>
                        <div className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
                          {new Date(evaluacion.fecha).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-4">
                  <div className="text-center text-gray-500">
                    No hay evaluaciones programadas próximamente
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 