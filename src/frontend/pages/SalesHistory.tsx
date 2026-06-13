import { useState, useEffect } from 'react';
import { Search, Calendar, Eye, Trash2, ArrowLeft, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../hooks/useToast.ts';
import { Sale } from '../../shared/types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import DataTable from '../components/ui/DataTable.tsx';

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [taxSettings, setTaxSettings] = useState<{ taxRate: number; taxType: string; taxIncluded: boolean }>({ taxRate: 0, taxType: 'none', taxIncluded: false });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const { success, error: toastError } = useToast();

  const fetchSales = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const [data, settings, tax] = await Promise.all([
            window.api.getAllSales(),
            window.api.getSettings(),
            window.api.getTaxSettings()
        ]);
        setSales(data || []);
        setBusinessInfo(settings);
        setTaxSettings(tax || { taxRate: 0, taxType: 'none', taxIncluded: false });
      }
    } catch (err) {
      toastError('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleShowDetail = async (id: number) => {
    try {
      const details = await window.api.getSaleDetails(id);
      setSelectedSale(details);
      setIsDetailOpen(true);
    } catch (err) {
      toastError('No se pudieron obtener los detalles');
    }
  };

  const handleCancelSale = async (id: number) => {
    const confirm = await window.api.showConfirmDialog({ message: '¿Estás seguro de que deseas anular esta venta? El stock será devuelto y el total se restará de la caja.' });
    if (!confirm) return;
    
    try {
      const result = await window.api.cancelSale(id);
      if (result.success) {
        success('Venta anulada correctamente');
        fetchSales();
        setIsDetailOpen(false);
      } else {
        toastError(result.message || 'Error al anular');
      }
    } catch (err) {
      toastError('Error de comunicación');
    }
  };

  const downloadTicket = (sale: any) => {
    const rate = sale.exchange_rate || 0;
    const extraLines = rate > 0 ? sale.items.length + 3 : 0;
    const doc = new jsPDF({ unit: 'mm', format: [80, 150 + extraLines * 3] });
    const bizName = businessInfo?.business_name || 'INVENTARIO-POS';
    const bizAddress = businessInfo?.business_address || '';
    const bizPhone = businessInfo?.business_phone || '';
    const footer = businessInfo?.ticket_footer || '¡Gracias por su compra!';
    const taxAmt = sale.tax_amount || 0;
    const subtotal = sale.subtotal || sale.total;

    doc.setFontSize(12);
    doc.text(bizName, 40, 10, { align: 'center' });
    doc.setFontSize(7);
    if (bizAddress) {
      doc.text(bizAddress, 40, 14, { align: 'center' });
    }
    if (bizPhone) {
      doc.text(`Tel: ${bizPhone}`, 40, 17, { align: 'center' });
    }

    doc.setFontSize(8);
    doc.text(`Ticket: #${sale.id} (REIMPRESIÓN)`, 5, 25);
    doc.text(`Fecha: ${new Date(sale.created_at!).toLocaleString()}`, 5, 30);
    doc.text(`Cliente: ${sale.client?.name || 'Cliente General'}`, 5, 35);
    if (rate > 0) {
      doc.text(`Tasa Bs.: ${rate.toFixed(2)}`, 5, 40);
    }
    doc.text('------------------------------------------', 5, rate > 0 ? 45 : 40);

    let y = rate > 0 ? 50 : 45;
    sale.items.forEach((item: any) => {
      doc.text(`${item.quantity} x ${item.product?.name || 'Producto'}`, 5, y);
      doc.text(`$${(item.unit_price * item.quantity).toFixed(2)}`, 75, y, { align: 'right' });
      y += 5;
    });

    doc.text('------------------------------------------', 5, y + 2);
    doc.setFontSize(9);
    doc.text(`Subtotal:`, 5, y + 8);
    doc.text(`$${subtotal.toFixed(2)}`, 75, y + 8, { align: 'right' });
    if (taxAmt > 0) {
      doc.text(`${taxSettings.taxType.toUpperCase()} (${taxSettings.taxRate * 100}%):`, 5, y + 13);
      doc.text(`$${taxAmt.toFixed(2)}`, 75, y + 13, { align: 'right' });
    }
    doc.setFontSize(10);
    doc.text(`TOTAL: $${sale.total.toFixed(2)}`, 75, taxAmt > 0 ? y + 20 : y + 15, { align: 'right' });
    if (rate > 0) {
      doc.setFontSize(8);
      doc.text(`Tasa Bs. ${rate.toFixed(2)} = Bs. ${(sale.total * rate).toFixed(2)}`, 5, (taxAmt > 0 ? y + 20 : y + 15) + 5);
    }
    doc.setFontSize(8);
    doc.text(footer, 40, (taxAmt > 0 ? y + 28 : y + 23) + (rate > 0 ? 5 : 0), { align: 'center' });
    doc.save(`Ticket_Reimpresion_${sale.id}.pdf`);
  };

  const filteredSales = sales.filter(s => 
    s.id?.toString().includes(searchTerm) || 
    (s.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage));
  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      header: 'ID',
      render: (sale: Sale) => <span className="font-medium text-white">#{sale.id}</span>,
    },
    {
      header: 'Fecha',
      render: (sale: Sale) => (
        <div className="flex items-center italic">
          <Calendar className="w-3 h-3 mr-2 text-primary/60" />
          {new Date(sale.created_at!).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </div>
      ),
    },
    {
      header: 'Cliente',
      render: (sale: Sale) => <span className="text-gray-300">{sale.client?.name || 'Cliente General'}</span>,
    },
    {
      header: 'Método',
      render: (sale: Sale) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sale.payment_method === 'CASH' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
          {sale.payment_method === 'CASH' ? 'EFECTIVO' : 'TARJETA'}
        </span>
      ),
    },
    {
      header: 'Total',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (sale: Sale) => <span className="font-bold text-white">${sale.total.toFixed(2)}</span>,
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (sale: Sale) => (
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleShowDetail(sale.id!)} className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors" title="Ver Detalles">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">Historial de Ventas</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por ID o cliente..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="bg-[#1f2028] border border-[#2e303a] rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedSales}
        keyExtractor={(sale) => sale.id!}
        loading={loading}
        emptyMessage="No se encontraron ventas"
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredSales.length}
        onPageChange={setCurrentPage}
      />

      {/* Modal de Detalle */}
      <AnimatePresence>
        {isDetailOpen && selectedSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1f2028] border border-[#2e303a] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white">Detalle de Venta #{selectedSale.id}</h3>
                  <p className="text-xs text-gray-500">{new Date(selectedSale.created_at!).toLocaleString()}</p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Productos</h4>
                  <div className="space-y-2">
                    {selectedSale.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{item.product?.name || 'Producto Desconocido'}</span>
                          <span className="text-[10px] text-gray-500">{item.quantity} unidades x ${item.unit_price.toFixed(2)}</span>
                        </div>
                        <span className="text-sm font-bold text-white">${(item.quantity * item.unit_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Cliente</p>
                      <p className="text-sm text-white font-medium">{selectedSale.client?.name || 'Cliente General'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total Pagado</p>
                      <p className="text-2xl font-black text-primary">${selectedSale.total.toFixed(2)}</p>
                    </div>
                  </div>
                  {(selectedSale.tax_amount || 0) > 0 && (
                    <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
                      <span>Subtotal</span>
                      <span>${(selectedSale.subtotal || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(selectedSale.tax_amount || 0) > 0 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{taxSettings.taxType.toUpperCase()} ({taxSettings.taxRate * 100}%)</span>
                      <span>${(selectedSale.tax_amount || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                    onClick={() => downloadTicket(selectedSale)}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all"
                  >
                    <Download className="w-4 h-4" /> Reimprimir
                  </button>
                  <button 
                    onClick={() => handleCancelSale(selectedSale.id)}
                    className="flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Anular Venta
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
