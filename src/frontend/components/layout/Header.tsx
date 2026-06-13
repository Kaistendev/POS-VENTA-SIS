import React from 'react';
import { Bell, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[#2e303a] bg-[#16171d]/80 backdrop-blur-md sticky top-0 z-10 transition-all">
      <div className="flex items-center flex-1">
        <div className="relative w-96 hidden md:block">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
           <input 
             type="text" 
             placeholder="Buscar en el sistema (Ctrl+K)" 
             className="w-full bg-[#1f2028] border border-[#2e303a] rounded-full py-1.5 pl-10 pr-4 text-sm text-gray-200 outline-none focus:border-primary/50 transition-colors placeholder:text-gray-600"
           />
        </div>
      </div>
      
      <div className="flex items-center justify-end px-4 space-x-4">
        <button className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#1f2028] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#16171d]"></span>
        </button>
        <div className="h-6 w-px bg-[#2e303a] mx-2"></div>
        <div className="text-sm text-gray-400">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
