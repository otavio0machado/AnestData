import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BoletimFormPage from './pages/BoletimFormPage';
import BoletimDetailPage from './pages/BoletimDetailPage';
import AdminPanelPage from './pages/AdminPanelPage';
import UsersPage from './pages/UsersPage';
import Layout from './components/layout/Layout';

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loadUser } = useAuthStore();
  useEffect(() => { loadUser(); }, [loadUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="boletim/novo" element={<BoletimFormPage />} />
          <Route path="boletim/:id" element={<BoletimDetailPage />} />
          <Route path="boletim/:id/editar" element={<BoletimFormPage />} />
          <Route path="admin" element={<PrivateRoute adminOnly><AdminPanelPage /></PrivateRoute>} />
          <Route path="usuarios" element={<PrivateRoute adminOnly><UsersPage /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
