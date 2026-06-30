interface AscensoScoreCardProps {
  score: number;
  label: string;
  tips?: string[];
}

export function AscensoScoreCard({ score, label, tips = [] }: AscensoScoreCardProps) {
  const color =
    score >= 75 ? 'from-emerald-500 to-teal-400' : score >= 50 ? 'from-violet-500 to-cyan-400' : 'from-amber-500 to-orange-400';

  return (
    <div className="rounded-2xl border border-white/10 bg-[#14141f] p-5">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-wide">Ascenso Score™</p>
          <p className="text-white font-bold text-lg mt-0.5">{label}</p>
        </div>
        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
          aria-label={`Puntuación ${score} de 100`}>
          <span className="text-white text-2xl font-black tabular-nums">{score}</span>
        </div>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${score}%` }} />
      </div>
      {tips.length > 0 ? (
        <ul className="space-y-1">
          {tips.map((t) => (
            <li key={t} className="text-zinc-500 text-xs flex gap-1.5">
              <span className="text-violet-400">→</span>
              {t}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-emerald-400/90 text-xs">¡Día excelente! Sigue así.</p>
      )}
    </div>
  );
}
