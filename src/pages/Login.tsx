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
      if (window.api && window.api.login) {
        const result = await window.api.login(username, password);
        if (result.success) {
          onLogin(result.user);
          navigate('/dashboard');
        } else {
          setError(result.error || result.message || 'Credenciales inválidas');
        }
      } else {
        setTimeout(() => {
          if (username === 'admin' && password === 'admin') {
            onLogin({ id: 1, username: 'admin', role: 'ADMIN', password_hash: '' } as UserType);
            navigate('/dashboard');
          } else {
            setError('Usuario o contraseña incorrectos (Mock: admin/admin)');
          }
          setLoading(false);
        }, 1000);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1040]/40 via-[#0a0a0f] to-[#0a0a0f] relative overflow-hidden">
      
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#6d28d9]/15 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#0891b2]/10 rounded-full blur-[150px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#13131f]/95 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-[#2a2a45]/60 shadow-[0_0_60px_-15px_rgba(109,40,217,0.3)]">
          
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="w-16 h-16 bg-[#6d28d9]/20 rounded-2xl flex items-center justify-center mb-4 border border-[#6d28d9]/30 shadow-[0_0_20px_-5px_rgba(109,40,217,0.3)]">
              <Package2 className="w-8 h-8 text-[#a78bfa]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#e2e8f0] mb-1">Bienvenido</h1>
            <p className="text-[#64748b] text-sm">Ingresa a tu cuenta de InventarioPOS</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-sm text-center shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#94a3b8] ml-1">Usuario</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-xl py-3 pl-12 pr-4 text-[#e2e8f0] outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all placeholder:text-[#475569] shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#94a3b8] ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-xl py-3 pl-12 pr-4 text-[#e2e8f0] outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all placeholder:text-[#475569] shadow-inner"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-8 bg-[#6d28d9] hover:bg-[#7c3aed] text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-[#6d28d9]/25 flex items-center justify-center border border-[#6d28d9]/50 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
            </button>
          </form>

        </div>
      </motion.div>
    </div>
  );
}
