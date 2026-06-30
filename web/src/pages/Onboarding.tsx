import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket,
  ChevronRight,
  BookOpen,
  Heart,
  Wallet,
  Briefcase,
  Sun,
  CheckCircle2,
  Circle,
  Dumbbell,
} from 'lucide-react';
import {
  ONBOARDING_TEMPLATES,
  type OnboardingFocus,
} from '@shared/validators/onboarding.validator';
import {
  FINANCE_ONBOARDING_CATEGORIES,
  ONBOARDING_FOCUS_META,
  onboardingStepIndex,
  type OnboardingStepId,
} from '@shared/onboarding-helpers';
import { userApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BrandLogo } from '../components/brand/BrandLogo';

type WizardStep = OnboardingStepId;

const focusKeys = Object.keys(ONBOARDING_TEMPLATES) as OnboardingFocus[];

const FOCUS_ICONS: Record<OnboardingFocus, typeof BookOpen> = {
  ESTUDIO: BookOpen,
  SALUD: Heart,
  FINANZAS: Wallet,
  TRABAJO: Briefcase,
  PERSONAL: Sun,
  EMPRENDEDOR: Rocket,
  FITNESS: Dumbbell,
};

function ProgressBar({ step }: { step: WizardStep }) {
  const current = onboardingStepIndex(step);
  return (
    <div className="mb-8">
      <p className="text-zinc-500 text-xs text-center font-medium mb-2">
        Paso {current} de 3
      </p>
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-colors ${
              n <= current ? 'bg-violet-500' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function Onboarding() {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [focus, setFocus] = useState<OnboardingFocus | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [task1, setTask1] = useState('');
  const [task2, setTask2] = useState('');
  const [habitName, setHabitName] = useState('');
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeCategory, setFinanceCategory] = useState('Comida');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const firstName = user?.name?.split(' ')[0] ?? 'viajero';
  const meta = focus ? ONBOARDING_FOCUS_META[focus] : null;

  const applyTemplate = (key: OnboardingFocus) => {
    const t = ONBOARDING_TEMPLATES[key];
    setFocus(key);
    setGoalTitle(t.goalTitle);
    setTask1(t.taskTitles[0]);
    setTask2(t.taskTitles[1]);
    setHabitName(t.habitName);
    setFinanceAmount('');
    setFinanceCategory('Comida');
  };

  const skip = async () => {
    setLoading(true);
    try {
      const t = ONBOARDING_TEMPLATES.PERSONAL;
      await userApi.setupOnboarding({
        focus: 'PERSONAL',
        goalTitle: t.goalTitle,
        taskTitles: [...t.taskTitles],
        habitName: t.habitName,
      });
      await refreshUser();
      showToast(`¡Configuración rápida lista! +50 XP`, 'success');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    if (!focus || goalTitle.trim().length < 3) {
      showToast('Completa tu objetivo principal', 'info');
      return;
    }
    const tasks = [task1, task2].map((t) => t.trim()).filter(Boolean);
    if (!tasks.length || !habitName.trim()) {
      showToast('Añade al menos una tarea y un hábito', 'info');
      return;
    }

    let initialFinance: { amount: number; category: string } | undefined;
    if (focus === 'FINANZAS') {
      const amt = parseFloat(financeAmount.replace(',', '.'));
      if (amt && amt > 0 && financeCategory.trim()) {
        initialFinance = { amount: amt, category: financeCategory.trim() };
      }
    }

    setLoading(true);
    try {
      await userApi.setupOnboarding({
        focus,
        goalTitle: goalTitle.trim(),
        taskTitles: tasks,
        habitName: habitName.trim(),
        initialFinance,
      });
      await refreshUser();
      showToast('¡Tu espacio está listo! +50 XP de bienvenida', 'success');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <ProgressBar step={step} />

        {step === 'welcome' && (
          <>
            <div className="flex justify-center mb-6">
              <BrandLogo size="md" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 text-center">
              Hola, {firstName} 👋
            </h1>
            <p className="text-violet-300 text-center font-medium mb-4">Bienvenido a ASCENDX</p>
            <p className="text-zinc-400 mb-6 leading-relaxed text-center">
              En 1 minuto configuramos objetivo, tareas y hábito. La IA usará tus datos reales desde
              hoy.
            </p>
            <ul className="space-y-2 mb-8">
              {['Objetivo SMART', 'Tareas concretas', 'Hábito con racha', 'Mentor IA'].map((b) => (
                <li key={b} className="flex items-center gap-2 text-zinc-300 text-sm">
                  <CheckCircle2 className="text-emerald-400 shrink-0" size={16} />
                  {b}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setStep('focus')}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              Empezar configuración
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={skip}
              disabled={loading}
              className="w-full mt-3 text-zinc-500 text-sm hover:text-zinc-300 py-2 disabled:opacity-50">
              {loading ? 'Configurando...' : 'Configuración rápida (30 seg) →'}
            </button>
          </>
        )}

        {step === 'focus' && (
          <>
            <h1 className="text-xl font-bold text-white mb-2 text-center">¿En qué quieres enfocarte?</h1>
            <p className="text-zinc-500 text-sm text-center mb-6">
              Elige un área. Podrás editar todo después.
            </p>
            <div className="space-y-3 mb-6">
              {focusKeys.map((key) => {
                const m = ONBOARDING_FOCUS_META[key];
                const Icon = FOCUS_ICONS[key];
                const selected = focus === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTemplate(key)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                      selected ? 'bg-violet-500/10' : 'bg-[#1c1c2e] hover:border-violet-500/40'
                    }`}
                    style={{ borderColor: selected ? m.color : 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: m.color + '22' }}>
                      <Icon size={22} style={{ color: m.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{m.label}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{m.description}</p>
                      <p className="text-xs font-medium mt-1" style={{ color: m.color }}>
                        {m.methodology}
                      </p>
                    </div>
                    {selected ? (
                      <CheckCircle2 size={22} style={{ color: m.color }} />
                    ) : (
                      <Circle className="text-zinc-600" size={22} />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => focus && setStep('setup')}
              disabled={!focus}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white py-3 rounded-xl font-medium">
              Continuar
            </button>
            <button
              type="button"
              onClick={() => setStep('welcome')}
              className="w-full mt-3 text-zinc-500 text-sm hover:text-zinc-300 py-2">
              ← Atrás
            </button>
          </>
        )}

        {step === 'setup' && focus && meta && (
          <>
            <div
              className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-full mx-auto w-fit"
              style={{ backgroundColor: meta.color + '18' }}>
              <span className="text-sm font-semibold" style={{ color: meta.color }}>
                {meta.label} · {meta.methodology}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mb-4 text-center">Personaliza tu inicio</h1>

            <label className="block text-zinc-300 text-xs font-medium mb-1">Objetivo principal</label>
            <p className="text-zinc-600 text-[11px] mb-1">{meta.goalHint}</p>
            <input
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full mb-4 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
            />

            <label className="block text-zinc-300 text-xs font-medium mb-1">Tareas iniciales</label>
            <p className="text-zinc-600 text-[11px] mb-1">Acciones pequeñas para empezar</p>
            <input
              value={task1}
              onChange={(e) => setTask1(e.target.value)}
              placeholder="Tarea 1"
              className="w-full mb-2 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
            />
            <input
              value={task2}
              onChange={(e) => setTask2(e.target.value)}
              placeholder="Tarea 2 (opcional)"
              className="w-full mb-4 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
            />

            <label className="block text-zinc-300 text-xs font-medium mb-1">Hábito diario</label>
            <p className="text-zinc-600 text-[11px] mb-1">{meta.habitHint}</p>
            <input
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="w-full mb-4 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
            />

            {focus === 'FINANZAS' && (
              <div className="mb-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
                <label className="block text-zinc-300 text-xs font-medium mb-1">
                  Primer gasto (opcional)
                </label>
                <p className="text-zinc-600 text-[11px] mb-2">
                  Activa gráficos y balance desde el día uno
                </p>
                <input
                  value={financeAmount}
                  onChange={(e) => setFinanceAmount(e.target.value)}
                  placeholder="Monto"
                  className="w-full mb-3 bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white"
                />
                <div className="flex flex-wrap gap-2">
                  {FINANCE_ONBOARDING_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFinanceCategory(c)}
                      className={`px-3 py-1 rounded-full text-xs ${
                        financeCategory === c
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/50'
                          : 'bg-zinc-800 text-zinc-400 border border-white/10'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={finish}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <Rocket size={18} />
              {loading ? 'Creando tu espacio...' : 'Entrar a ASCENDX'}
            </button>
            <button
              type="button"
              onClick={() => setStep('focus')}
              className="w-full mt-3 text-zinc-500 text-sm hover:text-zinc-300 py-2">
              ← Cambiar enfoque
            </button>
          </>
        )}
      </div>
    </div>
  );
}
