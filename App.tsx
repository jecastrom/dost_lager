import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_ITEMS, MOCK_RECEIPT_HEADERS, MOCK_RECEIPT_ITEMS, MOCK_COMMENTS, MOCK_TICKETS, MOCK_PURCHASE_ORDERS } from './data';
import { StockItem, ViewMode, Theme, ActiveModule, ReceiptHeader, ReceiptItem, ReceiptComment, Ticket, PurchaseOrder } from './types';
import { Header } from './components/Header';
import { StockCard } from './components/StockCard';
import { GoodsReceiptFlow } from './components/GoodsReceiptFlow';
import { ReceiptManagement } from './components/ReceiptManagement';
import { CreateOrderWizard } from './components/CreateOrderWizard';
import { OrderManagement } from './components/OrderManagement';
import { SettingsPage } from './components/SettingsPage';
import { DocumentationPage } from './components/DocumentationPage';
import { 
  AlertTriangle, TrendingDown, CheckCircle2, 
  ChevronRight, LayoutDashboard, 
  PackagePlus, Menu, X, Settings, PlusCircle, ClipboardList, Filter, RefreshCcw, MapPin,
  Check, Search, Plus, FilePlus, BarChart3, FileText
} from 'lucide-react';

type FilterType = 'all' | 'low' | 'out' | 'healthy';

// Custom Battery Icon Component (Visual Only)
const BatteryIcon = ({ percentage, fillHex, size = 24 }: { percentage: number, fillHex: string, size?: number }) => {
  const pct = Math.max(0, Math.min(100, percentage));
  // Battery body is roughly 18 units high (y=5 to y=23)
  const bodyHeight = 18; 
  const fillHeight = (pct / 100) * bodyHeight;
  // Fill grows from bottom (y=23) up
  const fillY = 23 - fillHeight;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cap */}
      <path d="M10 2H14V5H10V2Z" fill="currentColor" fillOpacity="0.5" />
      {/* Body Outline */}
      <rect x="5" y="5" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      {/* Fill Level */}
      {pct > 0 && (
        <rect x="6.5" y={fillY} width="11" height={Math.max(0.5, fillHeight)} rx="0.5" fill={fillHex} />
      )}
    </svg>
  );
};

// -- HELPER COMPONENTS --

const SidebarItem = ({ icon, label, active, onClick, collapsed, isDark }: any) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
        ${active 
          ? isDark ? 'bg-blue-600/10 text-blue-400' : 'bg-blue-50 text-[#0077B5]'
          : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }
      `}
      title={collapsed ? label : undefined}
    >
      <div className={`shrink-0 transition-colors ${active ? '' : ''}`}>{icon}</div>
      
      {!collapsed && (
        <span className={`text-sm font-bold truncate transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          {label}
        </span>
      )}

      {collapsed && active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
      )}
    </button>
  );
};

