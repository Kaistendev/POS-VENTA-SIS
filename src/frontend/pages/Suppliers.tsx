import { useState, useEffect } from 'react';
import { Truck, RefreshCw, Pencil, Trash2, PlusCircle, Banknote, AlertTriangle, Wallet } from 'lucide-react';
import { useToast } from '../hooks/useToast.ts';
import Modal from '../components/ui/Modal.tsx';
import DataTable from '../components/ui/DataTable.tsx';
import { useExchangeRate, formatBsRef } from '../lib/currency.ts';

const formatMoney = (value: number) =>
  `$${(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [payables, setPayables] = useState<Record<number, number>>({});
  const [cashPosition, setCashPosition] = useState({ total_inflow: 0, paid_to_suppliers: 0, available: 0 });
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [debtInfo, setDebtInfo] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);
  const { success, error: toastError } = useToast();
  const exchangeRate = useExchangeRate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(suppliers.length / itemsPerPage));
  const paginatedSuppliers = suppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  // Form state
  const [formData, setFormData] = useState({ 
    name: '', 
    ruc: '', 
    phone: '', 
    email: '', 
    address: '' 
  });
  const [deleteTarget, setDeleteTarget] = useState<{id: number, name: string} | null>(null);

  const columns = [
    {
      header: 'Nombre',
      render: (supplier: any) => (
        <div>
          <div className="font-medium text-white">{supplier.name}</div>
          <div className="text-xs text-gray-500">{supplier.ruc}</div>
        </div>
      ),
    },
    {
      header: 'RUC',
      render: (supplier: any) => (
        supplier.ruc || <span className="text-gray-600">-</span>
      ),
    },
    {
      header: 'Teléfono',
      render: (supplier: any) => (
        supplier.phone || <span className="text-gray-600">-</span>
      ),
    },
    {
      header: 'Email',
      render: (supplier: any) => (
        supplier.email || <span className="text-gray-600">-</span>
      ),
    },
    {
      header: 'Productos',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (supplier: any) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400">
          {supplier._count?.products ?? 0}
        </span>
      ),
    },
    {
      header: 'Cuentas por pagar',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (supplier: any) => {
        const owed = payables[supplier.id] ?? 0;
        const bsRef = formatBsRef(owed, exchangeRate);
        return owed > 0 ? (
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400">
              <AlertTriangle className="w-3 h-3" />
              {formatMoney(owed)}
            </span>
            {bsRef && <p className="text-[11px] text-gray-500 mt-0.5">{bsRef}</p>}
          </div>
        ) : (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400">Al día</span>
        );
      },
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (supplier: any) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {(payables[supplier.id] ?? 0) > 0 && (
            <button
              onClick={() => handleOpenPayModal(supplier)}
              className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
              title="Registrar pago"
            >
              <Banknote className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => handleOpenEditModal(supplier)} 
            className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" 
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeleteClick(supplier.id, supplier.name)} 
            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const [data, accounts] = await Promise.all([
          window.api.getAllSuppliers(),
          window.api.getAccountsPayable(),
        ]);
        setSuppliers(data || []);
        const map: Record<number, number> = {};
        for (const p of accounts?.payables ?? []) map[p.supplier_id] = p.total_owed;
        setPayables(map);
        setCashPosition(accounts?.cashPosition ?? { total_inflow: 0, paid_to_suppliers: 0, available: 0 });
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedSupplier(null);
    setFormData({ name: '', ruc: '', phone: '', email: '', address: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      ruc: supplier.ruc || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.name) {
        toastError('El nombre es requerido');
        return;
      }

      let result;
      if (selectedSupplier) {
        result = await window.api.updateSupplier(selectedSupplier.id, formData);
      } else {
        result = await window.api.createSupplier(formData);
      }

      if (result.success) {
        success(selectedSupplier ? 'Proveedor actualizado' : 'Proveedor creado');
        setIsModalOpen(false);
        fetchData();
      } else {
        toastError(result.message || 'Error al guardar');
      }
    } catch (err: any) {
      toastError('Error de comunicación');
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteTarget({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleOpenPayModal = async (supplier: any) => {
    setSelectedSupplier(supplier);
    setPayAmount('');
    setPayNote('');
    setDebtInfo(null);
    setIsPayModalOpen(true);
    try {
      const debt = await window.api.getSupplierDebt(supplier.id);
      setDebtInfo(debt);
      if (debt && debt.total_owed > 0) {
        const max = Math.min(debt.total_owed, debt.cashPosition.available);
        setPayAmount(String(Math.round(max * 100) / 100));
      }
    } catch (err) {
      console.error(err);
      toastError('Error al cargar la deuda del proveedor');
    }
  };

  const maxPayable = debtInfo ? Math.min(debtInfo.total_owed, debtInfo.cashPosition.available) : 0;

  const handlePayConfirm = async () => {
    if (!selectedSupplier || !debtInfo) return;
    const amount = parseFloat(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toastError('Ingresa un monto válido');
      return;
    }
    if (amount > debtInfo.total_owed + 0.001) {
      toastError(`El pago excede la deuda (${formatMoney(debtInfo.total_owed)})`);
      return;
    }
    if (amount > debtInfo.cashPosition.available + 0.001) {
      toastError(`Saldo insuficiente. Disponible: ${formatMoney(debtInfo.cashPosition.available)}`);
      return;
    }

    setPaying(true);
    try {
      const result = await window.api.paySupplier(selectedSupplier.id, amount, payNote || undefined);
      if (result.success) {
        const payload: any = result as any;
        const remaining = payload.remaining_debt ?? payload.data?.remaining_debt ?? (debtInfo.total_owed - amount);
        success(remaining <= 0.001 ? 'Deuda saldada por completo' : `Pago registrado. Saldo pendiente: ${formatMoney(remaining)}`);
        setIsPayModalOpen(false);
        fetchData();
        const paymentIds: number[] | undefined = payload.payment_ids ?? payload.data?.payment_ids;
        if (paymentIds?.length) {
          try {
            await window.api.generatePaymentReceipt(paymentIds);
          } catch (err) {
            console.error(err);
          }
        }
      } else {
        toastError(result.message || 'Error al registrar el pago');
      }
    } catch (err) {
      toastError('Error de comunicación');
    }
    setPaying(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    try {
      const result = await window.api.deleteSupplier(deleteTarget.id);
      if (result.success) {
        success('Proveedor eliminado');
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        toastError(result.message || 'Error al eliminar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Proveedores</h2>
          <p className="text-gray-400 mt-1">Gestión de proveedores para compras</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => { setCurrentPage(1); fetchData(); }} 
            className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Nuevo Proveedor
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1f2028] border border-[#2e303a]">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Saldo disponible</p>
            <p className={`text-lg font-bold ${cashPosition.available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoney(cashPosition.available)}
            </p>
            {formatBsRef(cashPosition.available, exchangeRate) && (
              <p className="text-[11px] text-gray-400">{formatBsRef(cashPosition.available, exchangeRate)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1f2028] border border-[#2e303a]">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Ingresos históricos (cajas + ventas)</p>
            <p className="text-lg font-bold text-white">{formatMoney(cashPosition.total_inflow)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1f2028] border border-[#2e303a]">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Deuda total con proveedores</p>
            <p className="text-lg font-bold text-white">
              {formatMoney(Object.values(payables).reduce((sum, v) => sum + v, 0))}
            </p>
            {formatBsRef(Object.values(payables).reduce((sum, v) => sum + v, 0), exchangeRate) && (
              <p className="text-[11px] text-gray-400">{formatBsRef(Object.values(payables).reduce((sum, v) => sum + v, 0), exchangeRate)}</p>
            )}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedSuppliers}
        keyExtractor={(supplier) => supplier.id}
        loading={loading}
        emptyMessage="No hay proveedores"
        emptyDescription="Agrega tu primer proveedor para gestionar compras"
        emptyIcon={<Truck className="w-8 h-8" />}
        emptyAction={{ label: 'Agregar Proveedor', onClick: handleOpenCreateModal }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={suppliers.length}
        onPageChange={setCurrentPage}
      />

      {/* Modal para Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        width="600px"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              RUC
            </label>
            <input
              type="text"
              value={formData.ruc}
              onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Dirección
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-[#2e303a] text-gray-300 rounded-lg hover:bg-[#3e404a] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              {selectedSupplier ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Pago a Proveedor */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Pagar a ${selectedSupplier?.name ?? ''}`}
        width="560px"
      >
        {!debtInfo ? (
          <p className="text-gray-400 text-center py-6">Cargando deuda...</p>
        ) : debtInfo.total_owed <= 0 ? (
          <p className="text-emerald-400 text-center py-6">Este proveedor no tiene deudas pendientes</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#1f2028] border border-[#2e303a]">
                <p className="text-xs text-gray-500">Deuda total</p>
                <p className="text-lg font-bold text-red-400">{formatMoney(debtInfo.total_owed)}</p>
                {formatBsRef(debtInfo.total_owed, exchangeRate) && (
                  <p className="text-[11px] text-gray-500">{formatBsRef(debtInfo.total_owed, exchangeRate)}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-[#1f2028] border border-[#2e303a]">
                <p className="text-xs text-gray-500">Saldo disponible</p>
                <p className={`text-lg font-bold ${debtInfo.cashPosition.available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatMoney(debtInfo.cashPosition.available)}
                </p>
                {formatBsRef(debtInfo.cashPosition.available, exchangeRate) && (
                  <p className="text-[11px] text-gray-500">{formatBsRef(debtInfo.cashPosition.available, exchangeRate)}</p>
                )}
                {debtInfo.cashPosition.available < debtInfo.total_owed && (
                  <p className="text-[11px] text-amber-400 mt-0.5">
                    Solo puedes pagar hasta tu saldo disponible
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">Compras pendientes (se pagan de la más antigua a la más reciente)</p>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {debtInfo.purchases.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1f2028] border border-[#2e303a] text-sm">
                    <span className="text-gray-300">Compra #{p.id}</span>
                    <span className="text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</span>
                    <span className={p.remaining < p.total_amount ? 'text-amber-400 font-medium' : 'text-white font-medium'}>
                      {formatMoney(p.remaining)}
                      {p.paid_amount > 0 && <span className="text-gray-500 font-normal"> / {formatMoney(p.total_amount)}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Monto a pagar *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                placeholder="0.00"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPayAmount(String(debtInfo.total_owed))}
                  disabled={debtInfo.cashPosition.available < debtInfo.total_owed}
                  className="px-3 py-1 text-xs rounded-lg bg-[#2e303a] text-gray-300 hover:bg-[#3e404a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Saldar todo ({formatMoney(debtInfo.total_owed)})
                </button>
                <button
                  type="button"
                  onClick={() => setPayAmount(String(Math.round(maxPayable * 100) / 100))}
                  className="px-3 py-1 text-xs rounded-lg bg-[#2e303a] text-gray-300 hover:bg-[#3e404a] transition-colors"
                >
                  Máximo posible ({formatMoney(maxPayable)})
                </button>
              </div>
              {formatBsRef(parseFloat(payAmount) || 0, exchangeRate) && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {formatBsRef(parseFloat(payAmount) || 0, exchangeRate)} <span className="text-gray-600">(tasa: {exchangeRate} Bs./$)</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nota (opcional)</label>
              <input
                type="text"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                placeholder="Ej: pago parcial, transferencia..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 bg-[#2e303a] text-gray-300 rounded-lg hover:bg-[#3e404a] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePayConfirm}
                disabled={paying || debtInfo.cashPosition.available <= 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying ? 'Procesando...' : 'Registrar pago'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmación para Eliminar */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        width="450px"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white">
            ¿Estás seguro de eliminar <span className="font-semibold">"{deleteTarget?.name}"</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer</p>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(false)}
            className="flex-1 px-4 py-2.5 bg-[#2e303a] text-gray-300 rounded-xl hover:bg-[#3e404a] transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
