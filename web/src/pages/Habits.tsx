import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { Card } from '../components/Card';
import { habitsApi } from '../api/services';
import type { Habit } from '../types';

export function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);

  const load = () => habitsApi.list().then(setHabits).catch(() => {});
  useEffect(() => { load(); }, []);

  const complete = async (id: string) => {
    await habitsApi.complete(id);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Hábitos</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {habits.map((h) => (
          <Card key={h.id}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold">{h.name}</h3>
                <p className="text-zinc-500 text-sm">{h.frequency === 'DAILY' ? 'Diario' : 'Semanal'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Flame size={18} /> {h.streak}
                </span>
                <button
                  onClick={() => complete(h.id)}
                  className="bg-violet-600/20 text-violet-300 hover:bg-violet-600/40 px-3 py-1.5 rounded-lg text-sm">
                  +1
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!habits.length && <p className="text-zinc-500 col-span-2 text-center py-12">Sin hábitos registrados</p>}
      </div>
    </div>
  );
}
