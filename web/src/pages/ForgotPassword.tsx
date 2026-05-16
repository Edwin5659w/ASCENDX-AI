import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AuthLayout } from '../components/brand/AuthLayout';
import { authApi } from '../api/services';
import { validateLoginEmail } from '@shared/validators/auth.rules';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const emailVal = useMemo(() => validateLoginEmail(email, touched), [email, touched]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    if (emailVal.status !== 'valid') return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Recuperar contraseña">
        {done ? (
          <div className="rounded-2xl border border-white/10 bg-[#14141f] p-8 space-y-4 text-center">
            <p className="text-zinc-300 mb-4">
              Si existe una cuenta con ese correo, te enviaremos instrucciones (revisa spam).
              Sin servicio de email configurado, el enlace aparece en la consola del servidor en desarrollo.
            </p>
            <Link to="/login" className="inline-block brand-gradient-text font-medium hover:opacity-90">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form
            onSubmit={submit}
            noValidate
            className="rounded-2xl border border-white/10 bg-[#14141f] p-8 space-y-5">
            <AuthTextField
              id="forgot-email"
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={setEmail}
              onBlur={() => setTouched(true)}
              validation={emailVal}
              placeholder="nombre@gmail.com"
              autoComplete="email"
            />
            {error ? (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading || emailVal.status !== 'valid'}
              className="w-full brand-btn-primary text-white font-semibold py-3 rounded-lg">
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
            <p className="text-center text-zinc-500 text-sm">
              <Link to="/login" className="text-cyan-400/90 hover:text-cyan-300">
                Volver a iniciar sesión
              </Link>
            </p>
          </form>
        )}
    </AuthLayout>
  );
}
