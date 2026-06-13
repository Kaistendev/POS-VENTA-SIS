import { useState, useEffect } from 'react';
import { ShoppingBag, RefreshCw, X, PlusCircle, Truck, CheckCircle, XCircle, Clock, Search, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../hooks/useToast.ts';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import DataTable from '../components/ui/DataTable.tsx';
 
export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const { success, error: toastError } = useToast();
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    payment_status: 'UNPAID',
    items: [] as { product_id: number; quantity: number; unit_cost: number }[],
  });
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(purchases.length / itemsPerPage));
  const paginatedPurchases = purchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Product search state
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});
  const [productResults, setProductResults] = useState<Record<number, any[]>>({});
  const [searchTimeouts, setSearchTimeouts] = useState<Record<number, NodeJS.Timeout>>({});
  
  // Quick product creation
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [creatingForIndex, setCreatingForIndex] = useState<number>(-1);
  const [quickProduct, setQuickProduct] = useState({ name: '', sku: '', price_purchase: 0, supplier_id: 0 });

  // Product search handler
  const handleProductSearch = (index: number, searchTerm: string) => {
    setProductSearch(prev => ({ ...prev, [index]: searchTerm }));
    
    if (searchTimeouts[index]) clearTimeout(searchTimeouts[index]);
    
    const timeout = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setProductResults(prev => ({ ...prev, [index]: [] }));
        return;
      }
      try {
        if (window.api && window.api.getAllProducts) {
          const results = await window.api.getAllProducts(searchTerm);
          setProductResults(prev => ({ ...prev, [index]: Array.isArray(results) ? results : [] }));
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);
    
    setSearchTimeouts(prev => ({ ...prev, [index]: timeout }));
  };

  // Clear search results when clicking outside
  const clearProductSearch = (index: number) => {
    setTimeout(() => {
      setProductResults(prev => ({ ...prev, [index]: [] }));
    }, 200);
  };

  // Open quick product creation modal
  const openCreateProduct = (index: number) => {
    setCreatingForIndex(index);
    const supplierId = formData.supplier_id ? parseInt(formData.supplier_id) : 0;
    setQuickProduct({ name: productSearch[index] || '', sku: '', price_purchase: 0, supplier_id: supplierId });
    setIsCreateProductModalOpen(true);
  };

  // Handle quick product creation
  const handleQuickProductCreate = async () => {
    if (!quickProduct.name) return;
    
    try {
      const productData: any = {
        name: quickProduct.name,
        sku: quickProduct.sku,
        price_purchase: quickProduct.price_purchase,
        price_sale: quickProduct.price_purchase * 1.3, // Default 30% margin
        stock: 0,
      };

      // Associate with supplier if creating from a purchase
      if (quickProduct.supplier_id > 0) {
        productData.supplier_id = quickProduct.supplier_id;
      }

      const result = await window.api.createProduct(productData);

      if (result.success) {
        success(`Producto creado${quickProduct.supplier_id ? ' y asociado al proveedor' : ''}`);
        setIsCreateProductModalOpen(false);
        
        // Refresh products list
        const updatedProducts = await window.api.getAllProducts();
        setProducts(updatedProducts || []);
        
        // Auto-select the new product in the form
        if (creatingForIndex >= 0) {
          updateItem(creatingForIndex, 'product_id', result.id);
          updateItem(creatingForIndex, 'unit_cost', quickProduct.price_purchase);
          const supplierName = suppliers.find((s: any) => s.id === quickProduct.supplier_id)?.name || '';
          setProductSearch(prev => ({ 
            ...prev, 
            [creatingForIndex]: `${quickProduct.name} (${quickProduct.sku})${supplierName ? ` - ${supplierName}` : ''}` 
          }));
        }
      } else {
        toastError(result.message || 'Error al crear producto');
      }
    } catch (err) {
      console.error(err);
      toastError('Error de comunicación');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const [purData, supData, prodData] = await Promise.all([
          window.api.getAllPurchases(),
          window.api.getAllSuppliers(),
          window.api.getAllProducts(),
        ]);
        setPurchases(purData || []);
        setSuppliers(supData || []);
        setProducts(prodData || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'PENDING': 'bg-yellow-500/20 text-yellow-400',
      'RECEIVED': 'bg-green-500/20 text-green-400',
      'CANCELLED': 'bg-red-500/20 text-red-400',
    };

    const icons: Record<string, any> = {
      'PENDING': Clock,
      'RECEIVED': CheckCircle,
      'CANCELLED': XCircle,
    };

    const labels: Record<string, string> = {
      'PENDING': 'Pendiente',
      'RECEIVED': 'Recibido',
      'CANCELLED': 'Cancelado',
    };

    const Icon = icons[status] || Clock;

    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center ${styles[status] || ''}`}>
        <Icon className="w-3 h-3 mr-1" />
        {labels[status] || status}
      </span>
    );
  };

  const handleOpenCreateModal = () => {
    setSelectedPurchase(null);
    setFormData({ supplier_id: '', items: [] });
    setIsModalOpen(true);
  };

  const handleOpenDetails = (purchase: any) => {
    setSelectedPurchase(purchase);
    setIsModalOpen(true);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: 0, quantity: 1, unit_cost: 0 }],
    }));
  };

  // Track which items have been touched/modified
  const [touchedItems, setTouchedItems] = useState<Record<number, boolean>>({});

  const markItemTouched = (index: number) => {
    setTouchedItems(prev => ({ ...prev, [index]: true }));
  };

  // Check if form is valid (only used for submit)
  const isFormValid = () => {
    if (!formData.supplier_id) return false;
    if (formData.items.length === 0) return false;
    return formData.items.every(item => 
      item.product_id > 0 && item.quantity > 0 && item.unit_cost > 0
    );
  };

  // Get item validation state (only show after touched)
  const getItemError = (item: any, index: number) => {
    if (!touchedItems[index]) return null;
    if (!item.product_id || item.product_id === 0) return 'Selecciona un producto';
    if (item.quantity <= 0) return 'Cantidad inválida';
    if (item.unit_cost <= 0) return 'Costo inválido';
    return null;
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
    markItemTouched(index);
  };

  const removeItem = (index: number) => {
    setFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.supplier_id) {
      setError('Selecciona un proveedor');
      return;
    }

    if (formData.items.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    // Mark all items as touched on submit attempt
    const allTouched: Record<number, boolean> = {};
    formData.items.forEach((_, index) => { allTouched[index] = true; });
    setTouchedItems(allTouched);

    const invalidItem = formData.items.find(item => !item.product_id || item.quantity <= 0 || item.unit_cost <= 0);
    if (invalidItem) {
      const index = formData.items.indexOf(invalidItem);
      const error = getItemError(invalidItem, index);
      setError(`Error en item ${index + 1}: ${error}`);
      return;
    }

    try {
      const result = await window.api.createPurchase({
        supplier_id: Number(formData.supplier_id),
        payment_status: formData.payment_status,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      });

      if (result.success) {
        success('Orden de compra creada');
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(result.message || 'Error al crear orden');
      }
    } catch (err: any) {
      setError('Error de comunicación');
    }
  };

  const handleReceivePurchase = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Recibir Compra',
      message: '¿Confirmas que recibiste esta compra? Se incrementará el stock automáticamente.',
      variant: 'info',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const result = await window.api.receivePurchase(id);
          if (result.success) {
            success('Compra recibida - Stock actualizado');
            fetchData();
          } else {
            toastError(result.message || 'Error al recibir compra');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleCancelPurchase = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Cancelar Compra',
      message: '¿Estás seguro de cancelar esta compra?',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const result = await window.api.cancelPurchase(id);
          if (result.success) {
            success('Compra cancelada');
            fetchData();
          } else {
            toastError(result.message || 'Error al cancelar');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Compras</h2>
          <p className="text-gray-400 mt-1">Gestión de órdenes de compra a proveedores</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Nueva Orden
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { header: 'ID', render: (p: any) => <span className="font-medium text-white">#{p.id}</span> },
          { header: 'Proveedor', render: (p: any) => <span className="text-gray-300">{p.supplier?.name || 'N/A'}</span> },
          { header: 'Total', render: (p: any) => <span className="text-white font-medium">${Number(p.total_amount).toFixed(2)}</span> },
          { header: 'Estado', render: (p: any) => {
            const statusStyles: Record<string, string> = {
              PENDING: 'bg-yellow-500/20 text-yellow-400',
              RECEIVED: 'bg-green-500/20 text-green-400',
              CANCELLED: 'bg-red-500/20 text-red-400',
            };
            const statusLabels: Record<string, string> = {
              PENDING: 'Pendiente',
              RECEIVED: 'Recibida',
              CANCELLED: 'Anulada',
            };
            return (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusStyles[p.status] || 'bg-gray-500/20 text-gray-400'}`}>
                {statusLabels[p.status] || p.status}
              </span>
            );
          }},
          { header: 'Pago', render: (p: any) => (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              p.payment_status === 'PAID'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-orange-500/20 text-orange-400'
            }`}>
              {p.payment_status === 'PAID' ? 'Pagado' : 'Por Pagar'}
            </span>
          )},
          { header: 'Fecha', render: (p: any) => <span className="text-gray-400">{new Date(p.created_at).toLocaleDateString('es-ES')}</span> },
          { header: 'Acciones', headerClassName: 'text-right', className: 'text-right', render: (p: any) => (
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenDetails(p)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg" title="Ver detalles">
                <ShoppingBag className="w-4 h-4" />
              </button>
              {p.status === 'PENDING' && (
                <>
                  <button onClick={() => handleReceivePurchase(p.id)} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg" title="Recibir compra">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleCancelPurchase(p.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg" title="Cancelar">
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={async () => {
                  const newStatus = p.payment_status === 'PAID' ? 'UNPAID' : 'PAID';
                  await window.api.updatePurchasePaymentStatus(p.id, newStatus);
                  success(newStatus === 'PAID' ? 'Pagado' : 'Por Pagar');
                  fetchData();
                }}
                className={`p-2 rounded-lg transition-colors ${
                  p.payment_status === 'PAID'
                    ? 'text-orange-400 hover:bg-orange-400/10'
                    : 'text-green-400 hover:bg-green-400/10'
                }`}
                title={p.payment_status === 'PAID' ? 'Marcar como Por Pagar' : 'Marcar como Pagado'}
              >
                <DollarSign className="w-4 h-4" />
              </button>
            </div>
          )},
        ]}
        data={paginatedPurchases}
        keyExtractor={(p: any) => p.id}
        loading={loading}
        emptyMessage="No hay compras"
        emptyDescription="Crea tu primera orden de compra a un proveedor"
        emptyIcon={<ShoppingBag className="w-8 h-8" />}
        emptyAction={{ label: 'Crear Orden', onClick: handleOpenCreateModal }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={purchases.length}
        onPageChange={setCurrentPage}
      />

      {/* Modal para Crear/Ver Detalles */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1f2028] border border-[#2e303a] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-[#2e303a] flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-bold text-white">
                  {selectedPurchase ? 'Detalles de Compra' : 'Nueva Orden de Compra'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedPurchase ? (
                // Vista de detalles
                <div className="p-6 overflow-y-auto flex-1">
                  <div className="mb-6 p-4 bg-white/5 rounded-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Proveedor</p>
                        <p className="text-white font-medium">{selectedPurchase.supplier?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">RUC</p>
                        <p className="text-white">{selectedPurchase.supplier?.ruc}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Estado</p>
                        <div className="mt-1">{getStatusBadge(selectedPurchase.status)}</div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Pago</p>
                        <div className="mt-1">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            selectedPurchase.payment_status === 'PAID'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {selectedPurchase.payment_status === 'PAID' ? 'Pagado' : 'Por Pagar'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Fecha</p>
                        <p className="text-white">
                          {new Date(selectedPurchase.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-4">Productos</h4>
                  <div className="space-y-2">
                    {selectedPurchase.items?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.product?.name}</p>
                          <p className="text-xs text-gray-500">{item.product?.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">{item.quantity} u. × ${item.unit_cost.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            Total: ${(item.quantity * item.unit_cost).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#2e303a] flex justify-between items-center">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${selectedPurchase.total_amount?.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={async () => {
                        const newStatus = selectedPurchase.payment_status === 'PAID' ? 'UNPAID' : 'PAID';
                        await window.api.updatePurchasePaymentStatus(selectedPurchase.id, newStatus);
                        selectedPurchase.payment_status = newStatus;
                        setSelectedPurchase({ ...selectedPurchase });
                        success(newStatus === 'PAID' ? 'Compra marcada como pagada' : 'Compra marcada como por pagar');
                        fetchData();
                      }}
                      className={`flex-1 py-3 font-bold rounded-xl transition-all ${
                        selectedPurchase.payment_status === 'PAID'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      <DollarSign className="w-5 h-5 inline mr-2" />
                      {selectedPurchase.payment_status === 'PAID' ? 'Marcar como Por Pagar' : 'Marcar como Pagado'}
                    </button>
                  </div>

                  {selectedPurchase.status === 'PENDING' && (
                    <div className="mt-3 flex space-x-3">
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          handleReceivePurchase(selectedPurchase.id);
                        }}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                      >
                        <CheckCircle className="w-5 h-5 inline mr-2" />
                        Recibir Compra
                      </button>
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          handleCancelPurchase(selectedPurchase.id);
                        }}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                      >
                        <XCircle className="w-5 h-5 inline mr-2" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Formulario de creación
                <form onSubmit={handleCreatePurchase} className="p-6 space-y-4 overflow-y-auto flex-1">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">
                      Proveedor *
                    </label>
                    <select
                      required
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary transition-all"
                    >
                      <option value="">Seleccionar proveedor...</option>
                      {suppliers.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} - {s.ruc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">
                      Estado de Pago
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_status: 'UNPAID' })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          formData.payment_status === 'UNPAID'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-black/20 text-gray-500 border border-white/10'
                        }`}
                      >
                        Por Pagar
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_status: 'PAID' })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          formData.payment_status === 'PAID'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-black/20 text-gray-500 border border-white/10'
                        }`}
                      >
                        Pagado
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                        Productos *
                      </label>
                      <button
                        type="button"
                        onClick={addItem}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        + Agregar producto
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5 relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                              <input
                                type="text"
                                placeholder="Buscar producto por nombre o SKU..."
                                value={productSearch[index] || (item.product_id ? `${item.product_id}` : '')}
                                onChange={(e) => handleProductSearch(index, e.target.value)}
                                onBlur={() => clearProductSearch(index)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white text-sm outline-none focus:border-primary"
                              />
                            </div>
                            {/* Dropdown results */}
                            {productResults[index]?.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-[#1f2028] border border-[#2e303a] rounded-xl max-h-40 overflow-y-auto shadow-xl">
                                {productResults[index].map((p: any) => (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      updateItem(index, 'product_id', p.id);
                                      updateItem(index, 'unit_cost', p.price_purchase || 0);
                                      setProductSearch(prev => ({ ...prev, [index]: `${p.name} (${p.sku})` }));
                                      setProductResults(prev => ({ ...prev, [index]: [] }));
                                    }}
                                    className="p-2 hover:bg-white/5 cursor-pointer text-sm border-b border-white/5 last:border-0"
                                  >
                                    <div className="text-white">{p.name}</div>
                                    <div className="text-xs text-gray-500">{p.sku} - ${p.price_purchase?.toFixed(2) || '0.00'}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Create product option when no results */}
                            {productSearch[index] && productResults[index]?.length === 0 && productSearch[index].length >= 2 && (
                              <div className="absolute z-10 w-full mt-1 bg-[#1f2028] border border-[#2e303a] rounded-xl shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => openCreateProduct(index)}
                                  className="w-full p-3 text-left hover:bg-primary/10 text-primary text-sm flex items-center"
                                >
                                  <PlusCircle className="w-4 h-4 mr-2" />
                                  Crear "{productSearch[index]}" como nuevo producto
                                </button>
                              </div>
                            )}
                            {item.product_id > 0 && products.find((p: any) => p.id === item.product_id) && (
                              <p className="text-xs text-gray-400 mt-1">
                                {products.find((p: any) => p.id === item.product_id)?.name} ({products.find((p: any) => p.id === item.product_id)?.sku})
                              </p>
                            )}
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              placeholder="Cant."
                              value={item.quantity || ''}
                              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                              className={`w-full bg-black/20 border rounded-lg py-2 px-3 text-white text-sm outline-none focus:border-primary ${
                                item.quantity <= 0 ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              min="1"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              placeholder="Costo unit."
                              value={item.unit_cost || ''}
                              onChange={(e) => updateItem(index, 'unit_cost', Number(e.target.value))}
                              className={`w-full bg-black/20 border rounded-lg py-2 px-3 text-white text-sm outline-none focus:border-primary ${
                                item.unit_cost <= 0 ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <p className="text-white text-sm">
                              ${((item.quantity * item.unit_cost) || 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1 text-red-400 hover:bg-red-400/10 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Item validation error */}
                          {getItemError(item, index) && (
                            <div className="col-span-12">
                              <p className="text-xs text-red-400">{getItemError(item, index)}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {formData.items.length === 0 && (
                      <p className="text-center text-gray-500 text-sm py-4">
                        No hay productos agregados
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[#2e303a] flex justify-between items-center">
                    <span className="text-gray-400">Total estimado:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!isFormValid()}
                    className={`w-full py-4 text-white font-bold rounded-xl mt-4 shadow-lg transition-all ${
                      isFormValid() 
                        ? 'bg-primary shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]' 
                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Crear Orden de Compra
                  </button>
                </form>
              )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Quick Product Creation Modal */}
      <AnimatePresence>
        {isCreateProductModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1f2028] border border-[#2e303a] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#2e303a] flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-bold text-white">Crear Producto Rápido</h3>
                <button onClick={() => setIsCreateProductModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Show supplier info if creating from purchase */}
                {quickProduct.supplier_id > 0 && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-xs text-blue-400 font-medium">Se asociará al proveedor:</p>
                    <p className="text-white font-medium mt-1">
                      {suppliers.find((s: any) => s.id === quickProduct.supplier_id)?.name || 'Proveedor'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={quickProduct.name}
                    onChange={(e) => setQuickProduct({ ...quickProduct, name: e.target.value })}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-primary"
                    autoFocus
                    placeholder="Nombre del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={quickProduct.sku}
                    onChange={(e) => setQuickProduct({ ...quickProduct, sku: e.target.value })}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-primary"
                    placeholder="Código único (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Precio de Compra *
                  </label>
                  <input
                    type="number"
                    value={quickProduct.price_purchase || ''}
                    onChange={(e) => setQuickProduct({ ...quickProduct, price_purchase: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-primary"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El precio de venta se calculará automáticamente (30% margen)
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateProductModalOpen(false)}
                    className="px-4 py-2 bg-[#2e303a] text-gray-300 rounded-lg hover:bg-[#3e404a] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickProductCreate}
                    disabled={!quickProduct.name || quickProduct.price_purchase <= 0}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      quickProduct.name && quickProduct.price_purchase > 0
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Crear Producto
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
