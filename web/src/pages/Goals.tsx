import { useCallback, useEffect, useState } from 'react';
import { Pencil, Target, Trash2, X } from 'lucide-react';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ListPageSkeleton } from '../components/ui/ListPageSkeleton';
import { MethodologyHint } from '../components/MethodologyHint';
import { goalsApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import type { Goal } from '../types';

const priorityColor = { LOW: 'text-zinc-400', MEDIUM: 'text-cyan-400', HIGH: 'text-red-400' };

export function Goals() {
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [editDeadline, setEditDeadline] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGoals(await goalsApi.list());
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al cargar objetivos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (title.trim().length < 3) {
      showToast('El título debe tener al menos 3 caracteres', 'info');
      return;
    }
    setCreating(true);
    try {
      await goalsApi.create({ title: title.trim(), priority });
      setTitle('');
      showToast('Objetivo creado', 'success');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo crear', 'error');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (g: Goal) => {
    setEditGoal(g);
    setEditTitle(g.title);
    setEditPriority(g.priority);
    setEditDeadline(g.deadline ? g.deadline.slice(0, 10) : '');
  };

  const saveEdit = async () => {
    if (!editGoal || editTitle.trim().length < 3) return;
    setSavingEdit(true);
    try {
      await goalsApi.update(editGoal.id, {
        title: editTitle.trim(),
        priority: editPriority,
        deadline: editDeadline || undefined,
      });
      showToast('Objetivo actualizado', 'success');
      setEditGoal(null);
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
      await goalsApi.remove(deleteId);
      showToast('Objetivo eliminado', 'success');
      setDeleteId(null);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo eliminar', 'error');
    }
  };

  if (loading) return <ListPageSkeleton rows={4} />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Objetivos</h1>
      <MethodologyHint module="goals" />

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="Nuevo objetivo (SMART: específico y claro)..."
          className="flex-1 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
          className="bg-[#1c1c2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm">
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
        </select>
        <button
          type="button"
          onClick={create}
          disabled={creating}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium">
          Añadir
        </button>
      </div>

      <div className="grid gap-4">
        {goals.map((g) => (
          <Card key={g.id} className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-white font-semibold">{g.title}</h3>
                <span className={`text-xs font-medium ${priorityColor[g.priority]}`}>{g.priority}</span>
                {g.deadline && (
                  <span className="text-xs text-zinc-500">
                    📅 {new Date(g.deadline).toLocaleDateString('es')}
                  </span>
                )}
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${g.progress}%` }} />
              </div>
              <p className="text-zinc-500 text-xs mt-1">{g.progress}% completado (vincula tareas)</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => openEdit(g)}
                className="text-zinc-500 hover:text-violet-400 p-1"
                aria-label="Editar">
                <Pencil size={18} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(g.id)}
                className="text-zinc-500 hover:text-red-400 p-1"
                aria-label="Eliminar">
                <Trash2 size={18} />
              </button>
            </div>
          </Card>
        ))}
        {!goals.length && (
          <EmptyState
            icon={Target}
            title="Sin objetivos"
            description="Crea tu primera meta SMART y vincula tareas para ver el progreso automático."
          />
        )}
      </div>

      {editGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-[#1c1c2e] border border-white/10 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Editar objetivo</h3>
              <button type="button" onClick={() => setEditGoal(null)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white mb-3"
            />
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm mb-3">
              <option value="LOW">Prioridad baja</option>
              <option value="MEDIUM">Prioridad media</option>
              <option value="HIGH">Prioridad alta</option>
            </select>
            <label className="text-zinc-500 text-xs block mb-1">Fecha límite (SMART: temporal)</label>
            <input
              type="date"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
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
        title="Eliminar objetivo"
        message="Se eliminará este objetivo. Las tareas asociadas quedarán sin objetivo."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
