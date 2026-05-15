import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Package, Users, DollarSign, AlertTriangle, ShoppingBag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product } from '../common/types';

export default function Dashboard() {
  const [stats, setStats] = useState({ todayRevenue: 0, todayProfit: 0, todaySalesCount: 0, activeProducts: 0, totalClients: 0 });
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (window.api) {
        try {
          const s = await window.api.getDashboardStats();
          const ls = await window.api.getLowStock();
          const ws = await window.api.getWeeklySales();


          setStats({
            todayRevenue: Number(s?.todayRevenue ?? 0),
            todayProfit: Number(s?.todayProfit ?? 0),
            todaySalesCount: Number(s?.todaySalesCount ?? 0),
            activeProducts: Number(s?.activeProducts ?? 0),
            totalClients: Number(s?.totalClients ?? 0),
          });
          setLowStock(ls || []);

          // Formatear fechas para el gráfico (ej: 2024-04-09 -> 09 Abr)
          const formattedChart = (ws || []).map(d => ({
            name: new Date(d.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
            total: d.total
          }));
          setChartData(formattedChart);
        } catch (error) {
          console.error("[Dashboard] Error loading data:", error);
        }
      }
      setLoading(false);
    };
    loadDashboardData();
  }, []);



  if (loading) return <div className="text-white p-10 flex items-center justify-center h-full">Cargando dashboard dinámico...</div>;

  const statCards = [
    { title: 'Ingresos de Hoy', value: `$${stats.todayRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
    { title: 'Ganancia de Hoy', value: `$${stats.todayProfit.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { title: 'Ventas de Hoy', value: String(stats.todaySalesCount), icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Productos con Stock', value: String(stats.activeProducts), icon: Package, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { title: 'Clientes Totales', value: String(stats.totalClients), icon: Users, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white m-0">Resumen de Negocio</h2>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="p-6 rounded-2xl glass-panel relative overflow-hidden group border border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}><Icon className={`w-6 h-6 ${stat.color}`} /></div>
              </div>
              <h3 className="text-gray-400 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Gráfico de Ventas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-white/5">
          <h3 className="text-white font-bold mb-6 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-primary" /> Tendencia de Ventas (7 días)</h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="99%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2028', border: '1px solid #2e303a', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#6366f1' }} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Stock Crítico */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="p-6 rounded-2xl glass-panel border border-white/5">
          <h3 className="text-white font-bold mb-4 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-orange-400" /> Stock Crítico</h3>
          <div className="space-y-3">
            {lowStock.length > 0 ? lowStock.map((p, i) => {
              const stock = p.stock ?? 0;
              const minStock = p.min_stock ?? 5;
              return (
                <div key={i} className={`flex justify-between items-center p-4 rounded-xl bg-white/5 border hover:bg-white/10 transition-colors ${stock === 0 ? 'border-red-500/50' : 'border-white/5'}`}>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white truncate max-w-[140px]">{p.name || p.sku}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{p.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-[10px] font-black ${stock === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        stock <= minStock ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                      {stock} / {minStock}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-gray-500 text-center py-20 italic text-sm">Todo el stock está bajo control</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
