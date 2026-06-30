import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sunrise, X } from 'lucide-react';
import { MORNING_RITUAL_STEPS } from '@shared/morning-ritual';
import { userApi } from '../../api/services';

interface MorningRitualModalProps {
  open: boolean;
  onClose: () => void;
}

export function MorningRitualModal({ open, onClose }: MorningRitualModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  if (!open) return null;

  const current = MORNING_RITUAL_STEPS[step];
  const isLast = step === MORNING_RITUAL_STEPS.length - 1;

  const next = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setFinishing(true);
    try {
      await userApi.completeMorningRitual();
    } catch {
      /* ignore */
    }
    onClose();
    navigate(current.webPath);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#14141f] p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
          aria-label="Cerrar ritual">
          <X size={20} />
        </button>
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <Sunrise className="text-amber-400" size={28} />
          </div>
        </div>
        <p className="text-amber-400 text-xs text-center font-semibold uppercase mb-1">
          Ritual matutino · {step + 1}/{MORNING_RITUAL_STEPS.length}
        </p>
        <h2 className="text-xl font-bold text-white text-center mb-2">{current.title}</h2>
        <p className="text-zinc-400 text-sm text-center leading-relaxed mb-6">{current.body}</p>
        <button
          type="button"
          onClick={() => void next()}
          disabled={finishing}
          className="w-full brand-btn-primary py-3 rounded-xl text-white font-semibold disabled:opacity-50">
          {finishing ? 'Listo...' : isLast ? current.cta : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}
