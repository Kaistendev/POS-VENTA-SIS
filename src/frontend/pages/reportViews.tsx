import { useState, useEffect, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Store, Truck, DollarSign, ShoppingBag, Users } from 'lucide-react';
import { useToast } from '../hooks/useToast.ts';
import DataTable from '../components/ui/DataTable.tsx';

function SummaryCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Historial de Ventas: cada producto vendido y a quién
// ────────────────────────────────────────
type SaleRow = {
  key: string;
  saleId: number;
  date: string;
  clientName: string;
  clientDni: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  paymentMethod: string;
};

export function SalesHistoryReportView() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { error: toastError } = useToast();
  const itemsPerPage = 8;

  useEffect(() => {
    (async () => {
      try {
        if (window.api) {
          const [sales, products] = await Promise.all([
            window.api.getAllSales(),
            window.api.getAllProducts(),
          ]);
          const productById = new Map(products.map((p: any) => [p.id, p]));
          const all: SaleRow[] = [];
          (sales || []).forEach((s: any) => {
            (s.items || []).forEach((item: any) => {
              const prod = productById.get(item.product_id);
              const unitPrice = item.final_unit_price ?? item.unit_price ?? 0;
              all.push({
                key: `${s.id}-${item.product_id}`,
                saleId: s.id,
                date: new Date(s.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                clientName: s.client?.name || 'Cliente General',
                clientDni: s.client?.dni || '—',
                productName: prod?.name || 'Producto Desconocido',
                sku: prod?.sku || '—',
                quantity: item.quantity,
                unitPrice,
                lineTotal: unitPrice * item.quantity,
                paymentMethod: s.payment_method === 'CASH' ? 'EFECTIVO' : 'TARJETA',
              });
            });
          });
          setRows(all);
        }
      } catch (err) {
        toastError('Error al cargar el historial de ventas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.clientName.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      r.sku.toLowerCase().includes(q) ||
      r.saleId.toString().includes(q)
    );
  }, [rows, search]);

  const totalRevenue = filtered.reduce((a, r) => a + r.lineTotal, 0);
  const totalUnits = filtered.reduce((a, r) => a + r.quantity, 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    { header: 'Venta', render: (r: SaleRow) => <span className="font-medium text-white">#{r.saleId}</span> },
    { header: 'Fecha', render: (r: SaleRow) => <span className="text-gray-400">{r.date}</span> },
    { header: 'Cliente', render: (r: SaleRow) => (
      <div>
        <span className="text-gray-300">{r.clientName}</span>
        <span className="block text-[10px] text-gray-500">{r.clientDni}</span>
      </div>
    )},
    { header: 'Producto', render: (r: SaleRow) => (
      <div>
        <span className="text-white">{r.productName}</span>
        <span className="block text-[10px] text-gray-500">{r.sku}</span>
      </div>
    )},
    { header: 'Cant.', className: 'text-center', headerClassName: 'text-center', render: (r: SaleRow) => <span className="text-gray-300">{r.quantity}</span> },
    { header: 'P/U', className: 'text-right', headerClassName: 'text-right', render: (r: SaleRow) => <span className="text-gray-300">${r.unitPrice.toFixed(2)}</span> },
    { header: 'Total', className: 'text-right', headerClassName: 'text-right', render: (r: SaleRow) => <span className="font-bold text-white">${r.lineTotal.toFixed(2)}</span> },
    { header: 'Pago', render: (r: SaleRow) => (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.paymentMethod === 'EFECTIVO' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
        {r.paymentMethod}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Historial de Ventas detallado</h3>
          <p className="text-sm text-gray-400">Cada producto vendido, su cantidad, precio y el cliente que lo compró</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, producto o venta..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="bg-[#1f2028] border border-[#2e303a] rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard icon={<ShoppingBag className="w-5 h-5" />} label="Líneas vendidas" value={`${filtered.length}`} color="bg-primary/10 text-primary" />
        <SummaryCard icon={<Users className="w-5 h-5" />} label="Unidades vendidas" value={`${totalUnits}`} color="bg-blue-500/10 text-blue-400" />
        <SummaryCard icon={<DollarSign className="w-5 h-5" />} label="Ingresos" value={`$${totalRevenue.toFixed(2)}`} color="bg-green-500/10 text-green-400" />
      </div>

      <DataTable
        columns={columns as any}
        data={paged as any}
        keyExtractor={(r: any) => r.key}
        loading={loading}
        emptyMessage="No hay ventas registradas"
        emptyDescription="Registra ventas para ver el historial detallado por producto"
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

// ────────────────────────────────────────
// Compras a Proveedores
// ────────────────────────────────────────
export function PurchasesReportView() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const { error: toastError } = useToast();
  const itemsPerPage = 8;

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const [purData, prodData] = await Promise.all([
          window.api.getAllPurchases(),
          window.api.getAllProducts(),
        ]);
        setPurchases(purData || []);
        setProducts(prodData || []);
      }
    } catch (err) {
      toastError('Error al cargar las compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const productName = (id: number) => products.find((p: any) => p.id === id)?.name || 'Producto Desconocido';
  const productSku = (id: number) => products.find((p: any) => p.id === id)?.sku || '—';

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return purchases;
    return purchases.filter((p: any) =>
      p.id.toString().includes(q) ||
      (p.supplier?.name || '').toLowerCase().includes(q) ||
      (p.supplier?.ruc || '').toLowerCase().includes(q)
    );
  }, [purchases, search]);

  const totalAmount = filtered.reduce((a, p: any) => a + Number(p.total_amount || 0), 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    { header: 'ID', render: (p: any) => <span className="font-medium text-white">#{p.id}</span> },
    { header: 'Proveedor', render: (p: any) => (
      <div>
        <span className="text-gray-300">{p.supplier?.name || 'N/A'}</span>
        <span className="block text-[10px] text-gray-500">{p.supplier?.ruc || '—'}</span>
      </div>
    )},
    { header: 'Total', className: 'text-right', headerClassName: 'text-right', render: (p: any) => <span className="font-bold text-white">${Number(p.total_amount || 0).toFixed(2)}</span> },
    { header: 'Estado', render: (p: any) => (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
        p.status === 'RECEIVED' ? 'bg-green-500/20 text-green-400'
        : p.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400'
        : 'bg-yellow-500/20 text-yellow-400'
      }`}>
        {p.status === 'RECEIVED' ? 'Recibida' : p.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente'}
      </span>
    )},
    { header: 'Pago', render: (p: any) => (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${p.payment_status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
        {p.payment_status === 'PAID' ? 'Pagado' : 'Por Pagar'}
      </span>
    )},
    { header: 'Fecha', render: (p: any) => <span className="text-gray-400">{new Date(p.created_at).toLocaleDateString('es-ES')}</span> },
    { header: 'Registrado', render: (p: any) => (
      <span className="text-[11px] text-gray-500">{p.items?.length || 0} productos</span>
    )},
    { header: 'Acciones', headerClassName: 'text-right', className: 'text-right', render: (p: any) => (
      <div className="flex justify-end">
        <button onClick={() => setSelected(p)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg" title="Ver detalles">
          <Eye className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Compras a Proveedores</h3>
          <p className="text-sm text-gray-400">Órdenes de compra realizadas, con el detalle de los productos adquiridos</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por proveedor, RUC o ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="bg-[#1f2028] border border-[#2e303a] rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard icon={<Store className="w-5 h-5" />} label="Órdenes" value={`${filtered.length}`} color="bg-primary/10 text-primary" />
        <SummaryCard icon={<Truck className="w-5 h-5" />} label="Recibidas" value={`${filtered.filter((p: any) => p.status === 'RECEIVED').length}`} color="bg-blue-500/10 text-blue-400" />
        <SummaryCard icon={<DollarSign className="w-5 h-5" />} label="Total invertido" value={`$${totalAmount.toFixed(2)}`} color="bg-green-500/10 text-green-400" />
      </div>

      <DataTable
        columns={columns}
        data={paged}
        keyExtractor={(p: any) => p.id}
        loading={loading}
        emptyMessage="No hay compras registradas"
        emptyDescription="Registra órdenes de compra a tus proveedores"
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        onPageChange={setCurrentPage}
      />

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#1f2028] border border-[#2e303a] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white">Detalle de Compra #{selected.id}</h3>
                  <p className="text-xs text-gray-500">{new Date(selected.created_at).toLocaleString('es-ES')}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 transition-colors">✕</button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="p-4 bg-white/5 rounded-2xl grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Proveedor</p>
                    <p className="text-white font-medium">{selected.supplier?.name || 'N/A'}</p>
                    <p className="text-[10px] text-gray-500">{selected.supplier?.ruc}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Estado</p>
                    <p className="text-white">{selected.status === 'RECEIVED' ? 'Recibida' : selected.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Productos</h4>
                  <div className="space-y-2">
                    {(selected.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{productName(item.product_id)}</span>
                          <span className="text-[10px] text-gray-500">{productSku(item.product_id)} · {item.quantity} u. × ${item.unit_cost.toFixed(2)}</span>
                        </div>
                        <span className="text-sm font-bold text-white">${(item.quantity * item.unit_cost).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-2xl font-black text-primary">${Number(selected.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}