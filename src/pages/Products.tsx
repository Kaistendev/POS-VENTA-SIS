import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { PackagePlus, RefreshCw, X, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ sku: '', name: '', category_id: '', price_purchase: '', price_sale: '', stock: '0', min_stock: '10' });
  const [stockAmount, setStockAmount] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const [prodData, catData] = await Promise.all([
          window.api.getAllProducts(),
          window.api.getAllCategories()
        ]);
        setProducts(prodData || []);
        setCategories(catData || []);
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
    setFormData({ sku: '', name: '', category_id: '', price_purchase: '', price_sale: '', stock: '0', min_stock: '10' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category_id: product.category_id || '',
      price_purchase: product.price_purchase?.toString() || '',
      price_sale: product.price_sale?.toString() || '',
      stock: '0', // Not used for edits, stock is managed separately
      min_stock: product.min_stock?.toString() || '10'
    });
    setIsModalOpen(true);
  };

  const handleOpenStockModal = (product) => {
    setSelectedProduct(product);
    setStockAmount('');
    setIsStockModalOpen(true);
  };

  const handleCreateOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const productToSave = {
        sku: formData.sku,
        name: formData.name,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        price_purchase: parseFloat(formData.price_purchase) || 0,
        price_sale: parseFloat(formData.price_sale),
        min_stock: parseInt(formData.min_stock) || 10
      };

      // Only include initial stock if creating new
      if (!selectedProduct) {
        (productToSave as any).stock = parseInt(formData.stock) || 0;
      }

      const result = await window.api.createProduct(productToSave);

      if (result.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(result.message || 'Error al procesar producto');
      }
    } catch (err: any) {
      setError('Error de comunicación con el sistema');
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    try {
      const amount = parseInt(stockAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Ingresa una cantidad válida');
        return;
      }

      const result = await window.api.addProductStock(selectedProduct.id, amount);
      if (result.success) {
        setIsStockModalOpen(false);
        fetchData();
      } else {
        setError(result.message || 'Error al añadir stock');
      }
    } catch (err) {
      setError('Error de comunicación');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const result = await window.api.deleteProduct(id);
      if (result.success) {
        fetchData();
      } else {
        alert(result.message || 'Error al eliminar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'sku', headerName: 'SKU', width: 120 },
    { field: 'name', headerName: 'Nombre del Producto', flex: 1 },
    { 
      field: 'category_id', 
      headerName: 'Categoría', 
      width: 130,
      renderCell: (params) => {
        const cat = categories.find(c => c.id === params.value);
        return <span className="text-gray-300">{cat ? cat.name : 'Sin categoría'}</span>;
      }
    },
    { field: 'price_sale', headerName: 'Precio Venta', type: 'number', width: 120, renderCell: (params) => `$${params.value?.toFixed(2) || '0.00'}` },
    { field: 'stock', headerName: 'Stock', type: 'number', width: 100, renderCell: (params) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${params.value > params.row.min_stock ? 'bg-green-500/10 text-green-400' : params.value > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'}`}>
        {params.value || 0} u.
      </span>
    )},
    { 
      field: 'actions', 
      headerName: 'Acciones', 
      width: 150, 
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center h-full space-x-1">
          <button 
            onClick={() => handleOpenStockModal(params.row)}
            className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
            title="Añadir Stock"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleOpenEditModal(params.row)}
            className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeleteProduct(params.row.id)}
            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Productos</h2>
          <p className="text-gray-400 mt-1">Gestión de inventario y precios</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={fetchData} className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
          >
            <PackagePlus className="w-5 h-5 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full glass-panel rounded-2xl overflow-hidden p-1 flex flex-col"
      >
        <div style={{ flexGrow: 1, width: '100%' }}>
          <DataGrid
            rows={products}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 15 } } }}
            pageSizeOptions={[15, 30, 50]}
            disableRowSelectionOnClick
            autoHeight={false}
          />
        </div>
      </motion.div>

      {/* Modal para Crear/Editar Producto */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1f2028] border border-[#2e303a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#2e303a] flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateOrUpdateProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">SKU / Código</label>
                    <input 
                      required
                      disabled={!!selectedProduct}
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                      placeholder="PROD-001"
                    />
                  </div>
                  {!selectedProduct && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Stock Inicial</label>
                      <input 
                        required
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre del Producto</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                    placeholder="Ej: Coca Cola 600ml"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Categoría</label>
                    <select 
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Stock Mínimo</label>
                    <input 
                      required
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                      className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Precio Compra</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={formData.price_purchase}
                      onChange={(e) => setFormData({...formData, price_purchase: e.target.value})}
                      className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Precio Venta</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={formData.price_sale}
                      onChange={(e) => setFormData({...formData, price_sale: e.target.value})}
                      className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg bg-[#2e303a] hover:bg-[#383b47] text-white font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
                  >
                    {selectedProduct ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal para Añadir Stock Rápido */}
      <AnimatePresence>
        {isStockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1f2028] border border-[#2e303a] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#2e303a] flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Añadir Stock</h3>
                <button onClick={() => setIsStockModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddStock} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
                
                <div className="text-center mb-4">
                  <p className="text-gray-400 text-sm">Producto selecciondo:</p>
                  <p className="text-white font-bold">{selectedProduct?.name}</p>
                  <p className="text-primary text-xs mt-1">Stock actual: {selectedProduct?.stock} u.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cantidad a añadir</label>
                  <input 
                    required
                    type="number"
                    value={stockAmount}
                    onChange={(e) => setStockAmount(e.target.value)}
                    className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-3 px-4 text-white text-center text-2xl font-bold outline-none focus:border-primary/50 transition-all"
                    placeholder="0"
                    autoFocus
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsStockModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg bg-[#2e303a] text-white font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
