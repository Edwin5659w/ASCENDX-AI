import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AuthTextField } from '../components/auth/AuthTextField';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { authApi } from '../api/services';
import { validatePassword } from '@shared/validators/auth.rules';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const passwordVal = useMemo(() => validatePassword(password, touched), [password, touched]);
  const canSubmit = token.length >= 32 && passwordVal.status === 'valid';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    if (!canSubmit) return;
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1033] to-[#0a0a0f] p-4">
        <div className="max-w-md text-center text-zinc-400">
          <p className="mb-4">Enlace inválido: falta el token.</p>
          <Link to="/forgot-password" className="text-violet-400">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1033] to-[#0a0a0f] p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white tracking-widest mb-2">ASCENDX</h1>
        <p className="text-center text-zinc-500 mb-8">Nueva contraseña</p>

        {done ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center text-emerald-200 text-sm">
            Contraseña actualizada. Redirigiendo al inicio de sesión...
          </div>
        ) : (
          <form
            onSubmit={submit}
            noValidate
            className="rounded-2xl border border-white/10 bg-[#14141f] p-8 space-y-5">
            <AuthTextField
              id="new-password"
              label="Nueva contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              onBlur={() => setTouched(true)}
              validation={passwordVal}
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-white p-1">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <PasswordStrength
              checks={passwordVal.checks}
              strength={passwordVal.strength}
              visible={touched || password.length > 0}
            />
            {error ? (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold py-3 rounded-lg">
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
            <p className="text-center text-zinc-500 text-sm">
              <Link to="/login" className="text-violet-400">
                Iniciar sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
