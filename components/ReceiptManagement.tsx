
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Calendar, MapPin, Package, ChevronRight, 
  ArrowLeft, Mail, Phone, StickyNote, Send, Clock, User, X,
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp, FileText, Truck,
  BarChart3, Ban, Archive, Briefcase, Info, PackagePlus,
  AlertTriangle, Layers, XCircle, ClipboardCheck,
  Undo2, MessageSquare
} from 'lucide-react';
import { ReceiptHeader, ReceiptItem, Theme, ReceiptComment, Ticket, PurchaseOrder, ReceiptMaster, DeliveryLog, ActiveModule } from '../types';
import { TicketSystem } from './TicketSystem';

interface ReceiptManagementProps {
  headers: ReceiptHeader[];
  items: ReceiptItem[];
  comments: ReceiptComment[];
  tickets: Ticket[];
  purchaseOrders: PurchaseOrder[];
  receiptMasters: ReceiptMaster[];
  theme: Theme;
  onUpdateStatus: (batchId: string, newStatus: string) => void;
  onAddComment: (batchId: string, type: 'note' | 'email' | 'call', message: string) => void;
  onAddTicket: (ticket: Ticket) => void;
  onUpdateTicket: (ticket: Ticket) => void;
  onReceiveGoods: (poId: string) => void;
  onNavigate: (module: ActiveModule) => void;
  onRevertReceipt: (batchId: string) => void;
}

// Extended Type for Grouped Rows
type ReceiptListRow = ReceiptHeader & {
    isGroup?: boolean;
    deliveryCount?: number;
    masterStatus?: string;
    subHeaders?: ReceiptHeader[]; // For search reference
};

