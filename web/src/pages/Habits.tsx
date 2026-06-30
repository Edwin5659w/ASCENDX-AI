import { useCallback, useEffect, useState } from 'react';
import { Bell, Check, Flame, Pencil, Plus, Trash2, X } from 'lucide-react';
import { habitsApi, userApi } from '../api/services';
import { PlanUsageBar } from '../components/PlanUsageBar';
import { MethodologyStrip } from '../components/MethodologyStrip';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ListPageSkeleton } from '../components/ui/ListPageSkeleton';
import { LoadMoreButton } from '../components/ui/LoadMoreButton';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { applyGamificationFeedback } from '../lib/gamification-feedback';
import type { Habit, PlanUsage } from '../types';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function HabitWeekStrip({ weekHistory, weekCompletionRate }: { weekHistory?: boolean[]; weekCompletionRate?: number }) {
  const days = weekHistory ?? Array(7).fill(false);
  return (
    <div className="mt-3">
      <div className="flex justify-between gap-1">
        {days.map((done, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className={`w-6 h-6 rounded-md border ${done ? 'bg-emerald-500 border-emerald-500' : 'bg-white/5 border-white/10'}`}
            />
            <span className="text-[10px] text-zinc-600 mt-1">{DAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
      {weekCompletionRate != null ? (
        <p className="text-zinc-600 text-xs mt-2">{weekCompletionRate}% esta semana</p>
      ) : null}
    </div>
  );
}

function streakLabel(milestone: number | null | undefined, streak: number) {
  if (milestone === 30) return 'Leyenda';
  if (milestone === 21) return '3 semanas';
  if (milestone === 7) return '1 semana';
  if (milestone === 3) return 'En marcha';
  return `${streak} días`;
}

export function Habits() {
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const fetchHabits = useCallback((page: number, limit: number) => habitsApi.list(page, limit), []);
  const { items: habits, loading, loadingMore, hasMore, refresh, loadMore } = usePaginatedList<Habit>(fetchHabits);
  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameFor, setRenameFor] = useState<Habit | null>(null);
  const [renameText, setRenameText] = useState('');
  const [reminderFor, setReminderFor] = useState<Habit | null>(null);
  const [reminderHour, setReminderHour] = useState('8');
  const [reminderMinute, setReminderMinute] = useState('0');

  useEffect(() => {
    userApi.plan().then(setPlanUsage).catch(() => {});
  }, []);

  const reload = useCallback(async () => {
    await refresh();
    try {
      setPlanUsage(await userApi.plan());
    } catch {
      /* ignore */
    }
  }, [refresh]);

  const create = async () => {
    if (name.trim().length < 1) {
      showToast('Escribe el nombre del hábito', 'info');
      return;
    }
    setCreating(true);
    try {
      await habitsApi.create({ name: name.trim(), frequency });
      setName('');
      showToast('Hábito creado', 'success');
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo crear', 'error');
    } finally {
      setCreating(false);
    }
  };

  const complete = async (habit: Habit) => {
    if (habit.completedToday) {
      showToast('Ya completaste este hábito hoy', 'info');
      return;
    }
    try {
      const updated = await habitsApi.complete(habit.id);
      applyGamificationFeedback(updated.gamification, showToast, refreshUser);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo completar', 'error');
    }
  };

  const saveRename = async () => {
    if (!renameFor || !renameText.trim()) return;
    try {
      await habitsApi.update(renameFor.id, { name: renameText.trim() });
      showToast('Hábito actualizado', 'success');
      setRenameFor(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo renombrar', 'error');
    }
  };

  const openReminder = (h: Habit) => {
    setReminderFor(h);
    setReminderHour(String(h.reminderHour ?? 8));
    setReminderMinute(String(h.reminderMinute ?? 0));
  };

  const saveReminder = async (enabled: boolean) => {
    if (!reminderFor) return;
    const h = parseInt(reminderHour, 10);
    const m = parseInt(reminderMinute, 10);
    if (enabled && (Number.isNaN(h) || h < 0 || h > 23 || Number.isNaN(m) || m < 0 || m > 59)) {
      showToast('Hora 0-23 y minutos 0-59', 'info');
      return;
    }
    try {
      await habitsApi.update(reminderFor.id, {
        reminderEnabled: enabled,
        reminderHour: enabled ? h : null,
        reminderMinute: enabled ? m : null,
      });
      showToast(enabled ? 'Recordatorio guardado (solo móvil local)' : 'Recordatorio desactivado', 'success');
      setReminderFor(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await habitsApi.remove(deleteId);
      showToast('Hábito eliminado', 'success');
      setDeleteId(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo eliminar', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-full max-w-md mb-6" />
        <ListPageSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Hábitos</h1>
      <MethodologyStrip module="habits" />
      <PlanUsageBar usage={planUsage} metric="habits" className="mb-4" />
      <p className="text-zinc-500 text-sm mb-6">Un completado por día. Mantén tu racha.</p>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          id="habit-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="Nuevo hábito..."
          className="flex-1 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
        />
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as 'DAILY' | 'WEEKLY')}
          className="bg-[#1c1c2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm">
          <option value="DAILY">Diario</option>
          <option value="WEEKLY">Semanal</option>
        </select>
        <button
          onClick={create}
          disabled={creating || !name.trim()}
          className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium">
          <Plus size={18} />
          Añadir
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {habits.map((h) => (
          <Card key={h.id}>
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">{h.name}</h3>
                <p className="text-zinc-500 text-sm">{h.frequency === 'DAILY' ? 'Diario' : 'Semanal'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                  <Flame size={16} /> {streakLabel(h.streakMilestone, h.streak)}
                </span>
                <button
                  type="button"
                  onClick={() => complete(h)}
                  disabled={h.completedToday}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    h.completedToday
                      ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                      : 'bg-violet-600/20 text-violet-300 hover:bg-violet-600/40'
                  }`}>
                  {h.completedToday ? (
                    <>
                      <Check size={14} /> Hecho
                    </>
                  ) : (
                    'Completar'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openReminder(h)}
                  className={`p-1 ${h.reminderEnabled ? 'text-violet-400' : 'text-zinc-500 hover:text-violet-400'}`}
                  aria-label="Recordatorio">
                  <Bell size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenameFor(h);
                    setRenameText(h.name);
                  }}
                  className="text-zinc-500 hover:text-violet-400 p-1"
                  aria-label="Editar hábito">
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(h.id)}
                  className="text-zinc-500 hover:text-red-400 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <HabitWeekStrip weekHistory={h.weekHistory} weekCompletionRate={h.weekCompletionRate} />
          </Card>
        ))}
        {!habits.length && (
          <EmptyState
            icon={Flame}
            title="Sin hábitos aún"
            description="Crea tu primer hábito y completa uno al día para subir tu racha."
            action={
              <button
                type="button"
                onClick={() => document.getElementById('habit-name-input')?.focus()}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium">
                Crear mi primer hábito
              </button>
            }
          />
        )}
      </div>

      <LoadMoreButton hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} />

      {reminderFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-[#1c1c2e] border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-2">Recordatorio diario</h3>
            <p className="text-zinc-500 text-xs mb-4">En web solo se guarda la preferencia; las alertas locales funcionan en la app móvil.</p>
            <div className="flex gap-2 mb-4">
              <input
                value={reminderHour}
                onChange={(e) => setReminderHour(e.target.value)}
                placeholder="Hora"
                className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white text-center"
              />
              <span className="text-white self-center">:</span>
              <input
                value={reminderMinute}
                onChange={(e) => setReminderMinute(e.target.value)}
                placeholder="Min"
                className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white text-center"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => saveReminder(false)}
                className="flex-1 border border-white/10 text-zinc-400 py-2.5 rounded-lg">
                Desactivar
              </button>
              <button
                type="button"
                onClick={() => saveReminder(true)}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg">
                Activar
              </button>
            </div>
            <button type="button" onClick={() => setReminderFor(null)} className="w-full mt-3 text-zinc-500 text-sm">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {renameFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-[#1c1c2e] border border-white/10 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Editar hábito</h3>
              <button type="button" onClick={() => setRenameFor(null)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <input
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white mb-4"
            />
            <button
              type="button"
              onClick={saveRename}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg font-medium">
              Guardar
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar hábito"
        message="Se perderá el historial de rachas de este hábito."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
