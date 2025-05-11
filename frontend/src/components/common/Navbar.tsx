import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = (): JSX.Element => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderNavLinks = () => {
    if (user?.rol === 'profesor') {
      return (
        <>
          <Link
            to="/materias"
            className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
          >
            Mis Materias
          </Link>
          <Link
            to="/evaluaciones"
            className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
          >
            Evaluaciones
          </Link>
        </>
      );
    }

    return (
      <>
        <Link
          to="/materias"
          className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
        >
          Mis Materias
        </Link>
        <Link
          to="/horario"
          className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
        >
          Horario
        </Link>
        <Link
          to="/historial"
          className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
        >
          Historial Académico
        </Link>
      </>
    );
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-gray-800">
                SGAP
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {renderNavLinks()}
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center">
            <span className="text-gray-700 mr-4">
              {user ? `${user.first_name} ${user.last_name}` : ''}
            </span>
            <button
              onClick={handleLogout}
              className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 