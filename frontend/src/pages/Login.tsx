import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import api, { setToken } from '../services/api';

const Login: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.token);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-white font-bold shadow-sm">
            MS
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Municipalidad SC</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Valoración Salarial</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck size={16} /> Acceso restringido
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-medium text-muted-foreground">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:opacity-90 disabled:opacity-60 transition"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
