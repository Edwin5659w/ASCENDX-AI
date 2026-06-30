import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { Card } from '../Card';

const DEFAULT_SEC = 25 * 60;

export function PomodoroTimer() {
  const [seconds, setSeconds] = useState(DEFAULT_SEC);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, seconds]);

  useEffect(() => {
    if (seconds === 0 && running) setRunning(false);
  }, [seconds, running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Timer className="text-violet-400" size={20} />
          <div>
            <p className="text-white font-medium text-sm">Pomodoro</p>
            <p className="text-zinc-500 text-xs">25 min de foco profundo</p>
          </div>
        </div>
        <p className="text-2xl font-mono text-violet-300 tabular-nums" aria-live="polite">
          {mm}:{ss}
        </p>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => setRunning(!running)}
          className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium">
          {running ? 'Pausar' : seconds < DEFAULT_SEC ? 'Reanudar' : 'Iniciar'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setSeconds(DEFAULT_SEC);
          }}
          className="px-4 py-2 rounded-lg border border-white/10 text-zinc-400 text-sm">
          Reset
        </button>
      </div>
    </Card>
  );
}
