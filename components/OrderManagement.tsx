
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Filter, Calendar, Truck, ChevronRight, 
  X, FileText, Pencil, ClipboardCheck, Archive, CheckSquare, Square, PackagePlus,
  CheckCircle2, Ban, Briefcase, Lock, Plus, AlertCircle
} from 'lucide-react';
import { PurchaseOrder, Theme, ReceiptMaster, ActiveModule, Ticket } from '../types';
import { LifecycleStepper } from './LifecycleStepper';
import { MOCK_ITEMS } from '../data'; // Import Mock Data for System Lookup

interface OrderManagementProps {
  orders: PurchaseOrder[]; // Required prop for Single Source of Truth
  theme: Theme;
  onArchive: (id: string) => void;
  onEdit: (order: PurchaseOrder) => void;
  onReceiveGoods: (id: string) => void;
  onQuickReceipt: (id: string) => void;
  receiptMasters: ReceiptMaster[];
  onNavigate: (module: ActiveModule) => void;
  tickets: Ticket[];
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ orders, theme, onArchive, onEdit, onReceiveGoods, onQuickReceipt, receiptMasters, onNavigate, tickets }) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // -- Confirmation Modal State --
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<string | null>(null);

  // -- Keyboard Listener for Modal --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (confirmModalOpen) {
                setConfirmModalOpen(false);
                setSelectedOrderForReceipt(null);
            } else if (selectedOrder) {
                setSelectedOrder(null);
            }
        }
    };

    if (selectedOrder || confirmModalOpen) {
        window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOrder, confirmModalOpen]);

  // -- Computed --
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Archive Filter Logic
      if (!showArchived && o.isArchived) return false;
      
      const term = searchTerm.toLowerCase();
      return (
        o.id.toLowerCase().includes(term) ||
        o.supplier.toLowerCase().includes(term)
      );
    }).sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
  }, [orders, searchTerm, showArchived]);

  // -- Lifecycle Logic for Stepper --
  const hasOpenTickets = useMemo(() => {
      if (!selectedOrder || !selectedOrder.linkedReceiptId) return false;
      return tickets.some(t => t.receiptId === selectedOrder.linkedReceiptId && t.status === 'Open');
  }, [selectedOrder, tickets]);

  // -- MULTI-BADGE STATUS LOGIC --
  const renderOrderBadges = (order: PurchaseOrder) => {
    const badges: React.ReactNode[] = [];
    
    // 1. Badge: Project Type (Eternal)
    // Shows if status is 'Projekt'. Note: Ideally this should be a persistent 'type' field, 
    // but we use status as a proxy per current data structure.
    if (order.status === 'Projekt') {
        badges.push(
            <span key="projekt" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 uppercase tracking-wider ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                <Briefcase size={10} /> Projekt
            </span>
        );
    }

    // 2. Badge: Lifecycle (Calculated)
    const totalOrdered = order.items.reduce((sum, i) => sum + i.quantityExpected, 0);
    const totalReceived = order.items.reduce((sum, i) => sum + i.quantityReceived, 0);

    let lifecycleBadge = null;

    if (order.isArchived) {
       lifecycleBadge = (
        <span key="archived" className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
          Archiviert
        </span>
       );
    } else if (order.status === 'Storniert') {
       lifecycleBadge = (
        <span key="cancelled" className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50">
          Storniert
        </span>
       );
    } else if (totalReceived === 0) {
        lifecycleBadge = (
            <span key="open" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
                Offen
            </span>
        );
    } else if (totalReceived > 0 && totalReceived < totalOrdered) {
        lifecycleBadge = (
            <span key="partial" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
                Teillieferung
            </span>
        );
    } else if (totalReceived >= totalOrdered || order.status === 'Abgeschlossen') {
        lifecycleBadge = (
            <span key="done" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
                Erledigt
            </span>
        );
    }
    
    if (lifecycleBadge) badges.push(lifecycleBadge);

    // 3. Process & 4. Result (Linked Receipt)
    const linkedReceipt = receiptMasters.find(r => r.poId === order.id);
    
    if (linkedReceipt) {
        const s = linkedReceipt.status as string; // Cast to string to handle extended statuses

        // Badge 3: Process - Temporary
        // ONLY if 'In Prüfung' (or similar pending state)
        if (s === 'In Prüfung' || s === 'Wartet auf Prüfung') {
             badges.push(
                <span key="check" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                    isDark ? 'bg-[#6264A7]/20 text-[#9ea0e6] border-[#6264A7]/40' : 'bg-[#6264A7]/10 text-[#6264A7] border-[#6264A7]/20'
                }`}>
                    In Prüfung
                </span>
            );
        }

        // Badge 4: Result - Issues
        if (s === 'Schaden' || s === 'Schaden + Falsch' || s === 'Beschädigt') {
             badges.push(
                <span key="damage" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1 ${
                    isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                    <AlertCircle size={10} /> Schaden
                </span>
            );
        }
        
        if (s === 'Abgelehnt') {
             badges.push(
                <span key="rejected" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                    isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                    <Ban size={10} /> Abgelehnt
                </span>
            );
        }

        if (s === 'Falsch geliefert') {
             badges.push(
                <span key="wrong" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                    isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                    Falsch
                </span>
            );
        }
    } else if (order.linkedReceiptId) {
        // Fallback for when Receipt Master hasn't synced but ID is present (e.g. freshly created)
        badges.push(
            <span key="check-legacy" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                isDark ? 'bg-[#6264A7]/20 text-[#9ea0e6] border-[#6264A7]/40' : 'bg-[#6264A7]/10 text-[#6264A7] border-[#6264A7]/20'
            }`}>
                In Prüfung
            </span>
        );
    }

    return <div className="flex flex-wrap gap-2 items-center">{badges}</div>;
  };

  const handleArchiveClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (window.confirm("Möchten Sie diese Bestellung wirklich archivieren?")) {
        onArchive(id);
    }
  };

  const handleEditClick = (e: React.MouseEvent, order: PurchaseOrder) => {
    e.stopPropagation(); 
    onEdit(order);
  };

  const handleReceiveClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onReceiveGoods(id);
  };

  const handleQuickReceiptClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedOrderForReceipt(id);
    setConfirmModalOpen(true);
  };

  const handleConfirmQuickReceipt = () => {
    if (selectedOrderForReceipt) {
        onQuickReceipt(selectedOrderForReceipt);
    }
    setConfirmModalOpen(false);
    setSelectedOrderForReceipt(null);
  };

  const handleCancelQuickReceipt = () => {
    setConfirmModalOpen(false);
    setSelectedOrderForReceipt(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-[#0077B5]" /> Bestellungen
        </h2>
        
        <button
            onClick={() => onNavigate('create-order')}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                isDark 
                 ? 'bg-[#0077B5] hover:bg-[#00A0DC] text-white shadow-blue-500/20' 
                 : 'bg-[#0077B5] hover:bg-[#00A0DC] text-white shadow-blue-500/20'
            }`}
        >
            <Plus size={20} /> Neue Bestellung
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Suche nach PO Nummer oder Lieferant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-xl pl-11 pr-4 py-3 text-base md:text-sm transition-all focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 focus:ring-blue-500/30' 
                  : 'bg-white border-slate-200 text-[#313335] focus:ring-[#0077B5]/20'
              }`}
            />
          </div>
          
          <button 
             onClick={() => setShowArchived(!showArchived)}
             className={`px-4 py-3 md:py-0 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
               isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'
             } ${showArchived ? 'text-[#0077B5] border-[#0077B5]/30' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}
          >
             {showArchived ? <CheckSquare size={18} /> : <Square size={18} />}
             <span>Archivierte anzeigen</span>
          </button>

          <button 
            disabled
            className={`hidden md:flex px-4 py-3 md:py-0 rounded-xl border items-center justify-center gap-2 font-bold transition-all opacity-50 cursor-not-allowed ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm min-w-[800px]">
             <thead className={`border-b ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
               <tr>
                 <th className="p-4 font-semibold">Bestell Nummer</th>
                 <th className="p-4 font-semibold">Datum</th>
                 <th className="p-4 font-semibold">Lieferant</th>
                 <th className="p-4 font-semibold w-64">Status</th>
                 <th className="p-4 font-semibold text-center">Bestellbestätigung</th>
                 <th className="p-4 font-semibold text-center">Positionen</th>
                 <th className="p-4 font-semibold text-right">Aktion</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-500/10">
                {filteredOrders.map(order => (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`cursor-pointer transition-colors ${
                        order.isArchived 
                            ? (isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800/50' : 'bg-slate-50 text-slate-400 hover:bg-slate-100')
                            : (isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50')
                    }`}
                  >
                    <td className="p-4 font-mono font-bold text-[#0077B5]">{order.id}</td>
                    <td className="p-4 flex items-center gap-2 text-slate-500">
                        <Calendar size={14} /> 
                        {new Date(order.dateCreated).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="p-4 font-medium">
                        <div className="flex items-center gap-2">
                            <Truck size={14} className="text-slate-400"/> {order.supplier}
                        </div>
                    </td>
                    <td className="p-4">
                      {renderOrderBadges(order)}
                    </td>
                    <td className="p-4 text-center">
                        {order.pdfUrl ? (
                           <div className="flex justify-center" title="Bestätigung vorhanden">
                             <CheckCircle2 size={18} className="text-emerald-500" />
                           </div>
                        ) : (
                           <div className="flex justify-center opacity-30" title="Keine Bestätigung">
                             <Ban size={18} className="text-slate-500" />
                           </div>
                        )}
                    </td>
                    <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {order.items.length}
                        </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                        {/* Quick Receipt Action */}
                        {!order.isArchived && (order.status === 'Offen' || order.status === 'Projekt') && !order.linkedReceiptId && (
                             <button
                                onClick={(e) => handleQuickReceiptClick(e, order.id)}
                                className="p-2 hover:bg-purple-500/10 hover:text-purple-500 text-slate-400 rounded-full transition-colors"
                                title="Wareneingang erstellen (Wartet auf Prüfung)"
                             >
                                <PackagePlus size={18} />
                             </button>
                        )}

                        {/* Receive Button */}
                        {!order.isArchived && order.status !== 'Abgeschlossen' && (
                            <button 
                                onClick={(e) => handleReceiveClick(e, order.id)}
                                className="p-2 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-400 rounded-full transition-colors"
                                title="Wareneingang prüfen"
                            >
                                <ClipboardCheck size={18} />
                            </button>
                        )}

                        {/* Edit Button */}
                        {!order.isArchived && order.status !== 'Abgeschlossen' ? (
                            <button 
                                onClick={(e) => handleEditClick(e, order)}
                                className="p-2 hover:bg-[#0077B5]/10 hover:text-[#0077B5] text-slate-400 rounded-full transition-colors"
                                title="Bearbeiten"
                            >
                                <Pencil size={18} />
                            </button>
                        ) : !order.isArchived && order.status === 'Abgeschlossen' ? (
                            <button 
                                disabled
                                className="p-2 opacity-30 cursor-not-allowed text-slate-400"
                                title="Bearbeitung gesperrt (Abgeschlossen)"
                            >
                                <Lock size={18} />
                            </button>
                        ) : null}

                        {!order.isArchived && (
                            <button 
                                onClick={(e) => handleArchiveClick(order.id, e)}
                                className="p-2 hover:bg-amber-500/10 hover:text-amber-500 text-slate-400 rounded-full transition-colors"
                                title="Archivieren"
                            >
                                <Archive size={18} />
                            </button>
                        )}
                        {order.isArchived && (
                            <span className="text-xs text-slate-500 italic mr-2">Archiviert</span>
                        )}
                        <div className="w-px h-4 bg-slate-500/20 mx-1" />
                        <button 
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-full transition-colors"
                            title="Details ansehen"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">Keine Bestellungen gefunden.</td>
                  </tr>
                )}
             </tbody>
           </table>
         </div>
      </div>

      {/* READ-ONLY DETAIL MODAL */}
      {selectedOrder && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedOrder(null)} />
            <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                
                {/* Modal Header */}
                <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    
                    {/* Title Row with Status Badge Top-Right */}
                    <div className="flex justify-between items-start mb-6">
                        <h3 className={`font-bold text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Bestell Nummer : {selectedOrder.id}
                        </h3>
                        <div className="flex items-center gap-3">
                            {/* Uses the same render logic as the table row for consistency */}
                            {renderOrderBadges(selectedOrder)}
                            <button onClick={() => setSelectedOrder(null)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                        {/* Supplier */}
                        <div>
                            <div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lieferant</div>
                            <div className={`font-medium flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                <Truck size={16} className="opacity-70 text-[#0077B5]" /> 
                                {selectedOrder.supplier}
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bestelldatum</div>
                            <div className={`font-medium flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                <Calendar size={16} className="opacity-70" /> 
                                {new Date(selectedOrder.dateCreated).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </div>
                        </div>

                        {/* PDF Attachment */}
                        <div>
                            <div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bestellbestätigung</div>
                            <div>
                                {selectedOrder.pdfUrl ? (
                                    <a 
                                        href={selectedOrder.pdfUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[#0077B5] hover:underline hover:text-[#00A0DC] flex items-center gap-2 font-bold transition-colors"
                                        title="PDF in neuem Tab öffnen"
                                    >
                                        <FileText size={16} /> PDF anzeigen
                                    </a>
                                ) : (
                                    <span className={`italic flex items-center gap-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                        <FileText size={16} className="opacity-50" /> Kein Anhang
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* LIFECYCLE STEPPER VISUALIZATION */}
                <div className={`px-6 py-6 border-b ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                    <LifecycleStepper 
                        status={selectedOrder.status}
                        hasOpenTickets={hasOpenTickets}
                        theme={theme}
                    />
                </div>
                
                {/* Modal Content (Table) */}
                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-left text-sm">
                        <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                            <tr>
                                <th className="px-6 py-3 font-semibold">Artikel</th>
                                <th className="px-6 py-3 font-semibold w-32 text-center">Bestellt</th>
                                <th className="px-6 py-3 font-semibold w-32 text-center">Geliefert</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                            {selectedOrder.items.map((item, idx) => {
                                // Lookup system from MOCK_ITEMS because it's not stored in the PO Item
                                const stockItem = MOCK_ITEMS.find(si => si.sku === item.sku);
                                const systemInfo = stockItem?.system || 'Material';

                                return (
                                <tr key={idx} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                    <td className="px-6 py-4">
                                        <div className={`font-bold text-sm mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.name}</div>
                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3">
                                            <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                <span className="opacity-70">Artikelnummer:</span>
                                                <span className="font-mono text-xs">{item.sku}</span>
                                            </div>
                                            
                                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {systemInfo}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold">
                                        {item.quantityExpected}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-bold ${
                                            item.quantityReceived >= item.quantityExpected 
                                                ? 'text-emerald-500' 
                                                : item.quantityReceived > 0 ? 'text-red-500' : 'text-slate-400'
                                        }`}>
                                            {item.quantityReceived}
                                        </span>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                {/* Modal Footer with Actions */}
                <div className={`p-5 border-t flex justify-between items-center gap-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    
                    {/* Action Toolbar */}
                    <div className="flex items-center gap-2">
                        {/* 1. Quick Receipt (PackagePlus) */}
                        {!selectedOrder.isArchived && (selectedOrder.status === 'Offen' || selectedOrder.status === 'Projekt') && !selectedOrder.linkedReceiptId && (
                             <button
                                onClick={() => {
                                    setSelectedOrderForReceipt(selectedOrder.id);
                                    setConfirmModalOpen(true);
                                }}
                                className={`px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                                    isDark 
                                    ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                }`}
                                title="Wareneingang vorerfassen (Status: In Prüfung)"
                             >
                                <PackagePlus size={18} />
                                <span className="hidden sm:inline">Erstellen</span>
                             </button>
                        )}

                        {/* 2. Receive / Check (ClipboardCheck) */}
                        {!selectedOrder.isArchived && selectedOrder.status !== 'Abgeschlossen' && (
                            <button 
                                onClick={() => onReceiveGoods(selectedOrder.id)}
                                className={`px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                                    isDark 
                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                                title="Wareneingang prüfen / buchen"
                            >
                                <ClipboardCheck size={18} />
                                <span className="hidden sm:inline">Prüfen</span>
                            </button>
                        )}

                        {/* 3. Edit (Pencil) */}
                        {!selectedOrder.isArchived && selectedOrder.status !== 'Abgeschlossen' && (
                            <button 
                                onClick={() => onEdit(selectedOrder)}
                                className={`px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                                    isDark 
                                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                                title="Bestellung bearbeiten"
                            >
                                <Pencil size={18} />
                                <span className="hidden sm:inline">Bearbeiten</span>
                            </button>
                        )}

                        {/* 4. Archive (Archive) */}
                        {!selectedOrder.isArchived && (
                            <button 
                                onClick={(e) => {
                                    if (window.confirm("Möchten Sie diese Bestellung wirklich archivieren?")) {
                                        onArchive(selectedOrder.id);
                                        setSelectedOrder(null); // Close modal after archive
                                    }
                                }}
                                className={`px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                                    isDark 
                                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                }`}
                                title="Archivieren"
                            >
                                <Archive size={18} />
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={() => setSelectedOrder(null)}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* NEW: Quick Receipt Confirmation Modal - INCREASED Z-INDEX to sit above Detail Modal */}
      {confirmModalOpen && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleCancelQuickReceipt} />
            <div className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full shrink-0 ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                        <PackagePlus size={24} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Wareneingang erstellen?</h3>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status wird auf 'Wartet auf Prüfung' gesetzt.</p>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-2">
                    <button 
                        onClick={handleCancelQuickReceipt}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                        Abbrechen
                    </button>
                    <button 
                        onClick={handleConfirmQuickReceipt}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all"
                    >
                        Ja, erstellen
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

    </div>
  );
};
