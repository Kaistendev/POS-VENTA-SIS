import { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { RefreshCw, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.tsx';

export default function CashHistory() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const data = await window.api.getAllRegisters();
        setRegisters(data || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const styles = {
      PERFECT: 'bg-green-500/20 text-green-400',
      SURPLUS: 'bg-blue-500/20 text-blue-400',
      MISSING: 'bg-red-500/20 text-red-400',
    };
    
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${styles[status as keyof typeof styles] || ''}`}>
        {status === 'PERFECT' ? '✓ Cuadrado' : status === 'SURPLUS' ? '➕ Sobra' : '➖ Falta'}
      </span>
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'opened_at',
      headerName: 'Fecha Apertura',
      width: 180,
      valueGetter: (value) => formatDate(value),
    },
    {
      field: 'opening_amount',
      headerName: 'Fondo Inicial',
      width: 140,
      renderCell: (params) => (
        <span className="text-green-400 font-medium">
          {formatCurrency(params.value)}
        </span>
      ),
    },
    {
      field: 'total_sales',
      headerName: 'Ventas Totales',
      width: 140,
      renderCell: (params) => (
        <span className="text-primary font-medium">
          {formatCurrency(params.value)}
        </span>
      ),
    },
    {
      field: 'expected_amount',
      headerName: 'Esperado',
      width: 140,
      renderCell: (params) => {
        const expected = Number(params.row.opening_amount) + Number(params.row.total_sales);
        return <span className="text-white font-medium">{formatCurrency(expected)}</span>;
      },
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 140,
      renderCell: (params) => getStatusBadge(params.row.status),
    },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Historial de Caja</h2>
          <p className="text-gray-400 mt-1">Auditoría de cierres de caja registradora</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full glass-panel rounded-2xl overflow-hidden p-1 flex flex-col border border-white/5 shadow-2xl"
      >
        {loading ? (
          <TableSkeleton rows={10} />
        ) : registers.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-8 h-8" />}
            title="No hay registros"
            description="No hay historial de cajas registradas"
          />
        ) : (
          <div style={{ flexGrow: 1, width: '100%' }}>
            <DataGrid
              rows={registers}
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
      </motion.div>
    </div>
  );
}