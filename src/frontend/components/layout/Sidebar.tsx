import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Wallet, Tags, LogOut, History, Settings as SettingsIcon, ChevronLeft, ChevronRight, Shield, RotateCcw, FolderOutput, Truck, ShoppingBag, FileText, Percent, Calculator } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { useAuthStore, useUIStore } from '../../store/useStore.ts';
import { useEffect } from 'react';
import logoSidebar from '../../assets/tienda.png';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [toggleSidebar]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const routes = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Terminal POS', path: '/sales', icon: ShoppingCart },
    { name: 'Historial', path: '/sales-history', icon: History },
    { name: 'Caja', path: '/cash', icon: Wallet },
    { name: 'Productos', path: '/products', icon: Package },
    ...(isAdmin ? [{ name: 'Categorías', path: '/categories', icon: Tags }] : []),
    { name: 'Clientes', path: '/clients', icon: Users },
    ...(isAdmin ? [{ name: 'Proveedores', path: '/suppliers', icon: Truck }] : []),
    ...(isAdmin ? [{ name: 'Compras', path: '/purchases', icon: ShoppingBag }] : []),
    ...(isAdmin ? [{ name: 'Usuarios', path: '/users', icon: Shield }] : []),
    ...(isAdmin ? [{ name: 'Movimientos', path: '/movements', icon: RotateCcw }] : []),
    ...(isAdmin ? [{ name: 'Cierres', path: '/cash-history', icon: FolderOutput }] : []),
    ...(isAdmin ? [{ name: 'Descuentos', path: '/discounts', icon: Percent }] : []),
    ...(isAdmin ? [{ name: 'Reportes', path: '/reports', icon: FileText }] : []),
    ...(isAdmin ? [{ name: 'Contabilidad', path: '/accounting', icon: Calculator }] : []),
    { name: 'Ajustes', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside className={cn(
      "border-r border-[#2e303a] bg-[#16171d] flex flex-col transition-all duration-300 relative",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 bg-[#1f2028] border border-[#2e303a] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary transition-colors z-10"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
      
      <div className="h-16 flex items-center px-4 border-b border-[#2e303a] gap-3">
        <img src={logoSidebar} alt="InventarioPOS" className="w-9 h-9 object-contain rounded-lg" />
        {!sidebarCollapsed && (
          <h1 className="text-xl font-bold tracking-tight text-white m-0">Inventario<span className="text-primary">POS</span></h1>
        )}
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <NavLink
              key={route.path}
              to={route.path}
              title={sidebarCollapsed ? route.name : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-400 hover:bg-[#1f2028] hover:text-gray-100"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("min-w-[20px]", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-100")} />
                  {!sidebarCollapsed && <span className="ml-3">{route.name}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-[#2e303a] space-y-3">
        <div className={cn(
          "flex items-center px-3 py-2 rounded-lg bg-[#1f2028]",
          sidebarCollapsed ? "justify-center p-2" : ""
        )}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mr-3 uppercase min-w-[32px]">
            {user?.username?.charAt(0) || 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white truncate max-w-[120px]">{user?.username || 'Usuario'}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{user?.role || 'Vendedor'}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={sidebarCollapsed ? "Cerrar Sesión" : undefined}
          className={cn(
            "w-full flex items-center rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 group",
            sidebarCollapsed ? "justify-center p-2" : "px-3 py-2"
          )}
        >
          <LogOut className="min-w-[20px] text-red-400" />
          {!sidebarCollapsed && <span className="ml-3">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
