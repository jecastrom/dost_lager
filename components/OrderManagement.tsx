import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Filter, Calendar, Truck, ChevronRight, 
  X, FileText, Trash2, Pencil
} from 'lucide-react';
import { PurchaseOrder, Theme } from '../types';
import { MOCK_PURCHASE_ORDERS } from '../data';

interface OrderManagementProps {
  orders?: PurchaseOrder[]; // Made optional since we are ignoring it for this fix
  theme: Theme;
  onDelete: (id: string) => void;
  onEdit: (order: PurchaseOrder) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ theme, onDelete, onEdit }) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  
  // -- State Initialization --
  // FIXED: Strictly use MOCK data for initialization to decouple from parent props
  // This ensures the list doesn't "reset" when the parent re-renders
  const [orders, setOrders] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);

  // NOTE: Removed useEffect that synced propOrders to state. 
  // Local state is now the single source of truth for this view.

  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // -- Computed --
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const term = searchTerm.toLowerCase();
      return (
        o.id.toLowerCase().includes(term) ||
        o.supplier.toLowerCase().includes(term)
      );
    }).sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
  }, [orders, searchTerm]);

  // -- Status Badge Helper --
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Offen':
        return isDark 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Teilweise geliefert':
        return isDark 
          ? 'bg-red-500/10 text-red-400 border-red-500/20' 
          : 'bg-red-100 text-red-700 border-red-200';
      case 'Abgeschlossen':
      case 'Erledigt':
        return isDark 
          ? 'bg-slate-700/50 text-slate-400 border-slate-700' 
          : 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return isDark 
          ? 'bg-slate-800 text-slate-400' 
          : 'bg-slate-100 text-slate-500';
    }
  };

  // Fixed Delete Handler
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Crucial: Stop row click event
    console.log('Deleting:', id); // Debug log

    if (!window.confirm("Möchten Sie diese Bestellung wirklich löschen?")) {
        return;
    }

    // Update Local State immediately
    setOrders(prev => prev.filter(o => o.id !== id));
    
    // Notify parent (optional, but good practice)
    onDelete(id);
  };

  const handleEditClick = (e: React.MouseEvent, order: PurchaseOrder) => {
    e.stopPropagation(); 
    onEdit(order);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-[#0077B5]" /> Bestellungen
        </h2>
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
            disabled
            className={`px-4 py-3 md:py-0 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all opacity-50 cursor-not-allowed ${
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
                 <th className="p-4 font-semibold">PO Nummer</th>
                 <th className="p-4 font-semibold">Datum</th>
                 <th className="p-4 font-semibold">Lieferant</th>
                 <th className="p-4 font-semibold">Status</th>
                 <th className="p-4 font-semibold text-center">Positionen</th>
                 <th className="p-4 font-semibold text-right">Aktion</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-500/10">
                {filteredOrders.map(order => (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                  >
                    <td className="p-4 font-mono font-bold text-[#0077B5]">{order.id}</td>
                    <td className="p-4 flex items-center gap-2 text-slate-500">
                        <Calendar size={14} /> {new Date(order.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-medium">
                        <div className="flex items-center gap-2">
                            <Truck size={14} className="text-slate-400"/> {order.supplier}
                        </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {order.items.length}
                        </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button 
                            onClick={(e) => handleEditClick(e, order)}
                            className="p-2 hover:bg-[#0077B5]/10 hover:text-[#0077B5] text-slate-400 rounded-full transition-colors"
                            title="Bearbeiten"
                        >
                            <Pencil size={18} />
                        </button>
                        <button 
                            onClick={(e) => handleDelete(order.id, e)}
                            className="p-2 hover:bg-red-500/10 hover:text-red-500 text-slate-400 rounded-full transition-colors"
                            title="Bestellung löschen"
                        >
                            <Trash2 size={18} />
                        </button>
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
                    <td colSpan={6} className="p-12 text-center text-slate-500">Keine Bestellungen gefunden.</td>
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
                            {selectedOrder.id}
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(selectedOrder.status)}`}>
                                {selectedOrder.status}
                            </span>
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
                                {new Date(selectedOrder.dateCreated).toLocaleDateString()}
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
                            {selectedOrder.items.map((item, idx) => (
                                <tr key={idx} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{item.name}</div>
                                        <div className="text-xs font-mono opacity-60 mt-0.5">{item.sku}</div>
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
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal Footer */}
                <div className={`p-5 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
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

    </div>
  );
};