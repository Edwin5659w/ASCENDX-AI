import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1033] to-[#0a0a0f] p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-white mb-2">Crear cuenta</h1>
        <p className="text-center text-zinc-500 mb-8">Empieza tu ascenso hoy</p>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#14141f] p-8 space-y-4">
          <input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#1c1c2e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
            {loading ? 'Creando...' : 'Registrarse'}
          </button>
          <p className="text-center text-zinc-500 text-sm">
            ¿Ya tienes cuenta? <Link to="/login" className="text-violet-400">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
