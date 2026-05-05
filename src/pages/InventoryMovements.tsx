import { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Package, RefreshCw, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.tsx';

export default function InventoryMovements() {
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const [movData, prodData] = await Promise.all([
          window.api.getAllMovements ? window.api.getAllMovements() : Promise.resolve([]),
          window.api.getAllProducts()
        ]);
        setMovements(movData || []);
        setProducts(prodData || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeBadge = (type: string) => {
    const isEntrada = type === 'ENTRADA';
    return (
      <div className="flex items-center">
        {isEntrada ? (
          <ArrowUpCircle className="w-4 h-4 mr-2 text-green-400" />
        ) : (
          <ArrowDownCircle className="w-4 h-4 mr-2 text-red-400" />
        )}
        <span className={isEntrada ? 'text-green-400' : 'text-red-400'}>
          {isEntrada ? 'Entrada' : 'Salida'}
        </span>
      </div>
    );
  };

  const getReasonBadge = (reason?: string) => {
    const map: Record<string, string> = {
      'COMPRA': 'Compra',
      'VENTA': 'Venta',
      'AJUSTE': 'Ajuste',
      'DEVOLUCION': 'Devolución',
      'INICIAL': 'Stock Inicial',
      'ROTURA': 'Rotura',
      'PERDIDA': 'Pérdida',
    };
    return (
      <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-300">
        {map[reason || reason] || reason || '-'}
      </span>
    );
  };

  const filteredMovements = selectedProduct
    ? movements.filter(m => m.product_id === selectedProduct)
    : movements;

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'product',
      headerName: 'Producto',
      flex: 1,
      renderCell: (params) => (
        <div>
          <div className="font-medium">{params.value?.name || `Producto #${params.row.product_id}`}</div>
          <div className="text-xs text-gray-500">{params.value?.sku}</div>
        </div>
      ),
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 120,
      renderCell: (params) => getTypeBadge(params.value),
    },
    {
      field: 'quantity',
      headerName: 'Cantidad',
      width: 100,
      renderCell: (params) => (
        <span className="font-bold">{params.value} u.</span>
      ),
    },
    {
      field: 'reason',
      headerName: 'Motivo',
      width: 120,
      renderCell: (params) => getReasonBadge(params.value),
    },
    {
      field: 'created_at',
      headerName: 'Fecha',
      width: 180,
      valueFormatter: (value) => formatDate(value),
    },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Movimientos</h2>
          <p className="text-gray-400 mt-1">Historial de movimientos de inventario</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedProduct || ''}
            onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
            className="bg-[#1f2028] border border-[#2e303a] rounded-lg px-4 py-2 text-white"
          >
            <option value="">Todos los productos</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full glass-panel rounded-2xl overflow-hidden p-1 flex flex-col border border-white/5 shadow-2xl"
      >
        {loading ? (
          <TableSkeleton rows={10} />
        ) : filteredMovements.length === 0 ? (
          <EmptyState
            icon={<History className="w-8 h-8" />}
            title="No hay movimientos"
            description="No hay movimientos de inventario registrados"
          />
        ) : (
          <div style={{ flexGrow: 1, width: '100%' }}>
            <DataGrid
              rows={filteredMovements}
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