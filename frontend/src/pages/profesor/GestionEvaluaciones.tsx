import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../utils/axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Evaluacion {
  id: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  porcentaje: number;
  estado: 'pendiente' | 'calificada';
}

interface Estudiante {
  id: string;
  nombre_completo: string;
  codigo: string;
  nota?: number;
}

interface FormEvaluacion {
  nombre: string;
  descripcion: string;
  fecha: string;
  porcentaje: number;
}

const GestionEvaluaciones: React.FC = () => {
  const { materiaId } = useParams<{ materiaId: string }>();
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [selectedEvaluacion, setSelectedEvaluacion] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormEvaluacion>({
    nombre: '',
    descripcion: '',
    fecha: '',
    porcentaje: 0,
  });
  const [notas, setNotas] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, [materiaId]);

  const fetchData = async () => {
    try {
      const [evaluacionesRes, estudiantesRes] = await Promise.all([
        axios.get(`/api/materias/${materiaId}/evaluaciones/`),
        axios.get(`/api/materias/${materiaId}/estudiantes/`),
      ]);
      setEvaluaciones(evaluacionesRes.data);
      setEstudiantes(estudiantesRes.data);
    } catch (error) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedEvaluacion) {
        await axios.put(`/api/evaluaciones/${selectedEvaluacion}/`, formData);
      } else {
        await axios.post('/api/evaluaciones/', {
          ...formData,
          materia: materiaId,
        });
      }
      fetchData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      setError('Error al guardar la evaluación');
    }
  };

  const handleDelete = async () => {
    if (!selectedEvaluacion) return;
    try {
      await axios.delete(`/api/evaluaciones/${selectedEvaluacion}/`);
      fetchData();
      setShowDeleteConfirm(false);
      setSelectedEvaluacion(null);
    } catch (error) {
      setError('Error al eliminar la evaluación');
    }
  };

  const handleCalificar = async (evaluacionId: string) => {
    try {
      await axios.post(`/api/evaluaciones/${evaluacionId}/calificar/`, {
        notas: Object.entries(notas).map(([estudianteId, nota]) => ({
          estudiante_id: estudianteId,
          nota,
        })),
      });
      fetchData();
      setNotas({});
      setSelectedEvaluacion(null);
    } catch (error) {
      setError('Error al guardar las calificaciones');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      fecha: '',
      porcentaje: 0,
    });
    setSelectedEvaluacion(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button
            className="absolute top-0 right-0 p-3"
            onClick={() => setError(null)}
            title="Cerrar mensaje de error"
            aria-label="Cerrar mensaje de error"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Evaluaciones</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Evaluación
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Porcentaje
                  <input
                    type="number"
                    value={formData.porcentaje}
                    onChange={(e) => setFormData({ ...formData, porcentaje: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                    max="100"
                    required
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {selectedEvaluacion ? 'Actualizar' : 'Crear'} Evaluación
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
        {evaluaciones.map((evaluacion) => (
          <div key={evaluacion.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{evaluacion.nombre}</h3>
                <p className="mt-1 text-sm text-gray-500">{evaluacion.descripcion}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Fecha: {new Date(evaluacion.fecha).toLocaleDateString()}</span>
                  <span>Porcentaje: {evaluacion.porcentaje}%</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setFormData({
                      nombre: evaluacion.nombre,
                      descripcion: evaluacion.descripcion,
                      fecha: evaluacion.fecha,
                      porcentaje: evaluacion.porcentaje,
                    });
                    setSelectedEvaluacion(evaluacion.id);
                    setShowForm(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="Editar evaluación"
                  aria-label="Editar evaluación"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedEvaluacion(evaluacion.id);
                    setShowDeleteConfirm(true);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500"
                  title="Eliminar evaluación"
                  aria-label="Eliminar evaluación"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {selectedEvaluacion === evaluacion.id && (
              <div className="mt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Calificar Estudiantes</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nota
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {estudiantes.map((estudiante) => (
                        <tr key={estudiante.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {estudiante.codigo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {estudiante.nombre_completo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={notas[estudiante.id] || ''}
                              onChange={(e) =>
                                setNotas({
                                  ...notas,
                                  [estudiante.id]: Number(e.target.value),
                                })
                              }
                              className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              min="0"
                              max="5"
                              step="0.1"
                              title={`Nota para ${estudiante.nombre_completo}`}
                              aria-label={`Nota para ${estudiante.nombre_completo}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedEvaluacion(null);
                      setNotas({});
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleCalificar(evaluacion.id)}
                    className="btn btn-primary"
                  >
                    Guardar Calificaciones
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ¿Está seguro de eliminar esta evaluación?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedEvaluacion(null);
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionEvaluaciones; 