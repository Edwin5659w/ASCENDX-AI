import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Medal, Share2, Sparkles } from 'lucide-react';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/services';
import type { UserStats } from '../types';
import { BrandLoader } from '../components/brand/BrandLoader';

export function Achievements() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi
      .stats()
      .then(setStats)
      .catch((e) => showToast(e instanceof Error ? e.message : 'Error', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const badges = stats?.badges ?? [];
  const unlocked = badges.filter((b) => b.unlocked);
  const locked = badges.filter((b) => !b.unlocked);

  const shareProgress = async () => {
    const text = `¡Llevo ${unlocked.length}/${badges.length} logros en ASCENDX AI! Nivel ${user?.level} · ${user?.xp} XP. Únete: ascendx.ai`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ASCENDX AI', text });
      } else {
        await navigator.clipboard.writeText(text);
        showToast('Progreso copiado al portapapeles', 'success');
      }
    } catch {
      /* cancelado */
    }
  };

  if (loading) return <BrandLoader className="min-h-[40vh] flex items-center justify-center" />;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Sparkles className="text-violet-400" size={24} />
            Logros
          </h1>
          <p className="text-zinc-500 text-sm">
            {unlocked.length} de {badges.length} desbloqueados · Nivel {user?.level}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void shareProgress()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-500/30 text-violet-300 text-sm hover:bg-violet-500/10">
          <Share2 size={16} />
          Compartir progreso
        </button>
      </div>

      {unlocked.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Desbloqueados</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((b) => (
              <Card key={b.slug} className="border-violet-500/30 bg-violet-500/5">
                <Medal className="text-amber-400 mb-2" size={24} />
                <p className="text-white font-semibold">{b.title}</p>
                <p className="text-zinc-500 text-sm mt-1">{b.subtitle}</p>
                {b.unlockedAt && (
                  <p className="text-zinc-600 text-xs mt-2">
                    {new Date(b.unlockedAt).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Por desbloquear</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((b) => (
              <Card key={b.slug} className="opacity-75">
                <Lock className="text-zinc-600 mb-2" size={20} />
                <p className="text-zinc-400 font-semibold">{b.title}</p>
                <p className="text-zinc-600 text-sm mt-1">{b.subtitle}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <p className="text-zinc-600 text-sm mt-8">
        Tip: completa tareas (+10 XP), hábitos (+15 XP) e invita amigos (+50 XP cada uno).{' '}
        <Link to="/profile" className="text-violet-400 hover:underline">
          Ver tu código de referido →
        </Link>
      </p>
    </div>
  );
}
