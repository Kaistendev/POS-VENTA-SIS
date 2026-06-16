import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, Package, User, UserPlus, CheckCircle, Lock, X, ArrowLeft, Download, Eye, Calendar, RefreshCw, PackagePlus, Pencil, PlusCircle, MinusCircle, AlertCircle, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { useCashStore, useCartStore } from '../store/useStore.ts';
import { useToast } from '../hooks/useToast.ts';
import { Product, Client } from '../../shared/types';
import { formatCurrency } from '../lib/utils.ts';

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const { activeRegister, setActiveRegister } = useCashStore();
  const { items: cart, addItem, removeItem, updateQty, clearCart, getTotal, suspendCart, suspendedCarts, resumeCart } = useCartStore();
  const { success, error: toastError } = useToast();
  
  const [isCheckout, setIsCheckout] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  
  const handleModalSearch = (val: string) => {
    setModalSearch(val);
    const p = products.find(prod => prod.sku.toLowerCase() === val.toLowerCase());
    if (p) {
        addItem(p);
        setModalSearch('');
        success(`Añadido: ${p.name}`);
    }
  };

  const [selectedClient, setSelectedClient] = useState<{ id?: number; name: string }>({ id: 1, name: 'Cliente General' });
  const [customerData, setCustomerData] = useState({ name: '', dni: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [taxSettings, setTaxSettings] = useState<{ taxRate: number; taxType: string; taxIncluded: boolean }>({ taxRate: 0, taxType: 'none', taxIncluded: false });
  const [exchangeRate, setExchangeRate] = useState(0);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [cartDiscounts, setCartDiscounts] = useState<Record<number, { id: number; name: string; type: string; value: number }>>({});
  const [discountModalProductId, setDiscountModalProductId] = useState<number | null>(null);
  const [applicableDiscounts, setApplicableDiscounts] = useState<any[]>([]);

  const fetchData = async () => {
    if (window.api) {
      const p = await window.api.getAllProducts();
      const c = await window.api.getAllClients();
      const reg = await window.api.getOpenRegister();
      const settings = await window.api.getSettings();
      const tax = await window.api.getTaxSettings();
      setProducts(p || []);
      setClients(c || []);
      setActiveRegister(reg || null);
      setBusinessInfo(settings);
      setTaxSettings(tax || { taxRate: 0, taxType: 'none', taxIncluded: false });
      setExchangeRate(parseFloat(settings?.exchange_rate_usd_ves) || 0);
      const activeDiscounts = await window.api.getDiscounts(true);
      setDiscounts(activeDiscounts || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const total = getTotal();

  const getDiscountTotal = () => {
    let totalDisc = 0;
    for (const item of cart) {
      const disc = cartDiscounts[item.id];
      if (disc) {
        const lineTotal = item.price * item.qty;
        if (disc.type === 'PERCENTAGE') {
          totalDisc += lineTotal * (disc.value / 100);
        } else {
          totalDisc += Math.min(disc.value, lineTotal);
        }
      }
    }
    return parseFloat(totalDisc.toFixed(2));
  };

  const getTaxInfo = (rawTotal: number, discountTotal: number = 0) => {
    const subtotal = rawTotal - discountTotal;
    if (taxSettings.taxType === 'none' || taxSettings.taxRate <= 0) {
      return { subtotal: parseFloat(subtotal.toFixed(2)), taxAmount: 0, total: parseFloat(subtotal.toFixed(2)), discountTotal };
    }
    const taxAmt = subtotal * taxSettings.taxRate;
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmt.toFixed(2)),
      total: parseFloat((subtotal + taxAmt).toFixed(2)),
      discountTotal,
    };
  };

  const discountTotal = getDiscountTotal();
  const taxInfo = getTaxInfo(total, discountTotal);

  const handleOpenDiscountModal = async (productId: number) => {
    const cartItem = cart.find(i => i.id === productId);
    if (!cartItem) return;
    try {
      const applicable = await window.api.getApplicableDiscounts(productId);
      setApplicableDiscounts(applicable || []);
      setDiscountModalProductId(productId);
    } catch { }
  };

  const handleApplyDiscount = (productId: number, discount: { id: number; name: string; type: string; value: number } | null) => {
    if (discount) {
      setCartDiscounts(prev => ({ ...prev, [productId]: discount }));
    } else {
      setCartDiscounts(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
    setDiscountModalProductId(null);
  };

  const getItemDiscountAmount = (item: { id: number; price: number; qty: number }) => {
    const disc = cartDiscounts[item.id];
    if (!disc) return 0;
    const lineTotal = item.price * item.qty;
    if (disc.type === 'PERCENTAGE') return parseFloat((lineTotal * (disc.value / 100)).toFixed(2));
    return parseFloat(Math.min(disc.value, lineTotal).toFixed(2));
  };

  const getItemFinalPrice = (item: { id: number; price: number; qty: number }) => {
    const discAmt = getItemDiscountAmount(item);
    return parseFloat(((item.price * item.qty - discAmt) / item.qty).toFixed(2));
  };

  const generateTicketPDF = (saleId: number | string, cartItems: any[], clientName: string, rate: number) => {
    const hasDiscounts = Object.keys(cartDiscounts).length > 0;
    const extraLines = (rate > 0 ? cartItems.length + 3 : 0) + (hasDiscounts ? cartItems.length : 0);
    const doc = new jsPDF({ unit: 'mm', format: [80, 150 + extraLines * 3] });
    doc.setFontSize(12);
    doc.text('INVENTARIO-POS', 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Ticket: #${saleId}`, 5, 20);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, 25);
    doc.text(`Cliente: ${clientName}`, 5, 30);
    if (rate > 0) {
      doc.text(`Tasa Bs.: ${rate.toFixed(2)}`, 5, 35);
    }
    doc.text('------------------------------------------', 5, 40);
    let y = 45;
    cartItems.forEach(item => {
      const discAmt = getItemDiscountAmount(item);
      const displayTotal = item.price * item.qty - discAmt;
      doc.text(`${item.qty} x ${item.name || item.sku}`, 5, y);
      doc.text(`$${formatCurrency(displayTotal)}`, 75, y, { align: 'right' });
      y += 4;
      if (discAmt > 0) {
        doc.setFontSize(6);
        doc.text(`  Desc: -$${formatCurrency(discAmt)}`, 8, y);
        doc.setFontSize(8);
        y += 4;
      }
      if (rate > 0) {
        doc.setFontSize(6);
        doc.text(`Bs. ${formatCurrency(displayTotal * rate)}`, 75, y, { align: 'right' });
        doc.setFontSize(8);
        y += 4;
      }
    });
    doc.text('------------------------------------------', 5, y + 2);
    y += 6;
    doc.setFontSize(9);
    doc.text(`Subtotal:`, 5, y);
    doc.text(`$${formatCurrency(taxInfo.subtotal)}`, 75, y, { align: 'right' });
    y += 5;
    if (taxInfo.discountTotal && taxInfo.discountTotal > 0) {
      doc.text(`Descuento:`, 5, y);
      doc.text(`-$${formatCurrency(taxInfo.discountTotal)}`, 75, y, { align: 'right' });
      y += 5;
    }
    if (taxInfo.taxAmount > 0) {
      doc.text(`${taxSettings.taxType.toUpperCase()} (${taxSettings.taxRate * 100}%):`, 5, y);
      doc.text(`$${formatCurrency(taxInfo.taxAmount)}`, 75, y, { align: 'right' });
      y += 5;
    }
    doc.setFontSize(10);
    doc.text(`TOTAL: $${formatCurrency(taxInfo.total)}`, 75, y, { align: 'right' });
    y += 5;
    if (rate > 0) {
      doc.setFontSize(8);
      doc.text(`Total Bs.: ${formatCurrency(taxInfo.total * rate)}`, 75, y, { align: 'right' });
      y += 5;
    }
    y += 3;
    doc.setFontSize(8);
    doc.text('Gracias por su compra', 40, y, { align: 'center' });
    doc.save(`Ticket_${saleId}.pdf`);
  };

  const handleProcessSale = async (method: 'cash' | 'card') => {
    if (cart.length === 0 || !activeRegister) return;
    setIsProcessing(true);
    try {
      const saleData = {
        cash_register_id: activeRegister.id,
        client_id: selectedClient.id,
        client_name: customerData.name || null,
        client_dni: customerData.dni || null,
        payment_method: method === 'card' ? 'CARD' : 'CASH',
        exchange_rate: exchangeRate,
        discount_total: discountTotal,
      };
      const itemsData = cart.map(item => ({
        product_id: item.id,
        quantity: item.qty,
        unit_price: item.price,
        discount_id: cartDiscounts[item.id]?.id || undefined,
      }));

      const result = await window.api.registerSale(saleData, itemsData);
      if (result.success) {
        const finalClientName = customerData.name || selectedClient.name;
        setLastSaleId(result.id);
        generateTicketPDF(result.id, cart, finalClientName, exchangeRate);
        setShowSuccess(true);
        clearCart();
        setCustomerData({ name: '', dni: '' });
        setSelectedClient({ id: 1, name: 'Cliente General' });
        
        // Actualizar estado de caja después de la venta
        const reg = await window.api.getOpenRegister();
        setActiveRegister(reg || null);
        
        success('Venta procesada correctamente');
        fetchData(); // Refrescar stock y clientes
      } else {
        toastError(result.message || 'Error al procesar venta');
      }
    } catch (err) {
      toastError('Error de comunicación con el sistema');
    } finally {
      setIsProcessing(false);
    }
  };

  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const handleCreateQuickClient = async () => {
    if (!customerData.name || !customerData.dni) {
      toastError('Nombre y DNI son obligatorios para registrar');
      return;
    }

    setIsCreatingClient(true);
    try {
      const newClient = {
        code: `CLI-${customerData.dni}`,
        name: customerData.name,
        dni: customerData.dni,
        phone: ''
      };

      const result = await window.api.createClient(newClient);
      if (result.success) {
        success('Cliente registrado y seleccionado');
        const updatedClients = await window.api.getAllClients();
        setClients(updatedClients || []);
        
        // Seleccionar el nuevo cliente
        const created = updatedClients.find((c: any) => c.dni === customerData.dni);
        if (created) setSelectedClient(created);
      } else {
        toastError(result.message || 'Error al registrar cliente');
      }
    } catch (err) {
      toastError('Error al crear cliente rápido');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check if product can be added to cart
  const canAddToCart = (product: any) => {
    if (product.stock === undefined) return true;
    const cartItem = cart.find(item => item.id === product.id);
    if (!cartItem) return product.stock > 0;
    return cartItem.qty < product.stock;
  };

  useEffect(() => {
    if (searchTerm.length >= 3) {
      const product = products.find(p => p.sku.toLowerCase() === searchTerm.toLowerCase());
      if (product) {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem && product.stock !== undefined && cartItem.qty >= product.stock) {
          toastError(`Stock insuficiente. Solo quedan ${product.stock} unidades de ${product.name}`);
        } else if (product.stock !== undefined && product.stock <= 0) {
          toastError(`${product.name} no tiene stock disponible`);
        } else {
          addItem(product);
          setSearchTerm('');
          success(`Añadido: ${product.name}`);
        }
      }
    }
  }, [searchTerm, products, addItem, cart]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(customerData.name.toLowerCase()) || 
    c.dni.includes(customerData.dni)
  );

  if (!activeRegister && !isProcessing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="glass-panel p-10 rounded-3xl border border-white/5 text-center max-w-sm">
          <div className="p-4 bg-red-500/10 rounded-2xl w-fit mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Ventas Bloqueadas</h3>
          <p className="text-gray-400 mb-8 text-sm">Debes realizar la apertura de caja antes de poder registrar ventas.</p>
          <button onClick={() => window.location.hash = '#/cash'} className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all">
            Ir a Control de Caja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-6 relative">
      <div className="flex-1 flex flex-col space-y-4">
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 border border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-sm uppercase tracking-widest">Información del Cliente</h3>
            <span className="text-[10px] text-gray-500 italic">Opcional: Si no se llena, será 'Cliente General'</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Nombre del cliente..." value={customerData.name} onChange={(e) => { setCustomerData({...customerData, name: e.target.value}); if (selectedClient.id !== 1) setSelectedClient({ id: 1, name: 'Cliente General' }); }} className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-primary transition-all" />
             </div>
             <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="DNI / ID..." value={customerData.dni} onChange={(e) => { setCustomerData({...customerData, dni: e.target.value}); if (selectedClient.id !== 1) setSelectedClient({ id: 1, name: 'Cliente General' }); }} className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-primary transition-all" />
             </div>
          </div>
          {customerData.dni.length > 3 && selectedClient.id === 1 && (
            <div className="mt-1">
              {filteredClients.length > 0 ? (
                <div className="bg-[#1f2028] border border-[#2e303a] rounded-xl overflow-hidden shadow-xl">
                  {filteredClients.slice(0, 3).map(c => (
                    <div key={c.id} onClick={() => { setCustomerData({ name: c.name, dni: c.dni }); setSelectedClient(c); }} className="p-3 hover:bg-primary/10 cursor-pointer text-xs text-gray-300 flex justify-between items-center border-b border-white/5 last:border-0">
                        <span>{c.name}</span>
                        <span>{c.dni}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <button 
                  onClick={handleCreateQuickClient}
                  disabled={isCreatingClient || !customerData.name}
                  className="w-full py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {isCreatingClient ? 'Registrando...' : `Registrar "${customerData.name || 'Nuevo Cliente'}"`}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar o escanear producto (SKU)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1f2028] border border-[#2e303a] rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-primary/50 transition-all shadow-sm" />
          </div>
          <button onClick={async () => {
             const last = await window.api.getLastSale();
             if (last) {
               const confirm = await window.api.showConfirmDialog({ message: `¿Anular última venta #${last.id} por $${last.total}?` });
               if (confirm) {
                 await window.api.cancelSale(last.id);
                 success('Venta anulada');
                 fetchData();
               }
             }
          }} className="px-4 bg-red-900/20 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-bold text-sm">
             Anular Última
          </button>
        </div>

        <div className="flex-1 bg-[#16171d] rounded-2xl border border-[#2e303a] overflow-hidden p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-360px)]">
            {(filteredProducts || []).map((product) => (
              <div 
                key={product.id} 
                onClick={() => {
                  const cartItem = cart.find(item => item.id === product.id);
                  if (cartItem && product.stock !== undefined && cartItem.qty >= product.stock) {
                    toastError(`Stock insuficiente. Solo quedan ${product.stock} unidades`);
                    return;
                  }
                  if (product.stock !== undefined && product.stock <= 0) {
                    toastError(`${product.name} no tiene stock disponible`);
                    return;
                  }
                  addItem(product);
                }} 
                className={`bg-[#1f2028] border border-[#2e303a] rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-[#252630] transition-colors group relative ${
                  product.stock !== undefined && product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="aspect-square bg-black/40 rounded-lg mb-3 flex items-center justify-center">
                  <Package className={`w-10 h-10 ${product.stock !== undefined && product.stock <= 0 ? 'text-red-500/30' : 'text-primary/40'}`} />
                </div>
                <h4 className="text-sm font-medium text-gray-200 truncate">{product.name || product.sku}</h4>
                <p className="text-primary font-bold mt-1">$ {product.price_sale.toFixed(2)}</p>
                {exchangeRate > 0 && (
                  <p className="text-[10px] text-orange-400/70">Bs. {formatCurrency(product.price_sale * exchangeRate)}</p>
                )}
                <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded ${
                  product.stock !== undefined && product.stock <= 0 
                    ? 'bg-red-500/20 text-red-400' 
                    : product.stock !== undefined && product.stock <= 5
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  Stock: {product.stock ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-[400px] flex flex-col space-y-4">
        {isCheckout ? (
           <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-[#2e303a] overflow-hidden shadow-2xl p-6 bg-[#1f2028]">
              <h3 className="text-white font-bold mb-6">Confirmar Pago</h3>
              <div className="flex-1 space-y-4">
          <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${taxInfo.subtotal.toFixed(2)}</span></div>
          {taxInfo.discountTotal > 0 && (
            <div className="flex justify-between text-green-400"><span>Descuento</span><span>-${taxInfo.discountTotal.toFixed(2)}</span></div>
          )}
          {taxInfo.taxAmount > 0 && (
            <div className="flex justify-between text-gray-400"><span>{taxSettings.taxType.toUpperCase()} ({taxSettings.taxRate * 100}%)</span><span>${taxInfo.taxAmount.toFixed(2)}</span></div>
          )}
          <div className="text-4xl font-black text-white text-right">${taxInfo.total.toFixed(2)}</div>
               {exchangeRate > 0 && <p className="text-orange-400/70 text-right text-lg mt-1">Bs. {formatCurrency(taxInfo.total * exchangeRate)}</p>}
               </div>
               <div className="grid grid-cols-2 gap-3 mt-6">
                 <button onClick={() => setIsCheckout(false)} className="py-3 bg-white/5 text-white rounded-xl">Volver</button>
                 <button onClick={() => handleProcessSale('cash')} className="py-3 bg-primary text-white font-bold rounded-xl">Pagar</button>
               </div>
            </div>
         ) : (
            <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-[#2e303a] overflow-hidden shadow-2xl">
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">Carrito vacío</div>
                ) : cart.map(item => {
                  const discAmt = getItemDiscountAmount(item);
                  const disc = cartDiscounts[item.id];
                  return (
                    <div key={item.id} className="bg-[#16171d] rounded-xl p-3 border border-[#2e303a]">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">${item.price.toFixed(2)} c/u</p>
                          {disc && (
                            <p className="text-xs text-green-400 mt-0.5">
                              Desc: {disc.name} ({disc.type === 'PERCENTAGE' ? `${disc.value}%` : `Bs. ${disc.value.toFixed(2)}`})
                              <span className="text-green-500 ml-1">-${formatCurrency(discAmt)}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => handleOpenDiscountModal(item.id)} className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${disc ? 'bg-green-500/20 text-green-400' : 'bg-[#1f2028] text-gray-500 hover:text-white'}`} title="Aplicar descuento">%</button>
                          <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-1.5 bg-[#1f2028] rounded-lg text-gray-400 hover:text-white text-xs">-</button>
                          <span className="text-sm font-bold text-white w-6 text-center">{item.qty}</span>
                          <button onClick={() => { if (item.stock !== undefined && item.qty >= item.stock) { toastError('Stock insuficiente'); return; } updateQty(item.id, item.qty + 1); }} className="p-1.5 bg-[#1f2028] rounded-lg text-gray-400 hover:text-white text-xs">+</button>
                          <button onClick={() => removeItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="text-right text-sm font-bold text-white mt-1">
                        ${formatCurrency(item.price * item.qty - discAmt)}
                      </div>
                    </div>
                  );
                })}
              </div>
             <div className="bg-[#1f2028] p-6 border-t border-[#2e303a]">
              <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span>${taxInfo.subtotal.toFixed(2)}</span></div>
                  {taxInfo.discountTotal > 0 && (
                    <div className="flex justify-between text-sm text-green-400"><span>Descuento</span><span>-${taxInfo.discountTotal.toFixed(2)}</span></div>
                  )}
                  {taxInfo.taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-gray-400"><span>{taxSettings.taxType.toUpperCase()} ({taxSettings.taxRate * 100}%)</span><span>${taxInfo.taxAmount.toFixed(2)}</span></div>
                )}
              </div>
               <div className="flex justify-between text-2xl font-bold text-white mb-6"><span>Total</span><span>${taxInfo.total.toFixed(2)}</span></div>
               {exchangeRate > 0 && <div className="flex justify-between text-base text-orange-400/80 mb-6"><span>Total Bs.</span><span>Bs. {formatCurrency(taxInfo.total * exchangeRate)}</span></div>}
             <button disabled={cart.length === 0} onClick={() => setIsCheckout(true)} className="w-full py-4 bg-primary text-white font-bold rounded-xl">Ir a Pagar</button>
             </div>
           </div>
        )}
      </div>

      {/* Modal de Carrito / Checkout */}
      <AnimatePresence>
        {isCheckout && (
          <div className="fixed inset-0 z-50 bg-[#16171d] p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black text-white">Carrito de Compras</h2>
              
              {/* Buscador interno del modal */}
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  autoFocus
                  type="text" 
                  value={modalSearch}
                  placeholder="Escanear o buscar producto..." 
                  className="w-full bg-[#1f2028] border border-[#2e303a] rounded-xl py-3 pl-12 pr-4 text-white"
                  onChange={(e) => handleModalSearch(e.target.value)}
                />
              </div>

              <button onClick={() => setIsCheckout(false)} className="p-4 bg-white/5 rounded-full hover:bg-red-500/20 text-white"><X className="w-8 h-8" /></button>
            </div>
            
            <div className="flex-1 grid grid-cols-3 gap-8">
              <div className="col-span-2 bg-[#1f2028] rounded-3xl p-6 border border-white/5 overflow-y-auto">
                {cart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">El carrito está vacío</div>
                ) : cart.map(item => {
                  const discAmt = getItemDiscountAmount(item);
                  const disc = cartDiscounts[item.id];
                  const finalLineTotal = item.price * item.qty - discAmt;
                  return (
                  <div key={item.id} className="flex justify-between items-center p-4 border-b border-white/5">
                    <div>
                      <p className="font-bold text-white text-lg">{item.name}</p>
                      <p className="text-gray-500">${item.price.toFixed(2)} <span className="text-xs text-gray-600">(Stock: {item.stock})</span>
                        {exchangeRate > 0 && <span className="text-orange-400/60 ml-2">Bs. {formatCurrency(item.price * exchangeRate)}</span>}
                      </p>
                      {disc && (
                        <p className="text-xs text-green-400 mt-0.5">
                          Desc: {disc.name} ({disc.type === 'PERCENTAGE' ? `${disc.value}%` : `Bs. ${disc.value.toFixed(2)}`})
                          <span className="text-green-500 ml-1">-${formatCurrency(discAmt)}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">${formatCurrency(finalLineTotal)}</p>
                        {discAmt > 0 && <p className="text-xs text-gray-500">${formatCurrency(item.price * item.qty)}</p>}
                      </div>
                      <button onClick={() => handleOpenDiscountModal(item.id)} className={`p-2 rounded-lg text-xs font-bold transition-colors ${disc ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400 hover:text-white'}`} title="Aplicar descuento">%</button>
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-2 bg-white/10 rounded-lg">-</button>
                      <span className="text-xl font-bold">{item.qty}</span>
                      <button 
                        onClick={() => {
                          if (item.stock !== undefined && item.qty >= item.stock) {
                            toastError(`Stock insuficiente. Solo quedan ${item.stock} unidades`);
                            return;
                          }
                          updateQty(item.id, item.qty + 1);
                        }} 
                        className={`p-2 rounded-lg ${item.stock !== undefined && item.qty >= item.stock ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        disabled={item.stock !== undefined && item.qty >= item.stock}
                      >
                        +
                      </button>
                      <button onClick={() => removeItem(item.id)} className="text-red-400 p-2"><Trash2 /></button>
                    </div>
                  </div>
                )})}
              </div>
              
              <div className="bg-[#1f2028] rounded-3xl p-8 border border-white/5 flex flex-col justify-between">
                <div>
                   <p className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-2">Total a Pagar</p>
                   <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span>${taxInfo.subtotal.toFixed(2)}</span></div>
                      {taxInfo.discountTotal > 0 && (
                        <div className="flex justify-between text-sm text-green-400"><span>Descuento</span><span>-${taxInfo.discountTotal.toFixed(2)}</span></div>
                      )}
                      {taxInfo.taxAmount > 0 && (
                        <div className="flex justify-between text-sm text-gray-400"><span>{taxSettings.taxType.toUpperCase()} ({taxSettings.taxRate * 100}%)</span><span>${taxInfo.taxAmount.toFixed(2)}</span></div>
                      )}
                   </div>
                   <p className="text-5xl font-black text-white">${taxInfo.total.toFixed(2)}</p>
                   {exchangeRate > 0 && <p className="text-orange-400/70 text-right text-xl mt-1">Bs. {formatCurrency(taxInfo.total * exchangeRate)}</p>}
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleProcessSale('cash')} className="py-6 bg-green-600 rounded-2xl font-bold text-white text-xl">Pagar Efectivo</button>
                  <button onClick={() => handleProcessSale('card')} className="py-6 bg-primary rounded-2xl font-bold text-white text-xl">Pagar Tarjeta</button>
                </div>
                <button onClick={() => { setIsCheckout(false); clearCart(); }} className="w-full py-4 text-red-400 font-bold hover:bg-red-500/10 rounded-2xl transition-all">Cancelar Operación</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Descuentos */}
      <AnimatePresence>
        {discountModalProductId !== null && (
          <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={() => setDiscountModalProductId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#1f2028] rounded-3xl p-6 w-full max-w-lg border border-white/10 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Descuentos Disponibles</h3>
                <button onClick={() => setDiscountModalProductId(null)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              {applicableDiscounts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay descuentos disponibles para este producto</p>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleApplyDiscount(discountModalProductId, null)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${!cartDiscounts[discountModalProductId] ? 'border-primary bg-primary/10' : 'border-[#2e303a] hover:border-gray-500'}`}
                  >
                    <p className="font-medium text-white">Sin descuento</p>
                  </button>
                  {applicableDiscounts.map(d => {
                    const isSelected = cartDiscounts[discountModalProductId]?.id === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => handleApplyDiscount(discountModalProductId, d)}
                        className={`w-full text-left p-4 rounded-xl border transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'border-[#2e303a] hover:border-gray-500'}`}
                      >
                        <p className="font-medium text-white">{d.name}</p>
                        <p className="text-sm text-gray-400">
                          {d.type === 'PERCENTAGE' ? `${d.value}% de descuento` : `Bs. ${d.value.toFixed(2)} de descuento`}
                        </p>
                        {d.min_purchase_amount > 0 && (
                          <p className="text-xs text-orange-400/70">Compra mínima: Bs. {d.min_purchase_amount.toFixed(2)}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
