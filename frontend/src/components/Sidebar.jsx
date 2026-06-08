import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Dog, 
  Utensils, 
  ShoppingCart, 
  BadgeDollarSign, 
  Stethoscope,
  LogOut,
  Users,
  Truck,
  BarChart2,
  Shield,
  ClipboardList,
  MapPin,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['ADMIN', 'VETERINARIO', 'VENDEDOR'] },
    { name: 'Animales', icon: <Dog size={20} />, path: '/animales', roles: ['ADMIN', 'VETERINARIO', 'VENDEDOR'] },
    { name: 'Ubicación', icon: <MapPin size={20} />, path: '/movimientos', roles: ['ADMIN'] },
    { name: 'Catálogos', icon: <ClipboardList size={20} />, path: '/catalogos', roles: ['ADMIN'] },
    { name: 'Inventario', icon: <Utensils size={20} />, path: '/inventario', roles: ['ADMIN', 'VETERINARIO'] },
    { name: 'Ventas', icon: <BadgeDollarSign size={20} />, path: '/ventas', roles: ['ADMIN', 'VENDEDOR'] },
    { name: 'Clientes', icon: <Users size={20} />, path: '/clientes', roles: ['ADMIN', 'VENDEDOR'] },
    { name: 'Compras', icon: <ShoppingCart size={20} />, path: '/compras', roles: ['ADMIN'] },
    { name: 'Proveedores', icon: <Truck size={20} />, path: '/proveedores', roles: ['ADMIN'] },
    { name: 'Sanidad', icon: <Stethoscope size={20} />, path: '/sanidad', roles: ['ADMIN', 'VETERINARIO'] },
    { name: 'Reportes', icon: <BarChart2 size={20} />, path: '/reportes', roles: ['ADMIN', 'VETERINARIO', 'VENDEDOR'] },
    { name: 'Usuarios', icon: <Shield size={20} />, path: '/usuarios', roles: ['ADMIN'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className={`
      fixed lg:sticky top-0 left-0 z-50 bg-white border-r border-gray-200 h-screen w-64 flex flex-col 
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-700">Mi Hacienda</h1>
        {/* Botón X para móvil */}
        <button 
          onClick={onClose}
          className="lg:hidden p-1 text-gray-400 hover:text-gray-600 no-print"
        >
          <X size={24} />
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary-50 text-primary-700 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
