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
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/goals', icon: Target, label: 'Objetivos' },
  { to: '/tasks', icon: CheckSquare, label: 'Tareas' },
  { to: '/habits', icon: Flame, label: 'Hábitos' },
  { to: '/finance', icon: Wallet, label: 'Finanzas' },
  { to: '/chat', icon: MessageCircle, label: 'Mentor' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

function NavItems({ compact }: { compact?: boolean }) {
  return (
    <>
      {nav.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            compact
              ? `flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] rounded-lg text-[10px] transition-colors ${
                  isActive ? 'text-violet-300' : 'text-zinc-500'
                }`
              : `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`
          }>
          <Icon size={compact ? 20 : 18} />
          <span className={compact ? 'truncate max-w-[56px]' : undefined}>{label}</span>
        </NavLink>
      ))}
    </>
  );
}

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] flex-col lg:flex-row">
      <aside className="hidden lg:flex w-64 border-r border-white/10 bg-[#14141f] p-4 flex-col shrink-0">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold tracking-widest text-white">ASCENDX</h1>
          <p className="text-xs text-zinc-500 mt-1">Life OS + IA</p>
        </div>
        <nav className="flex-1 space-y-1">
          <NavItems />
        </nav>
        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-sm text-white font-medium truncate px-2">{user?.name}</p>
          <p className="text-xs text-zinc-500 truncate px-2 mb-3">
            Nivel {user?.level} · {user?.xp} XP
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="lg:hidden border-b border-white/10 bg-[#14141f] px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2 px-1">
          <div>
            <p className="text-sm font-bold text-white tracking-wide">ASCENDX</p>
            <p className="text-[10px] text-zinc-500">Nivel {user?.level} · {user?.xp} XP</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-zinc-500 hover:text-red-400 p-2"
            aria-label="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          <NavItems compact />
        </nav>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-8">
        <Outlet />
      </main>
    </div>
  );
}
