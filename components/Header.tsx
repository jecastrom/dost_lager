
import React from 'react';
import { Search, Settings, LayoutGrid, List, Sun, Moon, Menu } from 'lucide-react';
import { ViewMode, Theme } from '../types';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  theme: Theme;
  toggleTheme: () => void;
  totalItems: number;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  viewMode, 
  setViewMode,
  theme,
  toggleTheme,
  totalItems,
  onToggleSidebar,
  sidebarOpen
}) => {
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-500 ${
      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/50 border-[#CACCCE]/60 shadow-sm shadow-slate-200/20'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Top Row: Mobile Menu + Logo + User on mobile maybe? */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={onToggleSidebar}
                className={`p-2 rounded-lg transition-all lg:hidden ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-[#86888A]'
                }`}
              >
                <Menu size={20} />
              </button>
              
              {/* Logo - Hidden on Desktop as Sidebar handles branding */}
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex flex-col leading-none select-none">
                  <span className="font-black italic text-[#005697] text-lg tracking-tighter">DOST</span>
                  <span className="font-black italic text-[#E2001A] text-lg tracking-tighter -mt-1.5">INFOSYS</span>
                </div>
                <div className="h-6 w-px bg-slate-500/20 mx-1"></div>
                <div>
                  <h1 className={`text-base font-bold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-[#000000]'}`}>
                    Inventar
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row gap-4 md:items-center flex-1">
             {/* Search */}
            <div className="relative flex-1 group">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                isDark ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-[#86888A] group-focus-within:text-[#0077B5]'
              }`} size={18} />
              <input 
                type="text"
                placeholder="Artikel suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-xl pl-11 pr-4 py-2.5 text-base md:text-sm transition-all focus:outline-none focus:ring-2 ${
                  isDark 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-blue-500/30' 
                    : 'bg-white/70 border-[#CACCCE] text-[#313335] placeholder:text-[#86888A] focus:ring-[#0077B5]/20 shadow-inner'
                }`}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-end gap-2 shrink-0">
              
              <div className={`flex p-1 rounded-xl border transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-[#CACCCE]/20 border-[#CACCCE]/40'}`}>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#0077B5] text-white shadow-md' : 'text-[#86888A] hover:text-[#313335]'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#0077B5] text-white shadow-md' : 'text-[#86888A] hover:text-[#313335]'}`}
                >
                  <List size={18} />
                </button>
              </div>
              
              <div className={`hidden md:block w-px h-8 mx-2 transition-colors ${isDark ? 'bg-slate-800' : 'bg-[#CACCCE]'}`} />

              <button 
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl transition-all ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#86888A] hover:text-[#000000] hover:bg-white/60'
                }`}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {/* Profile */}
              <div className={`hidden md:block w-10 h-10 rounded-full border-2 overflow-hidden ml-2 ring-2 transition-all ${
                isDark ? 'border-slate-700 ring-blue-500/20' : 'border-white ring-[#CACCCE] shadow-md shadow-slate-200/40'
              }`}>
                <img src="https://picsum.photos/seed/user/100" alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
