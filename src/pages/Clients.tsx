import { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { UserPlus, RefreshCw, X, Pencil, Trash2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '../common/types';
import { useToast } from '../hooks/useToast.ts';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { success, error: toastError } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    dni: '',
    tax_id: '',
    phone: ''
  });

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
      code: `CLI-${Math.floor(Math.random() * 10000)}`, // Generar código sugerido
      name: '',
      dni: '',
      tax_id: '',
      phone: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      code: client.code,
      name: client.name,
      dni: client.dni,
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      const result = await window.api.deleteClient(id);
      if (result.success) {
        success('Cliente eliminado');
        fetchClients();
      } else {
        toastError(result.message || 'Error al eliminar');
      }
    } catch (err) {
      toastError('Error al eliminar cliente');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'code', headerName: 'Código', width: 120 },
    { field: 'name', headerName: 'Nombre / Razón Social', flex: 1 },
    { field: 'dni', headerName: 'DNI / ID', width: 130 },
    { field: 'tax_id', headerName: 'RFC/NIF', width: 130 },
    { field: 'phone', headerName: 'Teléfono', width: 130 },
    { 
      field: 'actions', 
      headerName: 'Acciones', 
      width: 120, 
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center h-full space-x-2">
          <button 
            onClick={() => handleOpenEditModal(params.row)}
            className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(params.row.id)}
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
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Clientes</h2>
          <p className="text-gray-400 mt-1">Directorio de clientes y empresas</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={fetchClients} className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Nuevo Cliente
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
            rows={clients}
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

      {/* Modal para Crear/Editar Cliente */}
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
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Código</label>
                    <input 
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                      placeholder="CLI-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">DNI / Documento</label>
                    <input 
                      required
                      value={formData.dni}
                      onChange={(e) => setFormData({...formData, dni: e.target.value})}
                      className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                      placeholder="ID del cliente"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Completo / Razón Social</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                    placeholder="Ej: Juan Pérez o Empresa S.A."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">RFC / NIT / TAX_ID</label>
                    <input 
                      value={formData.tax_id}
                      onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                      className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
                    <input 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                      placeholder="Ej: +123 456 789"
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
                    {selectedClient ? 'Actualizar' : 'Guardar'}
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
