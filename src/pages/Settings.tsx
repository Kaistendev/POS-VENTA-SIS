import { useState, useEffect } from 'react';
import { Store, Phone, MapPin, Save, TrendingUp, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/useToast.ts';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'business' | 'reports'>('business');
  const [settings, setSettings] = useState({
    business_name: 'INVENTARIO-POS',
    business_address: '',
    business_phone: '',
    business_tax_id: '',
    ticket_footer: '¡Gracias por su compra!'
  });
  
  const [reportData, setReportsData] = useState<any>(null);
  const [loadingReport, setLoadingLoading] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      if (window.api) {
        const s = await window.api.getSettings();
        if (Object.keys(s).length > 0) {
          setSettings(prev => ({ ...prev, ...s }));
        }
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await window.api.updateSettings(settings);
      if (result.success) {
        success('Configuración guardada correctamente');
      } else {
        toastError('Error al guardar');
      }
    } catch (err) {
      toastError('Error de comunicación');
    }
  };

  const loadProfitReport = async () => {
    setLoadingLoading(true);
    try {
      if (window.api) {
        // Obtenemos estadísticas generales que ya tienen el profit calculado
        const stats = await window.api.getDashboardStats();
        setReportsData(stats);
      }
    } catch (err) {
      toastError('Error al cargar reporte');
    }
    setLoadingLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'reports') loadProfitReport();
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Ajustes y Reportes</h2>
          <p className="text-gray-400 mt-1">Configuración del ticket y análisis de ganancias</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 w-fit rounded-xl border border-white/5">
        <button 
          onClick={() => setActiveTab('business')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'business' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Datos del Negocio
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Reporte de Ganancias
        </button>
      </div>

      <div className="flex-1">
        {activeTab === 'business' ? (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl">
            <form onSubmit={handleSaveSettings} className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center">
                    <Store className="w-3 h-3 mr-2" /> Nombre del Negocio
                  </label>
                  <input 
                    value={settings.business_name}
                    onChange={(e) => setSettings({...settings, business_name: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center">
                    <Phone className="w-3 h-3 mr-2" /> Teléfono de Contacto
                  </label>
                  <input 
                    value={settings.business_phone}
                    onChange={(e) => setSettings({...settings, business_phone: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center">
                    <MapPin className="w-3 h-3 mr-2" /> Dirección Física
                  </label>
                  <input 
                    value={settings.business_address}
                    onChange={(e) => setSettings({...settings, business_address: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center">
                    Pie de Página del Ticket
                  </label>
                  <textarea 
                    rows={2}
                    value={settings.ticket_footer}
                    onChange={(e) => setSettings({...settings, ticket_footer: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                <Save className="w-5 h-5" /> Guardar Configuración
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-2">
                   <div className="p-3 bg-blue-500/10 rounded-2xl w-fit text-blue-400"><DollarSign className="w-6 h-6" /></div>
                   <p className="text-gray-500 text-xs font-bold uppercase">Ventas Totales (Hoy)</p>
                   <p className="text-3xl font-black text-white">${Number(reportData?.todayRevenue || 0).toFixed(2)}</p>
                </div>
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-2">
                   <div className="p-3 bg-green-500/10 rounded-2xl w-fit text-green-400"><TrendingUp className="w-6 h-6" /></div>
                   <p className="text-gray-500 text-xs font-bold uppercase">Ganancia Bruta (Hoy)</p>
                   <p className="text-3xl font-black text-green-400">${Number(reportData?.todayProfit || 0).toFixed(2)}</p>
                </div>
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-2">
                   <div className="p-3 bg-purple-500/10 rounded-2xl w-fit text-purple-400"><Calendar className="w-6 h-6" /></div>
                   <p className="text-gray-500 text-xs font-bold uppercase">Promedio por Venta</p>
                   <p className="text-3xl font-black text-white">${Number(reportData?.averageSale || 0).toFixed(2)}</p>
                </div>
             </div>

             <div className="glass-panel p-8 rounded-3xl border border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white">Análisis de Rentabilidad</h3>
                  <button onClick={loadProfitReport} disabled={loadingReport} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                    <RefreshCw className={`w-5 h-5 text-gray-500 ${loadingReport ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div>
                        <p className="text-white font-medium">Margen de Ganancia</p>
                        <p className="text-xs text-gray-500">Porcentaje sobre el total de ventas</p>
                      </div>
                      <p className="text-2xl font-black text-primary">
                        {reportData?.todayRevenue > 0 
                          ? ((reportData.todayProfit / reportData.todayRevenue) * 100).toFixed(1) 
                          : '0.0'}%
                      </p>
                   </div>
                   
                   <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl">
                      <p className="text-sm text-gray-300 leading-relaxed italic">
                        "La ganancia bruta se calcula restando el **precio de costo** registrado en cada producto al momento de la venta del **precio final pagado** por el cliente."
                      </p>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
