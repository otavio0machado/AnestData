import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, senha);
      navigate('/');
    } catch {
      setError('Email ou senha inválidos.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800">Anest<span className="text-primary-500">Data</span></h1>
          <p className="text-gray-500 mt-2 text-sm">Sistema de Gestão de Boletins Anestésicos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-base mt-2"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
          <div className="font-medium text-gray-600 mb-2">Acessos de demonstração:</div>
          <div>Admin: <span className="font-mono">admin@anestesio.com</span> / <span className="font-mono">admin123</span></div>
          <div>Médico: <span className="font-mono">dr.silva@anestesio.com</span> / <span className="font-mono">medico123</span></div>
        </div>
      </div>
    </div>
  );
}