export const ReceiptManagement: React.FC<ReceiptManagementProps> = ({
  headers,
  items,
  comments,
  tickets,
  purchaseOrders,
  receiptMasters,
  theme,
  onUpdateStatus,
  onAddComment,
  onAddTicket,
  onUpdateTicket,
  onReceiveGoods,
  onNavigate,
  onRevertReceipt
}) => {
  const isDark = theme === 'dark';
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  
  // -- Overview State --
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'booked'>('all');
  
  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterUser, setFilterUser] = useState('');

  // -- Detail State --
  const [commentInput, setCommentInput] = useState('');
  const [commentType, setCommentType] = useState<'note' | 'email' | 'call'>('note');
  
  // Phase 4: Tabs & Tickets & Delivery History
  const [activeTab, setActiveTab] = useState<'items' | 'tickets'>('items');
  
  // Expanded Delivery Logs State
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  // New State: Delivery List Popover
  const [showDeliveryList, setShowDeliveryList] = useState(false);

  // Reset dropdown when changing selection
  useEffect(() => {
      setShowDeliveryList(false);
  }, [selectedBatchId]);

  // -- Detail View Hooks --
  const selectedHeader = useMemo(() => headers.find(h => h.batchId === selectedBatchId), [headers, selectedBatchId]);
  const relatedItems = useMemo(() => items.filter(i => i.batchId === selectedBatchId), [items, selectedBatchId]);
  const relatedComments = useMemo(() => comments.filter(c => c.batchId === selectedBatchId).sort((a,b) => b.timestamp - a.timestamp), [comments, selectedBatchId]);
  const relatedTickets = useMemo(() => tickets.filter(t => t.receiptId === selectedBatchId), [tickets, selectedBatchId]);
  
  // Linked Purchase Order Logic
  const linkedPO = useMemo(() => {
      if (!selectedHeader?.bestellNr) return null;
      return purchaseOrders.find(po => po.id === selectedHeader.bestellNr);
  }, [selectedHeader, purchaseOrders]);

  // Linked Receipt Master Logic (For Multi-Delivery View)
  const linkedMaster = useMemo(() => {
      if (!selectedHeader?.bestellNr) return null;
      return receiptMasters.find(m => m.poId === selectedHeader.bestellNr);
  }, [selectedHeader, receiptMasters]);

  // 1. Group Data Logic
  const groupedRows = useMemo(() => {
      const groups: Record<string, ReceiptHeader[]> = {};
      const singles: ReceiptHeader[] = [];

      const sortedHeaders = [...headers].sort((a, b) => b.timestamp - a.timestamp);

      sortedHeaders.forEach(h => {
          if (h.bestellNr) {
              if (!groups[h.bestellNr]) groups[h.bestellNr] = [];
              groups[h.bestellNr].push(h);
          } else {
              singles.push(h);
          }
      });

      const result: ReceiptListRow[] = [];

      Object.entries(groups).forEach(([poId, groupHeaders]) => {
          const latest = groupHeaders[0];
          const master = receiptMasters.find(m => m.poId === poId);
          const deliveryCount = groupHeaders.length;

          result.push({
              ...latest,
              isGroup: true,
              deliveryCount: deliveryCount,
              masterStatus: master ? master.status : latest.status,
              subHeaders: groupHeaders
          });
      });

      singles.forEach(h => {
          result.push({
              ...h,
              isGroup: false,
              deliveryCount: 1,
              masterStatus: h.status
          });
      });

      return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [headers, receiptMasters]);

  // 2. Filter Logic
  const filteredRows = useMemo(() => {
    return groupedRows.filter(row => {
      const displayStatus = row.masterStatus || row.status;
      const term = searchTerm.toLowerCase();
      let matchesSearch = false;

      if (
          row.lieferscheinNr.toLowerCase().includes(term) ||
          row.lieferant.toLowerCase().includes(term) ||
          (row.bestellNr ? row.bestellNr.toLowerCase().includes(term) : false)
      ) {
          matchesSearch = true;
      }

      if (!matchesSearch && row.isGroup && row.subHeaders) {
          matchesSearch = row.subHeaders.some(sub => sub.lieferscheinNr.toLowerCase().includes(term));
      }
      
      if (!matchesSearch) return false;

      if (statusFilter === 'booked') {
          if (displayStatus !== 'Gebucht' && displayStatus !== 'Abgeschlossen') return false;
      }
      if (statusFilter === 'open') {
          if (displayStatus === 'Gebucht' || displayStatus === 'Abgeschlossen') return false;
      }

      if (dateFrom || dateTo) {
          const entryDate = new Date(row.timestamp).setHours(0,0,0,0);
          if (dateFrom) {
            const from = new Date(dateFrom).setHours(0,0,0,0);
            if (entryDate < from) return false;
          }
          if (dateTo) {
            const to = new Date(dateTo).setHours(0,0,0,0);
            if (entryDate > to) return false;
          }
      }

      if (filterUser) {
          const user = (row.createdByName || '').toLowerCase();
          if (!user.includes(filterUser.toLowerCase())) return false;
      }

      return true;
    });
  }, [groupedRows, searchTerm, statusFilter, dateFrom, dateTo, filterUser]);

  // Snapshot Logic
  const deliverySnapshots = useMemo(() => {
      if (!linkedMaster) return {};
      const snaps: Record<string, Record<string, { pre: number, current: number, post: number }>> = {};
      const running: Record<string, number> = {};
      const sortedDeliveries = [...linkedMaster.deliveries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      sortedDeliveries.forEach(d => {
          snaps[d.id] = {};
          d.items.forEach(item => {
              const pre = running[item.sku] || 0;
              const current = item.receivedQty;
              const post = pre + current;
              running[item.sku] = post;
              snaps[d.id][item.sku] = { pre, current, post };
          });
      });
      return snaps;
  }, [linkedMaster]);

  const canReceiveMore = useMemo(() => {
      if (!linkedPO) return false;
      if (linkedPO.status === 'Abgeschlossen' || linkedPO.status === 'Storniert') return false;
      const hasRemaining = linkedPO.items.some(i => i.quantityReceived < i.quantityExpected);
      return hasRemaining;
  }, [linkedPO]);

  const visibleDeliveries = useMemo(() => {
      return linkedMaster ? linkedMaster.deliveries.filter(d => d.lieferscheinNr !== 'Ausstehend') : [];
  }, [linkedMaster]);

  useEffect(() => {
      if (visibleDeliveries.length === 1) {
          setExpandedDeliveryId(visibleDeliveries[0].id);
      }
  }, [visibleDeliveries, selectedBatchId]);

  // --- Handlers ---
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setFilterUser('');
  };

  const handleOpenDetail = (row: ReceiptListRow) => {
    setSelectedBatchId(row.batchId);
  };

  const handleBack = () => {
    setSelectedBatchId(null);
  };

  const handleForceClose = () => {
     if (!selectedBatchId) return;
     if (window.confirm("Möchten Sie diesen Wareneingang wirklich abschließen?")) {
         onUpdateStatus(selectedBatchId, 'Abgeschlossen');
     }
  };

  const handleRevert = () => {
      if (!selectedBatchId) return;
      if (window.confirm("Möchten Sie die Buchung stornieren? Der Lagerbestand wird entsprechend reduziert.")) {
          onRevertReceipt(selectedBatchId);
      }
  };

  const toggleDeliveryExpand = (id: string) => {
      setExpandedDeliveryId(prev => prev === id ? null : id);
  };

  const handleScrollToDelivery = (deliveryId: string) => {
      setShowDeliveryList(false);
      setExpandedDeliveryId(deliveryId);
      
      // Allow state update to render content before scrolling
      setTimeout(() => {
          const el = document.getElementById(`delivery-${deliveryId}`);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }, 100);
  };

  const handlePostComment = () => {
      if (!selectedBatchId || !commentInput.trim()) return;
      onAddComment(selectedBatchId, commentType, commentInput);
      setCommentInput('');
  };

  // --- Helper Functions for Badges & Icons ---

  const statusColors = (status: string) => {
    if (status === 'Gebucht' || status === 'Abgeschlossen') {
        return isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (status === 'In Prüfung' || status === 'Wartet auf Prüfung') {
        return isDark 
            ? 'bg-[#6264A7]/20 text-[#9ea0e6] border-[#6264A7]/40' 
            : 'bg-[#6264A7]/10 text-[#6264A7] border-[#6264A7]/20';
    }
    if (status === 'Offen') {
        return isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (['Übermenge', 'Zu viel'].includes(status)) {
        return isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-100 text-orange-700 border-orange-200';
    }
    if (['Teillieferung', 'Untermenge', 'Falsch geliefert'].includes(status)) {
        return isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-700 border-amber-200';
    }
    if (['Quarantäne', 'Beschädigt', 'Reklamation', 'Abgelehnt', 'Rücklieferung'].includes(status)) {
        return isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-100 text-red-700 border-red-200';
    }
    return isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const renderReceiptBadges = (header: ReceiptHeader, po: PurchaseOrder | undefined, master: ReceiptMaster | undefined, receiptTickets: Ticket[]) => {
      const badges: React.ReactNode[] = [];
      const status = header.status;
      const effectiveStatus = (header as any).masterStatus || status; 

      // -- CALCULATE PROCESSED STATES FIRST --
      const isPartial = effectiveStatus === 'Teillieferung' || po?.status === 'Teilweise geliefert' || effectiveStatus.includes('Teil');
      const isOver = effectiveStatus === 'Übermenge' || (master?.deliveries.some(d => d.items.some(i => (i.zuViel || 0) > 0)));
      const isDamaged = effectiveStatus === 'Schaden' || effectiveStatus === 'Beschädigt' || (master?.deliveries.some(d => d.items.some(i => i.damageFlag)));
      const isWrong = effectiveStatus === 'Falsch geliefert';
      const isRejected = effectiveStatus === 'Abgelehnt' || effectiveStatus === 'Reklamation';
      
      const isBooked = effectiveStatus === 'Gebucht' || status === 'Gebucht';
      const isClosed = effectiveStatus === 'Abgeschlossen';

      // If any of these "Result" statuses are true, we consider the receipt processed and should HIDE "In Prüfung".
      const hasResultStatus = isPartial || isOver || isDamaged || isWrong || isRejected || isBooked || isClosed;

      // 1. Offen (Green) - Shows if PO is open OR Receipt is open (and not closed)
      const isPOOpen = po && !po.isArchived && po.status !== 'Abgeschlossen';
      const isReceiptOpen = !po && (effectiveStatus !== 'Abgeschlossen' && effectiveStatus !== 'Gebucht');
      
      if (isPOOpen || isReceiptOpen) {
           badges.push(
              <span key="offen" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                  Offen
              </span>
          );
      }

      // 2. Projekt (Blue)
      if (po?.status === 'Projekt') {
          badges.push(
              <span key="projekt" className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-900' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                  <Briefcase size={10} /> Projekt
              </span>
          );
      }

      // 3. In Prüfung (Purple) - Logic Updated to respect Result Status
      const isWaiting = header.lieferscheinNr === 'Ausstehend' || effectiveStatus === 'In Prüfung' || effectiveStatus === 'Wartet auf Prüfung';
      const isMasterChecking = master && (master.status === 'Offen' || master.status === 'In Prüfung');

      if ((isWaiting || isMasterChecking) && !hasResultStatus) {
           badges.push(
              <span key="checking" className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${isDark ? 'bg-[#6264A7]/20 text-[#9ea0e6] border-[#6264A7]/40' : 'bg-[#6264A7]/10 text-[#6264A7] border-[#6264A7]/20'}`}>
                  In Prüfung
              </span>
          );
      }

      // 4. Derived Statuses
      if (isPartial) {
           badges.push(
              <span key="partial" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                  Teillieferung
              </span>
          );
      }

      if (isOver) {
           badges.push(
              <span key="over" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                  Übermenge
              </span>
          );
      }

      if (isDamaged) {
           badges.push(
              <span key="damage" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  Schaden
              </span>
          );
      }
      
      if (isWrong) {
           badges.push(
              <span key="wrong" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                  Falsch geliefert
              </span>
          );
      }

      if (isRejected) {
           badges.push(
              <span key="rejected" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  Abgelehnt
              </span>
          );
      }

      if (isBooked) {
           badges.push(
              <span key="booked" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                  Gebucht
              </span>
          );
      }

      // TICKET STATUS BADGE
      if (receiptTickets.length > 0) {
          const allClosed = receiptTickets.every(t => t.status === 'Closed');
          if (allClosed) {
              badges.push(
                  <span key="tickets-closed" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      Fall gelöst
                  </span>
              );
          }
      }

      if (isClosed) {
           badges.push(
              <span key="closed" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                  Geschlossen
              </span>
          );
      }

      if (badges.length === 0) {
           badges.push(
              <span key="generic" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors(effectiveStatus)}`}>
                  {effectiveStatus}
              </span>
          );
      }

      return <div className="flex flex-wrap items-center gap-1.5">{badges}</div>;
  };

  const getItemIssues = (item: ReceiptItem) => {
    const notes = item.issueNotes || '';
    const isWrong = notes.includes('FALSCH');
    const isRejected = notes.includes('ABGELEHNT') || notes.includes('abgewiesen');
    const isDamaged = !!item.isDamaged; 
    const wrongReason = isWrong ? notes.match(/FALSCH: (.*?)(?: \| |$)/)?.[1] : null;
    return { isDamaged, isWrong, isRejected, wrongReason };
  };

  const ItemStatusBadge = ({ item, quantityInfo }: { item?: ReceiptItem, quantityInfo?: { ordered: number, received: number } }) => {
    if (!item) return <span className="text-slate-400">-</span>;
    
    const { isDamaged, isWrong, isRejected, wrongReason } = getItemIssues(item);
    
    if (isDamaged && isWrong) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <AlertTriangle size={10} /> Schaden + Falsch
            </span>
        );
    }
    if (isDamaged) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <AlertTriangle size={10} /> Schaden
            </span>
        );
    }
    if (isWrong) {
        return (
            <span 
                title={wrongReason || 'Falsch geliefert'}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
            >
                <XCircle size={10} /> Falsch geliefert
            </span>
        );
    }
    if (isRejected) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <Ban size={10} /> Abgelehnt
            </span>
        );
    }
    
    if (quantityInfo) {
        const { ordered, received } = quantityInfo;
        if (received > ordered) {
             return (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                    <Info size={10} /> Überlieferung
                </span>
            );
        }
        if (received < ordered) {
             return (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    <AlertTriangle size={10} /> Teillieferung
                </span>
            );
        }
    }
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            <CheckCircle2 size={10} /> OK
        </span>
    );
  };

  const findReceiptItemForLog = (delivery: DeliveryLog, sku: string) => {
    const header = headers.find(h => 
        h.lieferscheinNr === delivery.lieferscheinNr && 
        (linkedMaster?.poId ? h.bestellNr === linkedMaster.poId : true)
    );
    if (!header) return undefined;
    return items.find(i => i.batchId === header.batchId && i.sku === sku);
  };

  const renderItemStatusIconForPO = (ordered: number, received: number, hasIssues: boolean) => {
      const isPerfect = !hasIssues && ordered === received;
      if (isPerfect) return (<div className="flex justify-center"><CheckCircle2 size={18} className="text-emerald-500" /></div>);
      return (<div className="flex justify-center" title={hasIssues ? "Probleme gemeldet" : ordered !== received ? "Mengenabweichung" : ""}><AlertTriangle size={18} className="text-amber-500" /></div>);
  };

  // --- ACTIONS RENDERER (Shared for both layouts) ---
  const renderActions = () => (
      <>
        {/* SHOW "STORNO" BUTTON IF BOOKED */}
        {selectedHeader?.status === 'Gebucht' && (
            <button
                onClick={handleRevert}
                className={`p-1.5 rounded-lg border transition-all ${
                    isDark 
                    ? 'border-amber-500/50 text-amber-400 hover:bg-amber-500/10' 
                    : 'border-amber-500 text-amber-600 hover:bg-amber-50'
                }`}
                title="Buchung stornieren"
            >
                <Undo2 size={16} />
            </button>
        )}

        {selectedHeader?.status !== 'Abgeschlossen' && (
            <button
                onClick={handleForceClose}
                className={`p-1.5 rounded-lg border transition-all ${
                    isDark 
                    ? 'border-slate-700 text-slate-400 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10' 
                    : 'border-slate-300 text-slate-500 hover:border-red-500 hover:text-red-600 hover:bg-red-50'
                }`}
                title="Abschließen"
            >
                <Archive size={16} />
            </button>
        )}
      </>
  );

  if (!selectedBatchId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-2xl font-bold">Wareneingang Verwaltung</h2>
          <button
            onClick={() => onNavigate('goods-receipt')}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                isDark 
                 ? 'bg-[#0077B5] hover:bg-[#00A0DC] text-white shadow-blue-500/20' 
                 : 'bg-[#0077B5] hover:bg-[#00A0DC] text-white shadow-blue-500/20'
            }`}
          >
            <ClipboardCheck size={20} /> Lieferung prüfen
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Suche nach Lieferschein, Lieferant oder Bestell Nr..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-xl pl-11 pr-4 py-3 text-base md:text-sm transition-all focus:outline-none focus:ring-2 ${
                  isDark 
                    ? 'bg-slate-900 border-slate-800 text-slate-100 focus:ring-blue-500/30' 
                    : 'bg-white border-slate-200 text-[#313335] focus:ring-[#0077B5]/20'
                }`}
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                {(['all', 'open', 'booked'] as const).map(f => (
                <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    statusFilter === f 
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-[#0077B5]' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    {f === 'all' ? 'Alle' : f === 'open' ? 'Offen' : 'Gebucht'}
                </button>
                ))}
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 md:py-0 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                showFilters 
                   ? 'bg-[#0077B5] border-[#0077B5] text-white' 
                   : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>

          {showFilters && (
            <div className={`p-5 rounded-2xl border animate-in slide-in-from-top-2 duration-200 ${
              isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Erweiterte Suche</h3>
                  {(dateFrom || dateTo || filterUser) && (
                    <button onClick={clearFilters} className="text-xs text-[#0077B5] font-bold hover:underline flex items-center gap-1">
                       Filter zurücksetzen <X size={12}/>
                    </button>
                  )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-500">Zeitraum Von</label>
                   <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-500">Zeitraum Bis</label>
                   <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-500">Erfasst von (Benutzer)</label>
                   <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={filterUser} 
                        onChange={e => setFilterUser(e.target.value)} 
                        placeholder="Benutzername..." 
                        className={`w-full border rounded-xl pl-9 px-3 py-2 text-sm outline-none focus:ring-2 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`} 
                      />
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm min-w-[1000px]">
               <thead className={`border-b ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                 <tr>
                   <th className="p-4 font-semibold">Status</th>
                   <th className="p-4 font-semibold">Bestell Nr.</th>
                   <th className="p-4 font-semibold text-center">Bestellbestätigung</th>
                   <th className="p-4 font-semibold">Lieferschein</th>
                   <th className="p-4 font-semibold">Lieferant</th>
                   <th className="p-4 font-semibold">Aktualisiert am / von</th>
                   <th className="p-4 font-semibold text-right"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-500/10">
                  {filteredRows.map(row => {
                    const linkedPO = purchaseOrders.find(po => po.id === row.bestellNr);
                    const linkedMaster = receiptMasters.find(m => m.poId === row.bestellNr);
                    const deliveryCount = row.deliveryCount || 1;
                    const rowTickets = tickets.filter(t => t.receiptId === row.batchId);

                    return (
                    <tr 
                      key={row.batchId} 
                      onClick={() => handleOpenDetail(row)}
                      className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                    >
                      <td className="p-4">
                        {renderReceiptBadges(row, linkedPO, linkedMaster, rowTickets)}
                      </td>
                      <td className="p-4 font-medium text-slate-600 dark:text-slate-400">
                          {row.isGroup ? (
                              <div className="flex items-center gap-2">
                                  <Layers size={14} className="text-[#0077B5]" />
                                  <span className="font-bold">{row.bestellNr}</span>
                              </div>
                          ) : (
                              row.bestellNr || '—'
                          )}
                      </td>
                      <td className="p-4 text-center">
                        {linkedPO?.pdfUrl ? (
                           <div className="flex justify-center" title="Bestätigung vorhanden">
                             <CheckCircle2 size={18} className="text-emerald-500" />
                           </div>
                        ) : (
                           <div className="flex justify-center opacity-30" title="Keine Bestätigung">
                             <Ban size={18} className="text-slate-500" />
                           </div>
                        )}
                      </td>

                      <td className="p-4 font-medium">
                          {deliveryCount > 1 ? (
                              <span className="italic opacity-80 flex items-center gap-1">
                                  Multiple ({deliveryCount})
                              </span>
                          ) : (
                              row.lieferscheinNr
                          )}
                      </td>
                      <td className="p-4 text-slate-500">{row.lieferant}</td>
                      <td className="p-4 text-slate-500">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5"><Calendar size={12}/> {new Date(row.timestamp).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5 mt-1 text-xs opacity-70"><User size={12}/> {row.createdByName || 'Unbekannt'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-slate-400"><ChevronRight size={18} /></td>
                    </tr>
                  )})}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500">Keine Datensätze gefunden.</td>
                    </tr>
                  )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    );
  }

  if (!selectedHeader) return null;

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300">
      
      {/* TOP NAVIGATION BAR - PERSISTENT */}
      <div className={`flex-none flex items-center gap-4 px-4 h-14 border-b z-20 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <button 
            onClick={handleBack} 
            className={`flex items-center gap-2 text-sm font-bold transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
              <ArrowLeft size={18} /> <span className="hidden md:inline">Liste</span>
          </button>
          
          <div className="h-6 w-px bg-slate-500/20 mx-2"></div>
          
          {/* TAB PILLS - GMAIL STYLE */}
          <div className={`flex p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button 
                  onClick={() => setActiveTab('items')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      activeTab === 'items' 
                      ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') 
                      : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
                  }`}
              >
                  <Package size={14} />
                  Positionen
              </button>
              <button 
                  onClick={() => setActiveTab('tickets')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      activeTab === 'tickets' 
                      ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') 
                      : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
                  }`}
              >
                  <MessageSquare size={14} />
                  Reklamationen
                  {relatedTickets.length > 0 && (
                      <span className="bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold">{relatedTickets.length}</span>
                  )}
              </button>
          </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        
        {/* ITEMS TAB CONTENT */}
        {activeTab === 'items' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
                
                {/* HEADER PANE - ONLY IN ITEMS VIEW */}
                <div className={`rounded-xl border flex flex-col p-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    
                    {/* Top Row: PO | Divider | LS  <---> Badges | Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Left Group */}
                        <div className="flex items-center gap-4">
                            {/* PO */}
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Bestellung:</span>
                                <span className={`text-base font-bold font-mono ${selectedHeader.bestellNr ? (isDark ? 'text-white' : 'text-slate-900') : 'opacity-50 italic font-normal'}`}>
                                    {selectedHeader.bestellNr || '—'}
                                </span>
                            </div>

                            {/* Divider */}
                            <div className={`h-4 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

                            {/* LS Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowDeliveryList(!showDeliveryList)}
                                    className={`flex items-center gap-1.5 text-sm font-bold transition-colors group ${
                                        isDark ? 'text-white hover:text-blue-400' : 'text-slate-900 hover:text-[#0077B5]'
                                    }`}
                                >
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>LS:</span>
                                    {selectedHeader.lieferscheinNr}
                                    <ChevronDown size={14} className={`opacity-50 transition-transform duration-200 ${showDeliveryList ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Popover */}
                                {showDeliveryList && (
                                    <div className={`absolute top-full left-0 mt-2 w-72 rounded-xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 ${
                                        isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
                                    }`}>
                                        <div className={`p-3 border-b flex justify-between items-center ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Alle Lieferungen</span>
                                            <button onClick={() => setShowDeliveryList(false)} className="hover:bg-red-500/10 hover:text-red-500 p-1 rounded transition-colors"><X size={14}/></button>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {linkedMaster?.deliveries
                                                .filter(d => d.lieferscheinNr && d.lieferscheinNr !== 'Ausstehend' && d.lieferscheinNr !== 'Pending')
                                                .map((del, idx) => (
                                                <button 
                                                    key={del.id} 
                                                    onClick={() => handleScrollToDelivery(del.id)}
                                                    className={`w-full text-left p-3 border-b last:border-0 flex items-center gap-3 transition-colors ${
                                                    del.lieferscheinNr === selectedHeader.lieferscheinNr 
                                                        ? (isDark ? 'bg-[#0077B5]/10 hover:bg-[#0077B5]/20' : 'bg-[#0077B5]/5 hover:bg-[#0077B5]/10') 
                                                        : (isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50')
                                                }`}>
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                        del.lieferscheinNr === selectedHeader.lieferscheinNr 
                                                            ? 'bg-[#0077B5] text-white' 
                                                            : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className={`text-sm font-bold ${
                                                            del.lieferscheinNr === selectedHeader.lieferscheinNr 
                                                                ? 'text-[#0077B5]' 
                                                                : (isDark ? 'text-slate-200' : 'text-slate-700')
                                                        }`}>
                                                            {del.lieferscheinNr}
                                                        </div>
                                                        <div className="text-[10px] opacity-60">
                                                            {new Date(del.date).toLocaleDateString()} • {del.items.length} Pos.
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                            {(!linkedMaster || linkedMaster.deliveries.filter(d => d.lieferscheinNr && d.lieferscheinNr !== 'Ausstehend' && d.lieferscheinNr !== 'Pending').length === 0) && (
                                                <div className="p-4 text-center text-xs opacity-50">Keine weiteren Lieferungen gefunden.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Group */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                             <div className="flex flex-wrap justify-end gap-1.5">
                                {renderReceiptBadges(selectedHeader, linkedPO, linkedMaster, relatedTickets)}
                             </div>
                             <div className="flex gap-1">
                                {renderActions()}
                             </div>
                        </div>
                    </div>

                    {/* Bottom Row: Metadata */}
                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2 pt-2 border-t ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                        <span className="font-medium flex items-center gap-1.5"><Truck size={12} className="text-[#0077B5]" /> {selectedHeader.lieferant}</span>
                        <span className="hidden sm:inline opacity-30">•</span>
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(selectedHeader.timestamp).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><MapPin size={12}/> {selectedHeader.warehouseLocation}</span>
                        <span className="flex items-center gap-1 ml-auto"><User size={12}/> {selectedHeader.createdByName || '—'}</span>
                    </div>
                </div>

                {/* CONTENT COLUMNS */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* PANE B: ITEM LIST & HISTORY (LEFT MAIN) */}
                    <div className="flex-[2] flex flex-col gap-6">
                        
                        {canReceiveMore && (
                            <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 ${
                                isDark ? 'bg-[#6264A7]/10 border-[#6264A7]/20' : 'bg-[#6264A7]/5 border-[#6264A7]/20'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${isDark ? 'bg-[#6264A7]/20 text-[#9ea0e6]' : 'bg-[#6264A7]/10 text-[#6264A7]'}`}>
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isDark ? 'text-[#9ea0e6]' : 'text-[#6264A7]'}`}>
                                            Bestellung noch offen
                                        </h4>
                                        <p className={`text-sm ${isDark ? 'text-[#9ea0e6]/70' : 'text-[#6264A7]/70'}`}>
                                            Es wurden noch nicht alle Artikel geliefert.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => linkedPO && onReceiveGoods(linkedPO.id)}
                                    className="px-4 py-2 bg-[#0077B5] hover:bg-[#00A0DC] text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                                >
                                    <PackagePlus size={18} />
                                    <span className="hidden sm:inline">Weitere Lieferung erfassen</span>
                                </button>
                            </div>
                        )}

                        {linkedPO && linkedMaster ? (
                            <>
                                {/* DISTINCT SUMMARY SECTION */}
                                <div className={`rounded-2xl border overflow-hidden shadow-lg ${
                                    isDark ? 'bg-[#1f2937] border-slate-700' : 'bg-white border-slate-300'
                                }`}>
                                    <div className={`p-4 border-b font-bold flex items-center gap-2 ${
                                        isDark ? 'bg-[#1f2937] border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'
                                    }`}>
                                        <BarChart3 size={18} className="text-[#0077B5]" /> Bestell-Status (Gesamtübersicht)
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm min-w-[600px]">
                                            <thead className={`text-xs uppercase font-bold ${isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                                <tr>
                                                    <th className="px-4 py-2">Artikel</th>
                                                    <th className="px-4 py-2 w-24 text-center">Bestellt</th>
                                                    <th className="px-4 py-2 w-32 text-center">Gesamt geliefert</th>
                                                    <th className="px-4 py-2 w-20 text-center text-amber-500">Offen</th>
                                                    <th className="px-4 py-2 w-20 text-center text-orange-500">Zu viel</th>
                                                    <th className="px-4 py-2 w-24 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-500/10">
                                                {linkedPO.items.map(poItem => {
                                                    const ordered = poItem.quantityExpected;
                                                    const received = poItem.quantityReceived;
                                                    const pending = Math.max(0, ordered - received);
                                                    const over = Math.max(0, received - ordered);
                                                    const hasIssues = linkedMaster.deliveries.some(d => d.items.some(di => di.sku === poItem.sku && di.damageFlag));

                                                    return (
                                                        <tr key={poItem.sku} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                                            <td className="px-4 py-2">
                                                                <div className="font-bold text-sm">{poItem.name}</div>
                                                                <div className="text-[10px] opacity-60 font-mono">{poItem.sku}</div>
                                                            </td>
                                                            <td className="px-4 py-2 text-center font-mono opacity-70 text-sm">{ordered}</td>
                                                            <td className="px-4 py-2 text-center font-bold text-sm">{received}</td>
                                                            <td className={`px-4 py-2 text-center font-bold text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                                {pending > 0 ? pending : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}
                                                            </td>
                                                            <td className={`px-4 py-2 text-center font-bold text-sm ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                                                {over > 0 ? over : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                {renderItemStatusIconForPO(ordered, received, hasIssues)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-4 px-1">
                                        <Clock size={18} className="text-slate-500" />
                                        <h3 className="font-bold text-lg">Lieferhistorie</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {visibleDeliveries.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">
                                                Noch keine physischen Wareneingänge verbucht.
                                            </div>
                                        ) : (
                                            visibleDeliveries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((delivery, index) => {
                                                const isExpanded = expandedDeliveryId === delivery.id;
                                                const isCurrent = delivery.lieferscheinNr === selectedHeader.lieferscheinNr;
                                                const snapshot = deliverySnapshots[delivery.id] || {};
                                                const isLatest = index === 0;

                                                return (
                                                    <div 
                                                        id={`delivery-${delivery.id}`}
                                                        key={delivery.id} 
                                                        className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                                                            isCurrent 
                                                                ? isDark ? 'border-[#0077B5] shadow-[0_0_15px_rgba(0,119,181,0.1)]' : 'border-[#0077B5] shadow-md ring-1 ring-[#0077B5]/20'
                                                                : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                                                        }`}
                                                    >
                                                        <button 
                                                            onClick={() => toggleDeliveryExpand(delivery.id)}
                                                            className={`w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                                                isExpanded ? 'border-b border-slate-200 dark:border-slate-800' : ''
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-2 rounded-lg ${isCurrent ? 'bg-[#0077B5] text-white' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                                                                    <Truck size={20} />
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-sm flex items-center gap-2">
                                                                        Lieferschein: {delivery.lieferscheinNr}
                                                                        {isLatest && <span className="bg-[#0077B5] text-white text-[10px] px-1.5 py-0.5 rounded">LETZTE LIEFERUNG</span>}
                                                                    </div>
                                                                    <div className="text-xs opacity-60 flex flex-col gap-0.5 mt-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Calendar size={12} /> {new Date(delivery.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                        </div>
                                                                        {linkedPO && (
                                                                            <div className="flex items-center gap-2">
                                                                                <FileText size={12} /> Verknüpfte Bestellung: {linkedPO.id}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm font-bold opacity-70">{delivery.items.length} Positionen</span>
                                                                {isExpanded ? <ChevronUp size={20} className="opacity-50" /> : <ChevronDown size={20} className="opacity-50" />}
                                                            </div>
                                                        </button>

                                                        {isExpanded && (
                                                            <div className={`p-0 ${isDark ? 'bg-slate-950/30' : 'bg-slate-50/50'}`}>
                                                                <table className="w-full text-left text-sm min-w-[800px]">
                                                                    <thead className={`text-xs uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                                        <tr>
                                                                            <th className="px-6 py-2">Artikel</th>
                                                                            <th className="px-6 py-2 w-20 text-center">Bestellt</th>
                                                                            <th className="px-6 py-2 w-20 text-center opacity-70">Bisher</th>
                                                                            <th className="px-6 py-2 w-32 text-center">Geliefert (Lieferschein)</th>
                                                                            <th className="px-6 py-2 w-20 text-center">Gesamt</th>
                                                                            <th className="px-6 py-2 w-20 text-center text-amber-500">Offen</th>
                                                                            <th className="px-6 py-2 w-20 text-center text-orange-500">Zu viel</th>
                                                                            <th className="px-6 py-2 w-24 text-center">Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-500/10">
                                                                        {delivery.items.map(dItem => {
                                                                            const poItem = linkedPO.items.find(pi => pi.sku === dItem.sku);
                                                                            const itemName = poItem ? poItem.name : dItem.sku; 
                                                                            let ordered, previous, current, pending, over, totalReceived;

                                                                            if (dItem.orderedQty !== undefined) {
                                                                                ordered = dItem.orderedQty;
                                                                                previous = dItem.previousReceived || 0;
                                                                                current = dItem.receivedQty;
                                                                                pending = dItem.offen || 0;
                                                                                over = dItem.zuViel || 0;
                                                                                totalReceived = previous + current;
                                                                            } else {
                                                                                ordered = poItem ? poItem.quantityExpected : 0;
                                                                                const data = snapshot[dItem.sku] || { pre: 0, current: dItem.receivedQty, post: dItem.receivedQty };
                                                                                previous = data.pre;
                                                                                current = dItem.receivedQty;
                                                                                totalReceived = data.post;
                                                                                pending = Math.max(0, ordered - totalReceived);
                                                                                over = Math.max(0, totalReceived - ordered);
                                                                            }

                                                                            // Look up full receipt item for detailed badge
                                                                            const fullItem = findReceiptItemForLog(delivery, dItem.sku);

                                                                            return (
                                                                                <tr key={dItem.sku} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                                                                    <td className="px-6 py-2">
                                                                                        <div className="font-bold text-sm">{itemName}</div>
                                                                                        <div className="text-[10px] opacity-60 font-mono">{dItem.sku}</div>
                                                                                        {dItem.manualAddFlag && (
                                                                                            <div className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                                                                                <AlertTriangle size={8} /> Manuell
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-6 py-2 text-center font-mono opacity-70 text-sm">{ordered > 0 ? ordered : '-'}</td>
                                                                                    <td className="px-6 py-2 text-center font-mono text-sm opacity-50">{previous > 0 ? previous : '-'}</td>
                                                                                    <td className="px-6 py-2 text-center font-bold text-sm">{current > 0 ? `+${current}` : '0'}</td>
                                                                                    <td className="px-6 py-2 text-center font-mono font-bold text-sm">{totalReceived}</td>
                                                                                    <td className={`px-6 py-2 text-center font-bold text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{pending > 0 ? pending : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}</td>
                                                                                    <td className={`px-6 py-2 text-center font-bold text-sm ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{over > 0 ? over : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}</td>
                                                                                    <td className="px-6 py-2 text-center">
                                                                                        <ItemStatusBadge 
                                                                                            item={fullItem} 
                                                                                            quantityInfo={{ ordered, received: totalReceived }} 
                                                                                        />
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={`rounded-2xl border overflow-hidden flex flex-col min-h-[400px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <div className={`p-4 border-b font-bold flex items-center gap-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <Package size={18} className="text-slate-500" /> Enthaltene Artikel
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-left text-sm min-w-[600px]">
                                        <thead className={`sticky top-0 backdrop-blur-md z-10 ${isDark ? 'bg-slate-900/80' : 'bg-white/80'}`}>
                                        <tr className="text-slate-500">
                                            <th className="p-4 font-medium">Artikel</th>
                                            <th className="p-4 font-medium text-center">Menge</th>
                                            <th className="p-4 font-medium">Lagerort</th>
                                            <th className="p-4 font-medium w-40">Status</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-500/10">
                                        {relatedItems.map(item => (
                                            <tr key={item.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                                <td className="p-4">
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs font-mono opacity-60">{item.sku}</div>
                                                </td>
                                                <td className="p-4 text-center font-bold">
                                                    {item.quantity}
                                                </td>
                                                <td className="p-4 text-xs">{item.targetLocation}</td>
                                                <td className="p-4">
                                                    <ItemStatusBadge item={item} />
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PANE C: TRACEABILITY TIMELINE (RIGHT SIDE) */}
                    <div className={`flex-1 rounded-2xl border flex flex-col overflow-hidden min-h-[400px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className={`p-4 border-b font-bold flex items-center gap-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <Clock size={18} className="text-slate-500" /> Historie & Notizen
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {relatedComments.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-sm italic">Keine Einträge vorhanden.</div>
                            ) : (
                            relatedComments.map(c => (
                                <div key={c.id} className="relative pl-6 border-l border-slate-500/20 last:border-0 pb-2">
                                <div className={`absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                                }`}>
                                    {c.type === 'email' && <Mail size={12} className="text-blue-500" />}
                                    {c.type === 'call' && <Phone size={12} className="text-purple-500" />}
                                    {c.type === 'note' && <StickyNote size={12} className="text-amber-500" />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start text-xs">
                                        <span className="font-bold">{c.userName}</span>
                                        <span className="text-slate-500">{new Date(c.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className={`p-3 rounded-xl text-sm ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                    {c.message}
                                    </div>
                                </div>
                                </div>
                            ))
                            )}
                        </div>

                        <div className={`p-4 border-t ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex gap-2 mb-2">
                                <TypeButton active={commentType === 'note'} icon={<StickyNote size={14} />} label="Notiz" onClick={() => setCommentType('note')} isDark={isDark} />
                                <TypeButton active={commentType === 'email'} icon={<Mail size={14} />} label="Email" onClick={() => setCommentType('email')} isDark={isDark} />
                                <TypeButton active={commentType === 'call'} icon={<Phone size={14} />} label="Tel." onClick={() => setCommentType('call')} isDark={isDark} />
                            </div>
                            <div className="flex gap-2 items-start">
                            <textarea 
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Neuer Eintrag..."
                                className={`flex-1 rounded-xl p-3 text-base md:text-sm resize-none h-20 outline-none focus:ring-2 focus:ring-blue-500/20 border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                            />
                            <button 
                                onClick={handlePostComment}
                                disabled={!commentInput.trim()}
                                className="self-end p-3 rounded-xl bg-[#0077B5] text-white hover:bg-[#00A0DC] disabled:opacity-50 disabled:bg-slate-500"
                            >
                                <Send size={18} />
                            </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TICKETS TAB CONTENT - FULL HEIGHT */}
        {activeTab === 'tickets' && (
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden min-h-0 h-full">
                <TicketSystem 
                    receiptId={selectedBatchId}
                    tickets={relatedTickets}
                    onAddTicket={onAddTicket}
                    onUpdateTicket={onUpdateTicket}
                    theme={theme}
                    receiptHeader={selectedHeader}
                    linkedPO={linkedPO || undefined}
                />
            </div>
        )}

      </div>

    </div>
  );
};

const TypeButton = ({ active, icon, label, onClick, isDark }: { active: boolean, icon: any, label: string, onClick: () => void, isDark: boolean }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
      active 
        ? 'bg-[#0077B5] text-white border-[#0077B5]' 
        : isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500' : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
    }`}
  >
    {icon} {label}
  </button>
);
