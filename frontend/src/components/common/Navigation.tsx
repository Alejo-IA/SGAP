import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const profesorNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Mis Materias', href: '/materias', icon: BookOpenIcon },
  { name: 'Estudiantes', href: '/estudiantes', icon: UserGroupIcon },
  { name: 'Evaluaciones', href: '/evaluaciones', icon: ClipboardDocumentListIcon },
  { name: 'Calendario', href: '/calendario', icon: CalendarIcon },
];

const estudianteNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Mis Materias', href: '/mis-materias', icon: BookOpenIcon },
  { name: 'Mis Notas', href: '/mis-notas', icon: ClipboardDocumentListIcon },
  { name: 'Calendario', href: '/calendario', icon: CalendarIcon },
];

export const Navigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navigation = user?.rol === 'profesor' ? profesorNavigation : estudianteNavigation;

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <item.icon
              className={`mr-3 flex-shrink-0 h-5 w-5 ${
                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
              }`}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation; 