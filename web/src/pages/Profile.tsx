import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { API_URL } from '../api/client';

export function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-6">Perfil</h1>
      <Card className="text-center mb-4">
        <div className="w-20 h-20 rounded-full bg-violet-600/20 border-2 border-violet-500 flex items-center justify-center mx-auto mb-4 text-3xl">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-white">{user?.name}</h2>
        <p className="text-zinc-500">{user?.email}</p>
      </Card>
      <Card className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-zinc-500">Nivel</span>
          <span className="text-white font-semibold">{user?.level}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">XP total</span>
          <span className="text-white font-semibold">{user?.xp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Miembro desde</span>
          <span className="text-white">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es') : '—'}
          </span>
        </div>
      </Card>
      <p className="text-zinc-600 text-xs mb-4">API: {API_URL}</p>
      <button
        onClick={logout}
        className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 py-3 rounded-xl transition-colors">
        Cerrar sesión
      </button>
    </div>
  );
}
