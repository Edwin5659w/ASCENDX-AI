import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AuthLayout } from '../components/brand/AuthLayout';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { validateLoginEmail, validateLoginPassword } from '@shared/validators/auth.rules';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailVal = useMemo(() => validateLoginEmail(email, touched.email), [email, touched.email]);
  const passwordVal = useMemo(
    () => validateLoginPassword(password, touched.password),
    [password, touched.password],
  );

  const isFormValid = emailVal.status === 'valid' && passwordVal.status === 'valid';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setSubmitError('');

    if (!isFormValid) return;

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Correo o contraseña incorrectos',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Inicia sesión en tu cuenta">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-white/10 bg-[#14141f] p-8 space-y-5">
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

        <AuthTextField
          id="password"
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          validation={passwordVal}
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-zinc-400 hover:text-white p-1"
              aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {submitError ? (
          <div
            className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300"
            role="alert">
            {submitError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full brand-btn-primary text-white font-semibold py-3 rounded-lg disabled:cursor-not-allowed">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <GoogleSignInButton
          onSuccess={(u) => navigate(u.onboardingDone ? '/dashboard' : '/onboarding')}
          onError={(msg) => setSubmitError(msg)}
        />

        <p className="text-center text-sm">
          <Link to="/forgot-password" className="text-cyan-400/90 hover:text-cyan-300 transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="text-center text-zinc-500 text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="brand-gradient-text font-medium hover:opacity-90">
            Crear cuenta
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
