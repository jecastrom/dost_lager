
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Filter, Calendar, MapPin, Package, ChevronRight, 
  ArrowLeft, Mail, Phone, StickyNote, Send, Clock, User, X,
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp, FileText, Truck,
  CheckSquare, BarChart3, Ban, Archive, Briefcase, PlayCircle, Info, PackagePlus,
  AlertTriangle, Layers, Plus, MessageSquare, CornerDownRight, Unlock, Lock, XCircle, AlertOctagon
} from 'lucide-react';
import { ReceiptHeader, ReceiptItem, Theme, ReceiptComment, Ticket, TicketPriority, PurchaseOrder, TicketMessage, ReceiptMaster, DeliveryLog } from '../types';

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
}

// Internal Modal Component for New Ticket
const NewTicketModal = ({ isOpen, onClose, onSave, theme }: { isOpen: boolean, onClose: () => void, onSave: (subject: string, priority: TicketPriority, description: string) => void, theme: Theme }) => {
    const [subject, setSubject] = useState('');
    const [priority, setPriority] = useState<TicketPriority>('Normal');
    const [description, setDescription] = useState('');
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!subject || !description) return;
        onSave(subject, priority, description);
        setSubject('');
        setPriority('Normal');
        setDescription('');
    };

    const getPriorityStyles = (p: TicketPriority) => {
        if (p === 'Urgent') return isDark ? 'border-red-500 bg-red-500/10 text-red-400 focus:ring-red-500/30' : 'border-red-500 bg-red-50 text-red-700 focus:ring-red-500/30';
        if (p === 'High') return isDark ? 'border-orange-500 bg-orange-500/10 text-orange-400 focus:ring-orange-500/30' : 'border-orange-500 bg-orange-50 text-orange-700 focus:ring-orange-500/30';
        return isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500/30' : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-500/30';
    };

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <AlertCircle size={20} className="text-[#0077B5]" /> Neuen Fall melden
                    </h3>
                    <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Betreff <span className="text-red-500">*</span></label>
                        <input 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="z.B. Ware beschädigt, Falsche Menge..."
                            className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Priorität</label>
                        <select 
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as TicketPriority)}
                            className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all font-medium ${getPriorityStyles(priority)}`}
                        >
                            <option value="Normal">Normal</option>
                            <option value="High">Hoch (High)</option>
                            <option value="Urgent">Dringend (Urgent)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Beschreibung <span className="text-red-500">*</span></label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Bitte beschreiben Sie das Problem detailliert..."
                            className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[120px] resize-none transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                    </div>
                </div>

                <div className={`p-5 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <button 
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                        Abbrechen
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!subject || !description}
                        className="px-5 py-2.5 bg-[#0077B5] hover:bg-[#00A0DC] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                    >
                        <CheckCircle2 size={18} /> Fall erstellen
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

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
  onReceiveGoods
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
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  // Expanded Delivery Logs State
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  // New State: Delivery List Popover
  const [showDeliveryList, setShowDeliveryList] = useState(false);

  // Clear reply text when switching tickets or tabs
  useEffect(() => {
    setReplyText('');
    // Auto-expand first ticket if none selected
    if (activeTab === 'tickets' && !expandedTicketId && relatedTickets.length > 0) {
        setExpandedTicketId(relatedTickets[0].id);
    }
  }, [activeTab]);

  // Reset dropdown when changing selection
  useEffect(() => {
      setShowDeliveryList(false);
  }, [selectedBatchId]);

  // -- Detail View Hooks --
  const selectedHeader = useMemo(() => headers.find(h => h.batchId === selectedBatchId), [headers, selectedBatchId]);
  const relatedItems = useMemo(() => items.filter(i => i.batchId === selectedBatchId), [items, selectedBatchId]);
  const relatedComments = useMemo(() => comments.filter(c => c.batchId === selectedBatchId).sort((a,b) => b.timestamp - a.timestamp), [comments, selectedBatchId]);
  const relatedTickets = useMemo(() => tickets.filter(t => t.receiptId === selectedBatchId), [tickets, selectedBatchId]);
  
  // Get currently selected ticket object
  const selectedTicket = useMemo(() => relatedTickets.find(t => t.id === expandedTicketId), [relatedTickets, expandedTicketId]);

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

  // -- Handlers --
  const handleOpenDetail = (header: ReceiptHeader) => {
    setSelectedBatchId(header.batchId);
    setCommentInput('');
    setActiveTab('items'); 
    setExpandedDeliveryId(null);
  };

  const handleBack = () => {
    setSelectedBatchId(null);
  };

  const handleForceClose = () => {
    if (!selectedBatchId) return;
    if (window.confirm("Möchten Sie diesen Vorgang wirklich manuell beenden? Der Status wird auf 'Abgeschlossen' gesetzt.")) {
      onUpdateStatus(selectedBatchId, 'Abgeschlossen');
    }
  };

  const handlePostComment = () => {
    if (selectedBatchId && commentInput.trim()) {
      onAddComment(selectedBatchId, commentType, commentInput);
      setCommentInput('');
    }
  };

  const handleSaveNewTicket = (subject: string, priority: TicketPriority, description: string) => {
    if (!selectedBatchId) return;

    const newTicket: Ticket = {
        id: crypto.randomUUID(),
        receiptId: selectedBatchId,
        subject,
        priority,
        status: 'Open',
        messages: [{
            id: crypto.randomUUID(),
            author: 'Admin User',
            text: description,
            timestamp: Date.now(),
            type: 'user'
        }]
    };

    onAddTicket(newTicket);
    setShowNewTicketModal(false);
    setActiveTab('tickets');
    setExpandedTicketId(newTicket.id);
  };

  const handleReplyTicket = (ticket: Ticket, close: boolean) => {
    if (!replyText.trim() && !close) return;

    const messages = [...ticket.messages];
    if (replyText.trim()) {
        messages.push({
            id: crypto.randomUUID(),
            author: 'Admin User',
            text: replyText,
            timestamp: Date.now(),
            type: 'user'
        });
    }

    const updatedTicket: Ticket = {
        ...ticket,
        status: close ? 'Closed' : 'Open',
        messages
    };

    onUpdateTicket(updatedTicket);
    setReplyText('');
  };

  const handleReopenTicket = (ticket: Ticket) => {
    const updatedTicket: Ticket = {
        ...ticket,
        status: 'Open',
        messages: [...ticket.messages, {
            id: crypto.randomUUID(),
            author: 'System',
            text: 'Fall wurde wiedereröffnet.',
            timestamp: Date.now(),
            type: 'system'
        }]
    };
    onUpdateTicket(updatedTicket);
  };

  const toggleDeliveryExpand = (id: string) => {
      setExpandedDeliveryId(prev => prev === id ? null : id);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFilterUser('');
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
        return isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-200';
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

  const getBadgeStyles = (status: string) => {
    if (status === 'Gebucht' || status === 'Abgeschlossen') {
        return isDark 
            ? 'bg-emerald-900/30 border-emerald-500 text-emerald-500' 
            : 'bg-emerald-100 border-emerald-500 text-emerald-700';
    }
    if (status === 'In Prüfung' || status === 'Wartet auf Prüfung') {
        return isDark 
            ? 'bg-[#6264A7]/20 border-[#6264A7]/50 text-[#9ea0e6]' 
            : 'bg-[#6264A7]/10 border-[#6264A7] text-[#6264A7]';
    }
    if (['Übermenge', 'Zu viel'].includes(status)) {
        return isDark 
            ? 'bg-orange-900/30 border-orange-500 text-orange-500' 
            : 'bg-orange-100 border-orange-500 text-orange-700';
    }
    if (['Teillieferung', 'Untermenge', 'Falsch geliefert'].includes(status)) {
        return isDark 
            ? 'bg-amber-900/30 border-amber-500 text-amber-500' 
            : 'bg-amber-100 border-amber-500 text-amber-700';
    }
    if (['Quarantäne', 'Beschädigt', 'Reklamation', 'Abgelehnt', 'Rücklieferung'].includes(status)) {
        return isDark 
            ? 'bg-red-900/30 border-red-500 text-red-500' 
            : 'bg-red-100 border-red-500 text-red-700';
    }
    return isDark 
        ? 'bg-blue-900/30 border-blue-500 text-blue-500' 
        : 'bg-blue-100 border-blue-500 text-blue-700';
  };

  // Helper to parse notes and flags
  const getItemIssues = (item: ReceiptItem) => {
    const notes = item.issueNotes || '';
    const isWrong = notes.includes('FALSCH');
    const isRejected = notes.includes('ABGELEHNT') || notes.includes('abgewiesen');
    const isDamaged = !!item.isDamaged; 
    const wrongReason = isWrong ? notes.match(/FALSCH: (.*?)(?: \| |$)/)?.[1] : null;
    return { isDamaged, isWrong, isRejected, wrongReason };
  };

  // Detailed Item Status Badge
  const ItemStatusBadge = ({ item, quantityInfo }: { item?: ReceiptItem, quantityInfo?: { ordered: number, received: number } }) => {
    if (!item) return <span className="text-slate-400">-</span>;
    
    const { isDamaged, isWrong, isRejected, wrongReason } = getItemIssues(item);
    
    // Priority 1: Damage + Wrong
    if (isDamaged && isWrong) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <AlertTriangle size={10} /> Schaden + Falsch
            </span>
        );
    }
    // Priority 2: Damaged
    if (isDamaged) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <AlertTriangle size={10} /> Schaden
            </span>
        );
    }
    // Priority 3: Wrong (Amber)
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
    // Priority 4: Rejected (Red)
    if (isRejected) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <Ban size={10} /> Abgelehnt
            </span>
        );
    }
    
    // Quantity Mismatches (Only if no other issues)
    if (quantityInfo) {
        const { ordered, received } = quantityInfo;
        if (received > ordered) {
             // Over-delivery -> Orange
             return (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                    <Info size={10} /> Überlieferung
                </span>
            );
        }
        if (received < ordered) {
             // Under-delivery -> Amber
             return (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    <AlertTriangle size={10} /> Teillieferung
                </span>
            );
        }
    }
    
    // OK
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            <CheckCircle2 size={10} /> OK
        </span>
    );
  };

  // Helper to find full item details for history row
  const findReceiptItemForLog = (delivery: DeliveryLog, sku: string) => {
    // Find the header for this delivery log by fuzzy match or strict link
    const header = headers.find(h => 
        h.lieferscheinNr === delivery.lieferscheinNr && 
        (linkedMaster?.poId ? h.bestellNr === linkedMaster.poId : true)
    );
    if (!header) return undefined;
    return items.find(i => i.batchId === header.batchId && i.sku === sku);
  };

  const renderItemStatusIconForPO = (ordered: number, received: number, hasIssues: boolean) => {
      // Keep old simple icon logic for the PO Summary table (compact view)
      const isPerfect = !hasIssues && ordered === received;
      if (isPerfect) return (<div className="flex justify-center"><CheckCircle2 size={18} className="text-emerald-500" /></div>);
      return (<div className="flex justify-center" title={hasIssues ? "Probleme gemeldet" : ordered !== received ? "Mengenabweichung" : ""}><AlertTriangle size={18} className="text-amber-500" /></div>);
  };

  if (!selectedBatchId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-2xl font-bold">Wareneingang Verwaltung</h2>
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
                    const displayStatus = row.masterStatus || row.status;
                    const deliveryCount = row.deliveryCount || 1;

                    return (
                    <tr 
                      key={row.batchId} 
                      onClick={() => handleOpenDetail(row)}
                      className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                    >
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors(displayStatus)}`}>
                              {displayStatus}
                            </span>
                            {linkedPO?.status === 'Projekt' && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                                    isDark 
                                    ? 'bg-blue-900/30 text-blue-400 border-blue-800' 
                                    : 'bg-blue-100 text-blue-700 border-blue-200'
                                }`}>
                                    <Briefcase size={12} /> Projekt
                                </span>
                            )}
                        </div>
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
    <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300 pb-20 lg:pb-0">
      
      {/* PANE A: HEADER & STATUS CONTROL */}
      <div className={`mb-8 p-4 md:p-6 rounded-2xl border flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-start mb-6">
            <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-[#0077B5] text-sm font-bold transition-colors">
                <ArrowLeft size={16} /> Zurück zur Übersicht
            </button>
            <div className="flex items-center gap-3 ml-auto">
               <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 shadow-sm ${getBadgeStyles(selectedHeader.status)}`}>
                   <span className="text-sm font-bold uppercase tracking-wider">{selectedHeader.status}</span>
                   <span className="w-2 h-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
               </div>
               {selectedHeader.status !== 'Abgeschlossen' && (
                  <>
                    <div className="h-6 w-px bg-slate-500/20 mx-1"></div>
                    <button
                        onClick={handleForceClose}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all flex items-center gap-2 ${
                            isDark 
                            ? 'border-slate-700 text-slate-400 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10' 
                            : 'border-slate-300 text-slate-500 hover:border-red-500 hover:text-red-600 hover:bg-red-50'
                        }`}
                    >
                        <Archive size={16} />
                        <span className="hidden sm:inline">Abschließen / Archivieren</span>
                    </button>
                  </>
               )}
            </div>
        </div>

        <div className="flex flex-col gap-4">
              {/* SWAPPED HIERARCHY: BESTELLUNG (LEFT/LARGE) - LIEFERSCHEIN (RIGHT/SMALL) */}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-6 md:gap-12">
                  <div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider block mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Bestellung</span>
                      <div className={`text-3xl font-black leading-none tracking-tight ${selectedHeader.bestellNr ? '' : 'opacity-50 italic font-normal'}`}>
                          {selectedHeader.bestellNr || 'Nicht angegeben'}
                      </div>
                  </div>
                  <div className={`hidden sm:block w-px h-10 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                  
                  {/* INTERACTIVE DELIVERY LIST DROPDOWN */}
                  <div className="relative">
                      <span className={`text-[10px] uppercase font-bold tracking-wider block mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Lieferschein</span>
                      <button 
                          onClick={() => setShowDeliveryList(!showDeliveryList)}
                          className={`flex items-center gap-2 text-xl font-bold transition-colors group ${
                              isDark ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-[#0077B5]'
                          }`}
                      >
                          {selectedHeader.lieferscheinNr}
                          <ChevronDown size={16} className={`transition-transform duration-200 ${showDeliveryList ? 'rotate-180' : ''}`} />
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
                                  {linkedMaster?.deliveries.map((del, idx) => (
                                      <div key={del.id} className={`p-3 border-b last:border-0 flex items-center gap-3 ${
                                          del.lieferscheinNr === selectedHeader.lieferscheinNr 
                                              ? (isDark ? 'bg-[#0077B5]/10' : 'bg-[#0077B5]/5') 
                                              : ''
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
                                      </div>
                                  ))}
                                  {(!linkedMaster || linkedMaster.deliveries.length === 0) && (
                                       <div className="p-4 text-center text-xs opacity-50">Keine weiteren Lieferungen gefunden.</div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm border-t pt-4 mt-2 ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                 <span className="font-semibold flex items-center gap-2 text-base"><Truck size={16} className="text-[#0077B5]" /> {selectedHeader.lieferant}</span>
                 <div className="w-1 h-1 rounded-full bg-slate-500/30 hidden sm:block"></div>
                 <span className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(selectedHeader.timestamp).toLocaleDateString()}</span>
                 <span className="flex items-center gap-1.5"><MapPin size={14}/> {selectedHeader.warehouseLocation}</span>
                 <span className="flex items-center gap-1.5"><User size={14}/> {selectedHeader.createdByName || '—'}</span>
              </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className={`flex gap-6 border-b px-2 mb-6 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
         <button 
            onClick={() => setActiveTab('items')}
            className={`pb-3 font-bold text-sm transition-all border-b-2 ${
                activeTab === 'items' 
                ? 'text-[#0077B5] border-[#0077B5]' 
                : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
         >
            Positionen & Historie
         </button>
         <button 
            onClick={() => setActiveTab('tickets')}
            className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all border-b-2 ${
                activeTab === 'tickets' 
                ? 'text-[#0077B5] border-[#0077B5]' 
                : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
         >
            Reklamationen & Fälle
            {relatedTickets.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{relatedTickets.length}</span>
            )}
         </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'items' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 animate-in fade-in slide-in-from-left-4">
            
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
                        <div className={`sticky top-0 z-30 pb-4 pt-2 -mx-2 px-2 transition-colors ${
                            isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'
                        }`}>
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
                                    visibleDeliveries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(delivery => {
                                        const isExpanded = expandedDeliveryId === delivery.id;
                                        const isCurrent = delivery.lieferscheinNr === selectedHeader.lieferscheinNr;
                                        const snapshot = deliverySnapshots[delivery.id] || {};

                                        return (
                                            <div 
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
                                                                {delivery.lieferscheinNr}
                                                                {isCurrent && <span className="bg-[#0077B5] text-white text-[10px] px-1.5 py-0.5 rounded">AKTUELLE ANSICHT</span>}
                                                            </div>
                                                            <div className="text-xs opacity-60 flex items-center gap-2 mt-0.5">
                                                                <Calendar size={12} /> {new Date(delivery.date).toLocaleDateString()}
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
                    <div className="flex gap-2">
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
      )}

      {/* TICKET TAB CONTENT */}
      {activeTab === 'tickets' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 animate-in fade-in slide-in-from-left-4">
           {/* LEFT: Ticket List */}
           <div className={`flex-1 rounded-2xl border flex flex-col overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                 <h3 className="font-bold flex items-center gap-2">
                    <AlertCircle size={18} className="text-[#0077B5]" /> Offene Fälle
                 </h3>
                 <button 
                    onClick={() => setShowNewTicketModal(true)}
                    className="text-xs bg-[#0077B5] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#00A0DC] transition-colors flex items-center gap-1"
                 >
                    <Plus size={14} /> Neuer Fall
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                 {relatedTickets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 p-8 text-center">
                        <CheckCircle2 size={48} className="mb-2" />
                        <p className="text-sm font-medium">Keine Probleme gemeldet.</p>
                        <p className="text-xs opacity-70 mt-1">Erstellen Sie einen neuen Fall für Reklamationen.</p>
                    </div>
                 ) : (
                    relatedTickets.map(ticket => (
                       <button
                          key={ticket.id}
                          onClick={() => setExpandedTicketId(ticket.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                             expandedTicketId === ticket.id 
                                ? isDark ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500' : 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                : isDark ? 'bg-slate-900 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                       >
                          <div className="flex justify-between items-start mb-1">
                             <div className="font-bold text-sm truncate pr-2">{ticket.subject}</div>
                             {ticket.status === 'Closed' ? (
                                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20 uppercase">Geschlossen</span>
                             ) : (
                                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20 uppercase">Offen</span>
                             )}
                          </div>
                          <div className="flex items-center gap-2 text-xs opacity-70 mb-2">
                             <span>ID: {ticket.id.slice(0,8)}</span>
                             <span>•</span>
                             <span>{new Date(ticket.messages[0].timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                ticket.priority === 'Urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                ticket.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                'bg-slate-500/10 text-slate-500 border-slate-500/20'
                             }`}>
                                {ticket.priority}
                             </span>
                             <div className="ml-auto text-xs text-[#0077B5] font-medium flex items-center gap-1">
                                {ticket.messages.length} Nachrichten <ChevronRight size={12} />
                             </div>
                          </div>
                       </button>
                    ))
                 )}
              </div>
           </div>

           {/* RIGHT: Chat View */}
           <div className={`flex-[2] rounded-2xl border flex flex-col overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              {selectedTicket ? (
                  <>
                    {/* Chat Header */}
                    <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">{selectedTicket.subject}</h3>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                    selectedTicket.priority === 'Urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                    selectedTicket.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                }`}>
                                    {selectedTicket.priority}
                                </span>
                            </div>
                            <div className="text-xs opacity-60 flex items-center gap-2">
                                <span>Ticket ID: {selectedTicket.id}</span>
                                <span>•</span>
                                <span>Erstellt: {new Date(selectedTicket.messages[0].timestamp).toLocaleString()}</span>
                            </div>
                        </div>
                        {selectedTicket.status === 'Closed' ? (
                            <button 
                                onClick={() => handleReopenTicket(selectedTicket)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-2 ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Unlock size={14} /> Wiedereröffnen
                            </button>
                        ) : (
                            <div className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-bold flex items-center gap-2">
                                <Unlock size={14} /> Offen
                            </div>
                        )}
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedTicket.messages.map(msg => {
                            const isSystem = msg.type === 'system' || msg.author === 'System';
                            const isMe = msg.type === 'user' && msg.author !== 'System'; // Assuming current user is standard user
                            
                            if (isSystem) {
                                return (
                                    <div key={msg.id} className="flex justify-center my-4">
                                        <div className={`text-xs py-1 px-3 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                            {msg.text} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                        isMe 
                                        ? 'bg-[#0077B5] text-white rounded-tr-sm' 
                                        : isDark ? 'bg-slate-800 text-slate-200 rounded-tl-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                    <div className="text-[10px] opacity-50 mt-1 px-1">
                                        {msg.author} • {new Date(msg.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Reply Area */}
                    {selectedTicket.status === 'Open' ? (
                        <div className={`p-4 border-t ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex gap-2">
                                <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Antwort schreiben..."
                                    className={`flex-1 rounded-xl p-3 text-sm resize-none h-20 outline-none focus:ring-2 focus:ring-blue-500/20 border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                                />
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => handleReplyTicket(selectedTicket, false)}
                                        disabled={!replyText.trim()}
                                        className="p-3 rounded-xl bg-[#0077B5] text-white hover:bg-[#00A0DC] disabled:opacity-50 disabled:bg-slate-500"
                                        title="Senden"
                                    >
                                        <Send size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleReplyTicket(selectedTicket, true)}
                                        className={`p-3 rounded-xl border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-red-500/20 hover:text-red-400' : 'bg-white border-slate-200 hover:bg-red-50 hover:text-red-600'}`}
                                        title="Senden & Schließen"
                                    >
                                        <Lock size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={`p-6 border-t text-center opacity-60 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <Lock size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">Dieser Fall ist geschlossen.</p>
                        </div>
                    )}
                  </>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 p-8 text-center">
                      <MessageSquare size={48} className="mb-4" />
                      <p className="font-bold text-lg">Kein Fall ausgewählt</p>
                      <p className="text-sm">Wählen Sie einen Fall aus der Liste oder erstellen Sie einen neuen.</p>
                  </div>
              )}
           </div>
        </div>
      )}

      <NewTicketModal 
        isOpen={showNewTicketModal} 
        onClose={() => setShowNewTicketModal(false)} 
        onSave={handleSaveNewTicket}
        theme={theme}
      />

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
