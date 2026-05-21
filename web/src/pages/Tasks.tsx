import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Circle, Pencil, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ListPageSkeleton } from '../components/ui/ListPageSkeleton';
import { MethodologyHint } from '../components/MethodologyHint';
import { goalsApi, tasksApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import type { Goal, Task } from '../types';

export function Tasks() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [goalId, setGoalId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGoalId, setEditGoalId] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [taskList, goalList] = await Promise.all([tasksApi.list(), goalsApi.list()]);
      setTasks(taskList);
      setGoals(goalList);
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
      await tasksApi.create({
        title: title.trim(),
        goalId: goalId || null,
        dueDate: dueDate || undefined,
      });
      setTitle('');
      setGoalId('');
      setDueDate('');
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

  const openEdit = (task: Task) => {
    setEditTask(task);
    setEditTitle(task.title);
    setEditGoalId(task.goalId ?? '');
    setEditDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
  };

  const saveEdit = async () => {
    if (!editTask || !editTitle.trim()) return;
    setSavingEdit(true);
    try {
      await tasksApi.update(editTask.id, {
        title: editTitle.trim(),
        goalId: editGoalId || null,
        dueDate: editDueDate || undefined,
      });
      showToast('Tarea actualizada', 'success');
      setEditTask(null);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setSavingEdit(false);
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

  if (loading) return <ListPageSkeleton rows={6} />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Tareas</h1>
      <MethodologyHint module="tasks" />

      <div className="flex flex-col gap-2 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="Nueva tarea..."
          className="w-full bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="flex-1 bg-[#1c1c2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm">
            <option value="">Sin objetivo vinculado</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-[#1c1c2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm"
            aria-label="Fecha límite"
          />
          <button
            type="button"
            onClick={create}
            disabled={creating}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium shrink-0">
            Añadir
          </button>
        </div>
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
              className={`flex-1 text-left min-w-0 ${t.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
              <span className="block truncate">{t.title}</span>
              <span className="text-xs text-zinc-500 mt-0.5 flex flex-wrap gap-2">
                {t.goal && <span className="text-violet-400">{t.goal.title}</span>}
                {t.dueDate && (
                  <span>
                    📅 {new Date(t.dueDate).toLocaleDateString('es')}
                  </span>
                )}
              </span>
            </button>
            {t.streakCount > 0 && <span className="text-xs text-amber-400 shrink-0">🔥 {t.streakCount}</span>}
            <button
              type="button"
              onClick={() => openEdit(t)}
              className="text-zinc-500 hover:text-violet-400 p-1"
              aria-label="Editar tarea">
              <Pencil size={18} />
            </button>
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
            description="Añade tareas, vincúlalas a un objetivo y pon fecha para que la IA detecte prioridades."
          />
        )}
      </ul>

      {editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-[#1c1c2e] border border-white/10 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Editar tarea</h3>
              <button type="button" onClick={() => setEditTask(null)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white mb-3"
            />
            <select
              value={editGoalId}
              onChange={(e) => setEditGoalId(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm mb-3">
              <option value="">Sin objetivo</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm mb-4"
            />
            <button
              type="button"
              onClick={saveEdit}
              disabled={savingEdit}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium">
              {savingEdit ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

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
