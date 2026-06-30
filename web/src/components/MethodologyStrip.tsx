import { Lightbulb } from 'lucide-react';
import { METHODOLOGIES, type MethodologyModule } from '@shared/methodologies';

/** Franja visible con la metodología que respalda cada módulo — genera confianza sin abrumar */
export function MethodologyStrip({ module }: { module: MethodologyModule }) {
  const m = METHODOLOGIES[module];
  return (
    <div className="mb-4 rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 to-cyan-500/5 px-4 py-3">
      <div className="flex items-start gap-2">
        <Lightbulb size={16} className="text-violet-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-violet-300 font-semibold uppercase tracking-wide">
            Metodología {m.name}
          </p>
          <p className="text-sm text-zinc-200 font-medium mt-0.5">{m.tagline}</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{m.howWeHelp}</p>
        </div>
      </div>
    </div>
  );
}
