import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1033] to-[#0a0a0f] p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white tracking-widest mb-2">ASCENDX</h1>
        <p className="text-center text-zinc-500 mb-8">Tu Life OS con inteligencia artificial</p>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-[#14141f] p-8 space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
          <p className="text-center text-zinc-500 text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
