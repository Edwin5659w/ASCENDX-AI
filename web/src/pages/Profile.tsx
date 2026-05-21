import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { ProfileSkeleton } from '../components/ProfileSkeleton';
import { userApi } from '../api/services';
import { useToast } from '../context/ToastContext';

export function Profile() {
  const { user, logout, refreshUser, isLoading } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const appVersion = '1.0.0';

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast('Completa contraseña actual y nueva', 'info');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('La confirmación no coincide', 'info');
      return;
    }
    setChangingPassword(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Contraseña actualizada', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo cambiar', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const saveName = async () => {
    if (!name.trim() || name.trim() === user?.name) return;
    setSaving(true);
    try {
      await userApi.updateProfile({ name: name.trim() });
      await refreshUser();
      showToast('Perfil actualizado', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-6">Perfil</h1>
      <Card className="text-center mb-4">
        <div className="w-20 h-20 rounded-full bg-violet-600/20 border-2 border-violet-500 flex items-center justify-center mx-auto mb-4 text-3xl">
          {user.name?.[0]?.toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-white">{user.name}</h2>
        <p className="text-zinc-500">{user.email}</p>
        <p className="text-zinc-600 text-xs mt-2">ASCENDX web v{appVersion}</p>
      </Card>
      <Card className="mb-4 space-y-3">
        <h3 className="text-white font-semibold">Seguridad</h3>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Contraseña actual"
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nueva contraseña"
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmar nueva"
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white"
        />
        <button
          type="button"
          onClick={changePassword}
          disabled={changingPassword}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium">
          {changingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
        </button>
      </Card>
      <Card className="mb-4 space-y-3">
        <label className="block text-sm text-zinc-500">Nombre completo</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
        />
        <button
          type="button"
          onClick={saveName}
          disabled={saving}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium">
          {saving ? 'Guardando...' : 'Guardar nombre'}
        </button>
      </Card>
      <Card className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-zinc-500">Nivel</span>
          <span className="text-white font-semibold">{user.level}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">XP total</span>
          <span className="text-white font-semibold">{user.xp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Miembro desde</span>
          <span className="text-white">
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es') : '—'}
          </span>
        </div>
      </Card>
      <button
        type="button"
        onClick={() => logout()}
        className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 py-3 rounded-xl transition-colors">
        Cerrar sesión
      </button>
    </div>
  );
}
