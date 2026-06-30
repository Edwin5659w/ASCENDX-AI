import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Sparkles, X, Zap } from 'lucide-react';
import { XP } from '@shared/retention';

const STORAGE_KEY = 'ascendx_show_welcome';

export function markWelcomePending() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

interface WelcomeModalProps {
  userName?: string;
  onDismiss: () => void;
}

export function WelcomeModal({ userName, onDismiss }: WelcomeModalProps) {
  const firstName = userName?.split(' ')[0] ?? 'viajero';

  const dismiss = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-violet-500/40 bg-[#14141f] p-6 shadow-2xl brand-glow">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1"
          aria-label="Cerrar">
          <X size={20} />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
            <Rocket className="text-violet-400" size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-1">
          ¡Listo, {firstName}! 🎉
        </h2>
        <p className="text-violet-300 text-center text-sm font-medium mb-4">
          +{XP.ONBOARDING_COMPLETE} XP de bienvenida desbloqueados
        </p>

        <p className="text-zinc-400 text-sm text-center leading-relaxed mb-6">
          Ya tienes objetivo, tareas y hábito configurados. Tu mentor IA puede planificar el día con
          datos reales. El siguiente paso te da XP al instante.
        </p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-zinc-300 bg-white/5 rounded-lg px-3 py-2">
            <Zap className="text-amber-400 shrink-0" size={16} />
            Completa 1 tarea → +{XP.TASK_COMPLETE} XP
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-300 bg-white/5 rounded-lg px-3 py-2">
            <Sparkles className="text-cyan-400 shrink-0" size={16} />
            Marca tu hábito hoy → +{XP.HABIT_COMPLETE} XP
          </div>
        </div>

        <Link
          to="/tasks"
          onClick={dismiss}
          className="block w-full text-center brand-btn-primary text-white font-semibold py-3.5 rounded-xl mb-2">
          Completar mi primera tarea (+{XP.TASK_COMPLETE} XP)
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="w-full text-zinc-500 text-sm py-2 hover:text-zinc-300">
          Explorar el dashboard primero
        </button>
      </div>
    </div>
  );
}

export function useWelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(sessionStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      setOpen(false);
    }
  }, []);

  return { open, close: () => setOpen(false) };
}
