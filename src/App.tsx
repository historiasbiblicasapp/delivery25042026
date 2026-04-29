import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import LoginLoja from './pages/LoginLoja';
import Dashboard from './pages/Dashboard';
import Cardapio from './pages/Cardapio';
import Pedido from './pages/Pedido';
import Entregas from './pages/Entregas';
import AdminLoja from './pages/AdminLoja';
import Motoboy from './pages/Motoboy';
import ConfigPagamento from './pages/ConfigPagamento';
import Dispositivos from './pages/Dispositivos';
import PDV from './pages/PDV';
import Metrics from './pages/Metrics';
import Promo from './pages/Promo';
import { LayoutDashboard, Package, LogOut, Truck, ShoppingCart, CreditCard, Monitor, ShoppingBag } from 'lucide-react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <Layout>{children}</Layout>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const menuItemsAdmin = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Lojas' },
    { path: '/cardapio', icon: Package, label: 'Cardápio' },
    { path: '/dispositivos', icon: Monitor, label: 'Devices' },
    { path: '/pdv', icon: ShoppingBag, label: 'PDV' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <nav style={{ background: '#22c55e', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Delivery 2026</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={signOut} style={{ background: 'white', color: '#22c55e', border: 'none', borderRadius: '4px', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
            🚪 Sair
          </button>
        </div>
      </nav>
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', background: 'white', borderBottom: '1px solid #ddd', overflowX: 'auto' }}>
        {menuItemsAdmin.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '0.75rem',
              textDecoration: 'none',
              borderRadius: '4px',
              background: location.pathname === item.path ? '#22c55e' : '#f5f5f5',
              color: location.pathname === item.path ? 'white' : '#333',
              fontWeight: location.pathname === item.path ? 600 : 400,
              fontSize: '0.875rem'
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/login-loja" element={<LoginLoja />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/cardapio" element={<Cardapio />} />
          <Route path="/cardapio-loja" element={<Cardapio />} />
          <Route path="/promo" element={<Promo />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/admin" element={<AdminLoja />} />
          <Route path="/loja" element={<AdminLoja />} />
          <Route path="/pagamentos" element={<ConfigPagamento />} />
          <Route path="/dispositivos" element={<Dispositivos />} />
          <Route path="/pdv" element={<PDV />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login-login" element={<Navigate to="/login" />} />
          <Route path="/pedido" element={<Pedido />} />
          <Route path="/entregas/*" element={<Entregas />} />
          <Route path="/motoboy" element={<Motoboy />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}