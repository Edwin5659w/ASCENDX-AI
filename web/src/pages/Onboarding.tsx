import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Target, Flame } from 'lucide-react';
import { userApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const steps = [
  {
    icon: Rocket,
    title: 'Bienvenido a ASCENDX',
    text: 'Tu Life OS: objetivos, tareas, hábitos y finanzas en un solo lugar.',
  },
  {
    icon: Target,
    title: 'Define objetivos',
    text: 'Crea metas con prioridad y sigue el progreso automáticamente con tus tareas.',
  },
  {
    icon: Flame,
    title: 'Construye rachas',
    text: 'Completa hábitos una vez al día. Cada día suma a tu racha y +15 XP.',
  },
];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const current = steps[step];
  const Icon = current.icon;

  const finish = async () => {
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

  const next = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else finish();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/15 flex items-center justify-center mb-6">
          <Icon className="text-violet-400" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{current.title}</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">{current.text}</p>
        <div className="flex gap-2 justify-center mb-8">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-violet-500' : 'w-2 bg-zinc-700'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium">
          {step < steps.length - 1 ? 'Siguiente' : loading ? 'Guardando...' : 'Empezar'}
        </button>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="mt-3 text-zinc-500 text-sm hover:text-zinc-300">
            Atrás
          </button>
        )}
      </div>
    </div>
  );
}
