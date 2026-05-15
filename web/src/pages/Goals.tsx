import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card } from '../components/Card';
import { goalsApi } from '../api/services';
import type { Goal } from '../types';

const priorityColor = { LOW: 'text-zinc-400', MEDIUM: 'text-cyan-400', HIGH: 'text-red-400' };

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');

  const load = () => goalsApi.list().then(setGoals).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (title.trim().length < 3) return;
    await goalsApi.create({ title: title.trim() });
    setTitle('');
    load();
  };

  const remove = async (id: string) => {
    await goalsApi.remove(id);
    load();
  };

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
        <button onClick={create} className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-lg font-medium">
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
            <button onClick={() => remove(g.id)} className="text-zinc-500 hover:text-red-400 p-1">
              <Trash2 size={18} />
            </button>
          </Card>
        ))}
        {!goals.length && <p className="text-zinc-500 text-center py-12">Sin objetivos. ¡Crea el primero!</p>}
      </div>
    </div>
  );
}
