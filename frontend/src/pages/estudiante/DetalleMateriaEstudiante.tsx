import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../utils/axios';
import {
  BookOpenIcon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Evaluacion {
  id: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  porcentaje: number;
  nota?: number;
  estado: 'pendiente' | 'calificada';
}

interface MateriaDetalle {
  id: string;
  nombre: string;
  codigo: string;
  profesor: {
    nombre: string;
    email: string;
  };
  promedio: number;
  descripcion: string;
  horario: string;
}

const DetalleMateriaEstudiante: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [materia, setMateria] = useState<MateriaDetalle | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'evaluaciones'>('info');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materiaRes, evaluacionesRes] = await Promise.all([
          axios.get(`/api/materias/estudiante/${id}/`),
          axios.get(`/api/materias/estudiante/${id}/evaluaciones/`),
        ]);

        setMateria(materiaRes.data);
        setEvaluaciones(evaluacionesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (!materia) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Materia no encontrada</h3>
      </div>
    );
  }

  const promedioCalculado = evaluaciones
    .filter(e => e.nota !== undefined)
    .reduce((acc, curr) => acc + (curr.nota || 0) * (curr.porcentaje / 100), 0);

  return (
    <div className="space-y-6">
      {/* Encabezado de la materia */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BookOpenIcon className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">{materia.nombre}</h2>
              <p className="text-sm text-gray-500">Código: {materia.codigo}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{promedioCalculado.toFixed(1)}</div>
            <p className="text-sm text-gray-500">Promedio actual</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <UserCircleIcon className="h-6 w-6 text-gray-400" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Profesor</h3>
            </div>
            <p className="text-gray-700">{materia.profesor.nombre}</p>
            <p className="text-sm text-gray-500">{materia.profesor.email}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <CalendarIcon className="h-6 w-6 text-gray-400" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Horario</h3>
            </div>
            <p className="text-gray-700">{materia.horario}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Información General
          </button>
          <button
            onClick={() => setActiveTab('evaluaciones')}
            className={`${
              activeTab === 'evaluaciones'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Evaluaciones
          </button>
        </nav>
      </div>

      {/* Contenido de los tabs */}
      {activeTab === 'info' ? (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Descripción de la Materia</h3>
          <p className="text-gray-700 whitespace-pre-line">{materia.descripcion}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluaciones.map((evaluacion) => (
            <div
              key={evaluacion.id}
              className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{evaluacion.nombre}</h3>
                  <p className="mt-1 text-sm text-gray-500">{evaluacion.descripcion}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      Fecha: {new Date(evaluacion.fecha).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Porcentaje: {evaluacion.porcentaje}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {evaluacion.nota !== undefined ? (
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {evaluacion.nota.toFixed(1)}
                      </div>
                      <span className="text-sm text-gray-500">Calificación</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendiente
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {evaluaciones.length === 0 && (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay evaluaciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aún no se han programado evaluaciones para esta materia.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DetalleMateriaEstudiante; 