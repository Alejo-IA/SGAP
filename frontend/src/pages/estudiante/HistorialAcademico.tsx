import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';
import { AcademicCapIcon, ChartBarIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  estado: string;
  promedio: number;
}

interface HistorialData {
  materias: Materia[];
  promedio_general: number;
  creditos_totales: number;
  creditos_aprobados: number;
}

const HistorialAcademico: React.FC = () => {
  const [historial, setHistorial] = useState<HistorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const response = await axiosInstance.get('/api/estudiantes/historial/');
        if (response.data && response.data.materias) {
          setHistorial(response.data);
        } else {
          setError('Formato de datos inválido');
        }
        setLoading(false);
      } catch (err) {
        setError('Error al cargar el historial académico');
        setLoading(false);
      }
    };

    fetchHistorial();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4 max-w-lg mx-auto">
          <p className="font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (!historial) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No hay información disponible en este momento.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Historial Académico</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Promedio General</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{historial.promedio_general.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <AcademicCapIcon className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Créditos Aprobados</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {historial.creditos_aprobados} / {historial.creditos_totales}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <BookOpenIcon className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Materias Cursadas</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">{historial.materias.length}</p>
        </div>
      </div>

      {historial.materias.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No hay materias registradas en tu historial.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="border p-3 bg-gray-50">Código</th>
                <th className="border p-3 bg-gray-50">Nombre</th>
                <th className="border p-3 bg-gray-50">Créditos</th>
                <th className="border p-3 bg-gray-50">Estado</th>
                <th className="border p-3 bg-gray-50">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {historial.materias.map((materia) => (
                <tr key={materia.id}>
                  <td className="border p-3">{materia.codigo}</td>
                  <td className="border p-3">{materia.nombre}</td>
                  <td className="border p-3 text-center">{materia.creditos}</td>
                  <td className="border p-3">
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      materia.estado === 'Aprobada' ? 'bg-green-100 text-green-800' :
                      materia.estado === 'Reprobada' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {materia.estado}
                    </span>
                  </td>
                  <td className="border p-3 text-center">
                    {materia.promedio.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistorialAcademico; 