const StatCard = ({ label, value, icon, color, isDark, active, onClick, compact }: any) => {
  // ... (No changes to StatCard logic)
  const activeStyles: Record<string, string> = {
    blue: compact 
      ? 'bg-[#0077B5] border-[#0077B5] text-white shadow-md shadow-blue-500/20'
      : 'bg-[#0077B5] border-[#0077B5] text-white shadow-lg shadow-blue-500/30',
    amber: compact
      ? 'bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-500/20'
      : 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-500/30',
    red: compact
      ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-500/20'
      : 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30',
    emerald: compact
      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20'
      : 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30',
  };

  const inactiveIconColors: Record<string, string> = {
    blue: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-[#0077B5] border-blue-200',
    amber: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200',
    red: isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200',
    emerald: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };

  let containerClass = '';
  
  if (active) {
    containerClass = activeStyles[color] || activeStyles.blue;
  } else {
    if (compact) {
       containerClass = isDark 
         ? 'bg-transparent border-slate-800 hover:bg-slate-800/40 text-slate-400' 
         : 'bg-white/40 border-slate-200 hover:bg-white hover:shadow-sm text-slate-600';
    } else {
       containerClass = isDark 
        ? 'bg-slate-900 border-slate-800 hover:bg-slate-800/80 text-slate-100' 
        : 'bg-white/60 border-slate-200 hover:bg-white hover:shadow-md text-slate-700';
    }
  }

  const iconClass = active
    ? 'bg-white/20 text-white'
    : inactiveIconColors[color] || inactiveIconColors.blue;

  const labelClass = active
    ? 'text-white/80'
    : isDark ? 'text-slate-500' : 'text-slate-400';

  const valueClass = active
    ? 'text-white'
    : isDark ? 'text-slate-100' : 'text-slate-700';

  if (compact) {
    return (
      <button 
        onClick={onClick}
        className={`relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 w-full group ${containerClass}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-transform group-hover:scale-105 duration-300 ${iconClass}`}>
            {React.cloneElement(icon, { size: 18 })}
          </div>
          <div className="text-left">
             <div className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${labelClass}`}>
               {label}
             </div>
             <div className={`text-lg font-black tracking-tight leading-none ${valueClass}`}>
               {value}
             </div>
          </div>
        </div>
        {active && <div className="w-1.5 h-1.5 rounded-full bg-white/60 mr-1" />}
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`relative p-4 rounded-2xl border transition-all duration-300 text-left w-full group ${containerClass}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300 ${iconClass}`}>
          {icon}
        </div>
        {active && (
          <div className="w-2 h-2 rounded-full bg-white/50" />
        )}
      </div>
      <div>
         <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${labelClass}`}>
           {label}
         </div>
         <div className={`text-2xl font-black tracking-tight ${valueClass}`}>
           {value}
         </div>
      </div>
    </button>
  );
};

const FilterModal = ({ isOpen, onClose, title, options, selected, onApply, isDark }: any) => {
  // ... (No changes to FilterModal)
  const [tempSelected, setTempSelected] = useState<string[]>(selected);

  useEffect(() => {
    if (isOpen) setTempSelected(selected);
  }, [isOpen, selected]);

  if (!isOpen) return null;

  const toggle = (opt: string) => {
    setTempSelected(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
        <div className={`p-4 border-b font-bold flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          {title}
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {options.map((opt: string) => {
             const isSelected = tempSelected.includes(opt);
             return (
               <button 
                 key={opt}
                 onClick={() => toggle(opt)}
                 className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                   isSelected 
                     ? isDark ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-blue-50 border-[#0077B5] text-[#0077B5]'
                     : isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
                 }`}
               >
                 <span className="text-sm font-medium">{opt}</span>
                 {isSelected && <Check size={16} />}
               </button>
             );
          })}
        </div>
        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
           <button 
             onClick={() => onApply(tempSelected)}
             className="w-full py-3 bg-[#0077B5] text-white font-bold rounded-xl hover:bg-[#00A0DC] transition-colors"
           >
             Anwenden ({tempSelected.length})
           </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // ... (Initializations)
  const [items, setItems] = useState<StockItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const customData = localStorage.getItem('custom_inventory');
        if (customData) {
          const parsed = JSON.parse(customData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.error("Failed to load custom inventory", e);
    }
    return MOCK_ITEMS.map(item => ({ ...item, lastUpdated: item.lastUpdated || Date.now() }));
  });

  const [hasCustomData, setHasCustomData] = useState<boolean>(() => {
    return typeof window !== 'undefined' && !!localStorage.getItem('custom_inventory');
  });
  
  const [receiptHeaders, setReceiptHeaders] = useState<ReceiptHeader[]>(MOCK_RECEIPT_HEADERS);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>(MOCK_RECEIPT_ITEMS);
  const [comments, setComments] = useState<ReceiptComment[]>(MOCK_COMMENTS);
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
  
  // -- NEW: Editing State --
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stock_manager_view_mode');
      return (saved === 'list' || saved === 'grid') ? saved : 'grid';
    }
    return 'grid';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stock_manager_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    }
    return 'dark';
  });

  // --- Filtering State ---
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('stock_manager_theme', theme);
    document.body.className = `transition-colors duration-500 overflow-x-hidden ${isDark ? 'bg-slate-950' : 'bg-[#F2F3F4]'}`;
  }, [theme, isDark]);

  useEffect(() => {
    localStorage.setItem('stock_manager_view_mode', viewMode);
  }, [viewMode]);

  const handleModuleChange = (module: ActiveModule) => {
    // Clear editing state when navigating away or via sidebar
    setEditingOrder(null);
    setActiveModule(module);
    setMobileMenuOpen(false);
  };

  // ... (Data Handlers)
  const handleCustomDataUpload = (newItems: StockItem[]) => {
    setItems(newItems);
    localStorage.setItem('custom_inventory', JSON.stringify(newItems));
    setHasCustomData(true);
  };

  const handleClearData = () => {
    const defaultData = MOCK_ITEMS.map(item => ({ ...item, lastUpdated: item.lastUpdated || Date.now() }));
    setItems(defaultData);
    localStorage.removeItem('custom_inventory');
    setHasCustomData(false);
  };

  // ... (Calculated Stats and Filters)
  const uniqueLocations = useMemo(() => 
    Array.from(new Set(items.map(i => i.warehouseLocation).filter(Boolean) as string[])).sort()
  , [items]);

  const uniqueSystems = useMemo(() => 
    Array.from(new Set(items.map(i => i.system).filter(Boolean) as string[])).sort()
  , [items]);

  const filteredItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
    return sorted.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedLocations.length > 0) {
        if (!item.warehouseLocation || !selectedLocations.includes(item.warehouseLocation)) return false;
      }
      if (selectedSystems.length > 0) {
        if (!item.system || !selectedSystems.includes(item.system)) return false;
      }
      if (activeFilter === 'low') return item.stockLevel > 0 && item.stockLevel < item.minStock;
      if (activeFilter === 'out') return item.stockLevel <= 0;
      if (activeFilter === 'healthy') return item.stockLevel > 0 && item.stockLevel >= item.minStock;
      return true;
    });
  }, [items, searchTerm, activeFilter, selectedLocations, selectedSystems]);

  const stats = useMemo(() => ({
    total: items.length,
    low: items.filter(i => i.stockLevel > 0 && i.stockLevel < i.minStock).length,
    out: items.filter(i => i.stockLevel <= 0).length,
    healthy: items.filter(i => i.stockLevel > 0 && i.stockLevel >= i.minStock).length,
  }), [items]);

  const akkuStats = useMemo(() => {
    const akkuItems = items.filter(i => i.warehouseLocation === "Akku Service");
    return {
      total: akkuItems.length,
      low: akkuItems.filter(i => i.stockLevel > 0 && i.stockLevel < i.minStock).length,
      out: akkuItems.filter(i => i.stockLevel <= 0).length,
      healthy: akkuItems.filter(i => i.stockLevel > 0 && i.stockLevel >= i.minStock).length,
    };
  }, [items]);

  const akkuTotal = akkuStats.total || 1; 
  const akkuLowPct = Math.round((akkuStats.low / akkuTotal) * 100);
  const akkuOutPct = Math.round((akkuStats.out / akkuTotal) * 100);
  const akkuOptPct = Math.max(0, 100 - akkuLowPct - akkuOutPct);

  const handleUpdateLevel = (id: string, newLevel: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, stockLevel: newLevel, lastUpdated: Date.now() } : item
    ));
  };

  const handleReceiptComplete = (
    header: Omit<ReceiptHeader, 'batchId' | 'timestamp' | 'itemCount'>,
    cartItems: { item: StockItem; qty: number; location: string; isDamaged?: boolean; issueNotes?: string; }[],
    newItemsCreated: StockItem[]
  ) => {
    if (newItemsCreated.length > 0) setItems(prev => [...newItemsCreated, ...prev]);
    const batchId = crypto.randomUUID();
    const timestamp = Date.now();
    const newHeader: ReceiptHeader = { ...header, batchId, timestamp, itemCount: cartItems.length, createdByName: 'Admin User' };
    const newLines: ReceiptItem[] = cartItems.map(line => ({
      id: crypto.randomUUID(), batchId, sku: line.item.sku, name: line.item.name, quantity: line.qty, targetLocation: line.location, isDamaged: line.isDamaged, issueNotes: line.issueNotes
    }));
    setReceiptHeaders(prev => [newHeader, ...prev]);
    setReceiptItems(prev => [...newLines, ...prev]);
    if (header.status === 'Gebucht') {
      updateMasterStockFromReceipt(cartItems.map(c => ({ sku: c.item.sku, qty: c.qty, location: c.location })));
    }
  };

  const updateMasterStockFromReceipt = (updates: { sku: string, qty: number, location: string }[]) => {
    setItems(prevItems => {
        const itemMap = new Map<string, StockItem>();
        prevItems.forEach(i => itemMap.set(i.sku, i));
        updates.forEach(u => {
          const existing = itemMap.get(u.sku);
          if (existing) {
             itemMap.set(u.sku, { ...existing, stockLevel: existing.stockLevel + u.qty, warehouseLocation: u.location, lastUpdated: Date.now(), status: 'Gebucht' });
          }
        });
        return Array.from(itemMap.values());
    });
  };

  const handleReceiptStatusUpdate = (batchId: string, newStatus: string) => {
    const header = receiptHeaders.find(h => h.batchId === batchId);
    if (!header) return;
    const oldStatus = header.status;
    setReceiptHeaders(prev => prev.map(h => h.batchId === batchId ? { ...h, status: newStatus } : h));
    if (newStatus === 'Gebucht' && oldStatus !== 'Gebucht') {
      const itemsInBatch = receiptItems.filter(i => i.batchId === batchId);
      updateMasterStockFromReceipt(itemsInBatch.map(i => ({ sku: i.sku, qty: i.quantity, location: i.targetLocation })));
      handleAddComment(batchId, 'note', 'Status auf "Gebucht" geändert. Bestände wurden aktualisiert.');
    } else {
        handleAddComment(batchId, 'note', `Status geändert: ${oldStatus} -> ${newStatus}`);
    }
  };

  const handleAddComment = (batchId: string, type: 'note' | 'email' | 'call', message: string) => {
    const newComment: ReceiptComment = { id: crypto.randomUUID(), batchId, userId: 'u1', userName: 'Admin User', timestamp: Date.now(), type, message };
    setComments(prev => [newComment, ...prev]);
  };
  
  const handleAddTicket = (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
  };

  // -- Order Management Handlers --
  const handleSaveOrder = (order: PurchaseOrder) => {
    setPurchaseOrders(prev => {
        const exists = prev.findIndex(o => o.id === order.id);
        if (exists >= 0) {
            // Update existing
            const updated = [...prev];
            updated[exists] = order;
            return updated;
        } else {
            // Create new
            return [order, ...prev];
        }
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setPurchaseOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setActiveModule('create-order');
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Unified Filter Handler
  const handleStatCardClick = (type: FilterType, presetLocation?: string) => {
    if (!presetLocation) {
        setSelectedLocations([]);
        setSelectedSystems([]);
    } else {
        setSelectedLocations([presetLocation]);
        setSelectedSystems([]);
    }
    if (activeFilter === type && type !== 'all') {
        setActiveFilter('all');
    } else {
        setActiveFilter(type);
    }
  };

  const clearAllFilters = () => {
    setActiveFilter('all');
    setSelectedLocations([]);
    setSelectedSystems([]);
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  };

  const toggleSystem = (sys: string) => {
    setSelectedSystems(prev => prev.includes(sys) ? prev.filter(s => s !== sys) : [...prev, sys]);
  };

  return (
    <div className={`min-h-screen flex transition-all duration-500 relative ${isDark ? 'text-slate-100' : 'text-[#313335]'}`}>
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[90] lg:hidden backdrop-blur-sm animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-[100] h-screen border-r flex flex-col shrink-0 overflow-x-hidden transition-all duration-300 ease-in-out
          lg:static lg:z-auto lg:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:w-auto'}
          ${sidebarOpen ? 'lg:w-72' : 'lg:w-20'} 
          ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}
        `}
      >
        <div className={`p-6 flex items-center h-20 ${sidebarOpen ? 'justify-between' : 'justify-center flex-col gap-2'}`}>
          <div className={`flex items-center gap-3 transition-all duration-300 ${!sidebarOpen ? 'hidden' : 'flex'}`}>
             <div className="flex flex-col leading-none select-none">
                <span className="font-black italic text-[#005697] text-lg tracking-tighter">DOST</span>
                <span className="font-black italic text-[#E2001A] text-lg tracking-tighter -mt-1.5">INFOSYS</span>
             </div>
             <span className={`font-bold text-xs tracking-tight whitespace-nowrap self-end mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Inventar Pro</span>
          </div>

          <div className={`flex flex-col leading-none select-none items-center justify-center transition-all duration-300 ${!sidebarOpen ? 'flex mb-2' : 'hidden'}`}>
                <span className="font-black italic text-[#005697] text-xl tracking-tighter">D</span>
                <span className="font-black italic text-[#E2001A] text-xl tracking-tighter -mt-1.5">I</span>
          </div>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className={`hidden lg:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${!sidebarOpen ? 'text-[#005697]' : 'text-slate-400'}`}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <button 
             onClick={() => setMobileMenuOpen(false)}
             className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
             <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeModule === 'dashboard'} 
            onClick={() => handleModuleChange('dashboard')}
            collapsed={!sidebarOpen}
            isDark={isDark}
          />
          <div className={`pt-4 pb-2 px-3 text-xs font-bold uppercase text-slate-500 tracking-wider transition-opacity duration-300 ${!sidebarOpen ? 'lg:opacity-0' : 'opacity-100'}`}>
            {!sidebarOpen ? 'P2P' : 'Einkauf & Lager'}
          </div>
          <SidebarItem 
            icon={<FilePlus size={20} />} 
            label="Bestellung erstellen" 
            active={activeModule === 'create-order'} 
            onClick={() => handleModuleChange('create-order')}
            collapsed={!sidebarOpen}
            isDark={isDark}
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="Bestellungen" 
            active={activeModule === 'order-management'} 
            onClick={() => handleModuleChange('order-management')}
            collapsed={!sidebarOpen}
            isDark={isDark}
          />
          <SidebarItem 
            icon={<PlusCircle size={20} />} 
            label="Wareneingang prüfen" 
            active={activeModule === 'goods-receipt'} 
            onClick={() => handleModuleChange('goods-receipt')}
            collapsed={!sidebarOpen}
            isDark={isDark}
          />
          <SidebarItem 
            icon={<ClipboardList size={20} />} 
            label="Wareneingang verwalten" 
            active={activeModule === 'receipt-management'} 
            onClick={() => handleModuleChange('receipt-management')}
            collapsed={!sidebarOpen}
            isDark={isDark}
          />
        </nav>

        <div className={`p-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
           <SidebarItem 
            icon={<Settings size={20} />} 
            label="Einstellungen" 
            active={activeModule === 'settings' || activeModule === 'documentation'} 
            onClick={() => handleModuleChange('settings')}
            collapsed={!sidebarOpen}
            isDark={isDark}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 h-screen overflow-y-auto">
        <Header 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          viewMode={viewMode}
          setViewMode={setViewMode}
          theme={theme}
          toggleTheme={toggleTheme}
          totalItems={filteredItems.length}
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          sidebarOpen={mobileMenuOpen}
        />

        <main className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 md:py-8">
          {activeModule === 'dashboard' && (
            <>
              {/* Summary Cards */}
              <div className="flex flex-col mb-6 animate-in fade-in slide-in-from-top-2">
                <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <BarChart3 size={14} /> Gesamtübersicht
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <StatCard label="Gesamt" value={stats.total} icon={<ChevronRight size={24} />} color="blue" isDark={isDark} active={activeFilter === 'all' && selectedLocations.length === 0} onClick={() => handleStatCardClick('all')} compact={true} />
                  <StatCard label="Niedrig" value={stats.low} icon={<TrendingDown size={24} />} color="amber" isDark={isDark} active={activeFilter === 'low' && selectedLocations.length === 0} onClick={() => handleStatCardClick('low')} compact={true} />
                  <StatCard label="Ausverkauft" value={stats.out} icon={<AlertTriangle size={24} />} color="red" isDark={isDark} active={activeFilter === 'out' && selectedLocations.length === 0} onClick={() => handleStatCardClick('out')} compact={true} />
                  <StatCard label="Optimal" value={stats.healthy} icon={<CheckCircle2 size={24} />} color="emerald" isDark={isDark} active={activeFilter === 'healthy' && selectedLocations.length === 0} onClick={() => handleStatCardClick('healthy')} compact={true} />
                </div>

                <div className={`h-px w-full my-8 ${isDark ? 'bg-slate-800/50' : 'bg-slate-200/50'}`} />
                
                <div className="">
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <MapPin size={14} /> Akku Service
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <StatCard 
                      label="Akku Gesamt" 
                      value={<div className="flex items-baseline gap-1">{akkuStats.total}<span className={`text-xs font-medium opacity-60 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>STÜCK</span></div>}
                      icon={<BatteryIcon percentage={100} fillHex="#007bff" />} 
                      color="blue" 
                      isDark={isDark} 
                      active={activeFilter === 'all' && selectedLocations.includes('Akku Service') && selectedLocations.length === 1}
                      onClick={() => handleStatCardClick('all', 'Akku Service')}
                      secondary
                    />
                    <StatCard 
                      label="Akku Niedrig" 
                      value={<div className="flex items-baseline gap-1.5">{akkuStats.low}<span className={`text-sm font-medium opacity-70 translate-y-[-1px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>({akkuLowPct}%)</span></div>} 
                      icon={<BatteryIcon percentage={akkuLowPct} fillHex="#ffa500" />} 
                      color="amber" 
                      isDark={isDark} 
                      active={activeFilter === 'low' && selectedLocations.includes('Akku Service') && selectedLocations.length === 1}
                      onClick={() => handleStatCardClick('low', 'Akku Service')}
                      secondary
                    />
                    <StatCard 
                      label="Akku Ausverkauft" 
                      value={<div className="flex items-baseline gap-1.5">{akkuStats.out}<span className={`text-sm font-medium opacity-70 translate-y-[-1px] ${isDark ? 'text-red-400' : 'text-red-600'}`}>({akkuOutPct}%)</span></div>} 
                      icon={<BatteryIcon percentage={akkuOutPct} fillHex="#dc3545" />} 
                      color="red" 
                      isDark={isDark} 
                      active={activeFilter === 'out' && selectedLocations.includes('Akku Service') && selectedLocations.length === 1}
                      onClick={() => handleStatCardClick('out', 'Akku Service')}
                      secondary
                    />
                    <StatCard 
                      label="Akku Optimal" 
                      value={<div className="flex items-baseline gap-1.5">{akkuStats.healthy}<span className={`text-sm font-medium opacity-70 translate-y-[-1px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>({akkuOptPct}%)</span></div>}
                      icon={<BatteryIcon percentage={akkuOptPct} fillHex="#28a745" />} 
                      color="emerald" 
                      isDark={isDark} 
                      active={activeFilter === 'healthy' && selectedLocations.includes('Akku Service') && selectedLocations.length === 1}
                      onClick={() => handleStatCardClick('healthy', 'Akku Service')}
                      secondary
                    />
                  </div>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                   <button onClick={() => setIsLocationModalOpen(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-[#CACCCE] hover:bg-white text-slate-700'}`}>
                     <Plus size={14} /> Lagerort
                   </button>
                   <button onClick={() => setIsSystemModalOpen(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-[#CACCCE] hover:bg-white text-slate-700'}`}>
                     <Plus size={14} /> System
                   </button>
                   {(selectedLocations.length > 0 || selectedSystems.length > 0 || activeFilter !== 'all') && (
                     <div className={`w-px h-6 mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
                   )}
                   {activeFilter !== 'all' && (
                     <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold animate-in fade-in slide-in-from-left-2 ${activeFilter === 'low' ? 'bg-amber-500 text-white' : activeFilter === 'out' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        <span>Status: {activeFilter === 'low' ? 'Niedrig' : activeFilter === 'out' ? 'Ausverkauft' : 'Optimal'}</span>
                        <button onClick={() => setActiveFilter('all')} className="hover:text-white/70"><X size={14} /></button>
                     </div>
                   )}
                   {selectedLocations.map(loc => (
                     <div key={loc} className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0077B5] text-white text-xs font-bold animate-in fade-in slide-in-from-left-2">
                        <span>Lagerort: {loc}</span>
                        <button onClick={() => toggleLocation(loc)} className="hover:text-white/70"><X size={14} /></button>
                     </div>
                   ))}
                   {selectedSystems.map(sys => (
                     <div key={sys} className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0077B5] text-white text-xs font-bold animate-in fade-in slide-in-from-left-2">
                        <span>System: {sys}</span>
                        <button onClick={() => toggleSystem(sys)} className="hover:text-white/70"><X size={14} /></button>
                     </div>
                   ))}
                   {(selectedLocations.length > 0 || selectedSystems.length > 0 || activeFilter !== 'all') && (
                     <button onClick={clearAllFilters} className={`text-xs font-bold flex items-center gap-1 hover:underline ml-2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-[#0077B5]'}`}>
                       <RefreshCcw size={12} /> Alles löschen
                     </button>
                   )}
                </div>
              </div>

              {/* Items List */}
              {filteredItems.length > 0 ? (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5" : "flex flex-col gap-3"}>
                  {filteredItems.map(item => (
                    <StockCard 
                      key={item.id} 
                      item={item} 
                      onUpdate={handleUpdateLevel} 
                      onAddStock={() => setActiveModule('goods-receipt')}
                      viewMode={viewMode}
                      theme={theme}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className={`w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center mb-6 ${isDark ? 'border-slate-700 text-slate-700' : 'border-slate-300 text-slate-400'}`}>
                    <PackagePlus size={40} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Keine Artikel gefunden</h3>
                  <p className="text-slate-500 mb-6 max-w-xs mx-auto">
                    Es gibt keine Artikel für die aktuelle Filterauswahl oder die Suchanfrage.
                  </p>
                  <div className="flex gap-4">
                    <button onClick={clearAllFilters} className={`px-6 py-3 font-bold rounded-xl transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>Filter löschen</button>
                    <button onClick={() => setActiveModule('goods-receipt')} className="px-6 py-3 bg-[#0077B5] text-white font-bold rounded-xl flex items-center gap-2 hover:bg-[#00A0DC] transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                      <PlusCircle size={20} /> Zum Wareneingang
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeModule === 'create-order' && (
            <CreateOrderWizard 
              theme={theme} 
              items={items} 
              onNavigate={(module) => handleModuleChange(module)} 
              onCreateOrder={handleSaveOrder}
              initialOrder={editingOrder}
            />
          )}

          {activeModule === 'order-management' && (
            <OrderManagement 
              orders={purchaseOrders} 
              theme={theme} 
              onDelete={handleDeleteOrder}
              onEdit={handleEditOrder}
            />
          )}

          {activeModule === 'goods-receipt' && (
             <GoodsReceiptFlow 
              theme={theme}
              existingItems={items}
              onClose={() => handleModuleChange('receipt-management')}
              onSuccess={handleReceiptComplete}
              purchaseOrders={purchaseOrders}
             />
          )}

          {activeModule === 'receipt-management' && (
            <ReceiptManagement 
              headers={receiptHeaders}
              items={receiptItems}
              comments={comments}
              tickets={tickets}
              purchaseOrders={purchaseOrders}
              theme={theme}
              onUpdateStatus={handleReceiptStatusUpdate}
              onAddComment={handleAddComment}
              onAddTicket={handleAddTicket}
              onUpdateTicket={handleUpdateTicket}
            />
          )}

          {activeModule === 'settings' && (
            <SettingsPage 
              theme={theme}
              toggleTheme={toggleTheme}
              onNavigate={(module) => handleModuleChange(module)}
              onUploadData={handleCustomDataUpload}
              onClearData={handleClearData}
              hasCustomData={hasCustomData}
            />
          )}

          {activeModule === 'documentation' && (
            <DocumentationPage 
              theme={theme}
              onBack={() => handleModuleChange('settings')}
            />
          )}
        </main>
      </div>

      <FilterModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="Lagerort filtern"
        options={uniqueLocations}
        selected={selectedLocations}
        onApply={(newSelection) => {
          setSelectedLocations(newSelection);
          setIsLocationModalOpen(false);
        }}
        isDark={isDark}
      />

      <FilterModal 
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        title="System filtern"
        options={uniqueSystems}
        selected={selectedSystems}
        onApply={(newSelection) => {
          setSelectedSystems(newSelection);
          setIsSystemModalOpen(false);
        }}
        isDark={isDark}
      />

    </div>
  );
};

export default App;