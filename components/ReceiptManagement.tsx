import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Filter, Calendar, MapPin, Package, ChevronRight, 
  ArrowLeft, Save, Mail, Phone, StickyNote, Send, Clock, User, X,
  MessageSquare, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Plus, FileText, Truck,
  CornerDownRight, CheckSquare, RefreshCw
} from 'lucide-react';
import { ReceiptHeader, ReceiptItem, Theme, ReceiptComment, TRANSACTION_STATUS_OPTIONS, Ticket, TicketPriority, PurchaseOrder, TicketMessage } from '../types';

interface ReceiptManagementProps {
  headers: ReceiptHeader[];
  items: ReceiptItem[];
  comments: ReceiptComment[];
  tickets: Ticket[];
  purchaseOrders: PurchaseOrder[];
  theme: Theme;
  onUpdateStatus: (batchId: string, newStatus: string) => void;
  onAddComment: (batchId: string, type: 'note' | 'email' | 'call', message: string) => void;
  onAddTicket: (ticket: Ticket) => void;
  onUpdateTicket: (ticket: Ticket) => void;
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

    // Helper for visual priority feedback
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
                        <Save size={18} /> Fall erstellen
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export const ReceiptManagement: React.FC<ReceiptManagementProps> = ({
  headers,
  items,
  comments,
  tickets,
  purchaseOrders,
  theme,
  onUpdateStatus,
  onAddComment,
  onAddTicket,
  onUpdateTicket
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
  const [editStatus, setEditStatus] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [commentType, setCommentType] = useState<'note' | 'email' | 'call'>('note');
  
  // Phase 4: Tabs & Tickets
  const [activeTab, setActiveTab] = useState<'items' | 'tickets'>('items');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Clear reply text when switching tickets or tabs
  useEffect(() => {
    setReplyText('');
  }, [expandedTicketId, activeTab]);

  // -- Computed --
  const filteredHeaders = useMemo(() => {
    return headers.filter(h => {
      // 1. Text Search
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        h.lieferscheinNr.toLowerCase().includes(term) ||
        h.lieferant.toLowerCase().includes(term) ||
        (h.bestellNr ? h.bestellNr.toLowerCase().includes(term) : false);
      
      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter === 'booked' && h.status !== 'Gebucht') return false;
      if (statusFilter === 'open' && h.status === 'Gebucht') return false;

      // 3. Date Range Filter (based on Entry Timestamp)
      if (dateFrom || dateTo) {
          const entryDate = new Date(h.timestamp).setHours(0,0,0,0);
          
          if (dateFrom) {
            const from = new Date(dateFrom).setHours(0,0,0,0);
            if (entryDate < from) return false;
          }
          if (dateTo) {
            const to = new Date(dateTo).setHours(0,0,0,0);
            if (entryDate > to) return false;
          }
      }

      // 4. User Filter
      if (filterUser) {
          const user = (h.createdByName || '').toLowerCase();
          if (!user.includes(filterUser.toLowerCase())) return false;
      }

      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [headers, searchTerm, statusFilter, dateFrom, dateTo, filterUser]);

  const selectedHeader = useMemo(() => headers.find(h => h.batchId === selectedBatchId), [headers, selectedBatchId]);
  const relatedItems = useMemo(() => items.filter(i => i.batchId === selectedBatchId), [items, selectedBatchId]);
  const relatedComments = useMemo(() => comments.filter(c => c.batchId === selectedBatchId).sort((a,b) => b.timestamp - a.timestamp), [comments, selectedBatchId]);
  const relatedTickets = useMemo(() => tickets.filter(t => t.receiptId === selectedBatchId), [tickets, selectedBatchId]);

  // Linked Purchase Order Logic
  const linkedPO = useMemo(() => {
      if (!selectedHeader?.bestellNr) return null;
      return purchaseOrders.find(po => po.id === selectedHeader.bestellNr);
  }, [selectedHeader, purchaseOrders]);

  // -- Handlers --
  const handleOpenDetail = (header: ReceiptHeader) => {
    setSelectedBatchId(header.batchId);
    setEditStatus(header.status);
    setCommentInput('');
    setActiveTab('items'); // Reset to default tab
  };

  const handleBack = () => {
    setSelectedBatchId(null);
  };

  const handleSaveStatus = () => {
    if (selectedBatchId && editStatus) {
      onUpdateStatus(selectedBatchId, editStatus);
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
  };

  const handleReplyTicket = (ticket: Ticket, close: boolean) => {
    if (!replyText.trim()) return;

    const newMessage: TicketMessage = {
        id: crypto.randomUUID(),
        author: 'Admin User',
        text: replyText,
        timestamp: Date.now(),
        type: 'user'
    };

    const updatedTicket: Ticket = {
        ...ticket,
        status: close ? 'Closed' : 'Open',
        messages: [...ticket.messages, newMessage]
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

  const toggleTicketExpand = (id: string) => {
    setExpandedTicketId(prev => prev === id ? null : id);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFilterUser('');
  };

  // UPDATED: Traffic Light Logic for List View
  const statusColors = (status: string) => {
    // Green
    if (status === 'Gebucht') return isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    
    // Red (Critical - Short Delivery is now here)
    if (['Quarantäne', 'Beschädigt', 'Reklamation', 'Falsch geliefert', 'Teillieferung', 'Untermenge'].includes(status)) {
        return isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-100 text-red-700 border-red-200';
    }
    
    // Amber (Alert - Over Delivery is now here)
    if (['Übermenge', 'Projekt'].includes(status)) {
        return isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-700 border-amber-200';
    }

    // Default Blue
    return isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-200';
  };

  // UPDATED: Helper for Prominent Status Badge Styles (Detail View)
  const getBadgeStyles = (status: string) => {
    // Green
    if (status === 'Gebucht') {
        return isDark 
            ? 'bg-emerald-900/30 border-emerald-500 text-emerald-500' 
            : 'bg-emerald-100 border-emerald-500 text-emerald-700';
    }
    // Red (Critical Issues - Added Teillieferung/Untermenge)
    if (['Quarantäne', 'Beschädigt', 'Reklamation', 'Falsch geliefert', 'Abgelehnt', 'Rücklieferung', 'Teillieferung', 'Untermenge'].includes(status)) {
        return isDark 
            ? 'bg-red-900/30 border-red-500 text-red-500' 
            : 'bg-red-100 border-red-500 text-red-700';
    }
    // Amber (Warnings - Added Übermenge)
    if (['Übermenge', 'Projekt', 'In Bearbeitung'].includes(status)) {
        return isDark 
            ? 'bg-amber-900/30 border-amber-500 text-amber-500' 
            : 'bg-amber-100 border-amber-500 text-amber-700';
    }
    // Blue (Active/Processing)
    return isDark 
        ? 'bg-blue-900/30 border-blue-500 text-blue-500' 
        : 'bg-blue-100 border-blue-500 text-blue-700';
  };

  const inputClass = `w-full border rounded-xl px-3 py-2 text-base md:text-sm transition-all outline-none focus:ring-2 ${
      isDark 
        ? 'bg-slate-900 border-slate-700 text-slate-100 focus:ring-blue-500/30' 
        : 'bg-white border-slate-200 text-[#313335] focus:ring-[#0077B5]/20'
  }`;

  // --------------------------------------------------------------------------------
  // SCREEN 1: OVERVIEW TABLE
  // --------------------------------------------------------------------------------
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
          {/* Main Search Bar Row */}
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
              {(dateFrom || dateTo || filterUser) && <div className="w-2 h-2 rounded-full bg-red-500" />}
            </button>
          </div>

          {/* Expandable Filter Panel */}
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
                   <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-slate-500">Zeitraum Bis</label>
                   <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputClass} />
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
                        className={`${inputClass} pl-9`} 
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
                   <th className="p-4 font-semibold">Lieferschein</th>
                   <th className="p-4 font-semibold">Lieferant</th>
                   <th className="p-4 font-semibold">Erfasst am / von</th>
                   <th className="p-4 font-semibold text-right">Positionen</th>
                   <th className="p-4"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-500/10">
                  {filteredHeaders.map(h => (
                    <tr 
                      key={h.batchId} 
                      onClick={() => handleOpenDetail(h)}
                      className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                    >
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors(h.status)}`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-600 dark:text-slate-400">{h.bestellNr || '—'}</td>
                      <td className="p-4 font-medium">{h.lieferscheinNr}</td>
                      <td className="p-4 text-slate-500">{h.lieferant}</td>
                      <td className="p-4 text-slate-500">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5"><Calendar size={12}/> {new Date(h.timestamp).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5 mt-1 text-xs opacity-70"><User size={12}/> {h.createdByName || 'Unbekannt'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono font-bold">
                        {items ? items.filter(i => i.batchId === h.batchId).length : 0}
                      </td>
                      <td className="p-4 text-right text-slate-400"><ChevronRight size={18} /></td>
                    </tr>
                  ))}
                  {filteredHeaders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500">Keine Datensätze gefunden.</td>
                    </tr>
                  )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------------
  // SCREEN 2: DETAIL VIEW (TABBED)
  // --------------------------------------------------------------------------------
  if (!selectedHeader) return null;

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300 pb-20 lg:pb-0">
      
      {/* PANE A: HEADER & STATUS CONTROL */}
      <div className={`mb-6 p-4 md:p-6 rounded-2xl border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="w-full lg:w-auto">
           <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-[#0077B5] mb-2 text-sm font-bold transition-colors">
              <ArrowLeft size={16} /> Zurück
           </button>
           
           {/* UPDATED HEADER: Explicit Separation of Lieferschein and Bestellung */}
           <div className="flex flex-col gap-4 mt-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-6">
                  {/* Lieferschein Block */}
                  <div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider block mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Lieferschein</span>
                      <h2 className="text-2xl font-bold leading-none">{selectedHeader.lieferscheinNr}</h2>
                  </div>
                  
                  {/* Divider for Mobile/Desktop */}
                  <div className={`hidden sm:block w-px h-8 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`}></div>

                  {/* Bestellung Block */}
                  <div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider block mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Bestellung</span>
                      <div className={`text-lg font-bold ${selectedHeader.bestellNr ? '' : 'opacity-50 italic font-normal'}`}>
                          {selectedHeader.bestellNr || 'Nicht angegeben'}
                      </div>
                  </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 border-t pt-3 mt-1 border-dashed border-slate-500/20">
                 <span className="font-semibold flex items-center gap-2"><Truck size={14} className="text-[#0077B5]" /> {selectedHeader.lieferant}</span>
                 <span className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(selectedHeader.timestamp).toLocaleDateString()}</span>
                 <span className="flex items-center gap-1.5"><MapPin size={14}/> {selectedHeader.warehouseLocation}</span>
                 <span className="flex items-center gap-1.5"><User size={14}/> {selectedHeader.createdByName || '—'}</span>
              </div>
           </div>
        </div>

        <div className={`w-full lg:w-auto p-6 rounded-2xl border flex flex-col items-center gap-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
           <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-slate-500">Aktueller Status</label>
              
              {/* New Prominent Traffic Light Status Badge */}
              <div className={`px-6 py-2 rounded-full border-2 flex items-center gap-3 shadow-lg ${getBadgeStyles(selectedHeader.status)}`}>
                  <span className="text-lg font-bold uppercase tracking-wider">{selectedHeader.status}</span>
                  <span className="w-3 h-3 rounded-full bg-current animate-pulse shadow-[0_0_10px_currentColor]" />
              </div>
           </div>
           
           {selectedHeader.status !== 'Gebucht' && (
             <div className="flex items-center gap-2 w-full pt-4 mt-2 border-t border-dashed border-slate-500/20">
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)}
                  className={`block w-full p-2 rounded-lg border text-base md:text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                >
                  {TRANSACTION_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button 
                  onClick={handleSaveStatus}
                  className={`px-4 py-2 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                    editStatus === 'Gebucht' 
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' 
                      : 'bg-[#0077B5] hover:bg-[#00A0DC] shadow-blue-500/20'
                  }`}
                >
                  <Save size={18} />
                </button>
             </div>
           )}
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
            Positionen
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
            
            {/* PANE B: ITEM LIST (LEFT MAIN) */}
            <div className={`flex-[2] rounded-2xl border overflow-hidden flex flex-col min-h-[400px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 border-b font-bold flex items-center gap-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <Package size={18} className="text-slate-500" /> Enthaltene Artikel
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className={`sticky top-0 backdrop-blur-md z-10 ${isDark ? 'bg-slate-900/80' : 'bg-white/80'}`}>
                    <tr className="text-slate-500">
                        <th className="p-4 font-medium">Artikel</th>
                        {linkedPO && <th className="p-4 font-medium text-center">Bestellt</th>}
                        <th className="p-4 font-medium text-center">{linkedPO ? 'Geliefert' : 'Menge'}</th>
                        {linkedPO && <th className="p-4 font-medium text-center text-red-500">Offen</th>}
                        {linkedPO && <th className="p-4 font-medium text-center text-amber-500">Zu viel</th>}
                        <th className="p-4 font-medium">Lagerort</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-500/10">
                    {relatedItems.map(item => {
                        // Calculation Logic matching Flow 2
                        let orderedQty = 0;
                        let pending = 0;
                        let over = 0;
                        
                        if (linkedPO) {
                            const poItem = linkedPO.items.find(pi => pi.sku === item.sku);
                            orderedQty = poItem?.quantityExpected || 0;
                            pending = Math.max(0, orderedQty - item.quantity);
                            over = Math.max(0, item.quantity - orderedQty);
                        }

                        return (
                        <tr key={item.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                            <td className="p-4">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs font-mono opacity-60">{item.sku}</div>
                            </td>
                            
                            {linkedPO && (
                                <td className="p-4 text-center font-mono opacity-70">
                                    {orderedQty > 0 ? orderedQty : '-'}
                                </td>
                            )}

                            <td className="p-4 text-center font-bold">
                                {item.quantity}
                            </td>

                            {linkedPO && (
                                <td className="p-4 text-center font-bold text-red-500">
                                    {pending > 0 ? pending : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}
                                </td>
                            )}
                            
                            {linkedPO && (
                                <td className="p-4 text-center font-bold text-amber-500">
                                    {over > 0 ? over : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}
                                </td>
                            )}

                            <td className="p-4 text-xs">{item.targetLocation}</td>
                        </tr>
                    )})}
                    </tbody>
                </table>
                </div>
            </div>
            </div>

            {/* PANE C: TRACEABILITY TIMELINE (RIGHT SIDE) */}
            <div className={`flex-1 rounded-2xl border flex flex-col overflow-hidden min-h-[400px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 border-b font-bold flex items-center gap-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <Clock size={18} className="text-slate-500" /> Historie & Notizen
            </div>
            
            {/* Timeline Feed */}
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

            {/* Input Area */}
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

      {/* NEW TICKET TAB */}
      {activeTab === 'tickets' && (
        <div className="flex-1 overflow-y-auto min-h-0 animate-in fade-in slide-in-from-right-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-end">
                    <button 
                        onClick={() => setShowNewTicketModal(true)}
                        className="px-4 py-2 bg-[#0077B5] hover:bg-[#00A0DC] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95 transition-all"
                    >
                        <Plus size={16} /> Neuen Fall eröffnen
                    </button>
                </div>

                {relatedTickets.length === 0 ? (
                    <div className={`p-10 rounded-2xl border border-dashed text-center ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                        <MessageSquare size={40} className="mx-auto mb-4 opacity-50" />
                        <h3 className="font-bold text-lg mb-1">Keine Fälle vorhanden</h3>
                        <p className="text-sm">Für diesen Lieferschein wurden noch keine Reklamationen oder Tickets erstellt.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {relatedTickets.map(ticket => {
                            const isExpanded = expandedTicketId === ticket.id;
                            const isOpen = ticket.status === 'Open';
                            
                            return (
                                <div 
                                    key={ticket.id}
                                    className={`rounded-2xl border transition-all duration-300 ${
                                        isDark 
                                        ? 'bg-slate-900 border-slate-800' 
                                        : 'bg-white border-slate-200 shadow-sm'
                                    }`}
                                >
                                    {/* Ticket Card Header */}
                                    <button 
                                        onClick={() => toggleTicketExpand(ticket.id)}
                                        className="w-full text-left p-5 flex items-start gap-4 hover:opacity-80 transition-opacity"
                                    >
                                        <div className={`mt-1 p-2 rounded-lg ${
                                            isOpen 
                                            ? isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-600'
                                            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {isOpen ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg">{ticket.subject}</h3>
                                                    {ticket.priority === 'High' && <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">HOCH</span>}
                                                    {ticket.priority === 'Urgent' && <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">DRINGEND</span>}
                                                </div>
                                                {isExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                                    isOpen
                                                    ? 'bg-emerald-500 text-white border-emerald-600'
                                                    : 'bg-slate-500 text-white border-slate-600'
                                                }`}>
                                                    {ticket.status === 'Open' ? 'Offen' : 'Geschlossen'}
                                                </span>
                                                <span className="text-slate-500 flex items-center gap-1">
                                                    <Clock size={12} /> Letztes Update: {new Date(ticket.messages[ticket.messages.length - 1]?.timestamp || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Message History (Chat Log) */}
                                    {isExpanded && (
                                        <div className={`border-t p-5 space-y-4 ${isDark ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                                            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-4">Verlauf</h4>
                                            
                                            {ticket.messages.map(msg => {
                                                const isSystem = msg.type === 'system';
                                                const isMe = msg.author === 'Admin User';
                                                
                                                if (isSystem) {
                                                    return (
                                                        <div key={msg.id} className="flex justify-center my-4">
                                                            <span className="text-xs italic text-slate-400 bg-slate-200/10 px-3 py-1 rounded-full">
                                                                {msg.text} • {new Date(msg.timestamp).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className="text-[10px] text-slate-500 mb-1 px-1">
                                                            {msg.author} • {new Date(msg.timestamp).toLocaleString()}
                                                        </div>
                                                        <div className={`p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                                                            isMe 
                                                                ? 'bg-[#0077B5] text-white rounded-tr-none' 
                                                                : isDark ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-white border text-slate-700 rounded-tl-none'
                                                        }`}>
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Action Area: Open vs Closed State */}
                                            {isOpen ? (
                                                <div className="mt-6 pt-4 border-t border-slate-500/10 space-y-3">
                                                    <textarea 
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Antwort verfassen..."
                                                        className={`w-full rounded-xl px-4 py-3 text-sm border outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-24 transition-all ${
                                                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                                                        }`}
                                                    />
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button 
                                                            onClick={() => handleReplyTicket(ticket, false)}
                                                            disabled={!replyText.trim()}
                                                            className="px-4 py-2.5 bg-[#0077B5] hover:bg-[#00A0DC] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                                                        >
                                                            <CornerDownRight size={16} /> Antworten / Speichern
                                                        </button>
                                                        <button 
                                                            onClick={() => handleReplyTicket(ticket, true)}
                                                            disabled={!replyText.trim()}
                                                            className="px-4 py-2.5 border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            <CheckSquare size={16} /> Speichern & Fall schließen
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`mt-6 p-4 rounded-xl border flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 ${
                                                    isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                                                }`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-500/10 rounded-full text-slate-500">
                                                            <CheckCircle2 size={20} />
                                                        </div>
                                                        <span className="font-bold text-slate-500">Dieser Fall ist geschlossen.</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleReopenTicket(ticket)}
                                                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2"
                                                    >
                                                        <RefreshCw size={14} /> Fall wiedereröffnen
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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