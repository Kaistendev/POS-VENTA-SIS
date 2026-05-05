import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Tag, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/useToast.ts';
import Modal from '../components/ui/Modal.tsx';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.tsx';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const { success, error: toastError } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [deleteTarget, setDeleteTarget] = useState<{id: number, name: string} | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.getAllCategories) {
        const data = await window.api.getAllCategories();
        setCategories(data || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: any) => {
    setSelectedCategory(cat);
    setFormData({
      name: cat.name || '',
      description: cat.description || ''
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
      if (selectedCategory) {
        result = await window.api.updateCategory(selectedCategory.id, formData);
      } else {
        result = await window.api.createCategory(formData);
      }

      if (result.success) {
        success(selectedCategory ? 'Categoría actualizada' : 'Categoría creada');
        setIsModalOpen(false);
        fetchCategories();
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
      await window.api.deleteCategory(deleteTarget.id);
      success('Categoría eliminada');
      setIsDeleteModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Nombre de Categoría', flex: 1 },
    { 
      field: 'actions', 
      headerName: 'Acciones', 
      width: 100, 
      sortable: false,
      renderCell: (params) => (
        <button 
          onClick={() => handleDeleteClick(params.row.id, params.row.name)}
          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Categorías</h2>
          <p className="text-gray-400 mt-1">Organización de productos</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={fetchCategories} className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-primary" /> Nueva Categoría
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!formData.name) return;
              
              window.api.createCategory({ name: formData.name })
                .then((result: any) => {
                  if (result) {
                    success('Categoría creada');
                    setFormData({ name: '', description: '' });
                    fetchCategories();
                  }
                });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#16171d] border border-[#2e303a] rounded-lg py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all"
                  placeholder="Ej: Bebidas, Lácteos..."
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors flex items-center justify-center"
              >
                <Tag className="w-4 h-4 mr-2" /> Guardar Categoría
              </button>
            </form>
          </div>
        </div>
        
        {/* Tabla */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex-1 w-full glass-panel rounded-2xl overflow-hidden p-1 flex flex-col border border-white/5 shadow-2xl">
            {loading ? (
              <TableSkeleton rows={10} />
            ) : categories.length === 0 ? (
              <EmptyState
                icon={<Tag className="w-8 h-8" />}
                title="No hay categorías"
                description="Crea tu primera categoría para organizar productos"
                action={{ label: 'Agregar Categoría', onClick: handleOpenCreateModal }}
              />
            ) : (
              <div style={{ flexGrow: 1, width: '100%' }}>
                <DataGrid
                  rows={categories}
                  columns={columns}
                  loading={loading}
                  getRowId={(row) => row.id}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 15 },
                    },
                  }}
                  pageSizeOptions={[15, 30]}
                  disableRowSelectionOnClick
                  autoHeight={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Crear/Editar Categoría */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        width="500px"
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
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {selectedCategory ? 'Actualizar' : 'Crear'}
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
