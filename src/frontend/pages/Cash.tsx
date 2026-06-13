import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Lock, Unlock, Calculator, AlertCircle, CheckCircle2, TrendingUp, CreditCard, Banknote } from 'lucide-react';
import { useCashStore } from '../store/useStore.ts';

export default function Cash() {
  const { activeRegister, setActiveRegister } = useCashStore();
  const [loading, setLoading] = useState(true);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [closingAmount, setClosingAmount] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const loadRegister = async () => {
    setLoading(true);
    if (window.api) {
      const active = await window.api.getOpenRegister();
      setActiveRegister(active || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRegister();
  }, []);

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) return setError('Ingresa un monto válido.');

    const res = await window.api.openRegister(amount);
    if (res.success === false) {
      setError(res.message);
    } else {
      loadRegister();
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(closingAmount);
    if (isNaN(amount) || amount < 0) return setError('Ingresa el monto contado.');
    if (!activeRegister || !activeRegister.id) return setError('No hay una caja abierta.');

    const res = await window.api.closeRegister(activeRegister.id, amount);
    if (res.success === false) {
      setError(res.message);
    } else {
      setResult(res);
      setActiveRegister(null);
    }
  };

  if (loading) return <div className="p-10 text-white">Cargando estado de caja...</div>;

  return (
    <div className="h-full max-w-4xl mx-auto space-y-8 py-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white m-0">Control de Caja</h2>
          <p className="text-gray-400 mt-1">Apertura, arqueo y cierre diario</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center ${activeRegister ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {activeRegister ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}
          {activeRegister ? 'Caja Abierta' : 'Caja Cerrada'}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* RESULTADO DEL CIERRE (MOSTRAR DESPUÉS DE CERRAR) */}
        {result && !activeRegister && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-8 rounded-3xl border border-white/5 text-center space-y-6">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${result.status === 'PERFECT' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
              {result.status === 'PERFECT' ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Resumen de Cierre</h3>
              <p className="text-gray-400">Caja cerrada correctamente.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <span className="text-[10px] text-gray-500 block uppercase">Esperado</span>
                <span className="text-lg font-bold text-white">${Number(result.expected ?? 0).toFixed(2)}</span>
              </div>
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <span className="text-[10px] text-gray-500 block uppercase">Real</span>
                <span className="text-lg font-bold text-white">${Number(result.real ?? 0).toFixed(2)}</span>
              </div>
              <div className={`p-4 rounded-2xl border ${Number(result.difference ?? 0) >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <span className="text-[10px] block uppercase">Diferencia</span>
                <span className="text-lg font-bold">${Number(result.difference ?? 0).toFixed(2)}</span>
              </div>
            </div>

            <button onClick={() => setResult(null)} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 font-medium">
              Aceptar y Salir
            </button>
          </motion.div>
        )}

        {/* MODO APERTURA */}
        {!activeRegister && !result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">Abrir Turno</h3>
                <p className="text-sm text-gray-400">Ingresa el fondo inicial de caja (efectivo).</p>
              </div>

              <form onSubmit={handleOpen} className="space-y-4">
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input required type="number" step="0.01" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} placeholder="0.00" className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xl text-white outline-none focus:border-primary transition-all text-center font-bold" />
                </div>
                {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                <button type="submit" className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all">
                  Iniciar Jornada
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* MODO CIERRE / RESUMEN */}
        {activeRegister && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Resumen Izquierdo */}
            <div className="lg:col-span-3 space-y-6">
              <div className="glass-panel p-6 rounded-3xl border border-white/5 grid grid-cols-2 gap-6">
                <div className="col-span-2 p-4 bg-black/20 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-500/10 rounded-xl mr-4"><TrendingUp className="text-blue-400 w-5 h-5" /></div>
                    <div><span className="text-[10px] text-gray-500 uppercase block">Total Ventas</span><span className="text-2xl font-black text-white">${Number(activeRegister.total_sales).toFixed(2)}</span></div>
                  </div>
                  <div className="text-right"><span className="text-[10px] text-gray-500 block uppercase">Inició con</span><span className="text-sm font-medium text-gray-400">${Number(activeRegister.opening_amount).toFixed(2)}</span></div>
                </div>

                <div className="p-6 bg-green-500/5 border border-green-500/10 rounded-2xl text-center">
                  <Banknote className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <span className="text-[10px] text-green-400/50 uppercase block mb-1 font-bold">Ventas Efectivo</span>
                  <span className="text-2xl font-bold text-white">${Number(activeRegister.cash_sales || 0).toFixed(2)}</span>
                </div>

                <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-center">
                  <CreditCard className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <span className="text-[10px] text-purple-400/50 uppercase block mb-1 font-bold">Ventas Tarjeta</span>
                  <span className="text-2xl font-bold text-white">${Number(activeRegister.card_sales || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-6 bg-orange-400/5 border border-orange-400/10 rounded-3xl flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-400 shrink-0" />
                <p className="text-sm text-orange-400/80 leading-relaxed">
                  <strong>Recordatorio de Arqueo:</strong> Al cerrar, debes contar físicamente el dinero en el cajón.
                  La suma debe ser igual a: <span className="text-white font-bold underline">Fondo Inicial + Ventas Efectivo</span>. Las ventas con tarjeta no se incluyen en el conteo físico.
                </p>
              </div>
            </div>

            {/* Formulario Cierre Derecho */}
            <div className="lg:col-span-2">
              <div className="glass-panel p-8 rounded-3xl border border-white/5 sticky top-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">Arqueo de Caja</h3>
                  <p className="text-xs text-gray-500 mt-1">Ingresa el dinero físico contado actualmente en caja.</p>
                </div>

                <form onSubmit={handleClose} className="space-y-4">
                  <div className="relative">
                    <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input required type="number" step="0.01" value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} placeholder="0.00" className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xl text-white outline-none focus:border-primary transition-all text-center font-bold" />
                  </div>
                  {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                  <button type="submit" className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">
                    Cerrar Turno Ahora
                  </button>
                </form>

                <div className="pt-6 border-t border-white/5 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Abierto el {activeRegister.opened_at ? new Date(activeRegister.opened_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
