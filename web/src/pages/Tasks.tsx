import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Circle, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/PageLoader';
import { tasksApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import type { Task } from '../types';

export function Tasks() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await tasksApi.list());
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al cargar tareas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await tasksApi.create({ title: title.trim() });
      setTitle('');
      showToast('Tarea creada', 'success');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo crear', 'error');
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (task: Task) => {
    try {
      await tasksApi.update(task.id, { completed: !task.completed });
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo actualizar', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await tasksApi.remove(deleteId);
      showToast('Tarea eliminada', 'success');
      setDeleteId(null);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo eliminar', 'error');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Tareas</h1>
      <div className="flex gap-2 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="Nueva tarea..."
          className="flex-1 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
        />
        <button
          type="button"
          onClick={create}
          disabled={creating}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium">
          Añadir
        </button>
      </div>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-[#1c1c2e]/60 hover:bg-[#1c1c2e] transition-colors">
            <button type="button" onClick={() => toggle(t)} className="shrink-0">
              {t.completed ? (
                <CheckCircle className="text-emerald-400" size={22} />
              ) : (
                <Circle className="text-zinc-500" size={22} />
              )}
            </button>
            <button
              type="button"
              onClick={() => toggle(t)}
              className={`flex-1 text-left ${t.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
              {t.title}
            </button>
            {t.goal && <span className="text-xs text-violet-400 hidden sm:inline">{t.goal.title}</span>}
            {t.streakCount > 0 && <span className="text-xs text-amber-400">🔥 {t.streakCount}</span>}
            <button
              type="button"
              onClick={() => setDeleteId(t.id)}
              className="text-zinc-500 hover:text-red-400 p-1"
              aria-label="Eliminar tarea">
              <Trash2 size={18} />
            </button>
          </li>
        ))}
        {!tasks.length && (
          <EmptyState
            icon={CheckCircle}
            title="Sin tareas"
            description="Añade tareas y márcalas al completarlas para ganar XP."
          />
        )}
      </ul>

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar tarea"
        message="Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
