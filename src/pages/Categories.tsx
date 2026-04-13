import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Tag, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Category } from '../common/types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');

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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setError('');
    try {
      const result = await window.api.createCategory({ name: newCategoryName });
      if (result) {
        setNewCategoryName('');
        fetchCategories();
      } else {
        setError('Error al crear categoría');
      }
    } catch (err: any) {
      setError('Error de comunicación');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
    
    try {
      await window.api.deleteCategory(id);
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
      renderCell: (params) => (
        <button 
          onClick={() => handleDeleteCategory(params.row.id)}
          className="p-2 text-red-400 hover:text-red-300 transition-colors"
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
        <button onClick={fetchCategories} className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-primary" /> Nueva Categoría
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                <input 
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 w-full glass-panel rounded-2xl overflow-hidden p-1 flex flex-col"
          >
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
