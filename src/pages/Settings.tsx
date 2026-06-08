import { useState, useEffect } from 'react';
import { Store, Phone, MapPin, Save, TrendingUp, DollarSign, Calendar, RefreshCw, Database, Download, Upload, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/useToast.ts';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'business' | 'reports' | 'backup' | 'tax'>('business');
  const [settings, setSettings] = useState({
    business_name: 'INVENTARIO-POS',
    business_address: '',
    business_phone: '',
    business_tax_id: '',
    ticket_footer: '¡Gracias por su compra!',
    business_logo: '',
    exchange_rate_usd_ves: '0',
  });
  
  const [reportData, setReportsData] = useState<any>(null);
  const [loadingReport, setLoadingLoading] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [taxSettings, setTaxSettings] = useState({ taxRate: 0, taxType: 'none', taxIncluded: false });
  const { success, error: toastError } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      if (window.api) {
        const s = await window.api.getSettings();
        if (s && typeof s === 'object' && !('success' in s && !s.success)) {
          setSettings(prev => ({ ...prev, ...s }));
        }
        // Load tax settings
        const tax = await window.api.getTaxSettings();
        if (tax && typeof tax === 'object' && 'taxRate' in tax) {
          setTaxSettings(tax as { taxRate: number; taxType: string; taxIncluded: boolean });
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
        toastError(result.message || 'Error al guardar');
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
    if (activeTab === 'backup') loadBackups();
  }, [activeTab]);

  const loadBackups = async () => {
    setLoadingBackup(true);
    try {
      if (window.api) {
        const result = await window.api.listBackups();
        setBackups(result || []);
      }
    } catch (err) {
      console.error('Error loading backups:', err);
    }
    setLoadingBackup(false);
  };

  const handleCreateBackup = async () => {
    try {
      if (window.api) {
        const result = await window.api.createBackup();
        if (result.success) {
          success('Respaldo creado exitosamente');
          loadBackups();
        } else {
          toastError(result.message || 'Error al crear respaldo');
        }
      }
    } catch (err) {
      toastError('Error de comunicación');
    }
  };

  const handleRestoreBackup = async (backupPath: string) => {
    if (!confirm('¿Estás seguro de restaurar este respaldo? Se creará un respaldo de seguridad antes de restaurar.')) return;
    try {
      if (window.api) {
        const result = await window.api.restoreBackup(backupPath);
        if (result.success) {
          success('Respaldo restaurado. Reinicia la aplicación para ver los cambios.');
        } else {
          toastError(result.message || 'Error al restaurar');
        }
      }
    } catch (err) {
      toastError('Error de comunicación');
    }
  };

  const handleDeleteBackup = async (backupPath: string) => {
    if (!confirm('¿Estás seguro de eliminar este respaldo?')) return;
    try {
      if (window.api) {
        const result = await window.api.deleteBackup(backupPath);
        if (result.success) {
          success('Respaldo eliminado');
          loadBackups();
        } else {
          toastError(result.message || 'Error al eliminar');
        }
      }
    } catch (err) {
      toastError('Error de comunicación');
    }
  };

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
        <button 
          onClick={() => setActiveTab('backup')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'backup' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Respaldos
        </button>
        <button 
          onClick={() => setActiveTab('tax')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tax' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Impuestos
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

                <div className="col-span-full space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center">
                    <ImageIcon className="w-3 h-3 mr-2" /> Logo del Negocio
                  </label>
                  <div className="flex items-center gap-4">
                    {settings.business_logo ? (
                      <div className="relative">
                        <img src={settings.business_logo} alt="Logo" className="w-20 h-20 object-contain rounded-xl bg-white/5 border border-white/10" />
                        <button
                          type="button"
                          onClick={() => setSettings({...settings, business_logo: ''})}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null}
                    <label className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer transition-all">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">{settings.business_logo ? 'Cambiar Logo' : 'Subir Logo'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setSettings({...settings, business_logo: ev.target?.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG o JPG. Se mostrará en los comprobantes de venta.</p>
                </div>

                <div className="col-span-full space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center">
                    <DollarSign className="w-3 h-3 mr-2" /> Tasa de Cambio (USD → Bs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.exchange_rate_usd_ves}
                    onChange={(e) => setSettings({...settings, exchange_rate_usd_ves: e.target.value})}
                    placeholder="Ej: 36.50"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary transition-all"
                  />
                  <p className="text-xs text-gray-500">Precio en bolívares = Precio en USD × Tasa de cambio. Se usará en productos y ventas.</p>
                </div>
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                <Save className="w-5 h-5" /> Guardar Configuración
              </button>
            </form>
          </motion.div>
        ) : activeTab === 'reports' ? (
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
        ) : activeTab === 'backup' ? (
          /* Backup & Restore Tab */
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" /> Respaldos de Base de Datos
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">Crea y administra respaldos comprimidos de tu información</p>
                </div>
                <button
                  onClick={handleCreateBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  Crear Respaldo
                </button>
              </div>

              {loadingBackup ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.length > 0 ? backups.map((backup: any) => (
                    <div key={backup.path} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Database className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{backup.filename}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(backup.created).toLocaleString()} - {(backup.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestoreBackup(backup.path)}
                          className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                          title="Restaurar"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.path)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      No hay respaldos creados
                    </div>
                  )}
                </div>
              )}

              <div className="glass-panel p-6 rounded-3xl border border-white/5 mt-6">
                <h4 className="text-lg font-bold text-white mb-4">Información de Respaldos</h4>
                <div className="space-y-3 text-sm text-gray-400">
                  <p>• Los respaldos se guardan comprimidos (.sqlite.gz) en la carpeta del sistema</p>
                  <p>• Se crea un respaldo automático diario si no existe uno para ese día</p>
                  <p>• Al restaurar, se crea un respaldo de seguridad automáticamente</p>
                  <p className="text-yellow-400">• Después de restaurar, reinicia la aplicación para ver los cambios</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Tax Settings Tab */
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Configuración de Impuestos
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center">
                    <DollarSign className="w-3 h-3 mr-2" /> Tasa de Impuesto (%)
                  </label>
                  <input
                    type="number"
                    value={(taxSettings.taxRate * 100).toString()}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) / 100 || 0 }))}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-primary transition-all"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500">Porcentaje de impuesto a aplicar en ventas</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                    Tipo de Impuesto
                  </label>
                  <select
                    value={taxSettings.taxType}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, taxType: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-all"
                  >
                    <option value="none">Sin impuesto</option>
                    <option value="iva">IVA</option>
                    <option value="igv">IGV</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                  <input
                    type="checkbox"
                    id="taxIncluded"
                    checked={taxSettings.taxIncluded}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, taxIncluded: e.target.checked }))}
                    className="w-5 h-5 rounded border-white/20 bg-black/20 text-primary focus:ring-primary"
                  />
                  <label htmlFor="taxIncluded" className="text-sm text-gray-300 cursor-pointer">
                    El precio de venta <strong className="text-white">ya incluye impuestos</strong>
                  </label>
                </div>

                <div className="glass-panel p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <p className="text-sm text-blue-300">
                    <strong>Nota:</strong> Cuando "Precio incluye impuestos" está activado, el sistema calculará el precio base restando el impuesto. 
                    Cuando está desactivado, se añadirá el impuesto al precio base.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    try {
                      if (window.api) {
                        const result = await window.api.updateTaxSettings(
                          taxSettings.taxRate,
                          taxSettings.taxType,
                          taxSettings.taxIncluded
                        );
                        if (result.success) {
                          success('Configuración de impuestos guardada');
                        } else {
                          toastError(result.message || 'Error al guardar');
                        }
                      }
                    } catch (err) {
                      toastError('Error de comunicación');
                    }
                  }}
                  className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  Guardar Configuración de Impuestos
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
