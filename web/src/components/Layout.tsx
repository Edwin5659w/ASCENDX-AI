import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  MessageCircle,
  Wallet,
  User,
  LogOut,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/goals', icon: Target, label: 'Objetivos' },
  { to: '/tasks', icon: CheckSquare, label: 'Tareas' },
  { to: '/habits', icon: Flame, label: 'Hábitos' },
  { to: '/finance', icon: Wallet, label: 'Finanzas' },
  { to: '/chat', icon: MessageCircle, label: 'Mentor IA' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <aside className="w-64 border-r border-white/10 bg-[#14141f] p-4 flex flex-col shrink-0">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold tracking-widest text-white">ASCENDX</h1>
          <p className="text-xs text-zinc-500 mt-1">Life OS + IA</p>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-sm text-white font-medium truncate px-2">{user?.name}</p>
          <p className="text-xs text-zinc-500 truncate px-2 mb-3">Nivel {user?.level} · {user?.xp} XP</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
