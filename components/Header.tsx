import React, { useState } from 'react';
import { Sun, Moon, Sunrise, MoreVertical, Package, Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Database, Bell, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';
import { Theme, AppNotification, ActiveModule } from '../types';
import { DataSource } from '../api';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  totalItems: number;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  dataSource?: DataSource | null;
  pendingWrites?: number;
  isOnline?: boolean;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onNavigate?: (module: ActiveModule) => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  totalItems,
  onToggleSidebar,
  sidebarOpen,
  dataSource = null,
  pendingWrites = 0,
  isOnline = true,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllRead,
  onNavigate,
}) => {
  const isDark = theme === 'dark';
  const isSoft = theme === 'soft';
  const [showSyncDetail, setShowSyncDetail] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NOTIF_ICONS: Record<string, React.ElementType> = {
    'audit-approved': CheckCircle2,
    'audit-rejected': XCircle,
    'info': Info,
    'warning': AlertTriangle,
  };

  const NOTIF_COLORS: Record<string, string> = {
    'audit-approved': isDark ? 'text-emerald-400' : 'text-emerald-600',
    'audit-rejected': isDark ? 'text-red-400' : 'text-red-600',
    'info': isDark ? 'text-blue-400' : 'text-blue-600',
    'warning': isDark ? 'text-amber-400' : 'text-amber-600',
  };

  const formatTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Gerade eben';
    if (mins < 60) return `Vor ${mins} Min.`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Vor ${hours} Std.`;
    const days = Math.floor(hours / 24);
    return `Vor ${days} Tag${days > 1 ? 'en' : ''}`;
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-500 ${isDark ? 'bg-slate-900/80 border-slate-800' : isSoft ? 'bg-[#E8EDF0]/80 border-[#D4DDE2] shadow-sm shadow-[#5C7E8F]/5' : 'bg-white/50 border-[#CACCCE]/60 shadow-sm shadow-slate-200/20'
      }`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* Left: Mobile Logo (clean, no hamburger) */}
          <div className="flex items-center gap-4">
            {/* Mobile Logo - Hidden on Desktop as Sidebar handles branding */}
            <div className="flex items-center gap-3 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0077B5] to-[#00A0DC] flex items-center justify-center shadow-md shadow-blue-500/20">
                <Package className="text-white" size={18} />
              </div>
              <div className="flex flex-col leading-none select-none">
                <span className="font-black italic text-[#005697] text-base tracking-tighter">DOST</span>
                <span className="font-black italic text-[#E2001A] text-base tracking-tighter mt-0.5">INFOSYS</span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center justify-end gap-2 shrink-0 ml-auto">

            {/* Sync Status Indicator */}
            {dataSource && (
              <div className="relative">
                <button
                  onClick={() => setShowSyncDetail(prev => !prev)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all text-[11px] font-bold ${!isOnline
                    ? isDark ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' : isSoft ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                    : dataSource === 'api'
                      ? pendingWrites > 0
                        ? isDark ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : isSoft ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                        : isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : isSoft ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : dataSource === 'cache'
                        ? isDark ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' : isSoft ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        : isDark ? 'bg-slate-800 text-slate-500 hover:bg-slate-700' : isSoft ? 'bg-slate-200 text-slate-500 hover:bg-slate-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                  {!isOnline ? (
                    <span className="flex items-center gap-1"><WifiOff size={13} /><Database size={11} /></span>
                  ) : dataSource === 'cache' ? (
                    <Database size={13} className="animate-pulse" />
                  ) : dataSource === 'api' ? (
                    pendingWrites > 0 ? <RefreshCw size={13} className="animate-spin" /> : <Cloud size={13} />
                  ) : (
                    <CloudOff size={13} />
                  )}
                  <span className="hidden sm:inline">
                    {!isOnline
                      ? pendingWrites > 0 ? `Offline · ${pendingWrites}` : 'Offline'
                      : dataSource === 'cache'
                        ? 'Synchronisiere…'
                        : dataSource === 'api'
                          ? pendingWrites > 0 ? `${pendingWrites} ausstehend` : 'Verbunden'
                          : 'Lokal'}
                  </span>
                  {pendingWrites > 0 && (
                    <span className={`sm:hidden min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-black ${isDark ? 'bg-amber-500 text-slate-900' : 'bg-amber-500 text-white'
                      }`}>
                      {pendingWrites}
                    </span>
                  )}
                </button>

                {/* Dropdown detail panel */}
                {showSyncDetail && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSyncDetail(false)} />
                    <div className={`absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border shadow-xl p-3 ${isDark ? 'bg-slate-900 border-slate-700' : isSoft ? 'bg-[#F0F3F6] border-[#D4DDE2]' : 'bg-white border-slate-200'
                      }`}>
                      {/* Connection status */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${dataSource === 'api' ? 'bg-emerald-500' : dataSource === 'cache' ? 'bg-orange-500' : 'bg-slate-400'
                          }`} />
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          {dataSource === 'api' ? 'Mit Server verbunden' : dataSource === 'cache' ? 'Offline — Cache aktiv' : 'Lokale Daten'}
                        </span>
                      </div>

                      {/* Pending writes */}
                      {pendingWrites > 0 && (
                        <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-2 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'
                          }`}>
                          <RefreshCw size={13} className={`shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                          <span className={`text-[11px] ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                            <strong>{pendingWrites}</strong> {pendingWrites === 1 ? 'Änderung wartet' : 'Änderungen warten'} auf Sync
                          </span>
                        </div>
                      )}

                      {/* Info text */}
                      <p className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {dataSource === 'api' && pendingWrites === 0 && 'Alle Daten sind synchronisiert.'}
                        {dataSource === 'api' && pendingWrites > 0 && 'Änderungen werden automatisch synchronisiert, sobald möglich.'}
                        {dataSource === 'cache' && 'Daten aus dem letzten Sync werden angezeigt. Neue Eingaben werden gespeichert und bei Verbindung synchronisiert.'}
                        {dataSource === 'mock' && 'Keine Verbindung und kein Cache vorhanden. Es werden Beispieldaten angezeigt.'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(prev => !prev); setShowSyncDetail(false); }}
                className={`p-2.5 rounded-xl transition-all relative ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : isSoft ? 'text-[#86888A] hover:text-[#323338] hover:bg-[#E6E7EB]'
                    : 'text-[#86888A] hover:text-[#000000] hover:bg-white/60'
                  }`}
                title="Benachrichtigungen"
                style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black bg-red-500 text-white ring-2 ring-white dark:ring-slate-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className={`absolute right-0 top-full mt-2 z-50 w-80 max-h-96 rounded-xl border shadow-xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : isSoft ? 'bg-[#F0F3F6] border-[#D4DDE2]' : 'bg-white border-slate-200'
                    }`}>
                    {/* Header */}
                    <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Benachrichtigungen</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => onMarkAllRead?.()}
                          className={`text-[11px] font-bold transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                        >
                          Alle gelesen
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-80">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={24} className={`mx-auto mb-2 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                          <p className={`text-sm ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Keine Benachrichtigungen</p>
                        </div>
                      ) : (
                        notifications.slice(0, 20).map(notif => {
                          const Icon = NOTIF_ICONS[notif.type] || Info;
                          const color = NOTIF_COLORS[notif.type] || (isDark ? 'text-slate-400' : 'text-slate-500');

                          return (
                            <button
                              key={notif.id}
                              onClick={() => {
                                onMarkNotificationRead?.(notif.id);
                                if (notif.targetModule && onNavigate) {
                                  onNavigate(notif.targetModule);
                                }
                                setShowNotifications(false);
                              }}
                              className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${isDark ? 'border-slate-800' : 'border-slate-50'
                                } ${!notif.isRead
                                  ? isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-blue-50/50 hover:bg-blue-50'
                                  : isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                                }`}
                            >
                              <div className="flex gap-3">
                                <div className={`shrink-0 mt-0.5 ${color}`}>
                                  <Icon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{notif.title}</span>
                                    {!notif.isRead && (
                                      <span className="w-2 h-2 rounded-full bg-[#0077B5] shrink-0" />
                                    )}
                                  </div>
                                  <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {notif.message}
                                  </p>
                                  <span className={`text-[10px] mt-1 block ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {formatTimeAgo(notif.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : isSoft ? 'text-[#86888A] hover:text-[#323338] hover:bg-[#E6E7EB]'
                  : 'text-[#86888A] hover:text-[#000000] hover:bg-white/60'
                }`}
              title={theme === 'light' ? 'Soft Mode' : theme === 'soft' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <Sunrise size={20} /> : theme === 'soft' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Mobile: "More" menu → opens sidebar for secondary nav (Settings, Suppliers, etc.) */}
            <button
              onClick={onToggleSidebar}
              className={`p-2.5 rounded-xl transition-all lg:hidden ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : isSoft ? 'text-[#5C7E8F] hover:text-[#2C3E47] hover:bg-[#D4DDE2]' : 'text-[#86888A] hover:text-[#000000] hover:bg-white/60'
                }`}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              <MoreVertical size={20} />
            </button>

            {/* Profile */}
            <div className={`hidden md:block w-10 h-10 rounded-full border-2 overflow-hidden ml-2 ring-2 transition-all ${isDark ? 'border-slate-700 ring-blue-500/20' : isSoft ? 'border-[#F0F3F6] ring-[#D4DDE2] shadow-md shadow-[#5C7E8F]/10' : 'border-white ring-[#CACCCE] shadow-md shadow-slate-200/40'
              }`}>
              <img src="https://picsum.photos/seed/user/100" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};