import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AuthLayout } from '../components/brand/AuthLayout';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { RETENTION_MESSAGES } from '@shared/retention';
import { setPendingProCheckout } from '../lib/pending-pro-checkout';
import { track, AnalyticsEvents } from '../lib/analytics';
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from '@shared/validators/auth.rules';

export function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref')?.toUpperCase() ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const wantsPro = searchParams.get('plan') === 'pro';

  const nameVal = useMemo(() => validateFullName(name, touched.name), [name, touched.name]);
  const emailVal = useMemo(() => validateEmail(email, touched.email), [email, touched.email]);
  const passwordVal = useMemo(
    () => validatePassword(password, touched.password),
    [password, touched.password],
  );

  const isFormValid =
    nameVal.status === 'valid' &&
    emailVal.status === 'valid' &&
    passwordVal.status === 'valid' &&
    acceptedTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    setSubmitError('');

    if (!isFormValid) return;

    setLoading(true);
    try {
      const referralBonus = await register(name.trim().replace(/\s+/g, ' '), email.trim().toLowerCase(), password, referralCode || undefined);
      if (referralBonus > 0) {
        showToast(RETENTION_MESSAGES.referralBonus(referralBonus), 'success');
      }
      if (wantsPro) setPendingProCheckout();
      track(AnalyticsEvents.REGISTER, { plan: wantsPro ? 'pro' : 'free' });
      navigate('/onboarding');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crear tu cuenta"
      subtitle={wantsPro ? 'Regístrate y continúa al checkout Pro' : 'Únete a ASCENDX AI — tu Life OS personal'}>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-white/10 bg-[#14141f] p-8 space-y-5">
          <AuthTextField
            id="name"
            label="Nombre completo"
            value={name}
            onChange={setName}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            validation={nameVal}
            placeholder="Juan Pérez"
            autoComplete="name"
          />

          <AuthTextField
            id="email"
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={setEmail}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            validation={emailVal}
            placeholder="nombre@gmail.com"
            autoComplete="email"
          />

          <div>
            <AuthTextField
              id="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              validation={passwordVal}
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-white p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <PasswordStrength
              checks={passwordVal.checks}
              strength={passwordVal.strength}
              visible={touched.password || password.length > 0}
            />
          </div>

          <div>
            <label htmlFor="referral" className="block text-sm text-zinc-400 mb-1.5">
              Código de referido <span className="text-zinc-600">(opcional)</span>
            </label>
            <input
              id="referral"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Ej: JUAN1A2B"
              maxLength={12}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white uppercase tracking-wider focus:outline-none focus:border-violet-500"
            />
            <p className="text-zinc-600 text-xs mt-1">+50 XP para ti y quien te invitó</p>
          </div>

          {submitError ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300" role="alert">
              {submitError}
            </div>
          ) : null}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 accent-violet-600"
            />
            <span className="text-zinc-500 text-xs leading-relaxed">
              Acepto los{' '}
              <Link to="/terms" target="_blank" className="text-violet-400 hover:underline">
                Términos
              </Link>{' '}
              y la{' '}
              <Link to="/privacy" target="_blank" className="text-violet-400 hover:underline">
                Política de privacidad
              </Link>
              . Confirmo que tengo al menos 16 años.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full brand-btn-primary disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <GoogleSignInButton
            label="signup"
            referralCode={referralCode || undefined}
            onSuccess={(u) => {
              if (wantsPro) setPendingProCheckout();
              navigate(u.onboardingDone ? '/dashboard' : '/onboarding');
            }}
            onError={(msg) => setSubmitError(msg)}
          />

          <p className="text-center text-zinc-500 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="brand-gradient-text font-medium hover:opacity-90">
              Inicia sesión
            </Link>
          </p>
        </form>
    </AuthLayout>
  );
}