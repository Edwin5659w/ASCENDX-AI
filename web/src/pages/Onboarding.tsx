import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Target, Sparkles, ChevronRight } from 'lucide-react';
import {
  ONBOARDING_TEMPLATES,
  type OnboardingFocus,
} from '@shared/validators/onboarding.validator';
import { userApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type WizardStep = 'welcome' | 'focus' | 'setup';

const focusKeys = Object.keys(ONBOARDING_TEMPLATES) as OnboardingFocus[];

export function Onboarding() {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [focus, setFocus] = useState<OnboardingFocus | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [task1, setTask1] = useState('');
  const [task2, setTask2] = useState('');
  const [habitName, setHabitName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const applyTemplate = (key: OnboardingFocus) => {
    const t = ONBOARDING_TEMPLATES[key];
    setFocus(key);
    setGoalTitle(t.goalTitle);
    setTask1(t.taskTitles[0]);
    setTask2(t.taskTitles[1]);
    setHabitName(t.habitName);
  };

  const skip = async () => {
    setLoading(true);
    try {
      await userApi.completeOnboarding();
      await refreshUser();
      navigate('/', { replace: true });
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

    setLoading(true);
    try {
      await userApi.setupOnboarding({
        focus,
        goalTitle: goalTitle.trim(),
        taskTitles: tasks,
        habitName: habitName.trim(),
      });
      await refreshUser();
      showToast('¡Tu espacio está listo!', 'success');
      navigate('/', { replace: true });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {step === 'welcome' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/15 flex items-center justify-center mb-6">
              <Rocket className="text-violet-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 text-center">Bienvenido a ASCENDX</h1>
            <p className="text-zinc-400 mb-8 leading-relaxed text-center">
              En menos de un minuto configuramos tu primer objetivo, tareas y hábito para que la IA
              y el dashboard tengan contexto desde el día uno.
            </p>
            <button
              type="button"
              onClick={() => setStep('focus')}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              Configurar mi espacio
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={skip}
              disabled={loading}
              className="w-full mt-3 text-zinc-500 text-sm hover:text-zinc-300 py-2 disabled:opacity-50">
              {loading ? 'Omitiendo...' : 'Omitir por ahora'}
            </button>
          </>
        )}

        {step === 'focus' && (
          <>
            <h1 className="text-xl font-bold text-white mb-2 text-center">¿En qué quieres enfocarte?</h1>
            <p className="text-zinc-500 text-sm text-center mb-6">Elige una plantilla. Podrás editar todo después.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {focusKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    applyTemplate(key);
                    setStep('setup');
                  }}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    focus === key
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/10 bg-[#1c1c2e] hover:border-violet-500/50'
                  }`}>
                  <span className="text-white font-medium">{ONBOARDING_TEMPLATES[key].label}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep('welcome')} className="text-zinc-500 text-sm hover:text-zinc-300">
              Atrás
            </button>
          </>
        )}

        {step === 'setup' && focus && (
          <>
            <div className="flex items-center gap-2 mb-4 text-violet-400">
              <Target size={20} />
              <span className="text-sm font-medium">{ONBOARDING_TEMPLATES[focus].label}</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-4">Personaliza tu inicio</h1>
            <label className="block text-zinc-400 text-xs mb-1">Objetivo principal</label>
            <input
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full mb-4 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
            />
            <label className="block text-zinc-400 text-xs mb-1">Tareas iniciales</label>
            <input
              value={task1}
              onChange={(e) => setTask1(e.target.value)}
              placeholder="Tarea 1"
              className="w-full mb-2 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
            />
            <input
              value={task2}
              onChange={(e) => setTask2(e.target.value)}
              placeholder="Tarea 2"
              className="w-full mb-4 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
            />
            <label className="block text-zinc-400 text-xs mb-1">Hábito diario</label>
            <input
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="w-full mb-6 bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={finish}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <Sparkles size={18} />
              {loading ? 'Creando tu espacio...' : 'Empezar con ASCENDX'}
            </button>
            <button
              type="button"
              onClick={() => setStep('focus')}
              className="w-full mt-3 text-zinc-500 text-sm hover:text-zinc-300 py-2">
              Cambiar enfoque
            </button>
          </>
        )}
      </div>
    </div>
  );
}
