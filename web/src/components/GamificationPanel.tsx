import { Lock, Medal, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from './Card';
import type { User, UserStats } from '../types';

const XP_PER_LEVEL = 100;

function xpProgress(xp: number) {
  const inLevel = xp % XP_PER_LEVEL;
  return { pct: inLevel, toNext: inLevel === 0 && xp > 0 ? XP_PER_LEVEL : XP_PER_LEVEL - inLevel };
}

function fallbackBadges(user: User, stats: UserStats | null) {
  const level = user.level;
  return [
    { slug: 'FIRST_TASK', title: 'En marcha', subtitle: 'Primera tarea completada', unlocked: (stats?.completedTasks ?? 0) >= 1, unlockedAt: null as string | null },
    { slug: 'STREAK_7', title: 'Constancia', subtitle: 'Racha de 7 días o más', unlocked: (stats?.longestStreak ?? 0) >= 7, unlockedAt: null },
    { slug: 'GOALS_3', title: 'Visionario', subtitle: '3+ objetivos creados', unlocked: (stats?.totalGoals ?? 0) >= 3, unlockedAt: null },
    { slug: 'LEVEL_5', title: 'Ascenso', subtitle: 'Alcanza el nivel 5', unlocked: level >= 5, unlockedAt: null },
    { slug: 'STEEL', title: 'Acero', subtitle: '3 hábitos y racha 3+', unlocked: (stats?.activeHabits ?? 0) >= 3 && (stats?.longestStreak ?? 0) >= 3, unlockedAt: null },
    { slug: 'XP_500', title: 'Veterano', subtitle: '500 XP totales', unlocked: (stats?.totalXp ?? user.xp) >= 500, unlockedAt: null },
  ];
}

interface GamificationPanelProps {
  user: User | null;
  stats: UserStats | null;
  compact?: boolean;
}

export function GamificationPanel({ user, stats, compact = false }: GamificationPanelProps) {
  if (!user) return null;

  const { pct, toNext } = xpProgress(user.xp);
  const level = user.level;

  const badges =
    stats?.badges && stats.badges.length > 0 ? stats.badges : fallbackBadges(user, stats);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <Card className="mb-8 border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-transparent">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <Sparkles className="text-violet-400" size={22} />
          <div>
            <h2 className="text-lg font-semibold text-white">Tu progreso</h2>
            <p className="text-zinc-500 text-xs">Nivel {level} · {unlockedCount}/{badges.length} logros</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-violet-300">{user.xp}</p>
          <p className="text-zinc-500 text-xs">XP total</p>
        </div>
      </div>
      <Link to="/achievements" className="text-xs text-violet-400 hover:underline mb-4 inline-block">
        Ver todos los logros →
      </Link>

      <div className="mb-2 flex justify-between text-xs text-zinc-400">
        <span>Progreso al nivel {level + 1}</span>
        <span>{toNext} XP para subir</span>
      </div>
      <div className={`h-3 rounded-full bg-zinc-800 overflow-hidden ${compact ? 'mb-0' : 'mb-6'}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {!compact && (
        <>
      <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-3">Logros</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {badges.map((b) => (
          <div
            key={b.slug}
            className={`rounded-xl border p-3 text-left transition-colors ${
              b.unlocked
                ? 'border-violet-500/40 bg-violet-500/10'
                : 'border-white/5 bg-zinc-900/50 opacity-70'
            }`}>
            <div className="flex items-center justify-between gap-1 mb-1">
              {b.unlocked ? (
                <Medal className="text-amber-400 shrink-0" size={18} />
              ) : (
                <Lock className="text-zinc-500 shrink-0" size={16} />
              )}
            </div>
            <p className={`text-sm font-medium ${b.unlocked ? 'text-white' : 'text-zinc-500'}`}>{b.title}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{b.subtitle}</p>
            {b.unlocked && b.unlockedAt ? (
              <p className="text-[10px] text-zinc-600 mt-1">
                {new Date(b.unlockedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
              </p>
            ) : null}
          </div>
        ))}
      </div>
        </>
      )}
    </Card>
  );
}
