import React from 'react';
import {
  LayoutDashboard, ClipboardList,
  Settings, FileText, Package, History, Box, Users
} from 'lucide-react';
import { ActiveModule, Theme } from '../types';

interface SidebarProps {
  theme: Theme;
  activeModule: ActiveModule;
  onNavigate: (module: ActiveModule) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  mode?: 'full' | 'slim';
}

export const Sidebar: React.FC<SidebarProps> = ({
  theme,
  activeModule,
  onNavigate,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const isDark = theme === 'dark';
  const isSoft = theme === 'soft';

  const navItems = [
    { id: 'dashboard', label: 'Lager', icon: <LayoutDashboard size={20} /> },
    { id: 'inventory', label: 'Artikel', icon: <Box size={20} /> },
    { id: 'order-management', label: 'Bestellungen', icon: <FileText size={20} /> },
    { id: 'receipt-management', label: 'Wareneingang', icon: <ClipboardList size={20} /> },
    { id: 'stock-logs', label: 'Lagerprotokoll', icon: <History size={20} /> },
    { id: 'suppliers', label: 'Lieferanten', icon: <Users size={20} /> },
  ];

  const bg = isDark ? 'bg-[#1e293b]' : isSoft ? 'bg-[#E2E7EB]' : 'bg-white';
  const border = isDark ? 'border-slate-800' : isSoft ? 'border-[#D4DDE2]' : 'border-slate-200';
  const activeBg = 'bg-[#0077B5] text-white shadow-md shadow-blue-500/25';
  const inactiveTxt = isDark ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white' : isSoft ? 'text-[#5C7E8F] hover:bg-[#D4DDE2] hover:text-[#2C3E47]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900';
  const settingsActive = isDark ? 'bg-slate-800 text-white' : isSoft ? 'bg-[#D4DDE2] text-[#2C3E47]' : 'bg-slate-100 text-slate-900';
  const settingsInactive = isDark ? 'text-slate-400 hover:bg-slate-800/60' : isSoft ? 'text-[#5C7E8F] hover:bg-[#D4DDE2]' : 'text-slate-500 hover:bg-slate-100';

  return (
    <>
      {/* ═══ Pure CSS hover styles — no React state needed ═══ */}
      <style>{`
        .sidebar-desktop {
          width: 68px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
          box-shadow: none;
        }
        .sidebar-desktop:hover {
          width: 256px;
          box-shadow: 4px 0 24px rgba(0,0,0,0.08);
        }
        .sidebar-desktop .sidebar-label {
          opacity: 0;
          width: 0;
          transition: opacity 0.2s ease;
          transition-delay: 0s;
        }
        .sidebar-desktop:hover .sidebar-label {
          opacity: 1;
          width: auto;
          transition-delay: 0.1s;
        }
        .sidebar-desktop .sidebar-btn {
          padding: 10px 0;
          justify-content: center;
          transition: padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-desktop:hover .sidebar-btn {
          padding: 10px 12px;
          justify-content: flex-start;
        }
      `}</style>

      {/* ═══ DESKTOP SIDEBAR (lg+) — CSS hover-expand overlay ═══ */}
      <aside
        className={`sidebar-desktop hidden lg:flex fixed top-0 left-0 z-50 h-screen border-r flex-col overflow-hidden ${bg} ${border}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0077B5] to-[#00A0DC] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
            <Package className="text-white" size={20} />
          </div>
          <div className="sidebar-label flex flex-col overflow-hidden whitespace-nowrap">
            <span className="font-black italic text-[#0077B5] text-base tracking-tighter leading-none">DOST</span>
            <span className="font-black italic text-[#E2001A] text-base tracking-tighter leading-none mt-0.5">INFOSYS</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(item => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as ActiveModule)}
                className={`sidebar-btn w-full flex items-center gap-3 rounded-xl relative overflow-hidden
                  ${isActive ? activeBg : inactiveTxt}`}
                title={item.label}
              >
                <div className="relative z-10 shrink-0">{item.icon}</div>
                <span className="sidebar-label font-semibold text-sm whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Settings */}
        <div className={`border-t px-2 py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <button
            onClick={() => onNavigate('settings')}
            className={`sidebar-btn w-full flex items-center gap-3 rounded-xl overflow-hidden
              ${activeModule === 'settings' ? settingsActive : settingsInactive}`}
            title="Einstellungen"
          >
            <Settings size={20} className="shrink-0" />
            <span className="sidebar-label text-sm whitespace-nowrap overflow-hidden">
              Einstellungen
            </span>
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE SIDEBAR (<lg) — slide-in drawer, unchanged ═══ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 border-r transform lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${bg} ${border} shadow-xl`}
        style={{ transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0077B5] to-[#00A0DC] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
              <Package className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-black italic text-[#0077B5] text-lg tracking-tighter leading-none">DOST</span>
              <span className="font-black italic text-[#E2001A] text-lg tracking-tighter leading-none mt-0.5">INFOSYS</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-6 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as ActiveModule);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${activeModule === item.id ? activeBg : inactiveTxt
                  }`}
              >
                <div className="relative z-10 shrink-0">{item.icon}</div>
                <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
                {activeModule === item.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                )}
              </button>
            ))}
          </nav>

          {/* Bottom: Settings */}
          <div className={`p-4 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <button
              onClick={() => {
                onNavigate('settings');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${activeModule === 'settings' ? settingsActive : settingsInactive
                }`}
            >
              <Settings size={20} />
              <span>Einstellungen</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};