import { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { Card } from '../Card';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userApi } from '../../api/services';

function isFocusToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getUTCFullYear() === today.getUTCFullYear() &&
    d.getUTCMonth() === today.getUTCMonth() &&
    d.getUTCDate() === today.getUTCDate()
  );
}

export function DailyFocus() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [focus, setFocus] = useState(
    user?.dailyFocus && isFocusToday(user.dailyFocusDate) ? user.dailyFocus : '',
  );
  const [saving, setSaving] = useState(false);

  const hasTodayFocus = user?.dailyFocus && isFocusToday(user.dailyFocusDate);

  const save = async () => {
    if (!focus.trim() || focus.trim().length < 3) {
      showToast('Escribe tu foco del día (mín. 3 caracteres)', 'info');
      return;
    }
    setSaving(true);
    try {
      await userApi.setDailyFocus(focus.trim());
      await refreshUser();
      showToast('Foco del día guardado ✓', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6 border-cyan-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Crosshair className="text-cyan-400" size={20} />
        <h2 className="text-lg font-semibold text-white">Foco del día</h2>
      </div>
      {hasTodayFocus ? (
        <p className="text-cyan-200 text-sm font-medium">&ldquo;{user?.dailyFocus}&rdquo;</p>
      ) : (
        <>
          <p className="text-zinc-500 text-xs mb-3">
            Una sola prioridad. La IA la tendrá en cuenta en tu plan.
          </p>
          <div className="flex gap-2">
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Ej: Terminar el informe de finanzas"
              maxLength={120}
              className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            />
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium shrink-0">
              {saving ? '...' : 'Fijar'}
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
