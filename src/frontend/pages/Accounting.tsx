import { useState, useEffect } from 'react';
import { RefreshCw, Wallet, AlertTriangle, TrendingUp, Boxes, Banknote, ReceiptText } from 'lucide-react';
import { useToast } from '../hooks/useToast.ts';
import Modal from '../components/ui/Modal.tsx';
import { useExchangeRate, formatBsRef } from '../lib/currency.ts';

const formatMoney = (value: number) =>
  `$${(value ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Accounting() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { success, error: toastError } = useToast();
  const exchangeRate = useExchangeRate();

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paySupplier, setPaySupplier] = useState<any>(null);
  const [debtInfo, setDebtInfo] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const data = await window.api.getAccountingSummary();
        setSummary(data);
      }
    } catch (error) {
      console.error(error);
      toastError('Error al cargar el resumen contable');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPayModal = async (supplierId: number, name: string, owed: number) => {
    setPaySupplier({ id: supplierId, name, owed });
    setPayAmount('');
    setPayNote('');
    setDebtInfo(null);
    setIsPayModalOpen(true);
    try {
      const debt = await window.api.getSupplierDebt(supplierId);
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
    if (!paySupplier || !debtInfo) return;
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
      const result = await window.api.paySupplier(paySupplier.id, amount, payNote || undefined);
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

  const cashPosition = summary?.cashPosition ?? { total_inflow: 0, paid_to_suppliers: 0, available: 0 };
  const projection = summary?.projection ?? { units_in_stock: 0, inventory_cost_value: 0, potential_revenue: 0, projected_gross_profit: 0 };
  const payables = summary?.payables ?? [];
  const marginPct = projection.potential_revenue > 0
    ? ((projection.projected_gross_profit / projection.potential_revenue) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Contabilidad</h2>
          <p className="text-gray-400 mt-1">Saldo de la empresa, cuentas por pagar y proyección de ganancias</p>
        </div>
        <button
          onClick={() => { fetchData(); }}
          className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors shadow-sm"
          title="Actualizar"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-5 rounded-xl bg-[#1f2028] border border-[#2e303a]">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Saldo disponible de la empresa</p>
            <p className={`text-2xl font-bold ${cashPosition.available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoney(cashPosition.available)}
            </p>
            {formatBsRef(cashPosition.available, exchangeRate) && (
              <p className="text-[11px] text-gray-400">{formatBsRef(cashPosition.available, exchangeRate)}</p>
            )}
            <p className="text-[11px] text-gray-600">
              Ingresos {formatMoney(cashPosition.total_inflow)} − Pagos {formatMoney(cashPosition.paid_to_suppliers)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-5 rounded-xl bg-[#1f2028] border border-[#2e303a]">
          <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Deudas por pagar (proveedores)</p>
            <p className="text-2xl font-bold text-white">{formatMoney(summary?.total_debt ?? 0)}</p>
            {formatBsRef(summary?.total_debt ?? 0, exchangeRate) && (
              <p className="text-[11px] text-gray-400">{formatBsRef(summary?.total_debt ?? 0, exchangeRate)}</p>
            )}
            <p className="text-[11px] text-gray-600">{payables.length} proveedor(es) con deuda</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-5 rounded-xl bg-[#1f2028] border border-[#2e303a]">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Ganancia bruta proyectada (inventario)</p>
            <p className="text-2xl font-bold text-purple-400">{formatMoney(projection.projected_gross_profit)}</p>
            {formatBsRef(projection.projected_gross_profit, exchangeRate) && (
              <p className="text-[11px] text-gray-400">{formatBsRef(projection.projected_gross_profit, exchangeRate)}</p>
            )}
            <p className="text-[11px] text-gray-600">Margen potencial: {marginPct}%</p>
          </div>
        </div>
      </div>

      {/* Proyección de inventario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1f2028] border border-[#2e303a]">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Unidades en inventario</p>
            <p className="text-lg font-bold text-white">{projection.units_in_stock.toLocaleString('es-PE')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1f2028] border border-[#2e303a]">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <ReceiptText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Inventario a costo</p>
            <p className="text-lg font-bold text-white">{formatMoney(projection.inventory_cost_value)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1f2028] border border-[#2e303a]">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Ingreso potencial (venta total)</p>
            <p className="text-lg font-bold text-white">{formatMoney(projection.potential_revenue)}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 -mt-2">
        La ganancia bruta proyectada estima lo que ganarías si vendieras todo el inventario actual:
        ingreso potencial ({formatMoney(projection.potential_revenue)}) − costo del inventario ({formatMoney(projection.inventory_cost_value)}).
      </p>

      {/* Cuentas por pagar */}
      <div className="rounded-xl bg-[#1f2028] border border-[#2e303a] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2e303a] flex items-center justify-between">
          <h3 className="font-bold text-white">Cuentas por pagar</h3>
        </div>
        {payables.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No hay deudas pendientes con proveedores</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-[#2e303a]">
                <th className="px-5 py-3 font-medium">Proveedor</th>
                <th className="px-5 py-3 font-medium">RUC</th>
                <th className="px-5 py-3 font-medium text-center">Compras pendientes</th>
                <th className="px-5 py-3 font-medium text-right">Monto adeudado</th>
                <th className="px-5 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {payables.map((p: any) => (
                <tr key={p.supplier_id} className="border-b border-[#2e303a]/50 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-5 py-3 text-gray-400">{p.ruc || '-'}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400">{p.unpaid_purchases}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400">
                      {formatMoney(p.total_owed)}
                    </span>
                    {formatBsRef(p.total_owed, exchangeRate) && (
                      <p className="text-[11px] text-gray-500 mt-0.5">{formatBsRef(p.total_owed, exchangeRate)}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleOpenPayModal(p.supplier_id, p.name, p.total_owed)}
                      disabled={cashPosition.available <= 0}
                      title={cashPosition.available <= 0 ? 'Sin saldo disponible' : 'Registrar pago'}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      Pagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de pago */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Pagar a ${paySupplier?.name ?? ''}`}
        width="560px"
      >
        {!debtInfo ? (
          <p className="text-gray-400 text-center py-6">Cargando deuda...</p>
        ) : debtInfo.total_owed <= 0 ? (
          <p className="text-emerald-400 text-center py-6">Este proveedor no tiene deudas pendientes</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#16171d] border border-[#2e303a]">
                <p className="text-xs text-gray-500">Deuda total</p>
                <p className="text-lg font-bold text-red-400">{formatMoney(debtInfo.total_owed)}</p>
                {formatBsRef(debtInfo.total_owed, exchangeRate) && (
                  <p className="text-[11px] text-gray-500">{formatBsRef(debtInfo.total_owed, exchangeRate)}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-[#16171d] border border-[#2e303a]">
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
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#16171d] border border-[#2e303a] text-sm">
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
                className="w-full px-4 py-2 bg-[#16171d] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
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
                className="w-full px-4 py-2 bg-[#16171d] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
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
    </div>
  );
}
