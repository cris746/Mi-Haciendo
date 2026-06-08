import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Login from '../modules/auth/Login';
import Dashboard from '../modules/dashboard/Dashboard';
import Animales from '../modules/animales/Animales';
import Inventario from '../modules/inventario/Inventario';
import Ventas from '../modules/ventas/Ventas';
import Clientes from '../modules/clientes/Clientes';
import Compras from '../modules/compras/Compras';
import Proveedores from '../modules/proveedores/Proveedores';
import Sanidad from '../modules/sanidad/Sanidad';
import Reportes from '../modules/reportes/Reportes';
import Usuarios from '../modules/usuarios/Usuarios';
import Catalogos from '../modules/catalogos/Catalogos';
import Movimientos from '../modules/movimientos/Movimientos';
import PrivateRoute from './PrivateRoute';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Rutas Protegidas */}
      <Route element={<DashboardLayout />}>
        {/* Rutas compartidas o de redirección base */}
        <Route element={<PrivateRoute allowedRoles={['ADMIN', 'VETERINARIO', 'VENDEDOR']} />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/animales" element={<Animales />} />
        </Route>

        {/* ADMIN ONLY */}
        <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
          <Route path="/compras" element={<Compras />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/catalogos" element={<Catalogos />} />
          <Route path="/movimientos" element={<Movimientos />} />
        </Route>

        {/* VETERINARIO ONLY */}
        <Route element={<PrivateRoute allowedRoles={['VETERINARIO', 'ADMIN']} />}>
          <Route path="/sanidad" element={<Sanidad />} />
          <Route path="/inventario" element={<Inventario />} />
        </Route>

        {/* VENDEDOR ONLY */}
        <Route element={<PrivateRoute allowedRoles={['VENDEDOR', 'ADMIN']} />}>
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/clientes" element={<Clientes />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;
