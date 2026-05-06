import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { PackagePlus, RefreshCw, Pencil, Trash2, PlusCircle, MinusCircle, AlertCircle, Package } from 'lucide-react';
import { useToast } from '../hooks/useToast.ts';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.tsx';
import Modal from '../components/ui/Modal.tsx';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const [prodData, catData, supData] = await Promise.all([
          window.api.getAllProducts(),
          window.api.getAllCategories(),
          window.api.getAllSuppliers()
        ]);
        setProducts(prodData || []);
        setCategories(catData || []);
        setSuppliers(supData || []);
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

  const columns: GridColDef[] = [
    { field: 'sku', headerName: 'SKU', width: 120 },
    { field: 'name', headerName: 'Nombre', flex: 1 },
    { 
      field: 'category', 
      headerName: 'Categoría', 
      width: 150,
      renderCell: (params) => <span className="text-gray-400">{params.value?.name || 'General'}</span>
    },
    { 
      field: 'supplier', 
      headerName: 'Proveedor', 
      width: 180,
      renderCell: (params) => (
        <span className="text-gray-300 text-sm">
          {params.value?.name || <span className="text-gray-600 italic">Sin proveedor</span>}
        </span>
      )
    },
    { field: 'price_sale', headerName: 'Precio Venta', type: 'number', width: 120, renderCell: (params) => `$${params.value?.toFixed(2)}` },
    { 
      field: 'stock', 
      headerName: 'Stock', 
      type: 'number', 
      width: 120,
      renderCell: (params) => {
        const isLow = params.value <= params.row.min_stock;
        return (
          <div className="flex items-center">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${params.value === 0 ? 'bg-red-500/20 text-red-500' : isLow ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'}`}>
              {params.value} u.
            </span>
            {isLow && params.value > 0 && <AlertCircle className="w-3 h-3 ml-2 text-orange-500" />}
          </div>
        );
      }
    },
    { 
      field: 'actions', 
      headerName: 'Acciones', 
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center h-full space-x-1">
          <button onClick={() => handleOpenStockModal(params.row, 'ENTRADA')} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors" title="Aumentar Stock"><PlusCircle className="w-4 h-4" /></button>
          <button onClick={() => handleOpenStockModal(params.row, 'SALIDA')} className="p-2 text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors" title="Retirar Stock"><MinusCircle className="w-4 h-4" /></button>
          <button onClick={() => handleOpenEditModal(params.row)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDeleteClick(params.row.id, params.row.name)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  // Supplier filter state
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  const filteredProducts = selectedSupplier
    ? products.filter(p => p.supplier_id === parseInt(selectedSupplier))
    : products;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Productos</h2>
          <p className="text-gray-400 mt-1">Gestión de inventario y alertas de stock</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
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
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full glass-panel rounded-2xl overflow-hidden p-1 flex flex-col border border-white/5 shadow-2xl">
        {loading ? (
          <TableSkeleton rows={10} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="No hay productos"
            description={selectedSupplier ? "No hay productos de este proveedor" : "Agrega tu primer producto al inventario"}
            action={{ label: 'Agregar Producto', onClick: handleOpenCreateModal }}
          />
        ) : (
          <div style={{ flexGrow: 1, width: '100%' }}>
            <DataGrid
              rows={filteredProducts}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 15 } } }}
              pageSizeOptions={[15, 30, 50]}
              disableRowSelectionOnClick
              className="custom-datagrid"
            />
          </div>
        )}
      </div>

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
              <label className="block text-sm font-medium text-gray-300 mb-1">Proveedor *</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                required
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
    </div>
  );
}
