import { Link } from 'react-router-dom';
import { Brain, MessageCircle, Sparkles } from 'lucide-react';
import { Card } from '../Card';
import type { AIContextLevel } from '@shared/ai-prompts';

interface AIMentorCardProps {
  contextLevel: AIContextLevel;
  suggestedPrompts: string[];
  aiUsed?: number;
  aiLimit?: number;
}

export function AIMentorCard({ contextLevel, suggestedPrompts, aiUsed = 0, aiLimit = 5 }: AIMentorCardProps) {
  const remaining = Math.max(0, aiLimit - aiUsed);
  const prompt = suggestedPrompts[0] ?? 'Planifica mi día con mis tareas actuales';

  return (
    <Card className="mb-6 border-cyan-500/25 bg-gradient-to-br from-cyan-950/30 to-violet-950/20 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="text-cyan-400" size={22} />
          <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wide">Mentor IA</span>
          <span className="text-zinc-500 text-xs ml-auto">
            {remaining} mensaje{remaining !== 1 ? 's' : ''} hoy
          </span>
        </div>
        <h2 className="text-lg font-bold text-white mb-1">
          {contextLevel === 'ready'
            ? 'Tu IA conoce tus datos — úsala ahora'
            : contextLevel === 'partial'
              ? 'Completa tu perfil y la IA mejora'
              : 'Empieza con tu primer plan IA'}
        </h2>
        <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
          {contextLevel === 'ready'
            ? 'Pregunta algo concreto y obtén el siguiente paso en 25 minutos, no un discurso vacío.'
            : 'Configura objetivo + tareas + hábito para respuestas personalizadas.'}
        </p>
        <Link
          to="/chat"
          state={{ prefill: prompt }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-colors mb-3">
          <MessageCircle size={16} />
          Hablar con el mentor
        </Link>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.slice(0, 2).map((p) => (
            <Link
              key={p}
              to="/chat"
              state={{ prefill: p }}
              className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-200/90 hover:bg-cyan-500/10 transition-colors">
              <Sparkles size={10} className="inline mr-1 opacity-70" />
              {p.length > 42 ? `${p.slice(0, 42)}…` : p}
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
