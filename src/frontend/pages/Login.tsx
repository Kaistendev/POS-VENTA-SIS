import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, ArrowLeft, ShieldQuestion, KeyRound, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { User as UserType } from '../../shared/types';
import logoImg from '../assets/tienda.png';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

type AuthStep = 'login' | 'forgot-username' | 'forgot-question' | 'forgot-reset' | 'forgot-done';

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
          if (result.locked) {
            const minutes = Math.ceil((result.lockoutRemainingMs || 0) / 60000);
            setError(`Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutes} minuto${minutes > 1 ? 's' : ''}.`);
          } else {
            setError(result.error || result.message || 'Credenciales inválidas');
          }
        }
      } else {
        setError('Error de conexión con el sistema');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    }
    setLoading(false);
  };

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await window.api.getSecurityQuestion(recoveryUsername);
      if (result.success && result.question) {
        setSecurityQuestion(result.question);
        setStep('forgot-question');
      } else {
        setError(result.error || 'No se pudo recuperar la pregunta de seguridad');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    }
    setLoading(false);
  };

  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await window.api.verifySecurityAnswer(recoveryUsername, securityAnswer);
      if (result.success && result.token) {
        setRecoveryToken(result.token);
        setStep('forgot-reset');
      } else {
        setError(result.error || 'Respuesta incorrecta');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    try {
      const result = await window.api.resetPassword(recoveryToken, newPassword);
      if (result.success) {
        setStep('forgot-done');
      } else {
        setError(result.error || 'Error al restablecer la contraseña');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    }
    setLoading(false);
  };

  const backToLogin = () => {
    setStep('login');
    setError('');
    setRecoveryUsername('');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setRecoveryToken('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1040]/40 via-[#0a0a0f] to-[#0a0a0f] relative overflow-hidden">
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#6d28d9]/15 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#0891b2]/10 rounded-full blur-[150px] pointer-events-none"></div>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#13131f]/95 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-[#2a2a45]/60 shadow-[0_0_60px_-15px_rgba(109,40,217,0.3)]">

          {step === 'login' && (
            <>
              <div className="flex flex-col items-center justify-center mb-10">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                  <img src={logoImg} alt="InventarioPOS" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#e2e8f0] mb-1">Bienvenido</h1>
                <p className="text-[#64748b] text-sm">Ingresa a tu cuenta de InventarioPOS</p>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-sm text-center shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]">
                  {error}
                </div>
              )}

              <div className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs text-center">
                Demo: <span className="font-semibold">admin</span> / <span className="font-semibold">Admin123!</span>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#94a3b8] ml-1">Usuario</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="usuario"
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

              <button
                onClick={() => { setStep('forgot-username'); setError(''); }}
                className="w-full mt-4 text-sm text-[#64748b] hover:text-[#a78bfa] transition-colors text-center cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}

          {step === 'forgot-username' && (
            <>
              <div className="flex items-center gap-3 mb-8">
                <button onClick={backToLogin} className="text-[#64748b] hover:text-[#e2e8f0] transition-colors cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                <div>
                  <h2 className="text-xl font-bold text-[#e2e8f0]">Recuperar contraseña</h2>
                  <p className="text-[#64748b] text-sm">Ingresa tu nombre de usuario</p>
                </div>
              </div>
              {error && <div className="mb-6 p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-sm text-center">{error}</div>}
              <form onSubmit={handleForgotUsername} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#94a3b8] ml-1">Usuario</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
                    <input type="text" value={recoveryUsername} onChange={(e) => setRecoveryUsername(e.target.value)} placeholder="tu usuario" required
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-xl py-3 pl-12 pr-4 text-[#e2e8f0] outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all placeholder:text-[#475569] shadow-inner" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#6d28d9] hover:bg-[#7c3aed] text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-[#6d28d9]/25 flex items-center justify-center border border-[#6d28d9]/50 disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuar'}
                </button>
              </form>
            </>
          )}

          {step === 'forgot-question' && (
            <>
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => { setStep('forgot-username'); setError(''); }} className="text-[#64748b] hover:text-[#e2e8f0] transition-colors cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                <div>
                  <h2 className="text-xl font-bold text-[#e2e8f0]">Pregunta de seguridad</h2>
                  <p className="text-[#64748b] text-sm">Responde para verificar tu identidad</p>
                </div>
              </div>
              {error && <div className="mb-6 p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-sm text-center">{error}</div>}
              <form onSubmit={handleVerifyAnswer} className="space-y-5">
                <div className="p-4 rounded-xl bg-[#1a1a2e]/60 border border-[#2a2a45]/50">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldQuestion className="w-4 h-4 text-[#a78bfa]" />
                    <span className="text-sm text-[#94a3b8]">Pregunta de seguridad</span>
                  </div>
                  <p className="text-[#e2e8f0] font-medium">{securityQuestion}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#94a3b8] ml-1">Respuesta</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
                    <input type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} placeholder="tu respuesta" required autoFocus
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-xl py-3 pl-12 pr-4 text-[#e2e8f0] outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all placeholder:text-[#475569] shadow-inner" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#6d28d9] hover:bg-[#7c3aed] text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-[#6d28d9]/25 flex items-center justify-center border border-[#6d28d9]/50 disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar'}
                </button>
              </form>
            </>
          )}

          {step === 'forgot-reset' && (
            <>
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => { setStep('forgot-question'); setError(''); }} className="text-[#64748b] hover:text-[#e2e8f0] transition-colors cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                <div>
                  <h2 className="text-xl font-bold text-[#e2e8f0]">Nueva contraseña</h2>
                  <p className="text-[#64748b] text-sm">Ingresa tu nueva contraseña</p>
                </div>
              </div>
              {error && <div className="mb-6 p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-sm text-center">{error}</div>}
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#94a3b8] ml-1">Nueva contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-xl py-3 pl-12 pr-4 text-[#e2e8f0] outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all placeholder:text-[#475569] shadow-inner" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#94a3b8] ml-1">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-xl py-3 pl-12 pr-4 text-[#e2e8f0] outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all placeholder:text-[#475569] shadow-inner" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#6d28d9] hover:bg-[#7c3aed] text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-[#6d28d9]/25 flex items-center justify-center border border-[#6d28d9]/50 disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Restablecer contraseña'}
                </button>
              </form>
            </>
          )}

          {step === 'forgot-done' && (
            <>
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/30">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-[#e2e8f0] mb-1">Contraseña restablecida</h2>
                <p className="text-[#64748b] text-sm text-center">Tu contraseña ha sido actualizada exitosamente.</p>
              </div>
              <button onClick={backToLogin}
                className="w-full bg-[#6d28d9] hover:bg-[#7c3aed] text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-[#6d28d9]/25 flex items-center justify-center border border-[#6d28d9]/50">
                Iniciar Sesión
              </button>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
}
