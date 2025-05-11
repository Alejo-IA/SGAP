import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Materia {
  id: string;
  nombre: string;
  codigo: string;
  profesor: string;
  promedio: number;
  proxima_evaluacion?: {
    nombre: string;
    fecha: string;
  };
  evaluaciones_pendientes: number;
}

const MisMaterias: React.FC = () => {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const response = await axios.get('/api/materias/estudiante/');
        setMaterias(response.data);
      } catch (error) {
        console.error('Error fetching materias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterias();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {materias.map((materia) => (
          <div
            key={materia.id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
            onClick={() => navigate(`/materias/${materia.id}`)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <BookOpenIcon className="h-8 w-8 text-blue-600" />
                <span className="text-sm font-medium text-gray-500">{materia.codigo}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{materia.nombre}</h3>
              <p className="text-sm text-gray-500 mb-4">Prof. {materia.profesor}</p>
              
              <div className="flex items-center space-x-2 mb-4">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  Promedio: {materia.promedio.toFixed(1)}
                </span>
              </div>

              {materia.proxima_evaluacion && (
                <div className="p-4 bg-blue-50 rounded-lg mb-4">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Próxima Evaluación
                      </p>
                      <p className="text-sm text-blue-700">
                        {materia.proxima_evaluacion.nombre}
                      </p>
                      <p className="text-xs text-blue-600">
                        {new Date(materia.proxima_evaluacion.fecha).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-600">
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                  {materia.evaluaciones_pendientes} evaluaciones pendientes
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {materias.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay materias matriculadas</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tienes materias matriculadas para este período académico.
          </p>
        </div>
      )}
    </div>
  );
};

export default MisMaterias; 