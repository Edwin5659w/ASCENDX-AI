import { useCallback, useEffect, useState } from 'react';
import { Check, Flame, Pencil, Plus, Trash2, X } from 'lucide-react';
import { MethodologyHint } from '../components/MethodologyHint';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ListPageSkeleton } from '../components/ui/ListPageSkeleton';
import { Skeleton } from '../components/ui/Skeleton';
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
  const [renameFor, setRenameFor] = useState<Habit | null>(null);
  const [renameText, setRenameText] = useState('');

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
    if (name.trim().length < 1) {
      showToast('Escribe el nombre del hábito', 'info');
      return;
    }
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

  const saveRename = async () => {
    if (!renameFor || !renameText.trim()) return;
    try {
      await habitsApi.update(renameFor.id, { name: renameText.trim() });
      showToast('Hábito actualizado', 'success');
      setRenameFor(null);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo renombrar', 'error');
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
      <MethodologyHint module="habits" />
      <p className="text-zinc-500 text-sm mb-6">Un completado por día. Mantén tu racha (tracking).</p>

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
