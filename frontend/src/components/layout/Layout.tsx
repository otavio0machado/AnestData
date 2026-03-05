import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { LayoutDashboard, FilePlus, Users, Settings, LogOut, ClipboardList } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/boletim/novo', icon: FilePlus, label: 'Novo Boletim' },
    ...(user?.role === 'ADMIN' ? [
      { to: '/admin', icon: ClipboardList, label: 'Painel Admin' },
      { to: '/usuarios', icon: Users, label: 'Usuários' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-primary-800 text-white shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Anest</span>
            <span className="text-primary-300 text-xl font-light">Data</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary-200 hidden sm:block">{user?.nome}</span>
            <span className="text-xs bg-primary-600 px-2 py-0.5 rounded-full">{user?.role === 'ADMIN' ? 'Admin' : 'Médico'}</span>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-primary-700 transition-colors" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar desktop */}
        <nav className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 pt-6 pb-4 gap-1 px-3 shrink-0">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-primary-50 text-primary-800' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <div className="flex-1" />
          <div className="px-3 py-2 text-xs text-gray-400 border-t mt-2 pt-3">
            <div className="font-medium text-gray-600">{user?.nome}</div>
            {user?.cremers && <div>CREMERS: {user.cremers}</div>}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 pb-20 lg:pb-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10 shadow-xl">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => clsx(
              'flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors',
              isActive ? 'text-primary-700' : 'text-gray-500'
            )}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium text-gray-500"
        >
          <LogOut size={22} />
          <span>Sair</span>
        </button>
      </nav>
    </div>
  );
}
