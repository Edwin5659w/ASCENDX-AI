import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Crown, Download, RefreshCw, Shield, Trash2, Trophy, Users, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { ProfileSkeleton } from '../components/ProfileSkeleton';
import { userApi, billingApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import { useProCheckout } from '../hooks/useProCheckout';
import { AccountabilityPanel } from '../components/AccountabilityPanel';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@shared/currencies';
import type { ReferralInfo } from '../types';

export function Profile() {
  const { user, logout, refreshUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [currency, setCurrency] = useState(user?.preferredCurrency ?? DEFAULT_CURRENCY);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [tradingEnabled, setTradingEnabled] = useState(user?.tradingJournalEnabled ?? false);
  const [savingTrading, setSavingTrading] = useState(false);
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(user?.emailOptIn ?? true);
  const [billingConfigured, setBillingConfigured] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { startCheckout, openPortal, loading: billingLoading } = useProCheckout();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const appVersion = '1.2.0';

  useEffect(() => {
    billingApi.status().then((s) => setBillingConfigured(s.billingConfigured)).catch(() => {});
  }, []);

  useEffect(() => {
    userApi.referral().then(setReferral).catch(() => {});
  }, []);

  useEffect(() => {
    setName(user?.name ?? '');
    setCurrency(user?.preferredCurrency ?? DEFAULT_CURRENCY);
    setTradingEnabled(user?.tradingJournalEnabled ?? false);
    setEmailOptIn(user?.emailOptIn ?? true);
  }, [user?.name, user?.preferredCurrency, user?.tradingJournalEnabled, user?.emailOptIn]);

  const saveCurrency = async (code: string) => {
    if (code === user?.preferredCurrency) return;
    setCurrency(code);
    setSavingCurrency(true);
    try {
      await userApi.updateProfile({ preferredCurrency: code });
      await refreshUser();
      showToast('Moneda actualizada', 'success');
    } catch (e) {
      setCurrency(user?.preferredCurrency ?? DEFAULT_CURRENCY);
      showToast(e instanceof Error ? e.message : 'Error al guardar moneda', 'error');
    } finally {
      setSavingCurrency(false);
    }
  };

  const toggleTrading = async (enabled: boolean) => {
    setTradingEnabled(enabled);
    setSavingTrading(true);
    try {
      await userApi.updateProfile({ tradingJournalEnabled: enabled });
      await refreshUser();
      showToast(enabled ? 'Diario de trading activado' : 'Diario oculto en Finanzas', 'success');
    } catch (e) {
      setTradingEnabled(user?.tradingJournalEnabled ?? false);
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setSavingTrading(false);
    }
  };

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

  const copyReferral = async () => {
    if (!referral) return;
    await navigator.clipboard.writeText(referral.referralCode);
    showToast('Código copiado', 'success');
  };

  const shareReferral = async () => {
    if (!referral) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ASCENDX AI', text: referral.shareMessage });
      } else {
        await navigator.clipboard.writeText(referral.shareMessage);
        showToast('Mensaje copiado', 'success');
      }
    } catch {
      /* cancelado */
    }
  };

  const upgradePro = () => void startCheckout();

  const replayTour = async () => {
    try {
      await userApi.updateProfile({ productTourDone: false });
      await refreshUser();
      navigate('/dashboard');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo reiniciar el tour', 'error');
    }
  };

  const toggleEmailOptIn = async (enabled: boolean) => {
    setEmailOptIn(enabled);
    try {
      await userApi.updateProfile({ emailOptIn: enabled });
      await refreshUser();
      showToast(enabled ? 'Emails de tips activados' : 'Emails desactivados', 'success');
    } catch (e) {
      setEmailOptIn(user?.emailOptIn ?? true);
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      await userApi.exportData();
      showToast('Datos exportados', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo exportar', 'error');
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      showToast('Ingresa tu contraseña para confirmar', 'info');
      return;
    }
    if (!window.confirm('¿Eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      await userApi.deleteAccount(deletePassword);
      await logout();
      showToast('Cuenta eliminada', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setDeleting(false);
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
        {user.plan === 'PRO' ? (
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300 text-xs font-medium">
            <Crown size={12} /> Pro
          </span>
        ) : (
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 text-xs">
            Plan Gratis
          </span>
        )}
      </Card>

      {user.subscriptionStatus === 'PAST_DUE' && (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/10">
          <p className="text-amber-200 font-semibold text-sm">Pago pendiente</p>
          <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
            No pudimos cobrar tu suscripción Pro. Actualiza tu método de pago para mantener el acceso.
          </p>
          {billingConfigured ? (
            <button
              type="button"
              onClick={() => void openPortal()}
              disabled={billingLoading}
              className="mt-3 px-4 py-2 rounded-lg bg-amber-600/30 text-amber-200 text-sm font-medium hover:bg-amber-600/40 disabled:opacity-50">
              {billingLoading ? 'Abriendo...' : 'Actualizar pago en Stripe'}
            </button>
          ) : null}
        </Card>
      )}

      {user.plan === 'PRO' ? (
        <Card className="mb-4 border-violet-500/30 bg-violet-500/5">
          <div className="flex items-start gap-3">
            <Crown className="text-violet-400 shrink-0 mt-0.5" size={22} />
            <div className="flex-1">
              <h3 className="text-white font-semibold">Membresía Pro activa</h3>
              {user.subscriptionPeriodEnd ? (
                <p className="text-zinc-500 text-sm mt-1">
                  Renueva el{' '}
                  {new Date(user.subscriptionPeriodEnd).toLocaleDateString('es', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              ) : null}
              {billingConfigured ? (
                <button
                  type="button"
                  onClick={() => void openPortal()}
                  disabled={billingLoading}
                  className="mt-3 px-4 py-2 rounded-lg border border-violet-500/40 text-violet-300 text-sm font-medium hover:bg-violet-500/10 disabled:opacity-50">
                  {billingLoading ? 'Abriendo...' : 'Gestionar suscripción'}
                </button>
              ) : null}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-4 border-violet-500/30 bg-violet-500/5">
          <div className="flex items-start gap-3">
            <Crown className="text-violet-400 shrink-0 mt-0.5" size={22} />
            <div className="flex-1">
              <h3 className="text-white font-semibold">Pasa a Pro</h3>
              <p className="text-zinc-500 text-sm mt-1">
                100 mensajes IA/día, resumen semanal, diario de trading y más objetivos.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={upgradePro}
                  disabled={billingLoading}
                  className="brand-btn-primary px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50">
                  {billingLoading ? 'Redirigiendo...' : billingConfigured ? 'Suscribirme ($4.99/mes)' : 'Ver opciones Pro'}
                </button>
                <Link to="/pricing" className="px-4 py-2 rounded-lg border border-white/10 text-zinc-400 text-sm hover:text-white">
                  Ver planes
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Link
        to="/achievements"
        className="block mb-4 rounded-xl border border-white/10 bg-[#14141f] px-4 py-3 hover:border-violet-500/30 transition-colors">
        <div className="flex items-center gap-3">
          <Trophy className="text-amber-400" size={20} />
          <div>
            <p className="text-white font-medium text-sm">Logros y XP</p>
            <p className="text-zinc-500 text-xs">Nivel {user.level} · {user.xp} XP</p>
          </div>
        </div>
      </Link>

      <AccountabilityPanel />

      <Card className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {theme === 'dark' ? <Moon size={18} className="text-violet-400" /> : <Sun size={18} className="text-amber-400" />}
          <span className="text-white text-sm font-medium">Tema {theme === 'dark' ? 'oscuro' : 'claro'}</span>
        </div>
        <button type="button" onClick={toggleTheme} className="text-violet-400 text-sm font-medium">
          Cambiar
        </button>
      </Card>

      <Card className="mb-4 flex items-center justify-between gap-4">
        <span className="text-white text-sm font-medium">Idioma</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLocale('es')}
            className={`px-3 py-1 rounded-lg text-xs ${locale === 'es' ? 'bg-violet-600 text-white' : 'border border-white/10 text-zinc-400'}`}>
            ES
          </button>
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`px-3 py-1 rounded-lg text-xs ${locale === 'en' ? 'bg-violet-600 text-white' : 'border border-white/10 text-zinc-400'}`}>
            EN
          </button>
        </div>
      </Card>

      <Card className="mb-4">
        <button
          type="button"
          onClick={() => void replayTour()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 text-zinc-400 text-sm hover:text-white hover:border-violet-500/30 transition-colors">
          <RefreshCw size={16} />
          Ver tour del producto de nuevo
        </button>
      </Card>

      <Card className="mb-4">
        <button
          type="button"
          onClick={() => void exportData()}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/10 disabled:opacity-50">
          <Download size={16} />
          {exporting ? 'Exportando...' : 'Exportar mis datos (JSON)'}
        </button>
        <p className="text-zinc-600 text-xs text-center mt-2">Disponible para todos los usuarios (GDPR)</p>
      </Card>

      {referral && (
        <Card className="mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="text-cyan-400" size={20} />
            <h3 className="text-white font-semibold">Invita amigos</h3>
          </div>
          <p className="text-zinc-500 text-sm">
            Tú ganas +{referral.bonusXp} XP. Tu amigo gana +{referral.bonusXp} XP y{' '}
            {referral.trialDays ?? 7} días de Pro gratis.
          </p>
          <p className="text-cyan-400/80 text-xs font-medium">
            Más amigos = más XP. Ellos prueban Pro sin tarjeta.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-cyan-300 font-mono text-lg tracking-wider">
              {referral.referralCode}
            </code>
            <button
              type="button"
              onClick={() => void copyReferral()}
              className="p-2.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
              aria-label="Copiar código">
              <Copy size={18} />
            </button>
          </div>
          <p className="text-zinc-600 text-xs">{referral.referralCount} persona(s) invitada(s)</p>
          <button
            type="button"
            onClick={() => void shareReferral()}
            className="w-full py-2.5 rounded-lg border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/10">
            Compartir invitación
          </button>
        </Card>
      )}

      {(user.streakShields ?? 0) > 0 && (
        <Card className="mb-4 flex items-center gap-3">
          <Shield className="text-amber-400" size={22} />
          <div>
            <p className="text-white font-medium text-sm">{user.streakShields} escudo(s) de racha</p>
            <p className="text-zinc-500 text-xs">Protegen tu racha si faltas un día</p>
          </div>
        </Card>
      )}

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
        <h3 className="text-white font-semibold">Moneda principal</h3>
        <p className="text-zinc-500 text-sm">
          Montos en finanzas y balance. Por defecto: peso colombiano (COP).
        </p>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              disabled={savingCurrency}
              onClick={() => void saveCurrency(c.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                currency === c.code
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:border-violet-500/50'
              }`}>
              {c.code}
            </button>
          ))}
        </div>
      </Card>
      {user.plan === 'PRO' ? (
        <Card className="mb-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-semibold">Diario de trading</h3>
              <p className="text-zinc-500 text-sm mt-1">
                Operaciones en bolsa/cripto (opcional). Solo visible en Finanzas si lo activas.
              </p>
            </div>
            <input
              type="checkbox"
              checked={tradingEnabled}
              disabled={savingTrading}
              onChange={(e) => void toggleTrading(e.target.checked)}
              className="mt-1 h-5 w-5 accent-violet-600"
            />
          </div>
        </Card>
      ) : null}
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

      <Card className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-medium text-sm">Emails de tips y retención</h3>
          <p className="text-zinc-500 text-xs mt-1">Rachas, recordatorios y novedades Pro</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={emailOptIn}
          onClick={() => void toggleEmailOptIn(!emailOptIn)}
          className={`relative w-11 h-6 rounded-full transition-colors ${emailOptIn ? 'bg-violet-600' : 'bg-zinc-700'}`}>
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${emailOptIn ? 'translate-x-5' : ''}`}
          />
        </button>
      </Card>

      <Card className="mb-4 border-red-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="text-red-400" size={18} />
          <h3 className="text-red-300 font-semibold text-sm">Zona de peligro</h3>
        </div>
        <p className="text-zinc-500 text-xs">
          Eliminar tu cuenta borra todos tus datos permanentemente (GDPR).
        </p>
        <input
          type="password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          placeholder="Contraseña para confirmar"
          className="w-full bg-[#0a0a0f] border border-red-500/20 rounded-lg px-4 py-2.5 text-white text-sm"
        />
        <button
          type="button"
          onClick={() => void deleteAccount()}
          disabled={deleting}
          className="w-full border border-red-500/40 text-red-400 hover:bg-red-500/10 py-2.5 rounded-lg text-sm disabled:opacity-50">
          {deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
        </button>
      </Card>
      <button
        type="button"
        onClick={() => logout()}
        className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 py-3 rounded-xl transition-colors mb-4">
        Cerrar sesión
      </button>
      <div className="flex justify-center gap-4 text-xs text-zinc-600">
        <Link to="/privacy" className="hover:text-zinc-400">
          Privacidad
        </Link>
        <Link to="/terms" className="hover:text-zinc-400">
          Términos
        </Link>
        <a href="mailto:hola@ascendx.ai" className="hover:text-zinc-400">
          Soporte
        </a>
      </div>
    </div>
  );
}
