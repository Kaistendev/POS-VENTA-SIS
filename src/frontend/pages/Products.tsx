import React, { useState, useEffect } from 'react';
import DataTable from '../components/ui/DataTable.tsx';
import { PackagePlus, RefreshCw, Pencil, Trash2, PlusCircle, MinusCircle, AlertCircle, Package, Search } from 'lucide-react';
import { useToast } from '../hooks/useToast.ts';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.tsx';
import Modal from '../components/ui/Modal.tsx';
import { formatCurrency } from '../lib/utils.ts';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { success, error: toastError } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({ 
    sku: '', 
    name: '', 
    category_id: '', 
    supplier_id: '',
    price_purchase: '', 
    price_sale: '', 
    stock: '0', 
    min_stock: '10' 
  });
  const [stockAdjustment, setStockAdjustment] = useState({ 
    amount: '', 
    reason: 'COMPRA', 
    type: 'ENTRADA' 
  });
  const [deleteTarget, setDeleteTarget] = useState<{id: number, name: string} | null>(null);
  const [isBulkPriceModal, setIsBulkPriceModal] = useState(false);
  const [bulkPriceData, setBulkPriceData] = useState({ percentage: 10, category_id: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const [prodData, catData, supData, settings] = await Promise.all([
          window.api.getAllProducts(),
          window.api.getAllCategories(),
          window.api.getAllSuppliers(),
          window.api.getSettings(),
        ]);
        setProducts(prodData || []);
        setCategories(catData || []);
        setSuppliers(supData || []);
        setExchangeRate(parseFloat(settings?.exchange_rate_usd_ves) || 0);
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
    setSelectedProduct(null);
    setFormData({ 
      sku: '', 
      name: '', 
      category_id: '', 
      supplier_id: '',
      price_purchase: '', 
      price_sale: '', 
      stock: '0', 
      min_stock: '10' 
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      category_id: product.category_id ? product.category_id.toString() : '',
      supplier_id: product.supplier_id ? product.supplier_id.toString() : '',
      price_purchase: product.price_purchase?.toString() || '',
      price_sale: product.price_sale?.toString() || '',
      stock: '0',
      min_stock: product.min_stock?.toString() || '10'
    });
    setIsModalOpen(true);
  };

  const handleOpenStockModal = (product: any, type: 'ENTRADA' | 'SALIDA' = 'ENTRADA') => {
    setSelectedProduct(product);
    setStockAdjustment({ 
      amount: '', 
      reason: type === 'ENTRADA' ? 'COMPRA' : 'AJUSTE', 
      type 
    });
    setIsStockModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        sku: formData.sku,
        name: formData.name,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        price_purchase: parseFloat(formData.price_purchase) || 0,
        price_sale: parseFloat(formData.price_sale),
        min_stock: parseInt(formData.min_stock) || 10,
        stock: selectedProduct ? undefined : (parseInt(formData.stock) || 0)
      };

      let result;
      if (selectedProduct) {
        result = await window.api.updateProduct(selectedProduct.id, productData);
      } else {
        result = await window.api.createProduct(productData);
      }

      if (result.success) {
        success(selectedProduct ? 'Producto actualizado' : 'Producto creado');
        setIsModalOpen(false);
        fetchData();
      } else {
        toastError(result.message || 'Error al guardar');
      }
    } catch (err: any) {
      toastError('Error de comunicación');
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    try {
      const amount = parseInt(stockAdjustment.amount);
      if (isNaN(amount) || amount <= 0) {
        toastError('Ingresa una cantidad válida');
        return;
      }

      let result;
      if (stockAdjustment.type === 'ENTRADA') {
        result = await window.api.addProductStock(selectedProduct.id, amount, undefined, stockAdjustment.reason);
      } else {
        result = await window.api.removeProductStock(selectedProduct.id, amount, undefined, stockAdjustment.reason);
      }

      if (result.success) {
        success('Inventario actualizado');
        setIsStockModalOpen(false);
        fetchData();
      } else {
        toastError(result.message || 'Error al ajustar stock');
      }
    } catch (err) {
      toastError('Error de comunicación');
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteTarget({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    try {
      const result = await window.api.deleteProduct(deleteTarget.id);
      if (result.success) {
        success('Producto eliminado');
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        toastError(result.message || 'Error al eliminar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBulkModal = () => {
    setBulkPriceData({ percentage: 10, category_id: '' });
    setIsBulkPriceModal(true);
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: { percentage: number; category_id?: number } = {
        percentage: bulkPriceData.percentage,
      };
      if (bulkPriceData.category_id) {
        data.category_id = parseInt(bulkPriceData.category_id);
      }
      const result = await window.api.bulkUpdatePrice(data);
      if (result.success) {
        success(`Precios actualizados (${result.updatedCount || 0} productos)`);
        setIsBulkPriceModal(false);
        fetchData();
      } else {
        toastError(result.message || 'Error al actualizar precios');
      }
    } catch (err: any) {
      toastError(err?.message || 'Error de comunicación');
    }
  };



  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  const filteredProducts = products.filter(p => {
    if (selectedSupplier && p.supplier_id !== parseInt(selectedSupplier)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = p.name?.toLowerCase().includes(term);
      const matchesSku = p.sku?.toLowerCase().includes(term);
      if (!matchesName && !matchesSku) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Productos</h2>
          <p className="text-gray-400 mt-1">Gestión de inventario y alertas de stock</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="bg-[#1f2028] border border-[#2e303a] rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-primary outline-none transition-all w-64"
            />
          </div>
          <select
            value={selectedSupplier}
            onChange={(e) => { setSelectedSupplier(e.target.value); setCurrentPage(1); }}
            className="bg-[#1f2028] border border-[#2e303a] rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button onClick={fetchData} className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleOpenBulkModal}
            className="flex items-center px-4 py-2 bg-[#2e303a] hover:bg-[#3e404a] text-white rounded-xl font-bold transition-all"
          >
            <Package className="w-5 h-5 mr-2" />
            Aumentar Precios
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>
      
      <DataTable
        columns={[
          { header: 'SKU', render: (p) => <span className="font-medium text-white">{p.sku}</span> },
          { header: 'Nombre', render: (p) => <span className="text-gray-300">{p.name}</span> },
          { header: 'Categoría', render: (p) => <span className="text-gray-400">{p.category?.name || 'General'}</span> },
          { header: 'Proveedor', render: (p) => p.supplier?.name || <span className="text-gray-600 italic">Sin proveedor</span> },
          { header: 'Precio USD', className: 'text-white', render: (p) => `$${p.price_sale?.toFixed(2)}` },
          { header: 'Precio Bs.', className: 'text-orange-400 font-medium', render: (p) => `Bs. ${formatCurrency((p.price_sale || 0) * exchangeRate)}` },
          { header: 'Stock', render: (p) => (
            <div className="flex items-center">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${p.stock === 0 ? 'bg-red-500/20 text-red-500' : p.stock <= (p.min_stock ?? 0) ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'}`}>
                {p.stock} u.
              </span>
              {p.stock <= (p.min_stock ?? 0) && p.stock > 0 && <AlertCircle className="w-3 h-3 ml-1 inline text-orange-500" />}
            </div>
          )},
          { header: 'Acciones', headerClassName: 'text-right', className: 'text-right', render: (p) => (
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenStockModal(p, 'ENTRADA')} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg" title="Aumentar Stock"><PlusCircle className="w-4 h-4" /></button>
              <button onClick={() => handleOpenStockModal(p, 'SALIDA')} className="p-2 text-orange-400 hover:bg-orange-400/10 rounded-lg" title="Retirar Stock"><MinusCircle className="w-4 h-4" /></button>
              <button onClick={() => handleOpenEditModal(p)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg" title="Editar"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDeleteClick(p.id, p.name)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
            </div>
          )},
        ]}
        data={paginatedProducts}
        keyExtractor={(p) => p.id}
        loading={loading}
        emptyMessage="No hay productos"
        emptyDescription={searchTerm ? "No se encontraron productos con ese nombre o código" : selectedSupplier ? "No hay productos de este proveedor" : "Agrega tu primer producto al inventario"}
        emptyIcon={<Package className="w-8 h-8" />}
        emptyAction={{ label: 'Agregar Producto', onClick: handleOpenCreateModal }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredProducts.length}
        onPageChange={setCurrentPage}
      />

      {/* Modal para Crear/Editar Producto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
        width="600px"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="">General</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Proveedor</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="">Seleccionar proveedor...</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Precio Compra</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_purchase}
                onChange={(e) => setFormData({ ...formData, price_purchase: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Precio Venta *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_sale}
                onChange={(e) => setFormData({ ...formData, price_sale: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Stock inicial</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                disabled={!!selectedProduct}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Stock mínimo</label>
              <input
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
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
              {selectedProduct ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Ajuste de Stock */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={stockAdjustment.type === 'ENTRADA' ? 'Aumentar Stock' : 'Retirar Stock'}
        width="450px"
      >
        <form onSubmit={handleStockAdjustment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Producto</label>
            <div className="px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white">
              {selectedProduct?.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Cantidad *</label>
            <input
              type="number"
              min="1"
              value={stockAdjustment.amount}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, amount: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Razón</label>
            <select
              value={stockAdjustment.reason}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="COMPRA">Compra</option>
              <option value="AJUSTE">Ajuste</option>
              <option value="DONACION">Donación</option>
              <option value="CADUCIDAD">Caducidad</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2 bg-[#2e303a] text-gray-300 rounded-lg hover:bg-[#3e404a] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                stockAdjustment.type === 'ENTRADA' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {stockAdjustment.type === 'ENTRADA' ? 'Agregar' : 'Retirar'}
            </button>
          </div>
        </form>
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

      {/* Modal de Aumento Masivo de Precios */}
      <Modal
        isOpen={isBulkPriceModal}
        onClose={() => setIsBulkPriceModal(false)}
        title="Aumentar Precios Masivamente"
        width="500px"
      >
        <form onSubmit={handleBulkUpdate} className="space-y-4">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-orange-300 font-medium">¿Estás seguro?</p>
              <p className="text-xs text-gray-400 mt-1">
                Se actualizará el precio de venta de todos los productos
                {bulkPriceData.category_id ? ' de la categoría seleccionada' : ''}.
                {bulkPriceData.percentage >= 0 ? ' Los precios aumentarán' : ' Los precios se reducirán'} un {Math.abs(bulkPriceData.percentage)}%.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Porcentaje (%) *</label>
            <div className="relative">
              <input
                type="number"
                min="-100"
                max="1000"
                value={bulkPriceData.percentage}
                onChange={(e) => setBulkPriceData({ ...bulkPriceData, percentage: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                required
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Positivo para aumentar, negativo para reducir.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Categoría (opcional)</label>
            <select
              value={bulkPriceData.category_id}
              onChange={(e) => setBulkPriceData({ ...bulkPriceData, category_id: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Si no seleccionas, se aplicará a todos los productos.</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsBulkPriceModal(false)}
              className="px-4 py-2 bg-[#2e303a] text-gray-300 rounded-lg hover:bg-[#3e404a] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Aplicar {bulkPriceData.percentage >= 0 ? 'Aumento' : 'Reducción'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
