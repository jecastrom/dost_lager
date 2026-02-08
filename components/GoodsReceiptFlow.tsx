
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Search, Plus, Calendar, Truck, Package, 
  Hash, Info, CheckCircle2, AlertCircle, ChevronDown, Check,
  ArrowRight, ArrowLeft, Trash2, MapPin, FileText, Building2,
  AlertTriangle, Loader2, Home, ClipboardList, Ban, LogOut, 
  PlusCircle, Clock, Box, ChevronUp, Briefcase, Minus, XCircle,
  ShieldBan, Layers
} from 'lucide-react';
import { StockItem, Theme, ReceiptHeader, PurchaseOrder, ReceiptMaster, Ticket } from '../types';
import { MOCK_PURCHASE_ORDERS } from '../data';
import { TicketConfig } from './SettingsPage';

// Hardcoded Location Options (Global Scope)
const LAGERORT_OPTIONS: string[] = [
  "Akku Service",
  "Brandt, Service, B DI 446E",
  "Dallmann, Service",
  "EKZFK",
  "GERAS",
  "HaB",
  "HAB",
  "HaB Altbestand Kunde",
  "HLU",
  "HTW",
  "KEH",
  "Kitas",
  "Koplin, Service, B DI 243",
  "KWF",
  "Lavrenz, Service",
  "LHW",
  "MPC",
  "Pfefferwerk/WAB",
  "RAS_Zubehör",
  "RBB",
  "RBB_SSP",
  "Stöwhaas,Service",
  "Tau13",
  "Trittel, Service",
  "ukb",
  "UKB Lager",
  "UKB Service",
  "Wartungsklebchen"
];

// --- NEW DATA STRUCTURE: SPLIT MATH ---
interface CartItem {
    item: StockItem;
    // Math Core
    qtyReceived: number;   // Total Physical Count from Truck
    qtyRejected: number;   // Count sent back/quarantined
    qtyAccepted: number;   // Calculated: Received - Rejected
    
    // Logistics
    location: string;
    
    // Issue & Return Logic
    rejectionReason: 'Damaged' | 'Wrong' | 'Overdelivery' | 'Other' | '';
    rejectionNotes: string; // Specific details like "Broken glass"
    returnCarrier: string;
    returnTrackingId: string;
    
    // UI State
    showIssuePanel: boolean; 
    
    // Context / Legacy
    orderedQty?: number;
    previouslyReceived?: number;
    isManualAddition?: boolean;
    issueNotes: string; // General notes
}

// --- NEW COMPONENT: PO SELECTION MODAL ---
const POSelectionModal = ({ 
  isOpen, 
  onClose, 
  orders, 
  onSelect, 
  receiptMasters, 
  theme 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  orders: PurchaseOrder[], 
  onSelect: (po: PurchaseOrder) => void,
  receiptMasters: ReceiptMaster[],
  theme: Theme
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';
  const [term, setTerm] = useState('');

  // STRICT FILTERING LOGIC:
  // 1. Exclude Archived, Cancelled, & Force Closed
  // 2. Math Check: Total Received (Accepted) must be LESS than Total Ordered.
  const filtered = orders.filter(o => {
    // 1. Status Check
    if (o.isArchived || o.status === 'Storniert') return false;
    if (o.isForceClosed) return false; // Force Closed orders are hidden from picker

    // 2. Math Check
    const totalOrdered = o.items.reduce((sum, i) => sum + i.quantityExpected, 0);
    const totalReceived = o.items.reduce((sum, i) => sum + i.quantityReceived, 0); // Use PO state (Accepted Qty)

    // Keep only if there is still something to receive
    if (totalReceived >= totalOrdered && totalOrdered > 0) return false;

    // 3. Search
    if (!term) return true;
    return o.id.toLowerCase().includes(term.toLowerCase()) || 
           o.supplier.toLowerCase().includes(term.toLowerCase());
  });

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
       <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
          <div className={`p-5 border-b flex items-center gap-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
             <Search className="text-slate-400" size={24} />
             <input 
                autoFocus
                className={`flex-1 bg-transparent outline-none text-lg font-medium placeholder:opacity-50 ${isDark ? 'text-white' : 'text-slate-900'}`}
                placeholder="Bestellung suchen (Nr. oder Lieferant)..."
                value={term}
                onChange={e => setTerm(e.target.value)}
             />
             <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} className="text-slate-400"/>
             </button>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50 flex-1">
             {filtered.length === 0 && (
                <div className="text-center py-10 text-slate-500">Keine offenen Bestellungen gefunden.</div>
             )}
             {filtered.map(po => {
                const totalOrdered = po.items.reduce((sum, i) => sum + i.quantityExpected, 0);
                const totalReceived = po.items.reduce((sum, i) => sum + i.quantityReceived, 0);
                
                const linkedMaster = receiptMasters.find(r => r.poId === po.id);
                const isProject = po.status === 'Projekt' || po.id.toLowerCase().includes('projekt');
                const isInCheck = linkedMaster && (linkedMaster.status === 'In Prüfung' || linkedMaster.status === 'Wartet auf Prüfung');

                return (
                   <button
                      key={po.id}
                      onClick={() => onSelect(po)}
                      className={`w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-800/80' : 'bg-white border-slate-200 hover:border-[#0077B5] hover:shadow-md'}`}
                   >
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                              <span className={`font-mono font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{po.id}</span>
                              <div className="flex gap-2">
                                  {/* Identity Badge */}
                                  {isProject ? <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1 ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-900' : 'bg-blue-100 text-blue-700 border-blue-200'}`}><Briefcase size={10} /> Projekt</span> : <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1 ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}><Box size={10} /> Lager</span>}
                                  
                                  {/* Lifecycle Badge */}
                                  {po.isForceClosed ? (
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>Erledigt</span>
                                  ) : (
                                      <>
                                        {totalReceived === 0 && <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>Offen</span>}
                                        {totalReceived > 0 && totalReceived < totalOrdered && <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>Teillieferung</span>}
                                      </>
                                  )}

                                  {/* Process Badge */}
                                  {isInCheck && <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-[#6264A7]/20 text-[#9ea0e6] border-[#6264A7]/40' : 'bg-[#6264A7]/10 text-[#6264A7] border-[#6264A7]/20'}`}>In Prüfung</span>}
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm opacity-70">
                          <div className="flex items-center gap-1.5 font-medium"><Truck size={14} /> {po.supplier}</div>
                          <div className="w-1 h-1 rounded-full bg-current opacity-50" />
                          <div className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(po.dateCreated).toLocaleDateString()}</div>
                          <div className="ml-auto font-mono text-xs opacity-50">{po.items.length} Pos.</div>
                      </div>
                   </button>
                );
             })}
          </div>
       </div>
    </div>,
    document.body
  );
};

