import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Beef } from 'lucide-react';
import { getAnimals } from '../../api/api';

const LivestockList = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      const response = await getAnimals();
      setAnimals(response.data);
    } catch (error) {
      console.error('Error fetching animals:', error);
      // Fallback a datos estáticos para demo si falla la API
      setAnimals([
        { id: '1', tag: 'A-102', breed: 'Brahman', gender: 'Hembra', status: 'Healthy', weight: 450, birthDate: '2022-05-10' },
        { id: '2', tag: 'A-105', breed: 'Nelore', gender: 'Macho', status: 'Healthy', weight: 520, birthDate: '2021-11-25' },
        { id: '3', tag: 'B-201', breed: 'Holstein', gender: 'Hembra', status: 'Sick', weight: 380, birthDate: '2023-01-15' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate">
      <header className="header">
        <div>
          <h1 className="title">Inventario de Ganado</h1>
          <p style={{ color: '#64748b' }}>Gestiona y monitorea todos tus ejemplares.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={20} />
          <span>Registrar Ejemplar</span>
        </button>
      </header>

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', padding: '0.5rem 1rem' }}>
            <Search size={18} style={{ color: '#94a3b8', marginRight: '0.5rem' }} />
            <input 
              type="text" 
              placeholder="Buscar por arete o nombre..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', color: '#334155', width: '100%' }}
            />
          </div>
          <button className="btn" style={{ border: '1px solid #e2e8f0' }}>
            <Filter size={18} />
            <span>Filtros</span>
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Arete</th>
              <th>Raza</th>
              <th>Género</th>
              <th>Peso (kg)</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {animals.map((animal) => (
              <tr key={animal.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '0.5rem' }}>
                      <Beef size={18} style={{ color: '#64748b' }} />
                    </div>
                    <span style={{ fontWeight: 600 }}>{animal.tag}</span>
                  </div>
                </td>
                <td>{animal.breed}</td>
                <td>{animal.gender}</td>
                <td>{animal.weight}</td>
                <td>
                  <span className={`badge badge-${animal.status.toLowerCase()}`}>
                    {animal.status === 'Healthy' ? 'Sano' : 'Enfermo'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {animals.length === 0 && !loading && (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            No se encontraron animales registrados.
          </div>
        )}
      </div>
    </div>
  );
};

export default LivestockList;
