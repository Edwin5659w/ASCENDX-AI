import { useCallback, useEffect, useState } from 'react';
import { Target, Trash2 } from 'lucide-react';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/PageLoader';
import { goalsApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import type { Goal } from '../types';

const priorityColor = { LOW: 'text-zinc-400', MEDIUM: 'text-cyan-400', HIGH: 'text-red-400' };

export function Goals() {
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      await goalsApi.create({ title: title.trim() });
      setTitle('');
      showToast('Objetivo creado', 'success');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo crear', 'error');
    } finally {
      setCreating(false);
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

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Objetivos</h1>
      <div className="flex gap-2 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="Nuevo objetivo..."
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
      <div className="grid gap-4">
        {goals.map((g) => (
          <Card key={g.id} className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-semibold">{g.title}</h3>
                <span className={`text-xs font-medium ${priorityColor[g.priority]}`}>{g.priority}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${g.progress}%` }} />
              </div>
              <p className="text-zinc-500 text-xs mt-1">{g.progress}% completado</p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteId(g.id)}
              className="text-zinc-500 hover:text-red-400 p-1"
              aria-label="Eliminar">
              <Trash2 size={18} />
            </button>
          </Card>
        ))}
        {!goals.length && (
          <EmptyState
            icon={Target}
            title="Sin objetivos"
            description="Crea tu primera meta y vincula tareas para ver el progreso automático."
          />
        )}
      </div>

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
