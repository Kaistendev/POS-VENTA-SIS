import { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Truck, RefreshCw, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast.ts';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.tsx';
import Modal from '../components/ui/Modal.tsx';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const { success, error: toastError } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({ 
    name: '', 
    ruc: '', 
    phone: '', 
    email: '', 
    address: '' 
  });
  const [deleteTarget, setDeleteTarget] = useState<{id: number, name: string} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const data = await window.api.getAllSuppliers();
        setSuppliers(data || []);
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

  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Nombre', 
      flex: 1,
      renderCell: (params) => (
        <div>
          <div className="font-medium text-white">{params.value}</div>
          <div className="text-xs text-gray-500">{params.row.ruc}</div>
        </div>
      )
    },
    { 
      field: 'ruc', 
      headerName: 'RUC', 
      width: 150,
      renderCell: (params) => params.value || <span className="text-gray-600">-</span>
    },
    { 
      field: 'phone', 
      headerName: 'Teléfono', 
      width: 130,
      renderCell: (params) => params.value || <span className="text-gray-600">-</span>
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      width: 200,
      renderCell: (params) => params.value || <span className="text-gray-600">-</span>
    },
    { 
      field: '_count', 
      headerName: 'Productos', 
      width: 100,
      renderCell: (params) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400">
          {params.value?.products || 0}
        </span>
      )
    },
    { 
      field: 'actions', 
      headerName: 'Acciones', 
      width: 150, 
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center h-full space-x-1">
          <button 
            onClick={() => handleOpenEditModal(params.row)} 
            className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" 
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeleteClick(params.row.id, params.row.name)} 
            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
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
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Proveedores</h2>
          <p className="text-gray-400 mt-1">Gestión de proveedores para compras</p>
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
            Nuevo Proveedor
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full glass-panel rounded-2xl overflow-hidden p-1 flex flex-col border border-white/5 shadow-2xl">
        {loading ? (
          <TableSkeleton rows={10} />
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={<Truck className="w-8 h-8" />}
            title="No hay proveedores"
            description="Agrega tu primer proveedor para gestionar compras"
            action={{ label: 'Agregar Proveedor', onClick: handleOpenCreateModal }}
          />
        ) : (
          <div style={{ flexGrow: 1, width: '100%' }}>
            <DataGrid
              rows={suppliers}
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
