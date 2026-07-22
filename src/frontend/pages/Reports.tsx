import { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Calendar, Download, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/useToast.ts';

type ReportType = 'daily_sales' | 'sales_summary' | 'inventory' | 'low_stock' | 'top_products' | 'profit_summary' | 'sale_receipt' | 'cash_close';
type ReportFormat = 'pdf' | 'xlsx';

const reportTypes: { value: ReportType; label: string; description: string }[] = [
  { value: 'daily_sales', label: 'Ventas del Día', description: 'Listado detallado de todas las ventas realizadas' },
  { value: 'sales_summary', label: 'Resumen de Ventas', description: 'Resumen de ventas con totales por período' },
  { value: 'profit_summary', label: 'Reporte de Ganancias', description: 'Análisis de ganancia y rentabilidad' },
  { value: 'inventory', label: 'Inventario Completo', description: 'Listado de todos los productos con stock y precios' },
  { value: 'low_stock', label: 'Stock Bajo', description: 'Productos con stock por debajo del mínimo' },
  { value: 'top_products', label: 'Productos Más Vendidos', description: 'Ranking de productos con mayores ventas' },
  { value: 'sale_receipt', label: 'Comprobante de Venta', description: 'Ticket o factura detallada de una venta' },
  { value: 'cash_close', label: 'Cierre de Caja', description: 'Reporte de cierre con resumen y diferencias' },
];

export default function Reports() {
  const [type, setType] = useState<ReportType>('daily_sales');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [cashRegisters, setCashRegisters] = useState<{ id: number; opened_at: Date | string }[]>([]);
  const [fetchedRegisters, setFetchedRegisters] = useState(false);

  useEffect(() => {
    if (type === 'cash_close' && !fetchedRegisters && window.api) {
      window.api.getAllRegisters().then(data => {
        setCashRegisters(data || []);
        setFetchedRegisters(true);
      });
    }
  }, [type, fetchedRegisters]);

  const handleTypeChange = (newType: ReportType) => {
    setType(newType);
    setFetchedRegisters(false);
    const now = new Date();
    if (newType === 'daily_sales') {
      const d = now.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate('');
    } else if (newType === 'sales_summary' || newType === 'profit_summary') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = now.toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };
  const [saleId, setSaleId] = useState('');
  const [registerId, setRegisterId] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleGenerate = async () => {
    if (type === 'cash_close' && !registerId) {
      toastError('Seleccione una caja para generar el reporte de cierre');
      return;
    }
    if (type === 'sale_receipt' && !saleId) {
      toastError('Ingrese el ID de la venta para generar el comprobante');
      return;
    }
    setLoading(true);
    try {
      if (window.api) {
        const request: import('../../domain/dtos').ReportRequestDTO = {
          type,
          format,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          saleId: saleId ? parseInt(saleId) : undefined,
          registerId: registerId ? parseInt(registerId) : undefined,
        };
        const result = await window.api.generateReport(request);
        if (result.success) {
          success(`Reporte guardado en: ${result.path}`);
        } else if (result.message !== 'Cancelado por el usuario') {
          toastError(result.message || 'Error al generar reporte');
        }
      }
    } catch (err) {
      toastError('Error de comunicación');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = reportTypes.find(t => t.value === type);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Reportes</h2>
          <p className="text-gray-400 mt-1">Genera y exporta reportes del sistema</p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6">Configuración del Reporte</h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center">
                  <FileText className="w-3 h-3 mr-2" /> Tipo de Reporte
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportTypes.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => handleTypeChange(rt.value)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        type === rt.value
                          ? 'bg-primary/10 border-primary/40 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                      }`}
                    >
                      <p className="text-sm font-bold">{rt.label}</p>
                      <p className="text-[10px] mt-1 opacity-70">{rt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center">
                  <Calendar className="w-3 h-3 mr-2" /> Rango de Fechas (opcional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {type === 'sale_receipt' && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                    ID de Venta
                  </label>
                  <input
                    type="number"
                    value={saleId}
                    onChange={(e) => setSaleId(e.target.value)}
                    placeholder="Ej: 123"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary transition-all"
                  />
                </div>
              )}

              {type === 'cash_close' && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center">
                    <Wallet className="w-3 h-3 mr-2" /> Caja
                  </label>
                  <select
                    value={registerId}
                    onChange={(e) => setRegisterId(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Seleccione una caja...</option>
                    {cashRegisters.map(r => (
                      <option key={r.id} value={r.id}>
                        #{r.id} — {new Date(r.opened_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6">Formato</h3>

            <div className="space-y-3">
              <button
                onClick={() => setFormat('pdf')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  format === 'pdf'
                    ? 'bg-red-500/10 border-red-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <FileText className={`w-6 h-6 ${format === 'pdf' ? 'text-red-400' : ''}`} />
                <div className="text-left">
                  <p className="text-sm font-bold">PDF</p>
                  <p className="text-[10px] opacity-70">Documento portátil</p>
                </div>
              </button>

              <button
                onClick={() => setFormat('xlsx')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  format === 'xlsx'
                    ? 'bg-green-500/10 border-green-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <FileSpreadsheet className={`w-6 h-6 ${format === 'xlsx' ? 'text-green-400' : ''}`} />
                <div className="text-left">
                  <p className="text-sm font-bold">Excel</p>
                  <p className="text-[10px] opacity-70">Hoja de cálculo (.xlsx)</p>
                </div>
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Reporte seleccionado</p>
                <p className="text-white font-bold">{selectedType?.label}</p>
                <p className="text-[10px] text-gray-500 mt-1">{selectedType?.description}</p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {loading ? 'Generando...' : 'Generar y Guardar'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
