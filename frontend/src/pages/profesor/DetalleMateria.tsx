import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface Estudiante {
  id: string;
  nombre_completo: string;
  codigo: string;
  promedio: number;
}

interface Evaluacion {
  id: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  porcentaje: number;
  estado: 'pendiente' | 'calificada';
}

interface MateriaDetalle {
  id: string;
  nombre: string;
  codigo: string;
  creditos: number;
  descripcion: string;
}

const DetalleMateria: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [materia, setMateria] = useState<MateriaDetalle | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'estudiantes' | 'evaluaciones'>('estudiantes');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materiaRes, estudiantesRes, evaluacionesRes] = await Promise.all([
          axios.get(`/api/materias/${id}/`),
          axios.get(`/api/materias/${id}/estudiantes/`),
          axios.get(`/api/materias/${id}/evaluaciones/`),
        ]);

        setMateria(materiaRes.data);
        setEstudiantes(estudiantesRes.data);
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

  return (
    <div className="space-y-6">
      {/* Encabezado de la materia */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{materia.nombre}</h2>
            <p className="text-sm text-gray-500">Código: {materia.codigo}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/materias/${id}/evaluaciones`)}
              className="btn btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Gestionar Evaluaciones
            </button>
          </div>
        </div>
        <p className="text-gray-600">{materia.descripcion}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('estudiantes')}
            className={`${
              activeTab === 'estudiantes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Estudiantes
          </button>
          <button
            onClick={() => setActiveTab('evaluaciones')}
            className={`${
              activeTab === 'evaluaciones'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
            Evaluaciones
          </button>
        </nav>
      </div>

      {/* Contenido de los tabs */}
      {activeTab === 'estudiantes' ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {estudiantes.map((estudiante) => (
                <tr key={estudiante.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {estudiante.nombre_completo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{estudiante.codigo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{estudiante.promedio.toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Nueva Evaluación
            </button>
          </div>
          <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
            {evaluaciones.map((evaluacion) => (
              <div key={evaluacion.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{evaluacion.nombre}</h3>
                    <p className="mt-1 text-sm text-gray-500">{evaluacion.descripcion}</p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Fecha: {new Date(evaluacion.fecha).toLocaleDateString()}</span>
                      <span>Porcentaje: {evaluacion.porcentaje}%</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        evaluacion.estado === 'calificada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {evaluacion.estado === 'calificada' ? 'Calificada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleMateria; 