import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';
import { ClockIcon, AcademicCapIcon, UserIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface HorarioMateria {
  id: string;
  nombre: string;
  profesor: string;
  dia_clase: string;
  hora_inicio: string;
  hora_fin: string;
  salon: string;
}

const Horario: React.FC = () => {
  const [materias, setMaterias] = useState<HorarioMateria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHorario = async () => {
      try {
        const response = await axiosInstance.get('/api/estudiantes/horario/');
        if (response.data && Array.isArray(response.data)) {
          setMaterias(response.data);
        } else {
          setError('Formato de datos inválido');
        }
        setLoading(false);
      } catch (err) {
        setError('Error al cargar el horario');
        setLoading(false);
      }
    };

    fetchHorario();
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

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const horas = Array.from({ length: 14 }, (_, i) => `${i + 7}:00`);

  const estaEnHorario = (materia: HorarioMateria, hora: string) => {
    const horaActual = parseInt(hora.split(':')[0]);
    const horaInicio = parseInt(materia.hora_inicio.split(':')[0]);
    const horaFin = parseInt(materia.hora_fin.split(':')[0]);
    return horaActual >= horaInicio && horaActual < horaFin;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Mi Horario</h2>
      
      {materias.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No tienes materias matriculadas en este momento.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="border p-3 bg-gray-50">Hora</th>
                {dias.map(dia => (
                  <th key={dia} className="border p-3 bg-gray-50">{dia}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horas.map((hora) => (
                <tr key={hora}>
                  <td className="border p-2 text-sm font-medium bg-gray-50">{hora}</td>
                  {dias.map(dia => {
                    const materia = materias.find(m => 
                      m.dia_clase === dia && 
                      estaEnHorario(m, hora)
                    );

                    return (
                      <td key={`${dia}-${hora}`} className="border p-2">
                        {materia && (
                          <div className="bg-blue-100 p-2 rounded">
                            <div className="font-medium text-blue-800">{materia.nombre}</div>
                            <div className="text-sm text-blue-600">
                              <div className="flex items-center gap-1">
                                <UserIcon className="h-4 w-4" />
                                {materia.profesor}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPinIcon className="h-4 w-4" />
                                {materia.salon}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Horario; 