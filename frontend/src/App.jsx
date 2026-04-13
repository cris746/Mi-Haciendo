import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home, LayoutGrid, Beef, Syringe, ClipboardList, Settings, Menu, X, Plus } from 'lucide-react';
import Dashboard from './modules/dashboard/Dashboard';
import LivestockList from './modules/livestock/LivestockList';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
          <div className="sidebar-header">
            <Beef size={28} className="text-white" />
            <span className="sidebar-logo">Mi Hacienda</span>
          </div>

          <nav className="nav-menu">
            <Link to="/" className="nav-item">
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
            <Link to="/livestock" className="nav-item">
              <ClipboardList size={20} />
              <span>Inventario Ganado</span>
            </Link>
            <Link to="/health" className="nav-item">
              <Syringe size={20} />
              <span>Sanidad</span>
            </Link>
            <Link to="/production" className="nav-item">
              <LayoutGrid size={20} />
              <span>Producción</span>
            </Link>
          </nav>

          <div className="nav-footer">
            <Link to="/settings" className="nav-item">
              <Settings size={20} />
              <span>Configuración</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/livestock" element={<LivestockList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
