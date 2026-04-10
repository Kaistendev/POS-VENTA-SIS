import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { UserPlus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.getAllClients) {
        const data = await window.api.getAllClients();
        setClients(data || []);
      } else {
        // Mock data
        setClients([
          { id: 1, code: 'CL-001', name: 'Juan Perez', tax_id: '12345678A', phone: '555-0100' },
          { id: 2, code: 'CL-002', name: 'Maria Garcia', tax_id: '87654321B', phone: '555-0101' },
          { id: 3, code: 'CL-003', name: 'Empresa XYZ', tax_id: 'B1234567', phone: '555-0102' },
        ]);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'code', headerName: 'Código', width: 130 },
    { field: 'name', headerName: 'Nombre / Razón Social', flex: 1 },
    { field: 'tax_id', headerName: 'RFC/NIF', width: 160 },
    { field: 'phone', headerName: 'Teléfono', width: 160 },
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
          <button className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors shadow-lg shadow-primary/20">
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
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 15 },
              },
            }}
            pageSizeOptions={[15, 30, 50]}
            disableRowSelectionOnClick
            autoHeight={false}
          />
        </div>
      </motion.div>
    </div>
  );
}
