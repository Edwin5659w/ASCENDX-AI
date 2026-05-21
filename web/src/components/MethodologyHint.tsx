import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { METHODOLOGIES, type MethodologyModule } from '@shared/methodologies';

export function MethodologyHint({ module }: { module: MethodologyModule }) {
  const [open, setOpen] = useState(false);
  const m = METHODOLOGIES[module];

  return (
    <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-violet-500/10 transition-colors">
        <span className="flex items-center gap-2 text-sm text-violet-200">
          <Lightbulb size={16} className="text-violet-400 shrink-0" />
          <span>
            <strong className="text-violet-300">{m.name}</strong>
            <span className="text-zinc-400"> — {m.tagline}</span>
          </span>
        </span>
        {open ? <ChevronUp size={18} className="text-zinc-500" /> : <ChevronDown size={18} className="text-zinc-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-white/5">
          <p className="text-zinc-400 text-sm mt-3 mb-2">{m.howWeHelp}</p>
          <ol className="list-decimal list-inside space-y-1 text-zinc-500 text-sm">
            {m.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
