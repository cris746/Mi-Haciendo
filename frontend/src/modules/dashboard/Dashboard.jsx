import React from 'react';
import { Beef, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { title: 'Total Ganado', value: '142', icon: <Beef size={24} />, color: '#10b981' },
    { title: 'Nacimientos (Mes)', value: '12', icon: <TrendingUp size={24} />, color: '#3b82f6' },
    { title: 'Alertas Salud', value: '3', icon: <AlertCircle size={24} />, color: '#ef4444' },
    { title: 'Ventas Pendientes', value: '5', icon: <ShoppingCart size={24} />, color: '#f59e0b' },
  ];

  return (
    <div className="animate">
      <header className="header">
        <h1 className="title">Panel Principal</h1>
        <p className="text-secondary">Bienvenido a Mi Hacienda ERP</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${stat.color}` }}>
            <div style={{ backgroundColor: `${stat.color}15`, color: stat.color, padding: '0.75rem', borderRadius: '0.75rem' }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>{stat.title}</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Actividades Recientes</h3>
        <p style={{ color: '#64748b' }}>No hay actividades registradas en las últimas 24 horas.</p>
      </div>
    </div>
  );
};

export default Dashboard;
