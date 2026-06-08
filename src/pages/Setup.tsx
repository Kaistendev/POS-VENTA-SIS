import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, User, CheckCircle2, ArrowLeft, ArrowRight, Building2, Smartphone, DollarSign, Printer, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { validatePassword } from '../common/validation.js';

type Step = 'business' | 'admin' | 'confirm';

const SECURITY_QUESTIONS = [
  '¿Cuál es el nombre de tu primera mascota?',
  '¿Cuál es el nombre de tu ciudad natal?',
  '¿Cuál es el nombre de tu mejor amigo de la infancia?',
  '¿Cuál es tu comida favorita?',
  '¿Cuál es el nombre de tu profesor favorito?',
  '¿Cuál es tu película favorita?',
  '¿Cuál es el modelo de tu primer auto?',
];

interface SetupData {
  business_name: string;
  business_address: string;
  business_phone: string;
  ticket_footer: string;
  exchange_rate_usd_ves: string;
  username: string;
  password: string;
  security_question: string;
  security_answer: string;
}

export default function Setup({ onComplete }: { onComplete: (user?: any) => void }) {
  const [step, setStep] = useState<Step>('business');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<SetupData>({
    business_name: '',
    business_address: '',
    business_phone: '',
    ticket_footer: 'Gracias por su compra!',
    exchange_rate_usd_ves: '0',
    username: '',
    password: '',
    security_question: '',
    security_answer: '',
  });

  const update = (field: keyof SetupData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateBusiness = () => {
    if (!data.business_name.trim()) {
      setError('El nombre del negocio es obligatorio');
      return false;
    }
    return true;
  };

  const validateAdmin = () => {
    if (!data.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      return false;
    }
    if (data.username.trim().length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return false;
    }
    if (!data.password) {
      setError('La contraseña es obligatoria');
      return false;
    }
    const pwCheck = validatePassword(data.password);
    if (!pwCheck.valid) {
      setError(pwCheck.error);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (!window.api) {
        setError('API no disponible');
        setLoading(false);
        return;
      }
      const result = await window.api.completeSetup({
        user: { 
          username: data.username.trim(), 
          password: data.password,
          ...(data.security_question && data.security_answer ? { security_question: data.security_question, security_answer: data.security_answer } : {}),
        },
        settings: {
          business_name: data.business_name.trim(),
          business_address: data.business_address.trim(),
          business_phone: data.business_phone.trim(),
          ticket_footer: data.ticket_footer.trim(),
          exchange_rate_usd_ves: data.exchange_rate_usd_ves,
        },
      });
      if (result.success) {
        onComplete(result.user);
      } else {
        setError(result.message || 'Error al guardar la configuración');
      }
    } catch (err: any) {
      setError(err.message || 'Error de comunicación');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'business' as const, icon: Building2, label: 'Negocio' },
    { key: 'admin' as const, icon: User, label: 'Admin' },
    { key: 'confirm' as const, icon: CheckCircle2, label: 'Confirmar' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1040]/40 via-[#0a0a0f] to-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-150px] left-[-150px] w-[400px] h-[400px] bg-[#6d28d9]/15 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] bg-[#0891b2]/10 rounded-full blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-[#13131f]/95 backdrop-blur-xl rounded-2xl p-8 border border-[#2a2a45]/60 shadow-[0_0_60px_-15px_rgba(109,40,217,0.3)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-[#6d28d9]/20 border border-[#6d28d9]/30 shadow-[0_0_15px_-5px_rgba(109,40,217,0.3)]">
              <Store className="w-6 h-6 text-[#a78bfa]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#e2e8f0]">Configuracion Inicial</h1>
              <p className="text-xs text-[#64748b] mt-0.5">Bienvenido a InventarioPOS</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => {
              const active = step === s.key;
              const done = steps.findIndex(x => x.key === step) > i;
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active ? 'bg-[#6d28d9]/25 text-[#a78bfa] border border-[#6d28d9]/40 shadow-[0_0_15px_-3px_rgba(109,40,217,0.3)]' :
                    done ? 'bg-[#059669]/20 text-[#34d399] border border-[#059669]/30' :
                    'bg-[#1e1e32]/80 text-[#475569] border border-[#2a2a45]'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-6 h-px ${done ? 'bg-[#059669]/40' : 'bg-[#2a2a45]'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {step === 'business' && (
              <motion.div key="business" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-lg font-semibold text-[#e2e8f0] mb-1">Informacion del Negocio</h2>
                <p className="text-xs text-[#64748b] mb-6">Datos que apareceran en tus tickets y reportes</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                      <Building2 className="w-3.5 h-3.5 inline mr-1.5 text-[#a78bfa]" />
                      Nombre del Negocio <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={data.business_name}
                      onChange={e => update('business_name', e.target.value)}
                      placeholder="Ej: Mi Tienda"
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Direccion</label>
                    <input
                      value={data.business_address}
                      onChange={e => update('business_address', e.target.value)}
                      placeholder="Direccion del negocio"
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                      <Smartphone className="w-3.5 h-3.5 inline mr-1.5 text-[#a78bfa]" />
                      Telefono
                    </label>
                    <input
                      value={data.business_phone}
                      onChange={e => update('business_phone', e.target.value)}
                      placeholder="Numero de telefono"
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                      <Printer className="w-3.5 h-3.5 inline mr-1.5 text-[#a78bfa]" />
                      Pie de Ticket
                    </label>
                    <input
                      value={data.ticket_footer}
                      onChange={e => update('ticket_footer', e.target.value)}
                      placeholder="Gracias por su compra!"
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                      <DollarSign className="w-3.5 h-3.5 inline mr-1.5 text-[#a78bfa]" />
                      Tasa Bs. (USD a VES)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={data.exchange_rate_usd_ves}
                      onChange={e => update('exchange_rate_usd_ves', e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

                <button
                  onClick={() => { if (validateBusiness()) setStep('admin'); }}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-[#6d28d9] hover:bg-[#7c3aed] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#6d28d9]/25 border border-[#6d28d9]/50"
                >
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 'admin' && (
              <motion.div key="admin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-lg font-semibold text-[#e2e8f0] mb-1">Usuario Administrador</h2>
                <p className="text-xs text-[#64748b] mb-6">Crea el primer usuario con acceso completo al sistema</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                      <User className="w-3.5 h-3.5 inline mr-1.5 text-[#a78bfa]" />
                      Nombre de Usuario <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={data.username}
                      onChange={e => update('username', e.target.value)}
                      placeholder="admin"
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 text-[#a78bfa]" />
                      Contrasena <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={data.password}
                      onChange={e => update('password', e.target.value)}
                      placeholder="Minimo 6 caracteres"
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all shadow-inner"
                    />
                  </div>
                  <hr className="border-[#2a2a45]" />
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                      <ShieldQuestion className="w-3.5 h-3.5 inline mr-1.5 text-[#a78bfa]" />
                      Pregunta de Seguridad (opcional)
                    </label>
                    <select
                      value={data.security_question}
                      onChange={e => update('security_question', e.target.value)}
                      className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all shadow-inner"
                    >
                      <option value="">Sin pregunta de seguridad</option>
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  {data.security_question && (
                    <div>
                      <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Respuesta <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={data.security_answer}
                        onChange={e => update('security_answer', e.target.value)}
                        placeholder="tu respuesta"
                        className="w-full bg-[#0f0f1a] border border-[#2a2a45] rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#6d28d9]/60 focus:ring-1 focus:ring-[#6d28d9]/40 transition-all shadow-inner"
                      />
                    </div>
                  )}
                </div>

                {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep('business')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1e1e32]/80 hover:bg-[#2a2a45]/80 text-[#e2e8f0] rounded-xl text-sm font-bold transition-all border border-[#2a2a45]"
                  >
                    <ArrowLeft className="w-4 h-4" /> Atras
                  </button>
                  <button
                    onClick={() => { if (validateAdmin()) setStep('confirm'); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#6d28d9] hover:bg-[#7c3aed] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#6d28d9]/25 border border-[#6d28d9]/50"
                  >
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-lg font-semibold text-[#e2e8f0] mb-1">Resumen</h2>
                <p className="text-xs text-[#64748b] mb-6">Revisa los datos antes de finalizar</p>

                <div className="space-y-4">
                  <div className="bg-[#0f0f1a] rounded-xl p-4 border border-[#2a2a45]">
                    <h3 className="text-xs font-semibold text-[#a78bfa] uppercase tracking-wider mb-3">Negocio</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Nombre</span>
                        <span className="text-[#e2e8f0] font-medium">{data.business_name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Direccion</span>
                        <span className="text-[#e2e8f0] font-medium">{data.business_address || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Telefono</span>
                        <span className="text-[#e2e8f0] font-medium">{data.business_phone || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Tasa Bs.</span>
                        <span className={parseFloat(data.exchange_rate_usd_ves) > 0 ? 'text-[#34d399] font-medium' : 'text-[#64748b]'}>{parseFloat(data.exchange_rate_usd_ves) > 0 ? `${parseFloat(data.exchange_rate_usd_ves).toFixed(2)} Bs/USD` : 'No configurada'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0f0f1a] rounded-xl p-4 border border-[#2a2a45]">
                    <h3 className="text-xs font-semibold text-[#34d399] uppercase tracking-wider mb-3">Administrador</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Usuario</span>
                        <span className="text-[#e2e8f0] font-medium">{data.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Rol</span>
                        <span className="text-[#fbbf24] font-medium">ADMIN</span>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep('admin')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1e1e32]/80 hover:bg-[#2a2a45]/80 text-[#e2e8f0] rounded-xl text-sm font-bold transition-all border border-[#2a2a45]"
                  >
                    <ArrowLeft className="w-4 h-4" /> Atras
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#059669] hover:bg-[#10b981] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#059669]/25 border border-[#059669]/50 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Finalizar</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
