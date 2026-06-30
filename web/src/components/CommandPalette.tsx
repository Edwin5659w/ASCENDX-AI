import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { userApi } from '../api/services';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{
    goals: { id: string; title: string }[];
    tasks: { id: string; title: string; completed: boolean }[];
    habits: { id: string; name: string }[];
  } | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    try {
      setResults(await userApi.search(query));
    } catch {
      setResults({ goals: [], tasks: [], habits: [] });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void search(q), 200);
    return () => clearTimeout(t);
  }, [q, open, search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const go = (path: string) => {
    navigate(path);
    onClose();
    setQ('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#14141f] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Búsqueda global">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="text-zinc-500" size={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar objetivos, tareas, hábitos... (⌘K)"
            className="flex-1 bg-transparent text-white outline-none text-sm"
          />
          <kbd className="text-zinc-600 text-xs hidden sm:inline">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {!results ? (
            <p className="text-zinc-600 text-sm text-center py-8">Escribe al menos 2 caracteres</p>
          ) : (
            <>
              {results.tasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => go('/tasks')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-zinc-300">
                  <span className="text-violet-400 text-xs mr-2">Tarea</span>
                  {t.title}
                  {t.completed ? <span className="text-emerald-500 text-xs ml-2">✓</span> : null}
                </button>
              ))}
              {results.goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => go('/goals')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-zinc-300">
                  <span className="text-cyan-400 text-xs mr-2">Objetivo</span>
                  {g.title}
                </button>
              ))}
              {results.habits.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => go('/habits')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-zinc-300">
                  <span className="text-amber-400 text-xs mr-2">Hábito</span>
                  {h.name}
                </button>
              ))}
              {results.goals.length === 0 && results.tasks.length === 0 && results.habits.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-6">Sin resultados</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
