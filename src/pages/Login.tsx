import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package2, Lock, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { User as UserType } from '../common/types';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Usar IPC si está disponible, de lo contrario mock
      if (window.api && window.api.login) {
        const result = await window.api.login(username, password);
        if (result.success) {
          onLogin(result.user);
          navigate('/dashboard');
        } else {
          setError(result.error || result.message || 'Credenciales inválidas');
        }
      } else {
        // Mock de autenticación para desarrollo UI
        setTimeout(() => {
          if (username === 'admin' && password === 'admin') {
            onLogin({ id: 1, username: 'admin', role: 'ADMIN', password_hash: '' } as UserType);
            navigate('/dashboard');
          } else {
            setError('Usuario o contraseña incorrectos (Mock: admin/admin)');
          }
          setLoading(false);
        }, 1000);
        return; // Retornar temprano para que el timeout maneje el loading
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background relative overflow-hidden">
      
      {/* Elementos decorativos */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 dark:border-[#2e303a]/50 shadow-2xl">
          
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
              <Package2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Bienvenido</h1>
            <p className="text-gray-400 text-sm">Ingresa a tu cuenta de InventarioPOS</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Usuario</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full bg-[#1f2028] border border-[#2e303a] rounded-xl py-3 pl-12 pr-4 text-gray-200 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#1f2028] border border-[#2e303a] rounded-xl py-3 pl-12 pr-4 text-gray-200 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 flex items-center justify-center border border-primary/50 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
            </button>
          </form>

        </div>
      </motion.div>
    </div>
  );
}
