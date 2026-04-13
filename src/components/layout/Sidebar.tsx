import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Package2, Wallet, Tags } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export default function Sidebar() {
  const routes = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Terminal POS', path: '/sales', icon: ShoppingCart },
    { name: 'Caja', path: '/cash', icon: Wallet },
    { name: 'Productos', path: '/products', icon: Package },
    { name: 'Categorías', path: '/categories', icon: Tags },
    { name: 'Clientes', path: '/clients', icon: Users },
  ];

  return (
    <aside className="w-64 border-r border-[#2e303a] bg-[#16171d] flex flex-col transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-[#2e303a]">
        <Package2 className="w-8 h-8 text-primary mr-3" />
        <h1 className="text-xl font-bold tracking-tight text-white m-0">Inventario<span className="text-primary">POS</span></h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <NavLink
              key={route.path}
              to={route.path}
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
                  <Icon className={cn("w-5 h-5 mr-3 transition-colors", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-100")} />
                  {route.name}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-[#2e303a]">
        <div className="flex items-center px-3 py-2 rounded-lg bg-[#1f2028]">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mr-3">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Admin User</span>
            <span className="text-xs text-gray-500">Sesión Activa</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
