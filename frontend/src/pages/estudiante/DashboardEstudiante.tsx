import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import {
  BookOpenIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  AcademicCapIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface ResumenAcademico {
  promedio_acumulado: number;
  creditos_aprobados: number;
  materias_actuales: number;
  proximas_evaluaciones: {
    id: string;
    nombre: string;
    materia_nombre: string;
    fecha: string;
  }[];
  ultimas_notas: {
    nota: number;
    evaluacion_nombre: string;
    materia_nombre: string;
    fecha: string;
  }[];
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

const DashboardEstudiante = (): JSX.Element => {
  const [resumen, setResumen] = useState<ResumenAcademico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const response = await axios.get('/api/estudiantes/resumen/');
        setResumen(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching resumen:', error);
        setError('Error al cargar el resumen académico');
      } finally {
        setLoading(false);
      }
    };

    fetchResumen();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (error || !resumen) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">{error || 'Error al cargar el resumen'}</h3>
      </div>
    );
  }

  const getNotaColor = (nota: number) => {
    if (nota >= 4.0) return 'text-green-600';
    if (nota >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel del Estudiante</h1>
          <p className="text-gray-600">Bienvenido al sistema de gestión académica.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Progreso del Semestre</p>
          <div className="flex items-center mt-1">
            <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
              <div
                className={`bg-blue-600 h-2.5 rounded-full w-[${resumen.progreso_semestre}%]`}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {resumen.progreso_semestre.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Promedio Acumulado</p>
              <p className={`text-2xl font-bold ${getNotaColor(resumen.promedio_acumulado)}`}>
                {resumen.promedio_acumulado.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Créditos Aprobados</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.creditos_aprobados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Materias Actuales</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.materias_actuales}</p>
            </div>
          </div>
        </div>

        <Link
          to="/horario"
          className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Ver Horario</p>
              <p className="text-lg font-medium text-gray-900">Horario de Clases</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Rendimiento por Materias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resumen.mejor_materia && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-4">
              <TrophyIcon className="h-6 w-6 text-yellow-500" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Mejor Rendimiento</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-900 font-medium">{resumen.mejor_materia.nombre}</p>
              <p className={`text-xl font-bold ${getNotaColor(resumen.mejor_materia.promedio)}`}>
                {resumen.mejor_materia.promedio.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {resumen.peor_materia && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Necesita Atención</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-900 font-medium">{resumen.peor_materia.nombre}</p>
              <p className={`text-xl font-bold ${getNotaColor(resumen.peor_materia.promedio)}`}>
                {resumen.peor_materia.promedio.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Últimas Notas */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Últimas Calificaciones</h3>
          <div className="space-y-4">
            {resumen.ultimas_notas.map((nota, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{nota.evaluacion_nombre}</p>
                  <p className="text-sm text-gray-500">{nota.materia_nombre}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getNotaColor(nota.nota)}`}>
                    {nota.nota.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(nota.fecha).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}

            {resumen.ultimas_notas.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500">No hay calificaciones recientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Próximas Evaluaciones */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Próximas Evaluaciones</h3>
          <div className="space-y-4">
            {resumen.proximas_evaluaciones.map((evaluacion) => (
              <div
                key={evaluacion.id}
                className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{evaluacion.nombre}</p>
                  <p className="text-sm text-gray-500">{evaluacion.materia_nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(evaluacion.fecha).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(evaluacion.fecha).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {resumen.proximas_evaluaciones.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500">No hay evaluaciones próximas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/materias"
          className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center mb-4">
            <BookOpenIcon className="h-8 w-8 text-blue-600" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Mis Materias</h3>
          </div>
          <p className="text-gray-500">
            Visualiza tus materias matriculadas, notas y evaluaciones pendientes.
          </p>
        </Link>

        <Link
          to="/historial"
          className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center mb-4">
            <ClipboardDocumentListIcon className="h-8 w-8 text-green-600" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Historial Académico</h3>
          </div>
          <p className="text-gray-500">
            Consulta tu historial académico completo y progreso en la carrera.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default DashboardEstudiante; 