import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  CheckSquare,
  Crown,
  Flame,
  Hand,
  LayoutDashboard,
  Rocket,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { PRODUCT_TOUR_STEPS, type ProductTourIcon } from '@shared/product-tour';
import { PlanComparison } from '../marketing/PlanComparison';
import { BrandLogo } from '../brand/BrandLogo';
import { userApi } from '../../api/services';
import { XP } from '@shared/retention';
import { track, AnalyticsEvents } from '../../lib/analytics';

const ICONS: Record<ProductTourIcon, typeof Sparkles> = {
  wave: Hand,
  home: LayoutDashboard,
  tasks: CheckSquare,
  habits: Flame,
  brain: Brain,
  trophy: Trophy,
  compare: Crown,
  rocket: Rocket,
};

const ACCENT_RING: Record<string, string> = {
  violet: 'from-violet-500/30 to-purple-600/20 border-violet-500/40',
  cyan: 'from-cyan-500/25 to-blue-500/15 border-cyan-500/35',
  amber: 'from-amber-500/25 to-orange-500/15 border-amber-500/35',
  emerald: 'from-emerald-500/25 to-teal-500/15 border-emerald-500/35',
};

interface ProductTourProps {
  open: boolean;
  userName?: string;
  onClose: () => void;
}

export function ProductTour({ open, userName, onClose }: ProductTourProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const steps = PRODUCT_TOUR_STEPS;
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const isLast = step === steps.length - 1;
  const isPlansStep = current?.id === 'plans';

  const firstName = userName?.split(' ')[0] ?? 'viajero';
  const title = current?.id === 'welcome' ? current.title.replace('!', `, ${firstName}!`) : current?.title ?? '';

  useEffect(() => {
    if (open) {
      setStep(0);
      setAnimKey(0);
    }
  }, [open]);

  const finishTour = useCallback(
    async (goTasks: boolean) => {
      setFinishing(true);
      try {
        await userApi.completeProductTour();
        track(AnalyticsEvents.TOUR_COMPLETE);
      } catch {
        /* persist locally even if API fails */
      }
      onClose();
      if (goTasks) navigate('/tasks');
    },
    [navigate, onClose],
  );

  const next = () => {
    if (isLast) {
      void finishTour(true);
      return;
    }
    setStep((s) => s + 1);
    setAnimKey((k) => k + 1);
  };

  const skip = () => {
    track(AnalyticsEvents.TOUR_SKIP);
    void finishTour(false);
  };

  if (!open || !current) return null;

  const Icon = current.id === 'welcome' ? null : ICONS[current.icon];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0f] tour-overlay-enter">
      {/* Progress bar estilo Duolingo */}
      <div className="shrink-0 px-4 pt-4 pb-2 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-500 text-xs font-medium">
            Paso {step + 1} de {steps.length}
          </span>
          <button
            type="button"
            onClick={skip}
            disabled={finishing}
            className="text-zinc-600 hover:text-zinc-400 text-xs flex items-center gap-1">
            <X size={14} />
            Saltar
          </button>
        </div>
        <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500 ease-out tour-progress-glow"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Contenido animado */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 max-w-lg mx-auto w-full overflow-y-auto">
        <div key={animKey} className="w-full tour-step-enter flex flex-col items-center">
          {/* Mascota / icono */}
          <div className="mb-8 relative">
            {current.id === 'welcome' ? (
              <div className="tour-icon-bounce">
                <BrandLogo size="md" animate breathe />
              </div>
            ) : (
              <div
                className={`w-28 h-28 rounded-3xl border-2 bg-gradient-to-br flex items-center justify-center tour-icon-bounce shadow-lg ${ACCENT_RING[current.accent]}`}>
                {Icon ? <Icon className="text-white" size={48} strokeWidth={1.5} /> : null}
              </div>
            )}
            {current.id === 'finish' ? (
              <div className="absolute -top-2 -right-2 tour-sparkle">
                <Sparkles className="text-amber-400" size={24} />
              </div>
            ) : null}
          </div>

          {/* Burbuja de diálogo */}
          <div className="w-full rounded-2xl border border-white/10 bg-[#14141f] p-6 relative mb-4 tour-bubble">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#14141f] border-l border-t border-white/10 rotate-45" />
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-3 leading-snug">{title}</h2>
            <p className="text-zinc-400 text-sm sm:text-base text-center leading-relaxed">{current.body}</p>
            {current.methodology ? (
              <p className="text-violet-400/90 text-xs text-center mt-3 font-medium">{current.methodology}</p>
            ) : null}
          </div>

          {/* Bullets */}
          {current.bullets && current.bullets.length > 0 ? (
            <ul className="w-full space-y-2 mb-4">
              {current.bullets.map((b, i) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-sm text-zinc-300 bg-white/[0.03] rounded-xl px-4 py-2.5 tour-bullet-enter"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Comparación en paso Pro */}
          {isPlansStep ? (
            <div className="w-full mb-2 tour-step-enter">
              <PlanComparison compact />
            </div>
          ) : null}

          {current.id === 'finish' ? (
            <div className="flex gap-3 w-full mb-2">
              <div className="flex-1 rounded-xl bg-violet-500/10 border border-violet-500/25 px-3 py-2 text-center">
                <p className="text-violet-300 font-bold text-lg">+{XP.TASK_COMPLETE} XP</p>
                <p className="text-zinc-500 text-[10px]">primera tarea</p>
              </div>
              <div className="flex-1 rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-center">
                <p className="text-amber-300 font-bold text-lg">+{XP.HABIT_COMPLETE} XP</p>
                <p className="text-zinc-500 text-[10px]">hábito hoy</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* CTA fijo abajo */}
      <div className="shrink-0 p-4 pb-8 max-w-lg mx-auto w-full border-t border-white/5 bg-[#0a0a0f]/95 backdrop-blur-sm">
        <button
          type="button"
          onClick={next}
          disabled={finishing}
          className="w-full brand-btn-primary text-white font-bold py-4 rounded-2xl text-lg disabled:opacity-50 tour-cta-pulse flex items-center justify-center gap-2">
          {finishing ? 'Preparando...' : isLast ? current.cta : current.cta ?? 'Continuar'}
          {!isLast && !finishing ? <span className="text-white/70">→</span> : null}
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={() => void finishTour(false)}
            disabled={finishing}
            className="w-full text-zinc-500 text-sm py-3 hover:text-zinc-300">
            Explorar el dashboard primero
          </button>
        ) : (
          <p className="text-center text-zinc-600 text-xs mt-2">
            Gratis para siempre · Pro desde $4.99/mes cuando quieras
          </p>
        )}
      </div>
    </div>
  );
}
