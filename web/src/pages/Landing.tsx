import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  Flame,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
  Wallet,
  Zap,
} from 'lucide-react';
import { MarketingLayout } from '../components/marketing/MarketingLayout';
import { BrandLogo } from '../components/brand/BrandLogo';
import { BrandPattern } from '../components/brand/BrandPattern';
import { publicApi } from '../api/services';
import { PlanComparison } from '../components/marketing/PlanComparison';
import { PLAN_PRICING } from '@shared/plans';
import { METHODOLOGIES } from '@shared/methodologies';

const FEATURES = [
  {
    icon: Target,
    title: 'Objetivos y tareas',
    desc: 'Metas claras con progreso automático al completar tareas vinculadas.',
  },
  {
    icon: Flame,
    title: 'Hábitos con rachas',
    desc: 'Constancia medida en días. Escudos de racha para no perder tu progreso.',
  },
  {
    icon: Wallet,
    title: 'Finanzas personales',
    desc: 'Registra ingresos y gastos. La IA usa tus datos reales, no inventa cifras.',
  },
  {
    icon: Brain,
    title: 'Mentor IA contextual',
    desc: 'Plan diario, detección de procrastinación y chat con tu perfil completo.',
  },
];

const FAQ = [
  {
    q: '¿Es gratis?',
    a: 'Sí. El plan Gratis incluye objetivos, tareas, hábitos, finanzas y 5 mensajes IA al día. Pro desbloquea más límites y resumen semanal por $4.99/mes.',
  },
  {
    q: '¿Mis datos son privados?',
    a: 'Sí. Tu información solo alimenta tu mentor IA personal. Puedes exportar o eliminar tu cuenta en cualquier momento (Pro para exportar).',
  },
  {
    q: '¿Funciona en móvil?',
    a: 'Sí. Misma cuenta en web y app móvil con sincronización en tiempo real.',
  },
  {
    q: '¿Cómo cancelo Pro?',
    a: 'Desde Perfil → Gestionar suscripción en Stripe. Cancelas cuando quieras, sin permanencia.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-[#14141f] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-white font-medium text-sm">{q}</span>
        <ChevronDown
          size={18}
          className={`text-zinc-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <p className="px-5 pb-4 text-zinc-400 text-sm leading-relaxed">{a}</p>}
    </div>
  );
}

export function Landing() {
  const [stats, setStats] = useState({ users: 0, tasksCompleted: 0, habitsCompleted: 0 });

  useEffect(() => {
    publicApi.stats().then(setStats).catch(() => {});
  }, []);

  const showUserStats = stats.users >= 50;

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden">
        <BrandPattern />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
            <Sparkles size={14} />
            Life OS en español · Web + móvil · IA con tus datos reales
          </div>

          <BrandLogo size="lg" animate breathe className="mx-auto mb-8" />

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-3xl mx-auto mb-6">
            Tu ascenso personal,{' '}
            <span className="brand-gradient-text">unificado e inteligente</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Objetivos, tareas, hábitos y finanzas en un solo flujo. Mentor IA que conoce tu progreso real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/register"
              className="brand-btn-primary flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-lg brand-glow">
              Crear cuenta gratis
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-3.5 rounded-xl border border-white/15 text-zinc-300 hover:border-violet-500/40 hover:text-white transition-colors font-medium">
              Ver planes Pro
            </Link>
          </div>

          {showUserStats ? (
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-white tabular-nums">{stats.users}+</p>
                <p className="text-zinc-500 text-sm">usuarios</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-400 tabular-nums">{stats.tasksCompleted}+</p>
                <p className="text-zinc-500 text-sm">tareas completadas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-400 tabular-nums">{stats.habitsCompleted}+</p>
                <p className="text-zinc-500 text-sm">hábitos registrados</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 text-center text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-400" /> Sin tarjeta para empezar
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone size={16} className="text-cyan-400" /> Web + app móvil
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy size={16} className="text-violet-400" /> XP y logros incluidos
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-[#14141f] to-[#0a0a0f] p-6 sm:p-10">
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-wide mb-3 text-center">
            Vista previa del producto
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'Dashboard', desc: 'Foco del día, KPIs y plan IA en un vistazo.' },
              { title: 'Mentor IA', desc: 'Chat con contexto de tus tareas, hábitos y finanzas.' },
              { title: 'Gamificación', desc: 'XP, niveles y logros que refuerzan la constancia.' },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-[#0a0a0f]/80 p-5 text-center">
                <div className="h-24 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 mb-3 flex items-center justify-center">
                  <Sparkles className="text-violet-400" size={28} />
                </div>
                <p className="text-white font-medium text-sm mb-1">{title}</p>
                <p className="text-zinc-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 pb-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Todo lo que necesitas para ascender</h2>
          <p className="text-zinc-500">Un solo sistema para tu productividad diaria.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-[#14141f] p-6 hover:border-violet-500/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center mb-4">
                <Icon className="text-violet-400" size={20} />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Metodologías probadas en cada módulo</h2>
          <p className="text-zinc-500 text-sm max-w-xl mx-auto">
            No es magia: ASCENDX aplica frameworks reconocidos (SMART, GTD, 50/30/20…) para que mejores con método.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(
            [
              ['goals', Target],
              ['tasks', CheckCircle2],
              ['habits', Flame],
              ['finance', Wallet],
              ['ai', Brain],
            ] as const
          ).map(([key, Icon]) => {
            const m = METHODOLOGIES[key];
            return (
              <div
                key={key}
                className="rounded-2xl border border-violet-500/20 bg-[#14141f] p-5 hover:border-violet-500/35 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="text-violet-400" size={18} />
                  <span className="text-violet-300 text-xs font-bold uppercase">{m.name}</span>
                </div>
                <p className="text-white font-medium text-sm mb-1">{m.tagline}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{m.howWeHelp}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#14141f]/50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-cyan-400 text-sm font-medium mb-4">
                <Zap size={16} />
                Diferenciador clave
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">IA que lee tus datos, no los inventa</h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                A diferencia de un chat genérico, ASCENDX construye contexto con tus objetivos, tareas
                pendientes, rachas y finanzas. El mentor te da el siguiente paso concreto.
              </p>
              <Link to="/register" className="text-violet-400 font-medium hover:underline inline-flex items-center gap-1">
                Probar gratis <ArrowRight size={16} />
              </Link>
            </div>
            <div className="rounded-2xl border border-violet-500/20 bg-[#0a0a0f] p-6 font-mono text-sm">
              <p className="text-violet-400 mb-2">// Plan del día — generado con tus datos</p>
              <p className="text-zinc-300 leading-relaxed">
                1) Completar &quot;Revisar dashboard web&quot; (vence hoy) — 15 min
                <br />
                2) Marcar hábito &quot;Meditar 10 min&quot; — racha 5 días 🔥
                <br />
                3) Registrar gasto de transporte en Finanzas
                <br />
                <span className="text-cyan-400">→ +10 XP por tarea · +15 XP por hábito</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Gratis vs Pro — sin trucos</h2>
          <p className="text-zinc-500 text-sm">
            El plan Gratis es completo. Pro desbloquea más IA por ${PLAN_PRICING.PRO.price}/mes.
          </p>
        </div>
        <PlanComparison showPitchLists />
        <div className="text-center mt-8">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-violet-400 font-medium hover:underline">
            Ver planes completos <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Preguntas frecuentes</h2>
          <p className="text-zinc-500 text-sm">
            ¿Más dudas? Escríbenos a{' '}
            <a href="mailto:hola@ascendx.ai" className="text-violet-400 hover:underline">
              hola@ascendx.ai
            </a>
          </p>
        </div>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Empieza tu ascenso hoy</h2>
        <p className="text-zinc-500 mb-8">Gratis para siempre. Pro a $4.99/mes cuando quieras desbloquear todo.</p>
        <Link
          to="/register"
          className="brand-btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-xl text-white font-semibold text-lg">
          Crear mi cuenta
          <ArrowRight size={20} />
        </Link>
      </section>
    </MarketingLayout>
  );
}
