import { useState, useEffect } from 'react';
import { RefreshCw, Wallet, Calendar, Eye, Download, X, Banknote, CreditCard, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DataTable from '../components/ui/DataTable.tsx';

export default function CashHistory() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegister, setSelectedRegister] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(registers.length / itemsPerPage));
  const paginatedRegisters = registers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const data = await window.api.getAllRegisters();
        setRegisters(data || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetails = async (register: any) => {
    setSelectedRegister(register);
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDailySummary(null);
    try {
      if (window.api) {
        const [details, summary] = await Promise.all([
          window.api.getRegisterDetails(register.id),
          window.api.getDailySummary(register.id),
        ]);
        setSelectedRegister(details);
        setDailySummary(summary);
      }
    } catch (error) {
      console.error(error);
    }
    setDetailLoading(false);
  };

  const handleDownloadReport = async (registerId: number) => {
    try {
      if (window.api) {
        await window.api.generateCashClose(registerId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const styles: Record<string, string> = {
      PERFECT: 'bg-green-500/20 text-green-400',
      SURPLUS: 'bg-blue-500/20 text-blue-400',
      MISSING: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${styles[status] || ''}`}>
        {status === 'PERFECT' ? '✓ Cuadrado' : status === 'SURPLUS' ? '➕ Sobra' : '➖ Falta'}
      </span>
    );
  };

  const getPaymentSummary = () => {
    if (!dailySummary?.salesByPayment) return { cash: 0, card: 0, cashCount: 0, cardCount: 0 };
    const cash = dailySummary.salesByPayment.find((s: any) => s.payment_method === 'CASH');
    const card = dailySummary.salesByPayment.find((s: any) => s.payment_method === 'CARD');
    return {
      cash: cash?._sum?.total || 0,
      card: card?._sum?.total || 0,
      cashCount: cash?._count?.id || 0,
      cardCount: card?._count?.id || 0,
    };
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Historial de Caja</h2>
          <p className="text-gray-400 mt-1">Auditoría de cierres de caja registradora</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <DataTable
        columns={[
          { header: 'ID', render: (r) => <span className="font-medium text-white">#{r.id}</span> },
          { header: 'Fecha Apertura', render: (r) => (
            <div className="flex items-center italic text-gray-400">
              <Calendar className="w-3 h-3 mr-2 text-primary/60" />
              {formatDate(r.opened_at)}
            </div>
          )},
          { header: 'Fondo Inicial', render: (r) => <span className="text-green-400 font-medium">{formatCurrency(r.opening_amount)}</span> },
          { header: 'Ventas Totales', render: (r) => <span className="text-primary font-medium">{formatCurrency(r.total_sales)}</span> },
          { header: 'Esperado', render: (r) => <span className="text-white font-medium">{formatCurrency(Number(r.opening_amount) + Number(r.total_sales))}</span> },
          { header: 'Estado', render: (r) => getStatusBadge(r.status) },
          { header: 'Acciones', headerClassName: 'text-right', className: 'text-right', render: (r) => (
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleViewDetails(r)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg" title="Ver detalle">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => handleDownloadReport(r.id)} className="p-2 text-primary hover:bg-primary/10 rounded-lg" title="Descargar reporte PDF">
                <Download className="w-4 h-4" />
              </button>
            </div>
          )},
        ]}
        data={paginatedRegisters}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage="No hay registros"
        emptyDescription="No hay historial de cajas registradas"
        emptyIcon={<Wallet className="w-8 h-8" />}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={registers.length}
        onPageChange={setCurrentPage}
      />

      <AnimatePresence>
        {isDetailOpen && selectedRegister && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1f2028] border border-[#2e303a] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white">Detalle de Caja #{selectedRegister.id}</h3>
                  <p className="text-xs text-gray-500">
                    Abierta: {formatDate(selectedRegister.opened_at)}
                    {selectedRegister.closed_at && ` — Cerrada: ${formatDate(selectedRegister.closed_at)}`}
                  </p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {detailLoading ? (
                  <div className="text-center text-gray-500 py-10">Cargando detalle...</div>
                ) : (
                  <>
                    {/* Resumen */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-500 block uppercase mb-1">Fondo Inicial</span>
                        <span className="text-lg font-bold text-green-400">{formatCurrency(selectedRegister.opening_amount)}</span>
                      </div>
                      <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-500 block uppercase mb-1">Ventas Totales</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(selectedRegister.total_sales)}</span>
                      </div>
                      <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-500 block uppercase mb-1">Esperado (Fondo + Ventas)</span>
                        <span className="text-lg font-bold text-white">{formatCurrency(Number(selectedRegister.opening_amount) + Number(selectedRegister.total_sales))}</span>
                      </div>
                      <div className={`p-4 rounded-2xl border text-center ${selectedRegister.closing_amount != null ? (Number(selectedRegister.difference) >= 0 ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10') : 'bg-black/20 border-white/5'}`}>
                        <span className="text-[10px] text-gray-500 block uppercase mb-1">Real (Declarado)</span>
                        <span className="text-lg font-bold text-white">{selectedRegister.closing_amount != null ? formatCurrency(selectedRegister.closing_amount) : '—'}</span>
                      </div>
                      <div className={`p-4 rounded-2xl border text-center ${selectedRegister.difference != null ? (Number(selectedRegister.difference) >= 0 ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10') : 'bg-black/20 border-white/5'}`}>
                        <span className="text-[10px] text-gray-500 block uppercase mb-1">Diferencia</span>
                        <span className={`text-lg font-bold ${selectedRegister.difference != null ? (Number(selectedRegister.difference) >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>
                          {selectedRegister.difference != null ? `$${Number(selectedRegister.difference).toFixed(2)}` : '—'}
                        </span>
                      </div>
                      <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-center">
                        <span className="text-[10px] text-gray-500 block uppercase mb-1">Estado</span>
                        <div className="mt-1">{getStatusBadge(selectedRegister.status) || <span className="text-gray-500 text-xs">Sin cierre</span>}</div>
                      </div>
                    </div>

                    {/* Ventas por método de pago */}
                    {dailySummary && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl text-center">
                          <Banknote className="w-6 h-6 text-green-400 mx-auto mb-2" />
                          <span className="text-[10px] text-green-400/50 block uppercase mb-1 font-bold">Efectivo</span>
                          <span className="text-xl font-bold text-white">{formatCurrency(getPaymentSummary().cash)}</span>
                          <span className="text-xs text-gray-500 block mt-1">{getPaymentSummary().cashCount} ventas</span>
                        </div>
                        <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-center">
                          <CreditCard className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                          <span className="text-[10px] text-purple-400/50 block uppercase mb-1 font-bold">Tarjeta</span>
                          <span className="text-xl font-bold text-white">{formatCurrency(getPaymentSummary().card)}</span>
                          <span className="text-xs text-gray-500 block mt-1">{getPaymentSummary().cardCount} ventas</span>
                        </div>
                      </div>
                    )}

                    {/* Ventas del día */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Ventas Registradas ({selectedRegister.sales?.length || 0})
                      </h4>
                      {selectedRegister.sales && selectedRegister.sales.length > 0 ? (
                        <div className="space-y-2">
                          {selectedRegister.sales.map((sale: any) => (
                            <div key={sale.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500">#{sale.id}</span>
                                <span className="text-sm text-gray-300">{sale.client?.name || 'Cliente General'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sale.payment_method === 'CASH' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {sale.payment_method === 'CASH' ? 'EFECTIVO' : 'TARJETA'}
                                </span>
                                <span className="text-sm font-bold text-white">${Number(sale.total).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 text-sm py-4">No hay ventas registradas en este turno</p>
                      )}
                    </div>

                    {/* Diferencia / Auditoría */}
                    {dailySummary && (
                      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        selectedRegister.status === 'PERFECT'
                          ? 'bg-green-500/5 border-green-500/10'
                          : selectedRegister.status === 'SURPLUS'
                          ? 'bg-blue-500/5 border-blue-500/10'
                          : selectedRegister.status === 'MISSING'
                          ? 'bg-red-500/5 border-red-500/10'
                          : 'bg-gray-500/5 border-gray-500/10'
                      }`}>
                        {selectedRegister.status === 'PERFECT' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                        ) : selectedRegister.status === 'MISSING' ? (
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-white">
                            {selectedRegister.status === 'PERFECT' ? 'Cuadratura Perfecta'
                              : selectedRegister.status === 'SURPLUS' ? 'Sobra Dinero en Caja'
                              : selectedRegister.status === 'MISSING' ? 'Falta Dinero en Caja'
                              : 'Cierre no realizado'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {selectedRegister.status === 'PERFECT'
                              ? 'El monto esperado coincide exactamente con el dinero contado.'
                              : selectedRegister.status === 'MISSING'
                              ? 'Hay una diferencia negativa. Revisa las ventas y el conteo físico.'
                              : selectedRegister.status === 'SURPLUS'
                              ? 'Hay un sobrante. Verifica que todas las ventas estén registradas.'
                              : 'Esta caja no tiene un cierre registrado.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Botón descargar */}
                    <button
                      onClick={() => handleDownloadReport(selectedRegister.id)}
                      className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Reporte PDF
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
