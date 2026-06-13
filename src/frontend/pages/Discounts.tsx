import { useState, useEffect } from 'react';
import { Percent, Plus, RefreshCw, Trash2, Pencil, Tag, Search } from 'lucide-react';
import { useToast } from '../hooks/useToast.ts';
import Modal from '../components/ui/Modal.tsx';
import DataTable from '../components/ui/DataTable.tsx';

export default function Discounts() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'PERCENTAGE',
    value: 0,
    is_active: true,
    applicable_to: 'ALL',
    category_id: null as number | null,
    product_ids: [] as number[],
    min_purchase_amount: null as number | null,
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(discounts.length / itemsPerPage));
  const paginatedDiscounts = discounts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.getDiscounts) {
        const data = await window.api.getDiscounts();
        setDiscounts(data || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      if (window.api && window.api.getAllCategories) {
        const data = await window.api.getAllCategories();
        setCategories(data || []);
      }
    } catch { }
  };

  const fetchProducts = async () => {
    try {
      if (window.api && window.api.getAllProducts) {
        const data = await window.api.getAllProducts();
        setProducts(data || []);
      }
    } catch { }
  };

  useEffect(() => {
    fetchDiscounts();
    fetchCategories();
    fetchProducts();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedDiscount(null);
    setFormData({
      name: '',
      type: 'PERCENTAGE',
      value: 0,
      is_active: true,
      applicable_to: 'ALL',
      category_id: null,
      product_ids: [],
      min_purchase_amount: null,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (discount: any) => {
    setSelectedDiscount(discount);
    setFormData({
      name: discount.name || '',
      type: discount.type || 'PERCENTAGE',
      value: discount.value || 0,
      is_active: discount.is_active ?? true,
      applicable_to: discount.applicable_to || 'ALL',
      category_id: discount.category_id ?? null,
      product_ids: discount.products?.map((p: any) => p.product_id) || [],
      min_purchase_amount: discount.min_purchase_amount ?? null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toastError('El nombre es requerido');
      return;
    }

    try {
      let result;
      const payload = {
        ...formData,
        category_id: formData.applicable_to === 'CATEGORY' ? formData.category_id : null,
        product_ids: formData.applicable_to === 'SPECIFIC' ? formData.product_ids : [],
      };

      if (selectedDiscount) {
        result = await window.api.updateDiscount(selectedDiscount.id, payload);
      } else {
        result = await window.api.createDiscount(payload);
      }

      if (result.success) {
        success(selectedDiscount ? 'Descuento actualizado' : 'Descuento creado');
        setIsModalOpen(false);
        fetchDiscounts();
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await window.api.deleteDiscount(deleteTarget.id);
      success('Descuento eliminado');
      setIsDeleteModalOpen(false);
      fetchDiscounts();
    } catch { }
  };

  const toggleProductSelection = (productId: number) => {
    setFormData((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter((id) => id !== productId)
        : [...prev.product_ids, productId],
    }));
  };

  const filteredProducts = products.filter(
    (p) =>
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const columns = [
    { header: 'Nombre', className: 'font-medium text-white', render: (d: any) => d.name },
    {
      header: 'Tipo',
      render: (d: any) => (d.type === 'PERCENTAGE' ? 'Porcentaje' : 'Monto Fijo'),
    },
    {
      header: 'Valor',
      render: (d: any) =>
        d.type === 'PERCENTAGE' ? `${d.value}%` : `Bs. ${d.value.toFixed(2)}`,
    },
    {
      header: 'Aplicable a',
      render: (d: any) =>
        d.applicable_to === 'ALL'
          ? 'Todos los productos'
          : d.applicable_to === 'CATEGORY'
            ? `Categoría`
            : 'Productos específicos',
    },
    {
      header: 'Activo',
      render: (d: any) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
        >
          {d.is_active ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (d: any) => (
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleOpenEditModal(d)}
            className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(d.id, d.name)}
            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Descuentos</h2>
          <p className="text-gray-400 mt-1">Reglas de descuento para productos</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchDiscounts}
            className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Nuevo Descuento
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedDiscounts}
        keyExtractor={(d: any) => d.id}
        loading={loading}
        emptyMessage="No hay descuentos"
        emptyDescription="Crea tu primer descuento para aplicar en el POS"
        emptyIcon={<Percent className="w-8 h-8" />}
        emptyAction={{ label: 'Nuevo Descuento', onClick: handleOpenCreateModal }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={discounts.length}
        onPageChange={setCurrentPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDiscount ? 'Editar Descuento' : 'Nuevo Descuento'}
        width="600px"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="PERCENTAGE">Porcentaje</option>
                <option value="FIXED_AMOUNT">Monto Fijo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Valor
                <span className="text-gray-500 ml-1">
                  {formData.type === 'PERCENTAGE' ? '(%)' : '(Bs.)'}
                </span>
              </label>
              <input
                type="number"
                step={formData.type === 'PERCENTAGE' ? '1' : '0.01'}
                min="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Aplicable a</label>
            <select
              value={formData.applicable_to}
              onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="ALL">Todos los productos</option>
              <option value="CATEGORY">Por categoría</option>
              <option value="SPECIFIC">Productos específicos</option>
            </select>
          </div>

          {formData.applicable_to === 'CATEGORY' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
              <select
                value={formData.category_id ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : null })
                }
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                required={formData.applicable_to === 'CATEGORY'}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.applicable_to === 'SPECIFIC' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Productos</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-9 pr-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-[#2e303a] rounded-lg divide-y divide-[#2e303a]">
                {filteredProducts.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center px-3 py-2 hover:bg-[#1f2028] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.product_ids.includes(p.id)}
                      onChange={() => toggleProductSelection(p.id)}
                      className="mr-3 accent-primary"
                    />
                    <span className="text-sm text-gray-300 flex-1">{p.name}</span>
                    <span className="text-xs text-gray-500">{p.sku}</span>
                  </label>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-3">Sin resultados</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Monto mínimo de compra <span className="text-gray-500">(opcional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.min_purchase_amount ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  min_purchase_amount: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              placeholder="Dejar vacío para aplicar sin mínimo"
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-300">Activo</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-primary' : 'bg-[#2e303a]'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-6' : ''}`}
              />
            </button>
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
              {selectedDiscount ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

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
