import { useCallback, useEffect, useState } from 'react';
import { Check, Flame, Plus, Trash2 } from 'lucide-react';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/PageLoader';
import { habitsApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import type { Habit } from '../types';

export function Habits() {
  const { showToast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHabits(await habitsApi.list());
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al cargar hábitos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (name.trim().length < 1) return;
    setCreating(true);
    try {
      await habitsApi.create({ name: name.trim(), frequency });
      setName('');
      showToast('Hábito creado', 'success');
      await load();
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
      await habitsApi.complete(habit.id);
      showToast('¡Hábito completado! +15 XP', 'success');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo completar', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await habitsApi.remove(deleteId);
      showToast('Hábito eliminado', 'success');
      setDeleteId(null);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo eliminar', 'error');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Hábitos</h1>
      <p className="text-zinc-500 text-sm mb-6">Un completado por día. Mantén tu racha.</p>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
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
                  <Flame size={16} /> {h.streak}
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
                  onClick={() => setDeleteId(h.id)}
                  className="text-zinc-500 hover:text-red-400 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!habits.length && (
          <EmptyState
            icon={Flame}
            title="Sin hábitos aún"
            description="Crea tu primer hábito y completa uno al día para subir tu racha."
          />
        )}
      </div>

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
