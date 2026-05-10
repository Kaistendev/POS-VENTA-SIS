import { useState, useEffect } from 'react';
import DataTable from '../components/ui/DataTable.tsx';
import { UserPlus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/useToast.ts';
import Modal from '../components/ui/Modal.tsx';

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const { success, error: toastError } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    dni: '',
    tax_id: '',
    phone: ''
  });
  const [deleteTarget, setDeleteTarget] = useState<{id: number, name: string} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(clients.length / itemsPerPage));
  const paginatedClients = clients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchClients = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.getAllClients) {
        const data = await window.api.getAllClients();
        setClients(data || []);
      }
    } catch (error) {
      console.error(error);
      toastError('Error al cargar clientes');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedClient(null);
    setFormData({
      code: `CLI-${Math.floor(Math.random() * 10000)}`,
      name: '',
      dni: '',
      tax_id: '',
      phone: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: any) => {
    setSelectedClient(client);
    setFormData({
      code: client.code,
      name: client.name,
      dni: client.dni || '',
      tax_id: client.tax_id || '',
      phone: client.phone || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let result;
      if (selectedClient) {
        result = await window.api.updateClient(selectedClient.id, formData);
      } else {
        result = await window.api.createClient(formData);
      }

      if (result.success) {
        success(selectedClient ? 'Cliente actualizado' : 'Cliente creado');
        setIsModalOpen(false);
        fetchClients();
      } else {
        toastError(result.message || 'Error al procesar cliente');
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
      const result = await window.api.deleteClient(deleteTarget.id);
      if (result.success) {
        success('Cliente eliminado');
        setIsDeleteModalOpen(false);
        fetchClients();
      } else {
        toastError(result.message || 'Error al eliminar');
      }
    } catch (err) {
      toastError('Error al eliminar cliente');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Clientes</h2>
          <p className="text-gray-400 mt-1">Directorio de clientes y empresas</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={fetchClients} className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Nuevo Cliente
          </button>
        </div>
      </div>
      
      <DataTable
        columns={[
          { header: 'ID', className: 'font-medium text-white', render: (c) => `#${c.id}` },
          { header: 'Código', render: (c) => c.code },
          { header: 'Nombre / Razón Social', render: (c) => c.name },
          { header: 'DNI / ID', render: (c) => c.dni || '—' },
          { header: 'RFC/NIF', render: (c) => c.tax_id || '—' },
          { header: 'Teléfono', render: (c) => c.phone || '—' },
          {
            header: 'Acciones',
            headerClassName: 'text-right',
            render: (c) => (
              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEditModal(c)}
                  className="p-2 hover:bg-blue-400/10 rounded-lg text-blue-400 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(c.id, c.name)}
                  className="p-2 hover:bg-red-400/10 rounded-lg text-red-400 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]}
        data={paginatedClients}
        keyExtractor={(c) => c.id}
        loading={loading}
        emptyMessage="No hay clientes"
        emptyDescription="Agrega tu primer cliente al sistema"
        emptyIcon={<UserPlus className="w-8 h-8" />}
        emptyAction={{ label: 'Agregar Cliente', onClick: handleOpenCreateModal }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={clients.length}
        onPageChange={setCurrentPage}
      />

      {/* Modal para Crear/Editar Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        width="500px"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Código
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

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
              DNI / Documento
            </label>
            <input
              type="text"
              value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              RFC/NIF
            </label>
            <input
              type="text"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
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
              {selectedClient ? 'Actualizar' : 'Crear'}
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
