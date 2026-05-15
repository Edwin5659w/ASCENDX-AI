import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthTextField } from '../components/auth/AuthTextField';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1033] to-[#0a0a0f] p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white tracking-widest mb-2">ASCENDX</h1>
        <p className="text-center text-zinc-500 mb-8">Recuperar contraseña</p>

        {done ? (
          <div className="rounded-2xl border border-white/10 bg-[#14141f] p-8 space-y-4 text-center">
            <p className="text-zinc-300 text-sm leading-relaxed">
              Si existe una cuenta con ese correo, puedes restablecer la contraseña con el enlace que
              generamos.
            </p>
            <p className="text-zinc-500 text-xs">
              En modo desarrollo, revisa la consola del servidor backend: verás la URL completa con el
              token.
            </p>
            <Link to="/login" className="inline-block text-violet-400 hover:text-violet-300 font-medium">
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
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold py-3 rounded-lg">
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
            <p className="text-center text-zinc-500 text-sm">
              <Link to="/login" className="text-violet-400 hover:text-violet-300">
                Volver a iniciar sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
