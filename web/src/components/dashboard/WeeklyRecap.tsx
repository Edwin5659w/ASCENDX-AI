import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Crown, Lock } from 'lucide-react';
import { Card } from '../Card';
import { userApi } from '../../api/services';
import type { WeeklyRecapResult } from '../../types';

export function WeeklyRecap() {
  const [recap, setRecap] = useState<WeeklyRecapResult | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    userApi
      .weeklyRecap()
      .then(setRecap)
      .catch((e) => {
        if (e instanceof Error && e.message.includes('Pro')) setLocked(true);
      });
  }, []);

  if (locked) {
    return (
      <Card className="mb-6 border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Lock className="text-amber-400" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Resumen semanal</p>
            <p className="text-zinc-500 text-xs">Disponible en plan Pro</p>
          </div>
          <Link
            to="/pricing"
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white font-medium">
            <Crown size={12} />
            Ver Pro
          </Link>
        </div>
      </Card>
    );
  }

  if (!recap) return null;

  return (
    <Card className="mb-6 border-emerald-500/20">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="text-emerald-400" size={20} />
        <h2 className="text-lg font-semibold text-white">Tu semana</h2>
        <span className="ml-auto text-emerald-300 font-bold text-sm">{recap.score}/100</span>
      </div>
      <p className="text-white font-medium mb-2">{recap.headline}</p>
      <ul className="text-zinc-400 text-sm space-y-1 mb-3">
        {recap.highlights.map((h) => (
          <li key={h}>• {h}</li>
        ))}
      </ul>
      <p className="text-zinc-500 text-xs">{recap.encouragement}</p>
    </Card>
  );
}
