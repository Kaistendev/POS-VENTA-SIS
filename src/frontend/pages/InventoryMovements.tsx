import { useState, useEffect } from 'react';
import DataTable from '../components/ui/DataTable.tsx';
import { Package, RefreshCw, ArrowUpCircle, ArrowDownCircle, History, Search, Filter, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryMovements() {
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterReason, setFilterReason] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  const query = debouncedSearch.toLowerCase().trim();

  const displayMovements = (() => {
    let result = filteredMovements;

    // Filter by type
    if (filterType) {
      result = result.filter(m => m.type === filterType);
    }

    // Filter by reason
    if (filterReason) {
      result = result.filter(m => m.reason === filterReason);
    }

    // Filter by date range
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      result = result.filter(m => new Date(m.created_at) >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(m => new Date(m.created_at) <= to);
    }

    // Filter by search term
    if (query) {
      result = result.filter(m => {
        const prod = m.product ?? {};
        const name = (prod.name ?? '').toLowerCase();
        const sku = (prod.sku ?? '').toLowerCase();
        return name.includes(query) || sku.includes(query);
      });
    }

    return result;
  })();

  // Stats calculation
  const totalEntradas = displayMovements.filter(m => m.type === 'ENTRADA').length;
  const totalSalidas = displayMovements.filter(m => m.type === 'SALIDA').length;

  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(displayMovements.length / itemsPerPage));
  const paginatedMovements = displayMovements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white m-0 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            Movimientos de Inventario
          </h2>
          <p className="text-gray-400 text-sm mt-1">Historial completo de entradas y salidas</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-[#1f2028] text-gray-300 hover:text-white border border-[#2e303a] transition-colors shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#1f2028] border border-[#2e303a] rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs">Total Movimientos</p>
            <p className="text-2xl font-bold text-white mt-1">{displayMovements.length}</p>
          </div>
          <Package className="w-8 h-8 text-blue-400/30" />
        </div>
        <div className="bg-[#1f2028] border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-green-400 text-xs">Entradas</p>
            <p className="text-2xl font-bold text-green-400 mt-1">+{totalEntradas}</p>
          </div>
          <ArrowUpCircle className="w-8 h-8 text-green-400/30" />
        </div>
        <div className="bg-[#1f2028] border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-red-400 text-xs">Salidas</p>
            <p className="text-2xl font-bold text-red-400 mt-1">-{totalSalidas}</p>
          </div>
          <ArrowDownCircle className="w-8 h-8 text-red-400/30" />
        </div>
        <div className="bg-[#1f2028] border border-[#2e303a] rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs">Productos Únicos</p>
            <p className="text-2xl font-bold text-white mt-1">
              {new Set(displayMovements.map(m => m.product_id)).size}
            </p>
          </div>
          <Filter className="w-8 h-8 text-purple-400/30" />
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-[#1f2028] border border-[#2e303a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros y Búsqueda
          </span>
          {(filterType || filterReason || filterDateFrom || filterDateTo || searchTerm || selectedProduct) && (
            <button
              onClick={() => {
                setFilterType('');
                setFilterReason('');
                setFilterDateFrom('');
                setFilterDateTo('');
                setSearchTerm('');
                setSelectedProduct(null);
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpiar todos los filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            value={selectedProduct || ''}
            onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
            className="bg-[#151620] border border-[#2e303a] rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="">Todos los productos</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#151620] border border-[#2e303a] rounded-lg text-white text-sm placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#151620] border border-[#2e303a] rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">🔼 Entrada</option>
            <option value="SALIDA">🔽 Salida</option>
          </select>

          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="bg-[#151620] border border-[#2e303a] rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="">Todos los motivos</option>
            <option value="COMPRA">Compra</option>
            <option value="VENTA">Venta</option>
            <option value="AJUSTE">Ajuste</option>
            <option value="DEVOLUCION">Devolución</option>
            <option value="INICIAL">Stock Inicial</option>
            <option value="ROTURA">Rotura</option>
            <option value="PERDIDA">Pérdida</option>
          </select>

          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="bg-[#151620] border border-[#2e303a] rounded-lg px-3 py-2 text-white text-sm"
            placeholder="Desde"
          />

          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="bg-[#151620] border border-[#2e303a] rounded-lg px-3 py-2 text-white text-sm"
            placeholder="Hasta"
          />
        </div>

        {/* Active Filters */}
        <AnimatePresence>
          {(filterType || filterReason || filterDateFrom || filterDateTo || searchTerm || selectedProduct) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 pt-2 border-t border-[#2e303a]"
            >
              <span className="text-xs text-gray-500 mr-1">Filtros activos:</span>
              {selectedProduct && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs flex items-center gap-1">
                  Producto: {products.find(p => p.id === selectedProduct)?.name}
                  <button onClick={() => setSelectedProduct(null)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterType && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs flex items-center gap-1">
                  Tipo: {filterType === 'ENTRADA' ? 'Entrada' : 'Salida'}
                  <button onClick={() => setFilterType('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterReason && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs flex items-center gap-1">
                  Motivo: {filterReason}
                  <button onClick={() => setFilterReason('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {(filterDateFrom || filterDateTo) && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs flex items-center gap-1">
                  Fecha: {filterDateFrom || '...'} - {filterDateTo || '...'}
                  <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              {searchTerm && (
                <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs flex items-center gap-1">
                  Búsqueda: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DataTable
        columns={[
          { header: 'ID', render: (m) => <span className="font-medium text-white">{m.id}</span> },
          { header: 'Fecha', render: (m) => (
            <div className="flex items-center italic text-gray-400">
              <Calendar className="w-3 h-3 mr-2 text-primary/60" />
              {new Date(m.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          )},
          { header: 'Tipo', render: (m) => (
            <div className="flex items-center">
              {m.type === 'ENTRADA' ? (
                <ArrowUpCircle className="w-4 h-4 mr-1.5 text-green-400" />
              ) : (
                <ArrowDownCircle className="w-4 h-4 mr-1.5 text-red-400" />
              )}
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${m.type === 'ENTRADA' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {m.type === 'ENTRADA' ? 'ENTRADA' : 'SALIDA'}
              </span>
            </div>
          )},
          { header: 'Producto', render: (m) => <span className="text-gray-300">{m.product?.name}</span> },
          { header: 'Cantidad', render: (m) => <span className="font-medium text-white">{m.quantity}</span> },
          { header: 'Motivo', render: (m) => <span className="text-gray-400">{m.reason}</span> },
        ]}
        data={paginatedMovements}
        keyExtractor={(m) => m.id}
        loading={loading}
        emptyMessage="No hay movimientos"
        emptyDescription={searchTerm || filterType || filterReason || filterDateFrom ? "No se encontraron movimientos con los filtros aplicados" : "No hay movimientos de inventario registrados"}
        emptyIcon={<History className="w-8 h-8" />}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={displayMovements.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
