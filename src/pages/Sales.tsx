import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, Package, User, UserPlus, CheckCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useCashStore, useCartStore } from '../store/useStore.ts';
import { useToast } from '../hooks/useToast.ts';
import { Product, Client } from '../common/types';

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const { activeRegister, setActiveRegister } = useCashStore();
  const { items: cart, addItem, removeItem, updateQty, clearCart, getTotal } = useCartStore();
  const { success, error: toastError } = useToast();
  
  const [selectedClient, setSelectedClient] = useState<{ id?: number; name: string }>({ id: 1, name: 'Cliente General' });
  const [customerData, setCustomerData] = useState({ name: '', dni: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | string | null>(null);

  const fetchData = async () => {
    if (window.api) {
      const p = await window.api.getAllProducts();
      const c = await window.api.getAllClients();
      const reg = await window.api.getOpenRegister();
      setProducts(p || []);
      setClients(c || []);
      setActiveRegister(reg || null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const total = getTotal();

  const generateTicketPDF = (saleId: number | string, cartItems: any[], clientName: string) => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 150] });
    doc.setFontSize(12);
    doc.text('INVENTARIO-POS', 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Ticket: #${saleId}`, 5, 20);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, 25);
    doc.text(`Cliente: ${clientName}`, 5, 30);
    doc.text('------------------------------------------', 5, 35);
    let y = 40;
    cartItems.forEach(item => {
      doc.text(`${item.qty} x ${item.name || item.sku}`, 5, y);
      doc.text(`$${(item.price * item.qty).toFixed(2)}`, 75, y, { align: 'right' });
      y += 5;
    });
    doc.text('------------------------------------------', 5, y + 2);
    doc.setFontSize(10);
    doc.text(`TOTAL: $${total.toFixed(2)}`, 75, y + 10, { align: 'right' });
    doc.setFontSize(8);
    doc.text('¡Gracias por su compra!', 40, y + 20, { align: 'center' });
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
        total: total
      };
      const itemsData = cart.map(item => ({
        product_id: item.id,
        quantity: item.qty,
        unit_price: item.price
      }));

      const result = await window.api.registerSale(saleData, itemsData);
      if (result.success) {
        const finalClientName = customerData.name || selectedClient.name;
        setLastSaleId(result.id);
        generateTicketPDF(result.id, cart, finalClientName);
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

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1f2028] border border-[#2e303a] rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-primary/50 transition-all shadow-sm" />
        </div>

        <div className="flex-1 bg-[#16171d] rounded-2xl border border-[#2e303a] overflow-hidden p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-360px)]">
            {(filteredProducts || []).map((product) => (
              <div key={product.id} onClick={() => addItem(product)} className="bg-[#1f2028] border border-[#2e303a] rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-[#252630] transition-colors group relative">
                <div className="aspect-square bg-black/40 rounded-lg mb-3 flex items-center justify-center"><Package className="w-10 h-10 text-primary/40" /></div>
                <h4 className="text-sm font-medium text-gray-200 truncate">{product.name || product.sku}</h4>
                <p className="text-primary font-bold mt-1">$ {product.price_sale.toFixed(2)}</p>
                <span className="absolute top-2 right-2 text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500">Stock: {product.stock ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-[400px] flex flex-col space-y-4">
        <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-[#2e303a] overflow-hidden shadow-2xl">
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#2e303a] bg-[#1f2028]">
             <div className="flex items-center text-white font-medium"><ShoppingCart className="w-5 h-5 mr-3 text-primary" /> Ticket</div>
             <span className="bg-primary/20 text-primary px-2.5 py-1 rounded-md text-xs font-bold">{cart.length} Ítems</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {cart.map((item) => (
               <div key={item.id} className="p-3 rounded-xl bg-[#16171d] border border-[#2e303a]">
                 <div className="flex justify-between items-start">
                   <span className="text-sm font-medium text-gray-200">{item.name || item.sku}</span>
                   <button onClick={() => removeItem(item.id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                 </div>
                 <div className="flex justify-between items-center mt-3">
                   <div className="flex items-center space-x-2 bg-[#1f2028] rounded-lg border border-[#2e303a]">
                     <button onClick={() => updateQty(item.id, item.qty - 1)} className="px-3 py-1 text-gray-400">-</button>
                     <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                     <button onClick={() => updateQty(item.id, item.qty + 1)} className="px-3 py-1 text-gray-400">+</button>
                   </div>
                   <span className="text-sm font-bold text-white">${(item.price * item.qty).toFixed(2)}</span>
                 </div>
               </div>
             ))}
          </div>
          <div className="bg-[#1f2028] p-6 border-t border-[#2e303a]">
             <div className="flex justify-between text-2xl font-bold text-white mb-6"><span>Total</span><span>${total.toFixed(2)}</span></div>
             <div className="grid grid-cols-2 gap-3">
                <button disabled={cart.length === 0 || isProcessing} onClick={() => handleProcessSale('cash')} className="flex items-center justify-center p-3 rounded-xl bg-[#2e303a] hover:bg-[#383b47] disabled:opacity-50 text-white font-medium transition-colors"><Banknote className="w-5 h-5 mr-2" /> Efectivo</button>
                <button disabled={cart.length === 0 || isProcessing} onClick={() => handleProcessSale('card')} className="flex items-center justify-center p-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium transition-colors shadow-lg shadow-primary/20"><CreditCard className="w-5 h-5 mr-2" /> Tarjeta</button>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#1f2028] border border-[#2e303a] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-green-500" /></div>
              <h3 className="text-2xl font-bold text-white mb-2">¡Venta Exitosa!</h3>
              <p className="text-gray-400 mb-6">La venta #{lastSaleId} se ha registrado y el ticket se ha descargado.</p>
              <button onClick={() => setShowSuccess(false)} className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all">Nueva Venta</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
