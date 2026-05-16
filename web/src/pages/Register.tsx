import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AuthLayout } from '../components/brand/AuthLayout';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from '@shared/validators/auth.rules';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameVal = useMemo(() => validateFullName(name, touched.name), [name, touched.name]);
  const emailVal = useMemo(() => validateEmail(email, touched.email), [email, touched.email]);
  const passwordVal = useMemo(
    () => validatePassword(password, touched.password),
    [password, touched.password],
  );

  const isFormValid =
    nameVal.status === 'valid' && emailVal.status === 'valid' && passwordVal.status === 'valid';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    setSubmitError('');

    if (!isFormValid) return;

    setLoading(true);
    try {
      await register(name.trim().replace(/\s+/g, ' '), email.trim().toLowerCase(), password);
      navigate('/');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Crear tu cuenta" subtitle="Únete a ASCENDX AI — tu Life OS personal">
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

          {submitError ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300" role="alert">
              {submitError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full brand-btn-primary disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

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