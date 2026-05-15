import { useEffect, useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { tasksApi } from '../api/services';
import type { Task } from '../types';

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');

  const load = () => tasksApi.list().then(setTasks).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title.trim()) return;
    await tasksApi.create({ title: title.trim() });
    setTitle('');
    load();
  };

  const toggle = async (task: Task) => {
    await tasksApi.update(task.id, { completed: !task.completed });
    load();
  };

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
        <button onClick={create} className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-lg font-medium">
          Añadir
        </button>
      </div>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            onClick={() => toggle(t)}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-[#1c1c2e]/60 cursor-pointer hover:bg-[#1c1c2e] transition-colors">
            {t.completed ? (
              <CheckCircle className="text-emerald-400 shrink-0" size={22} />
            ) : (
              <Circle className="text-zinc-500 shrink-0" size={22} />
            )}
            <span className={t.completed ? 'line-through text-zinc-500' : 'text-white'}>{t.title}</span>
            {t.goal && <span className="ml-auto text-xs text-violet-400">{t.goal.title}</span>}
          </li>
        ))}
        {!tasks.length && <p className="text-zinc-500 text-center py-12">Sin tareas pendientes</p>}
      </ul>
    </div>
  );
}