interface GoodsReceiptFlowProps {
  theme: Theme;
  existingItems: StockItem[];
  onClose: () => void;
  onSuccess: (
    header: Omit<ReceiptHeader, 'timestamp' | 'itemCount'>, 
    cartItems: any[], // Passing full split-math objects
    newItemsCreated: StockItem[],
    forceClose?: boolean // New: Allows "Short Close"
  ) => void;
  onLogStock?: (itemId: string, itemName: string, action: 'add' | 'remove', quantity: number, source?: string, context?: 'normal' | 'project' | 'manual' | 'po-normal' | 'po-project') => void;
  purchaseOrders?: PurchaseOrder[];
  initialPoId?: string | null;
  initialMode?: 'standard' | 'return'; // New Prop for Mode
  receiptMasters?: ReceiptMaster[];
  ticketConfig: TicketConfig;
  onAddTicket: (ticket: Ticket) => void;
}

export const GoodsReceiptFlow: React.FC<GoodsReceiptFlowProps> = ({ 
  theme, 
  existingItems, 
  onClose, 
  onSuccess,
  onLogStock,
  purchaseOrders,
  initialPoId,
  initialMode = 'standard', // Default to standard
  receiptMasters = [],
  ticketConfig,
  onAddTicket
}) => {
  const isDark = theme === 'dark';
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // -- Header Data --
  const [headerData, setHeaderData] = useState({
    lieferscheinNr: '',
    bestellNr: '', 
    lieferdatum: new Date().toISOString().split('T')[0],
    lieferant: '',
    status: 'In Bearbeitung', 
    warehouseLocation: '' 
  });

  // -- Process State --
  const [finalResultStatus, setFinalResultStatus] = useState('');
  const [linkedPoId, setLinkedPoId] = useState<string | null>(null);
  const [showPoModal, setShowPoModal] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [forceClose, setForceClose] = useState(false); // New State: Short Close
  const [isAdminClose, setIsAdminClose] = useState(false); // NEW: Administrative Close State

  // -- Portals State --
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierInputRef = useRef<HTMLDivElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const [supplierDropdownCoords, setSupplierDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationInputRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const [locationDropdownCoords, setLocationDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [searchDropdownCoords, setSearchDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  // -- Cart --
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<StockItem>>({ name: '', sku: '', category: 'Material', minStock: 0, system: '' });

  // --- LOGIC: CHECK FOR PARTIAL ---
  const isPartialDelivery = useMemo(() => {
      if (!linkedPoId) return false;
      return cart.some(c => {
          const ordered = c.orderedQty || 0;
          const previous = c.previouslyReceived || 0;
          const current = c.qtyAccepted || 0;
          // Returns true if Total Received (Prev + Current) is still less than Ordered
          return (previous + current) < ordered;
      });
  }, [cart, linkedPoId]);

  // --- LOGIC: STATUS CALCULATOR ---
  const calculateReceiptStatus = (currentCart: CartItem[], poId: string | null) => {
      // 1. Rejection Check (Highest Priority)
      const allRejected = currentCart.length > 0 && currentCart.every(c => c.qtyRejected === c.qtyReceived && c.qtyReceived > 0);
      if (allRejected) return 'Abgelehnt';

      const hasRejection = currentCart.some(c => c.qtyRejected > 0);
      const hasDamage = currentCart.some(c => c.rejectionReason === 'Damaged' && c.qtyRejected > 0);
      const hasWrong = currentCart.some(c => c.rejectionReason === 'Wrong' && c.qtyRejected > 0);

      if (hasDamage && hasWrong) return 'Schaden + Falsch';
      if (hasDamage) return 'Schaden';
      if (hasWrong) return 'Falsch geliefert';
      
      // 2. Quantity Check
      if (poId) {
          const currentPo = purchaseOrders?.find(p => p.id === poId);
          if (currentPo) {
              const linkedMaster = receiptMasters.find(m => m.poId === poId);
              let anyOver = false;
              let anyUnder = false;

              for (const poItem of currentPo.items) {
                  let historyQty = 0;
                  if (linkedMaster) {
                      linkedMaster.deliveries.forEach(del => {
                          const dItem = del.items.find(di => di.sku === poItem.sku);
                          if (dItem) historyQty += dItem.quantityAccepted; // Only count accepted
                      });
                  }
                  
                  const cartItem = currentCart.find(c => c.item.sku === poItem.sku);
                  const currentAccepted = cartItem ? cartItem.qtyAccepted : 0;
                  const total = historyQty + currentAccepted;

                  if (total < poItem.quantityExpected) anyUnder = true;
                  if (total > poItem.quantityExpected) anyOver = true;
              }

              if (anyOver) return 'Übermenge';
              if (anyUnder || hasRejection) return 'Teillieferung';
              return 'Gebucht';
          }
      }
      return hasRejection ? 'Teillieferung' : 'Gebucht';
  };

  useEffect(() => {
    if (step === 3) {
        const suggested = calculateReceiptStatus(cart, linkedPoId);
        setHeaderData(prev => ({ ...prev, status: suggested }));
    }
  }, [step, cart, linkedPoId]);

  // ... (Dropdown Handlers Omitted for Brevity - Same as before) ...
  // Re-implementing crucial ones for layout stability
  useEffect(() => {
    const handleResize = () => { setShowSupplierDropdown(false); setShowLocationDropdown(false); setShowSearchDropdown(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addToCart = (item: StockItem) => {
    setCart(prev => [...prev, { 
      item, 
      qtyReceived: 1, 
      qtyRejected: 0,
      qtyAccepted: 1,
      rejectionReason: '',
      rejectionNotes: '',
      returnCarrier: '',
      returnTrackingId: '',
      orderedQty: linkedPoId ? 0 : undefined,
      previouslyReceived: 0,
      location: headerData.warehouseLocation, 
      issueNotes: '',
      showIssuePanel: false,
      isManualAddition: !!linkedPoId
    }]);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
    setCart(prev => prev.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, [field]: value };
        
        // Recalculate Accepted Logic (Allows Negative for Return Flow)
        if (field === 'qtyReceived' || field === 'qtyRejected') {
            updated.qtyAccepted = updated.qtyReceived - updated.qtyRejected;
        }
        
        // REMOVED VALIDATION: Rejected IS allowed to exceed Received for pure returns.
        
        return updated;
    }));
  };

  const handleSelectPO = (po: PurchaseOrder, forcedAdminMode: boolean = false) => {
    setLinkedPoId(po.id);
    setHeaderData(prev => ({ ...prev, bestellNr: po.id, lieferant: po.supplier }));
    setShowPoModal(false);

    const linkedMaster = receiptMasters.find(m => m.poId === po.id);
    const historyMap = new Map<string, number>();
    
    if (linkedMaster) {
        linkedMaster.deliveries.forEach(del => {
            del.items.forEach(item => {
                const current = historyMap.get(item.sku) || 0;
                historyMap.set(item.sku, current + item.quantityAccepted); // Use Accepted for history
            });
        });
    }

    const useZeroQty = forcedAdminMode || isAdminClose; // Use explicit flag if passed, or state

    const newCartItems: CartItem[] = po.items.map(poItem => {
        const inventoryItem = existingItems.find(ex => ex.sku === poItem.sku);
        const historyQty = historyMap.get(poItem.sku) || 0;
        const remaining = Math.max(0, poItem.quantityExpected - historyQty);
        
        // REQ: Step 2 pre-fill 0 if Admin Close
        const initialQty = useZeroQty ? 0 : remaining;

        const item: StockItem = inventoryItem ? { ...inventoryItem } : {
            id: crypto.randomUUID(),
            name: poItem.name,
            sku: poItem.sku,
            system: 'Sonstiges',
            category: 'Material',
            stockLevel: 0,
            minStock: 0,
            warehouseLocation: headerData.warehouseLocation, 
            status: 'Active',
            lastUpdated: Date.now()
        };
        return {
            item,
            qtyReceived: initialQty, 
            qtyRejected: 0,
            qtyAccepted: initialQty,
            rejectionReason: '',
            rejectionNotes: '',
            returnCarrier: '',
            returnTrackingId: '',
            orderedQty: poItem.quantityExpected,
            previouslyReceived: historyQty,
            location: headerData.warehouseLocation,
            issueNotes: '',
            showIssuePanel: false,
            isManualAddition: false
        };
    });
    setCart(newCartItems);
  };

  // --- AUTO-SELECT EFFECT (FAST LANE) ---
  useEffect(() => {
    // Only trigger if: 
    // 1. initialPoId is present
    // 2. No PO is currently linked (prevents loops)
    if (initialPoId && purchaseOrders && !linkedPoId) {
        const po = purchaseOrders.find(p => p.id === initialPoId);
        if (po) {
            handleSelectPO(po);
            
            if (initialMode === 'return') {
                 // Auto-Fill for Return Mode
                 const datePart = new Date().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\./g, '');
                 const retLsNr = `RÜK-${datePart}`; // UPDATED PREFIX TO RÜK
                 
                 // Smart Location Lookup (from Inventory)
                 let loc = headerData.warehouseLocation || 'Wareneingang';
                 const firstItem = existingItems.find(i => i.sku === po.items[0]?.sku);
                 if (firstItem?.warehouseLocation) loc = firstItem.warehouseLocation;

                 setHeaderData(prev => ({
                     ...prev,
                     lieferscheinNr: retLsNr,
                     warehouseLocation: loc,
                     status: 'Rücklieferung' // Initial guess
                 }));
                 
                 // Auto-Jump
                 setStep(2);
            } else {
                 setStep(1); 
            }
        }
    }
  }, [initialPoId, purchaseOrders, initialMode]); 

  // --- ADMIN CLOSE LOGIC ---
  const handleAdminCloseToggle = (checked: boolean) => {
      setIsAdminClose(checked);
      if (checked) {
          const isoDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          
          setHeaderData(prev => ({
              ...prev,
              lieferscheinNr: `ABSCHLUSS-${isoDate}`,
              // Sync supplier if linked
              lieferant: linkedPoId ? (purchaseOrders?.find(p => p.id === linkedPoId)?.supplier || prev.lieferant) : prev.lieferant
          }));
          
          // Zero out cart
          setCart(prev => prev.map(c => ({...c, qtyReceived: 0, qtyAccepted: 0, qtyRejected: 0})));
          
          // Force Close default (REQ 4)
          setForceClose(true);
      } else {
          setHeaderData(prev => ({
              ...prev,
              lieferscheinNr: prev.lieferscheinNr.startsWith('ABSCHLUSS-') ? '' : prev.lieferscheinNr
          }));
          setForceClose(false);
          
          // Restore cart quantities from PO if possible
          if (linkedPoId && purchaseOrders) {
             const po = purchaseOrders.find(p => p.id === linkedPoId);
             if (po) {
                 handleSelectPO(po, false); // Explicitly pass false to recalc quantities
             }
          }
      }
  };

  const handleFinalize = () => {
    const batchId = `b-${Date.now()}`;
    const detailedIssues: string[] = [];
    const issueTypesSet = new Set<string>();

    cart.forEach(c => {
        const itemLabel = `${c.item.name} (${c.item.sku})`;

        // 1. Explicit Rejection (User manually rejected items)
        if (c.qtyRejected > 0) {
            const reason = c.rejectionReason === 'Damaged' ? 'Beschädigt' : c.rejectionReason === 'Wrong' ? 'Falsch' : c.rejectionReason === 'Overdelivery' ? 'Übermenge' : 'Sonstiges';
            detailedIssues.push(`${itemLabel}: ${c.qtyRejected}x Abgelehnt (${reason}) - ${c.rejectionNotes}`);
            
            if (c.rejectionReason === 'Damaged') issueTypesSet.add('Beschädigung');
            if (c.rejectionReason === 'Wrong') issueTypesSet.add('Falschlieferung');
            if (c.rejectionReason === 'Overdelivery') issueTypesSet.add('Überlieferung');
            if (c.rejectionReason === 'Other') issueTypesSet.add('Abweichung');
        }

        // 2. Implicit Overdelivery Logic (User accepted more than ordered)
        // This catches cases where user accepts the extra items instead of rejecting them.
        if (ticketConfig.extra && c.orderedQty !== undefined && c.qtyAccepted > 0) {
             const totalAcceptedNow = (c.previouslyReceived || 0) + c.qtyAccepted;
             if (totalAcceptedNow > c.orderedQty) {
                 const overage = totalAcceptedNow - c.orderedQty;
                 detailedIssues.push(`[Übermenge] ${itemLabel}: ${overage} Stück zu viel geliefert.`);
                 issueTypesSet.add('Überlieferung');
             }
        }
    });

    if (detailedIssues.length > 0) {
        const subject = `Reklamation: ${Array.from(issueTypesSet).join(', ')}`;
        const newTicket: Ticket = {
            id: crypto.randomUUID(),
            receiptId: batchId,
            subject: subject,
            status: 'Open',
            priority: 'High',
            messages: [{
                id: crypto.randomUUID(),
                author: 'System',
                text: `Automatisch erstellter Fall:\n\n${detailedIssues.join('\n')}`,
                timestamp: Date.now(),
                type: 'system'
            }]
        };
        onAddTicket(newTicket);
    }

    // Payload Preparation
    // Note: We pass 'qtyAccepted' as 'qty' to legacy handlers to ensure stock increases correctly.
    // Full data is preserved in the object for detailed logging.
    const cleanCartItems = cart.map(c => ({
        ...c,
        qty: c.qtyAccepted, // CRITICAL: This drives stock update in parent (can be negative now)
        isDamaged: c.rejectionReason === 'Damaged' && c.qtyRejected > 0, // Legacy flag
        issueNotes: c.rejectionNotes || c.issueNotes // Merge notes
    }));

    if (onLogStock) {
        cleanCartItems.forEach(c => {
            if (c.qty !== 0) {
                const action = c.qty > 0 ? 'add' : 'remove';
                onLogStock(c.item.sku, c.item.name, action, Math.abs(c.qty), `Wareneingang ${headerData.lieferscheinNr}`, 'po-normal');
            }
        });
    }

    const newItemsCreated = cart.filter(c => c.qtyAccepted > 0).map(c => c.item).filter(i => !existingItems.find(ex => ex.id === i.id));
    const finalHeader = { ...headerData, batchId, status: finalResultStatus };
    
    // Pass forceClose to success handler
    onSuccess(finalHeader, cleanCartItems, newItemsCreated, forceClose);
  };

  // --- UI HELPERS ---
  const inputClass = `w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:ring-blue-500/30' : 'bg-white border-slate-200 text-[#313335] focus:ring-[#0077B5]/20'}`;

  return (
    <div className={`h-full flex flex-col rounded-2xl border overflow-hidden animate-in slide-in-from-right-8 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      
      {/* SUCCESS / ERROR OVERLAY */}
      {(submissionStatus === 'success' || submissionStatus === 'error') && createPortal(
        <div className="fixed inset-0 z-[100000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           {submissionStatus === 'success' && (
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                <CheckCircle2 size={48} className="text-emerald-500 mb-6" />
                <h2 className="text-2xl font-bold mb-2 dark:text-white text-slate-900">Gespeichert</h2>
                <p className="text-slate-500 mb-8">Der Wareneingang wurde erfolgreich verbucht.</p>
                <button onClick={handleFinalize} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">OK</button>
             </div>
           )}
        </div>, document.body
      )}

      {/* HEADER WITH STEPPER */}
      <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                {initialMode === 'return' ? <LogOut className="text-orange-600"/> : <Package className="text-[#0077B5]" />} 
                {initialMode === 'return' ? 'Warenrücksendung' : 'Wareneingang'}
            </h2>
            
            {/* STEPPER UI */}
            <div className="hidden md:flex items-center gap-2 ml-4">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#0077B5]' : 'text-slate-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${step >= 1 ? 'bg-[#0077B5] text-white border-[#0077B5]' : 'bg-transparent border-slate-300'}`}>1</div>
                    <span className="text-sm font-bold">Lieferschein</span>
                </div>
                <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-[#0077B5]' : 'bg-slate-200'}`} />
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#0077B5]' : 'text-slate-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${step >= 2 ? 'bg-[#0077B5] text-white border-[#0077B5]' : 'bg-transparent border-slate-300'}`}>2</div>
                    <span className="text-sm font-bold">Prüfung</span>
                </div>
                <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-[#0077B5]' : 'bg-slate-200'}`} />
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#0077B5]' : 'text-slate-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${step >= 3 ? 'bg-[#0077B5] text-white border-[#0077B5]' : 'bg-transparent border-slate-300'}`}>3</div>
                    <span className="text-sm font-bold">Abschluss</span>
                </div>
            </div>
        </div>
        
        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-5 relative">
        
        {/* STEP 1: HEADER DATA (SIMPLIFIED FOR BREVITY - FOCUS IS ON STEP 2) */}
        {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="mb-4"><h3 className="text-lg font-bold">Schritt 1: Lieferschein</h3></div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0077B5] uppercase">Bestellung (Optional)</label>
                    <button onClick={() => setShowPoModal(true)} className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        {linkedPoId ? <span className="font-mono font-bold">{linkedPoId}</span> : <span className="opacity-50">Aus Liste wählen...</span>}
                        <ClipboardList size={20} className="text-[#0077B5]" />
                    </button>

                    {/* NEW: Admin Close Checkbox */}
                    <div className={`mt-3 flex items-center gap-3 p-3 rounded-xl border transition-all ${isAdminClose ? (isDark ? 'bg-purple-900/20 border-purple-500/50' : 'bg-purple-50 border-purple-200') : (isDark ? 'border-slate-800' : 'border-slate-200')} ${!linkedPoId ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-400 bg-transparent transition-all checked:border-purple-600 checked:bg-purple-600"
                                checked={isAdminClose}
                                onChange={(e) => handleAdminCloseToggle(e.target.checked)}
                                disabled={!linkedPoId}
                                id="adminCloseCheck"
                            />
                            <Check size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                        </div>
                        <label htmlFor="adminCloseCheck" className="cursor-pointer flex-1">
                            <div className={`text-sm font-bold flex items-center gap-2 ${isAdminClose ? 'text-purple-600 dark:text-purple-400' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <ShieldBan size={16} /> Keine Lieferung (Nur Abschluss / Stornierung)
                            </div>
                            <div className="text-xs opacity-60">
                                Erstellt einen Null-Beleg und schließt die Bestellung.
                            </div>
                        </label>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium opacity-70">Lieferschein Nr. *</label>
                    <input 
                        value={headerData.lieferscheinNr} 
                        onChange={e => setHeaderData({...headerData, lieferscheinNr: e.target.value})} 
                        className={`${inputClass} ${isAdminClose ? 'opacity-70 cursor-not-allowed' : ''}`} 
                        placeholder="LS-..." 
                        disabled={isAdminClose}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium opacity-70">Lieferant *</label>
                    <input value={headerData.lieferant} onChange={e => setHeaderData({...headerData, lieferant: e.target.value})} className={inputClass} disabled={!!linkedPoId} />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium opacity-70">Lagerort (Global) *</label>
                    <input 
                        value={headerData.warehouseLocation} 
                        onChange={e => {setHeaderData({...headerData, warehouseLocation: e.target.value}); setCart(p => p.map(i => ({...i, location: e.target.value})))}} 
                        className={`${inputClass} ${initialMode === 'return' ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="z.B. Wareneingang" 
                        disabled={initialMode === 'return'}
                    />
                </div>
            </div>
        )}

        {/* STEP 2: SPLIT-MATH CALCULATOR */}
        {step === 2 && (
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-lg font-bold">Schritt 2: Positionen & Prüfung</h3>
                    <button onClick={() => { setIsCreatingNew(true); setSearchTerm(''); }} className="text-sm text-[#0077B5] font-bold hover:underline flex items-center gap-1"><Plus size={16}/> Artikel hinzufügen</button>
                </div>

                {/* Search Bar */}
                {!isCreatingNew && (
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input ref={searchInputRef} value={searchTerm} onChange={e => { setSearchTerm(e.target.value); if(e.target.value) { const rect = searchInputRef.current?.getBoundingClientRect(); if(rect) setSearchDropdownCoords({top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width}); setShowSearchDropdown(true); } else setShowSearchDropdown(false); }} className={`${inputClass} pl-10`} placeholder="Artikel suchen..." />
                        {showSearchDropdown && createPortal(
                            <div style={{ position: 'absolute', top: searchDropdownCoords.top + 4, left: searchDropdownCoords.left, width: searchDropdownCoords.width, zIndex: 9999 }} className={`max-h-60 overflow-y-auto rounded-xl border shadow-xl ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                {existingItems.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku.includes(searchTerm)).map(item => (
                                    <button key={item.id} onClick={() => addToCart(item)} className={`w-full text-left p-3 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800`}>
                                        <div className="font-bold">{item.name}</div><div className="text-xs opacity-50">{item.sku}</div>
                                    </button>
                                ))}
                            </div>, document.body
                        )}
                    </div>
                )}

                {/* CART LIST */}
                <div className="space-y-4">
                    {cart.map((line, idx) => {
                        const hasRejection = line.qtyRejected > 0;
                        const isOk = line.qtyReceived > 0 && !hasRejection;
                        const ordered = line.orderedQty || 0;
                        const prev = line.previouslyReceived || 0;
                        
                        // FIX: Use Net Accepted for "Offen" calculation (Ordered - (History + (Rec - Rej)))
                        const currentNet = line.qtyAccepted; 
                        const totalEffective = prev + currentNet;
                        const rawRemaining = ordered - totalEffective;
                        
                        return (
                            <div key={idx} className={`rounded-xl border overflow-hidden transition-all ${
                                hasRejection 
                                    ? (isDark ? 'bg-amber-900/10 border-amber-500/30' : 'bg-amber-50 border-amber-200') 
                                    : (isOk ? (isDark ? 'bg-emerald-900/5 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200') : (isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'))
                            }`}>
                                <div className="p-4 space-y-4">
                                    {/* Header Row: Info & System */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-base truncate">{line.item.name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-mono text-xs opacity-60">{line.item.sku}</span>
                                                <span className={`w-px h-3 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isDark ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>
                                                    {line.item.system || 'Sonstiges'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Toggle Issue Panel Button */}
                                        <button 
                                            onClick={() => updateCartItem(idx, 'showIssuePanel', !line.showIssuePanel)}
                                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                                                hasRejection 
                                                    ? 'bg-amber-500 text-white shadow-md' 
                                                    : (line.showIssuePanel ? 'bg-slate-200 dark:bg-slate-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')
                                            }`}
                                            title="Problem melden / Details"
                                        >
                                            {hasRejection ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
                                            {hasRejection && <span className="text-xs font-bold hidden sm:inline">{line.qtyRejected} Abw.</span>}
                                        </button>
                                    </div>

                                    {/* 4-Column Metric Grid */}
                                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        
                                        {/* 1. Bestellt (Read Only) */}
                                        <div className="flex flex-col justify-center">
                                            <span className="text-[10px] uppercase font-bold opacity-50 mb-1">Bestellt</span>
                                            <div className="font-mono text-sm font-bold opacity-70">
                                                {linkedPoId ? ordered : '-'}
                                            </div>
                                        </div>

                                        {/* 2. Offen (Dynamic Calc) */}
                                        <div className="flex flex-col justify-center">
                                            <span className="text-[10px] uppercase font-bold opacity-50 mb-1">Offen</span>
                                            <div className="font-mono text-sm">
                                                {linkedPoId ? (
                                                    rawRemaining < 0 ? (
                                                        <span className="text-orange-500 font-bold">+{Math.abs(rawRemaining)} Zu viel</span>
                                                    ) : rawRemaining > 0 ? (
                                                        <span className={isDark ? 'text-amber-400 font-bold' : 'text-amber-600 font-bold'}>+{rawRemaining} Zu wenig</span>
                                                    ) : (
                                                        <span className="text-emerald-500 font-bold">0</span>
                                                    )
                                                ) : (
                                                    '-'
                                                )}
                                            </div>
                                        </div>

                                        {/* 3. Erhalten (Input) */}
                                        <div className="flex flex-col justify-center relative">
                                            <span className="text-[10px] uppercase font-bold opacity-50 mb-1">Erhalten</span>
                                            <input 
                                                type="number" 
                                                min={initialMode === 'return' ? undefined : "0"}
                                                value={line.qtyReceived}
                                                onChange={e => updateCartItem(idx, 'qtyReceived', parseInt(e.target.value) || 0)}
                                                className={`w-full p-2 text-center font-bold border rounded-lg outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-blue-500/30' : 'bg-white border-slate-300 focus:ring-blue-500/20'} ${isAdminClose ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={isAdminClose}
                                            />
                                        </div>

                                        {/* 4. Result / Buchung (Badge) */}
                                        <div className="flex flex-col justify-center items-start md:items-end">
                                            <span className="text-[10px] uppercase font-bold opacity-50 mb-1">Buchung</span>
                                            <div className={`min-w-[4rem] px-3 py-1.5 text-center font-bold text-xs rounded-lg border flex items-center justify-center gap-2 ${
                                                line.qtyAccepted < 0 
                                                    ? (isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-700 border-orange-200')
                                                    : line.qtyAccepted > 0 
                                                        ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                                                        : (isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200')
                                            }`}>
                                                {line.qtyAccepted < 0 ? <LogOut size={14} /> : line.qtyAccepted > 0 ? <CheckCircle2 size={14} /> : <Minus size={14} />}
                                                {Math.abs(line.qtyAccepted)}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* ISSUE SUB-PANEL */}
                                {line.showIssuePanel && (
                                    <div className={`border-t p-4 space-y-4 animate-in slide-in-from-top-2 ${isDark ? 'bg-black/20 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                            {/* A. Rejection Quantity */}
                                            <div>
                                                <label className="text-xs font-bold text-red-500 uppercase mb-1 block">Menge Ablehnen</label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number"
                                                        min="0"
                                                        // MAX Removed to allow pure returns (Received 0, Rejected 2 = -2)
                                                        value={line.qtyRejected}
                                                        onChange={e => updateCartItem(idx, 'qtyRejected', parseInt(e.target.value) || 0)}
                                                        className={`w-full p-2 text-center font-bold text-red-500 border-2 rounded-lg outline-none focus:ring-2 focus:ring-red-500/30 ${isDark ? 'bg-slate-900 border-red-500/30' : 'bg-white border-red-200'}`}
                                                    />
                                                    <span className="text-xs opacity-50">Stk.</span>
                                                </div>
                                                <p className="text-[10px] mt-1 opacity-50">Wird nicht gebucht.</p>
                                            </div>

                                            {/* B. Reason & Note */}
                                            <div className="md:col-span-2 space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-bold opacity-70 uppercase mb-1 block">Grund</label>
                                                        <select 
                                                            value={line.rejectionReason}
                                                            onChange={e => updateCartItem(idx, 'rejectionReason', e.target.value)}
                                                            className={inputClass}
                                                        >
                                                            <option value="">Bitte wählen...</option>
                                                            <option value="Damaged">Beschädigt</option>
                                                            <option value="Wrong">Falsch geliefert</option>
                                                            <option value="Overdelivery">Überlieferung (Rücksendung)</option>
                                                            <option value="Other">Sonstiges</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold opacity-70 uppercase mb-1 block">Notiz / Details</label>
                                                        <input 
                                                            value={line.rejectionNotes}
                                                            onChange={e => updateCartItem(idx, 'rejectionNotes', e.target.value)}
                                                            placeholder="z.B. Glasbruch..."
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                </div>

                                                {/* C. Logistics (Only if Rejected) */}
                                                {hasRejection && (
                                                    <div className={`p-3 rounded-lg border border-dashed ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-300 bg-slate-100/50'}`}>
                                                        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase opacity-60">
                                                            <Truck size={12} /> Rückversand (Optional)
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input 
                                                                value={line.returnCarrier} 
                                                                onChange={e => updateCartItem(idx, 'returnCarrier', e.target.value)} 
                                                                placeholder="Dienstleister (DHL, UPS...)" 
                                                                className={inputClass} 
                                                            />
                                                            <input 
                                                                value={line.returnTrackingId} 
                                                                onChange={e => updateCartItem(idx, 'returnTrackingId', e.target.value)} 
                                                                placeholder="Sendungsnummer" 
                                                                className={inputClass} 
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* STEP 3: SUMMARY */}
        {step === 3 && (
            <div className="max-w-3xl mx-auto text-center space-y-6">
                <div className={`inline-flex p-4 rounded-full ${['Schaden', 'Abgelehnt'].some(s => headerData.status.includes(s)) ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {['Schaden', 'Abgelehnt'].some(s => headerData.status.includes(s)) ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
                </div>
                <h3 className="text-2xl font-bold">Bereit zum Buchen?</h3>
                <div className="text-xl">Status: <span className="font-bold">{headerData.status}</span></div>
                <p className="text-slate-500">Es werden {cart.reduce((a,c) => a + c.qtyAccepted, 0)} Artikel dem Bestand hinzugefügt.</p>
                {cart.some(c => c.qtyRejected > 0) && (
                    <div className="p-4 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 max-w-md mx-auto text-sm">
                        <strong className="block mb-1">Hinweis:</strong>
                        Es wurden {cart.reduce((a,c) => a + c.qtyRejected, 0)} Artikel abgelehnt. Dafür wird automatisch ein Ticket erstellt.
                    </div>
                )}

                {/* FORCE CLOSE OPTION FOR PARTIAL DELIVERIES OR ADMIN CLOSE */}
                {(isPartialDelivery || isAdminClose) && (
                    <div className={`max-w-md mx-auto p-4 rounded-xl border flex items-center gap-4 text-left transition-colors cursor-pointer group ${
                        forceClose 
                        ? (isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200') 
                        : (isDark ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300')
                    }`} onClick={() => setForceClose(!forceClose)}>
                        <div className="relative flex items-center">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${forceClose ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-400 bg-transparent'}`}>
                                {forceClose && <Check size={14} strokeWidth={3} />}
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                Bestellung abschließen (Restmenge stornieren)
                            </div>
                            <div className="text-xs text-slate-500">
                                Setzt den Status der Bestellung auf "Abgeschlossen", auch wenn Artikel fehlen.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* FOOTER */}
      <div className={`p-5 border-t flex justify-between ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
         {step > 1 ? <button onClick={() => setStep(prev => prev - 1 as any)} className="px-6 py-3 rounded-xl font-bold bg-slate-200 text-slate-700">Zurück</button> : <div/>}
         {step < 3 ? (
             <button onClick={() => setStep(prev => prev + 1 as any)} disabled={step === 1 ? !headerData.lieferscheinNr : cart.length === 0} className="px-8 py-3 bg-[#0077B5] text-white rounded-xl font-bold">Weiter</button>
         ) : (
             <button onClick={() => { setSubmissionStatus('submitting'); setTimeout(() => { setSubmissionStatus('success'); }, 800); }} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold">Buchen</button>
         )}
      </div>

      {/* MODAL PORTAL */}
      <POSelectionModal isOpen={showPoModal} onClose={() => setShowPoModal(false)} orders={purchaseOrders || MOCK_PURCHASE_ORDERS} receiptMasters={receiptMasters} onSelect={handleSelectPO} theme={theme} />
    </div>
  );
};
