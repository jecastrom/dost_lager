
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Search, Plus, Calendar, Truck, Package, 
  Hash, Info, CheckCircle2, AlertCircle, ChevronDown, Check,
  ArrowRight, ArrowLeft, Trash2, MapPin, FileText, Building2,
  AlertTriangle, Loader2, Home, ClipboardList, CheckSquare, MessageSquare, Briefcase, Ban, ListFilter,
  LogOut, PlusCircle, XCircle
} from 'lucide-react';
import { StockItem, Theme, ReceiptHeader, PurchaseOrder, ReceiptMaster } from '../types';
import { MOCK_PURCHASE_ORDERS } from '../data';

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

interface CartItem {
    item: StockItem;
    qty: number;
    orderedQty?: number;
    previouslyReceived?: number; // Track history for cumulative logic
    location: string;
    // Issue Reporting (Refined)
    isDamaged: boolean;
    isWrongItem: boolean;
    wrongItemReason: string;
    issueNotes: string; // Keep for generic notes or compatibility
    showIssueInputs?: boolean; // UI state for toggling visibility
    isManualAddition?: boolean; // Flag for items added manually during PO check
    // Rejection Logic
    isRejected: boolean;
    rejectionReason: string;
    // Over-Delivery Logic
    overDeliveryResolution: 'return' | 'keep' | null;
    // Return Logistics (New)
    returnMethod?: string;
    returnTrackingId?: string;
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

  const filtered = orders.filter(o => 
    o.id.toLowerCase().includes(term.toLowerCase()) || 
    o.supplier.toLowerCase().includes(term.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Offen': return isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Teilweise geliefert': return isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Projekt': return isDark ? 'bg-blue-900/30 text-blue-400 border-blue-900' : 'bg-blue-100 text-blue-700 border-blue-200';
      default: return isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
       <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
          
          {/* Header */}
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

          {/* List */}
          <div className="overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50 flex-1">
             {filtered.length === 0 && (
                <div className="text-center py-10 text-slate-500">Keine Bestellungen gefunden.</div>
             )}
             {filtered.map(po => {
                // Status Logic
                const linkedReceipt = receiptMasters.find(r => r.poId === po.id);
                const isInCheck = linkedReceipt && linkedReceipt.status === 'Offen';
                const label = po.status === 'Teilweise geliefert' ? 'Teillieferung' : po.status;

                return (
                   <button
                      key={po.id}
                      onClick={() => onSelect(po)}
                      className={`w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-800/80' 
                            : 'bg-white border-slate-200 hover:border-[#0077B5] hover:shadow-md'
                      }`}
                   >
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                              <span className={`font-mono font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{po.id}</span>
                              {/* BADGES ROW */}
                              <div className="flex gap-2">
                                  {po.status === 'Projekt' ? (
                                      <>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle('Offen')}`}>Offen</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle('Projekt')}`}>Projekt</span>
                                      </>
                                  ) : (
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(po.status)}`}>{label}</span>
                                  )}
                                  
                                  {isInCheck && (
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-[#6264A7]/20 text-[#9ea0e6] border-[#6264A7]/40' : 'bg-[#6264A7]/10 text-[#6264A7] border-[#6264A7]/20'}`}>
                                          In Prüfung
                                      </span>
                                  )}
                              </div>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm opacity-70">
                          <div className="flex items-center gap-1.5 font-medium">
                              <Truck size={14} /> {po.supplier}
                          </div>
                          <div className="w-1 h-1 rounded-full bg-current opacity-50" />
                          <div className="flex items-center gap-1.5">
                              <Calendar size={14} /> {new Date(po.dateCreated).toLocaleDateString()}
                          </div>
                          <div className="ml-auto font-mono text-xs opacity-50">
                              {po.items.length} Pos.
                          </div>
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
    header: Omit<ReceiptHeader, 'batchId' | 'timestamp' | 'itemCount'>,
    cartItems: { 
        item: StockItem; 
        qty: number; 
        location: string; 
        isDamaged?: boolean; 
        issueNotes?: string; 
    }[],
    newItemsCreated: StockItem[]
  ) => void;
  onLogStock?: (itemId: string, itemName: string, action: 'add' | 'remove', quantity: number, source?: string, context?: 'normal' | 'project' | 'manual' | 'po-normal' | 'po-project') => void;
  purchaseOrders?: PurchaseOrder[];
  initialPoId?: string | null;
  receiptMasters?: ReceiptMaster[];
}

export const GoodsReceiptFlow: React.FC<GoodsReceiptFlowProps> = ({ 
  theme, 
  existingItems, 
  onClose, 
  onSuccess,
  onLogStock,
  purchaseOrders,
  initialPoId,
  receiptMasters = []
}) => {
  const isDark = theme === 'dark';
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // -- State: Header Data --
  const [headerData, setHeaderData] = useState({
    lieferscheinNr: '',
    bestellNr: '', 
    lieferdatum: new Date().toISOString().split('T')[0],
    lieferant: '',
    status: 'In Bearbeitung', // Will be calculated in Step 3
    warehouseLocation: '' // Global Location
  });

  // -- State: Logic & Automation --
  const [finalResultStatus, setFinalResultStatus] = useState('');

  // -- State: PO Selection --
  const [linkedPoId, setLinkedPoId] = useState<string | null>(null);
  const [showPoModal, setShowPoModal] = useState(false);

  // -- State: Supplier Selection (Portal) --
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierInputRef = useRef<HTMLDivElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const [supplierDropdownCoords, setSupplierDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  // -- State: Location Selection (Portal - Step 1) --
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationInputRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const [locationDropdownCoords, setLocationDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  // -- State: System Selection (New Item Portal) --
  const [showSystemDropdown, setShowSystemDropdown] = useState(false);
  const systemInputRef = useRef<HTMLDivElement>(null);
  const systemDropdownRef = useRef<HTMLDivElement>(null);
  const [systemDropdownCoords, setSystemDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  // -- State: Search Dropdown (Search Portal) --
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [searchDropdownCoords, setSearchDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  // -- State: Cart / Items --
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // -- State: Item Selection --
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<StockItem>>({
    name: '',
    sku: '',
    category: 'Material',
    minStock: 0,
    system: ''
  });

  // -- State: Submission Status --
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // -- AUTO-CALCULATE STATUS WHEN ENTERING STEP 3 --
  useEffect(() => {
    if (step === 3) {
        let suggested = 'Gebucht';

        // 1. REJECTION CHECK (Priority 4 logic for FULL rejection, but checked early for override)
        // If ALL items are rejected, status is 'Abgelehnt'
        const allRejected = cart.length > 0 && cart.every(c => c.isRejected);
        
        if (allRejected) {
             suggested = 'Abgelehnt';
        } else {
             // 2. PRIORITY LOGIC
             const hasDamage = cart.some(c => c.isDamaged);
             const hasWrong = cart.some(c => c.isWrongItem);

             if (hasDamage && hasWrong) {
                 suggested = 'Schaden + Falsch'; // Priority 2
             } else if (hasDamage) {
                 suggested = 'Schaden'; // Priority 1
             } else if (hasWrong) {
                 suggested = 'Falsch geliefert'; // Priority 3
             } else if (cart.some(c => c.isRejected)) {
                 // If not all rejected but some are, usually implies Teillieferung or issues
                 suggested = 'Teillieferung'; // Priority 5 partial/issues
             } else if (linkedPoId) {
                // MULTI-DELIVERY / QTY LOGIC (Priority 5)
                const linkedMaster = receiptMasters.find(m => m.poId === linkedPoId);
                const currentPo = purchaseOrders?.find(p => p.id === linkedPoId);
                
                if (currentPo) {
                    let allItemsComplete = true;
                    let anyOverDelivery = false;
                    
                    for (const poItem of currentPo.items) {
                        let historyQty = 0;
                        if (linkedMaster) {
                            linkedMaster.deliveries.forEach(del => {
                                const dItem = del.items.find(di => di.sku === poItem.sku);
                                if (dItem) historyQty += dItem.receivedQty;
                            });
                        }

                        const cartItem = cart.find(c => c.item.sku === poItem.sku);
                        let currentQty = 0;
                        if (cartItem && !cartItem.isRejected) {
                            if (cartItem.qty > (cartItem.orderedQty || 0) && cartItem.overDeliveryResolution === 'return') {
                                currentQty = cartItem.orderedQty || 0;
                            } else {
                                currentQty = cartItem.qty;
                            }
                        }

                        const totalReceived = historyQty + currentQty;

                        if (totalReceived < poItem.quantityExpected) {
                            allItemsComplete = false;
                        }
                        if (totalReceived > poItem.quantityExpected) {
                            anyOverDelivery = true;
                        }
                    }

                    if (anyOverDelivery) suggested = 'Übermenge';
                    else if (!allItemsComplete) suggested = 'Teillieferung';
                    else suggested = 'Gebucht'; // All complete & no issues
                }
             } else {
                 suggested = 'Gebucht';
             }
        }
        
        setHeaderData(prev => ({ ...prev, status: suggested }));
    }
  }, [step, cart, linkedPoId, receiptMasters, purchaseOrders]);

  // ... (Event Listeners for Portal Dropdowns - Unchanged) ...
  useEffect(() => {
    if (!showSystemDropdown && !showSearchDropdown && !showSupplierDropdown && !showLocationDropdown) return;
    const handleScroll = (e: Event) => {
        if (showSystemDropdown && systemDropdownRef.current && !systemDropdownRef.current.contains(e.target as Node)) setShowSystemDropdown(false);
        if (showSearchDropdown && searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) setShowSearchDropdown(false);
        if (showSupplierDropdown && supplierDropdownRef.current && !supplierDropdownRef.current.contains(e.target as Node)) setShowSupplierDropdown(false);
        if (showLocationDropdown && locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) setShowLocationDropdown(false);
    };
    const handleResize = () => {
        setShowSystemDropdown(false); setShowSupplierDropdown(false); setShowLocationDropdown(false);
        if (showSearchDropdown && searchInputRef.current) {
             const rect = searchInputRef.current.getBoundingClientRect();
             setSearchDropdownCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
        }
    };
    window.addEventListener('scroll', handleScroll, true); 
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('scroll', handleScroll, true); window.removeEventListener('resize', handleResize); };
  }, [showSystemDropdown, showSearchDropdown, showSupplierDropdown, showLocationDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showSystemDropdown && !systemInputRef.current?.contains(target) && !systemDropdownRef.current?.contains(target)) setShowSystemDropdown(false);
      if (showSearchDropdown && !searchInputRef.current?.contains(target) && !searchDropdownRef.current?.contains(target)) setShowSearchDropdown(false);
      if (showSupplierDropdown && !supplierInputRef.current?.contains(target) && !supplierDropdownRef.current?.contains(target)) setShowSupplierDropdown(false);
      if (showLocationDropdown && !locationInputRef.current?.contains(target) && !locationDropdownRef.current?.contains(target)) setShowLocationDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [showSystemDropdown, showSearchDropdown, showSupplierDropdown, showLocationDropdown]);

  // -- Computed Data Helpers --
  const availablePOs = useMemo(() => {
      const source = purchaseOrders || MOCK_PURCHASE_ORDERS;
      return source.filter(po => po.status !== 'Abgeschlossen' && po.status !== 'Storniert');
  }, [purchaseOrders]);

  const suppliers = useMemo(() => {
    const unique = new Set<string>();
    existingItems.forEach(item => { if (item.manufacturer) unique.add(item.manufacturer); });
    return Array.from(unique).sort();
  }, [existingItems]);

  const filteredSuppliers = useMemo(() => {
    if (!headerData.lieferant) return suppliers;
    return suppliers.filter(s => s.toLowerCase().includes(headerData.lieferant.toLowerCase()));
  }, [suppliers, headerData.lieferant]);

  const filteredLocations = useMemo(() => {
    if (!headerData.warehouseLocation) return LAGERORT_OPTIONS;
    return LAGERORT_OPTIONS.filter(l => l.toLowerCase().includes(headerData.warehouseLocation.toLowerCase()));
  }, [headerData.warehouseLocation]);

  const systems = useMemo(() => {
    const unique = new Set<string>();
    existingItems.forEach(item => { if (item.system) unique.add(item.system); });
    return Array.from(unique).sort();
  }, [existingItems]);

  const filteredSystems = useMemo(() => {
    if (!newItemData.system) return systems;
    return systems.filter(s => s.toLowerCase().includes(newItemData.system!.toLowerCase()));
  }, [systems, newItemData.system]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return existingItems.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50); 
  }, [searchTerm, existingItems]);

  // Anomaly Logic (Updated for new flags)
  const anomalies = useMemo(() => {
    if (!linkedPoId || cart.length === 0) return { hasMissing: false, hasExtra: false, hasDamage: false, isPerfect: false };

    let hasMissing = false;
    let hasExtra = false;
    let hasDamage = false;

    cart.forEach(c => {
        if (c.isRejected) return;
        const ordered = c.orderedQty || 0;
        const total = (c.previouslyReceived || 0) + c.qty;
        
        if (total < ordered) hasMissing = true;
        if (total > ordered) hasExtra = true;
        if (c.isDamaged || c.isWrongItem) hasDamage = true;
    });

    const isPerfect = !hasMissing && !hasExtra && !hasDamage && !cart.some(c => c.isRejected);

    return { hasMissing, hasExtra, hasDamage, isPerfect };
  }, [cart, linkedPoId]);

  const showHistoryColumn = useMemo(() => {
      return linkedPoId && cart.some(c => (c.previouslyReceived || 0) > 0);
  }, [linkedPoId, cart]);

  // -- Cart Handlers --
  const addToCart = (item: StockItem) => {
    setCart(prev => [...prev, { 
      item, 
      qty: 1, 
      orderedQty: linkedPoId ? 0 : undefined,
      previouslyReceived: 0,
      location: headerData.warehouseLocation, 
      isDamaged: false, 
      isWrongItem: false,
      wrongItemReason: '',
      issueNotes: '',
      showIssueInputs: false,
      isManualAddition: !!linkedPoId,
      isRejected: false,
      rejectionReason: '',
      overDeliveryResolution: null,
      returnMethod: '',
      returnTrackingId: ''
    }]);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
    setCart(prev => prev.map((line, i) => i === index ? { ...line, [field]: value } : line));
  };

  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateNewItem = () => {
    if (!newItemData.name || !newItemData.sku) return;
    const newItem: StockItem = {
      id: crypto.randomUUID(),
      name: newItemData.name || '',
      sku: newItemData.sku || '',
      category: newItemData.category || 'Material',
      system: newItemData.system || 'Sonstiges',
      stockLevel: 0, 
      minStock: newItemData.minStock || 0,
      warehouseLocation: headerData.warehouseLocation,
      isAkku: false,
      capacityAh: 0,
      status: 'Active',
      lastUpdated: Date.now()
    };
    addToCart(newItem);
    setIsCreatingNew(false);
    setNewItemData({ name: '', sku: '', category: 'Material', minStock: 0, system: '' });
  };

  const handleSelectPO = (po: PurchaseOrder) => {
    setLinkedPoId(po.id);
    setHeaderData(prev => ({ ...prev, bestellNr: po.id, lieferant: po.supplier }));
    setShowPoModal(false);

    const linkedMaster = receiptMasters.find(m => m.poId === po.id);
    const historyMap = new Map<string, number>();
    
    if (linkedMaster) {
        linkedMaster.deliveries.forEach(del => {
            del.items.forEach(item => {
                const current = historyMap.get(item.sku) || 0;
                historyMap.set(item.sku, current + item.receivedQty);
            });
        });
    }

    const newCartItems: CartItem[] = po.items.map(poItem => {
        const inventoryItem = existingItems.find(ex => ex.sku === poItem.sku);
        const historyQty = historyMap.get(poItem.sku) || 0;

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
            qty: Math.max(0, poItem.quantityExpected - historyQty), 
            orderedQty: poItem.quantityExpected,
            previouslyReceived: historyQty,
            location: headerData.warehouseLocation,
            isDamaged: false,
            isWrongItem: false,
            wrongItemReason: '',
            issueNotes: '',
            showIssueInputs: false,
            isManualAddition: false,
            isRejected: false,
            rejectionReason: '',
            overDeliveryResolution: null,
            returnMethod: '',
            returnTrackingId: ''
        };
    });
    setCart(newCartItems);
  };

  useEffect(() => {
    if (initialPoId && purchaseOrders) {
        const found = availablePOs.find(p => p.id === initialPoId);
        if (found) {
            handleSelectPO(found);
        }
    }
  }, []);

  // -- SUBMISSION HANDLERS --
  const handleSubmit = async () => {
    if (!headerData.lieferscheinNr || !headerData.lieferant || cart.length === 0) return;
    setSubmissionStatus('submitting');
    setFinalResultStatus(headerData.status);
    try {
        await new Promise(resolve => setTimeout(resolve, 600));
        setSubmissionStatus('success');
    } catch (err) {
        console.error("Error saving receipt:", err);
        setSubmissionStatus('error');
    }
  };

  const handleFinalize = () => {
    const cleanCartItems = cart.map(({ showIssueInputs, isRejected, rejectionReason, overDeliveryResolution, ...rest }) => {
        let finalQty = rest.qty;
        let finalNotes = rest.issueNotes || '';

        // Over-Delivery Handling
        const ordered = rest.orderedQty || 0;
        const previous = rest.previouslyReceived || 0;
        const totalAfterReceipt = previous + rest.qty;
        
        if (!isRejected && linkedPoId && totalAfterReceipt > ordered) {
            const over = totalAfterReceipt - ordered;
            if (overDeliveryResolution === 'return') {
                finalQty = Math.max(0, ordered - previous); 
                const methodInfo = rest.returnMethod ? ` via ${rest.returnMethod}` : '';
                const trackingInfo = rest.returnTrackingId ? ` (ID: ${rest.returnTrackingId})` : '';
                finalNotes += (finalNotes ? ' | ' : '') + `[AUTO] ${over}x Übermenge abgewiesen${methodInfo}${trackingInfo}`;
            } else {
                finalNotes += (finalNotes ? ' | ' : '') + `[AUTO] ${over}x Übermenge akzeptiert`;
            }
        }

        // Issue Notes Composition
        if (rest.isWrongItem) {
            finalNotes += (finalNotes ? ' | ' : '') + `FALSCH: ${rest.wrongItemReason || 'Grund unbekannt'}`;
        }
        if (rest.isDamaged) {
            finalNotes += (finalNotes ? ' | ' : '') + 'BESCHÄDIGT';
        }

        // Rejection Handling
        if (isRejected) {
            finalQty = 0;
            finalNotes = `ABGELEHNT: ${rejectionReason || 'Ohne Grund'}. ${finalNotes}`;
        }

        return {
            ...rest,
            qty: finalQty,
            issueNotes: finalNotes
        };
    });

    if (onLogStock) {
        const selectedPO = purchaseOrders?.find(p => p.id === linkedPoId);
        const source = "PO-" + (selectedPO?.id || "MANUAL");
        let context: 'po-project' | 'po-normal' | 'normal' | 'project' = 'po-normal';
        if (selectedPO) {
            if (selectedPO.status === 'Projekt') {
                context = 'po-project';
            }
        } else {
             context = 'po-normal'; 
        }

        cleanCartItems.forEach(c => {
            if (c.qty > 0) {
                onLogStock(c.item.sku, c.item.name, 'add', c.qty, source, context);
            }
        });
    }

    const newItemsCreated = cart
      .filter(c => !c.isRejected) 
      .map(c => c.item)
      .filter(item => !existingItems.find(ex => ex.id === item.id));

    const finalHeader = { ...headerData, status: finalResultStatus };
    
    // Call onSuccess which triggers navigation in parent App.tsx
    onSuccess(finalHeader, cleanCartItems, newItemsCreated);
  };

  const getSuccessMessage = () => {
    if (finalResultStatus === 'Abgelehnt') return "Wareneingang wurde als 'Abgelehnt' markiert.";
    if (finalResultStatus === 'Schaden') return "Achtung: Wareneingang enthält beschädigte Artikel.";
    if (finalResultStatus === 'Schaden + Falsch') return "Achtung: Wareneingang enthält beschädigte und falsche Artikel.";
    if (finalResultStatus === 'Falsch geliefert') return "Status auf 'Falsch geliefert' gesetzt aufgrund von gemeldeten Abweichungen.";
    if (finalResultStatus === 'Teillieferung') return "Teillieferung erfolgreich erfasst. Bestellung bleibt teilweise offen.";
    if (finalResultStatus === 'Übermenge') return "Achtung: Mehr geliefert als bestellt (Übermenge).";
    if (finalResultStatus === 'Gebucht') return "Wareneingang vollständig gebucht. Bestände wurden aktualisiert.";
    return "Vorgang erfolgreich gespeichert.";
  };

  // ... (Dropdown Position Updaters - Unchanged) ...
  const updateSystemDropdownPosition = () => {
    if (systemInputRef.current) {
      const rect = systemInputRef.current.getBoundingClientRect();
      setSystemDropdownCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowSystemDropdown(true);
    }
  };
  const updateSearchDropdownPosition = () => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setSearchDropdownCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowSearchDropdown(true);
    }
  };
  const updateSupplierDropdownPosition = () => {
    if (supplierInputRef.current) {
      const rect = supplierInputRef.current.getBoundingClientRect();
      setSupplierDropdownCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowSupplierDropdown(true);
    }
  };
  const updateLocationDropdownPosition = () => {
    if (locationInputRef.current) {
      const rect = locationInputRef.current.getBoundingClientRect();
      setLocationDropdownCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowLocationDropdown(true);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val) updateSearchDropdownPosition(); else setShowSearchDropdown(false);
  };

  const canGoNext = () => {
    if (step === 1) return headerData.lieferscheinNr && headerData.lieferant && headerData.warehouseLocation;
    if (step === 2) return cart.length > 0;
    return false;
  };

  const handleNext = () => { if (canGoNext()) setStep(prev => (prev < 3 ? prev + 1 : prev) as 1 | 2 | 3); };
  const handleBack = () => { setStep(prev => (prev > 1 ? prev - 1 : prev) as 1 | 2 | 3); };

  const inputClass = `w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ${
    isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:ring-blue-500/30' : 'bg-white border-slate-200 text-[#313335] focus:ring-[#0077B5]/20'
  }`;

  const readOnlyInputClass = `w-full border rounded-xl px-3 py-2 text-sm outline-none cursor-not-allowed ${
    isDark ? 'bg-slate-800/50 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500'
  }`;

  return (
    <div className={`h-full flex flex-col rounded-2xl border overflow-hidden animate-in slide-in-from-right-8 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      
      {/* Full Screen Overlay for Success/Error */}
      {(submissionStatus === 'success' || submissionStatus === 'error') && createPortal(
        <div className="fixed inset-0 z-[100000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           {submissionStatus === 'success' && (
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                  ['Schaden', 'Schaden + Falsch', 'Falsch geliefert', 'Abgelehnt'].includes(finalResultStatus) 
                    ? 'bg-red-100 dark:bg-red-500/20' 
                    : ['Teillieferung', 'Übermenge'].includes(finalResultStatus) 
                      ? 'bg-amber-100 dark:bg-amber-500/20'
                      : ['Projekt'].includes(finalResultStatus) 
                        ? 'bg-blue-100 dark:bg-blue-500/20'
                        : 'bg-emerald-100 dark:bg-emerald-500/20'
                }`}>
                   {['Schaden', 'Schaden + Falsch', 'Falsch geliefert'].includes(finalResultStatus) ? (
                      <AlertCircle size={48} className="text-red-600 dark:text-red-400" strokeWidth={3} />
                   ) : finalResultStatus === 'Abgelehnt' ? (
                      <Ban size={48} className="text-red-600 dark:text-red-400" strokeWidth={3} />
                   ) : ['Übermenge', 'Teillieferung'].includes(finalResultStatus) ? (
                      <AlertTriangle size={48} className="text-amber-600 dark:text-amber-400" strokeWidth={3} />
                   ) : finalResultStatus === 'Projekt' ? (
                      <Briefcase size={48} className="text-blue-600 dark:text-blue-400" strokeWidth={3} />
                   ) : (
                      <CheckCircle2 size={48} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                   )}
                </div>
                <h2 className="text-2xl font-bold mb-2 dark:text-white text-slate-900">
                    Wareneingang gespeichert
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                   {getSuccessMessage()}
                </p>
                <button 
                  onClick={handleFinalize}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Home size={20} /> OK
                </button>
             </div>
           )}
           {/* Error view unchanged */}
           {submissionStatus === 'error' && (
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                   <AlertTriangle size={48} className="text-red-600 dark:text-red-400" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-bold mb-2 dark:text-white text-slate-900">Fehler</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                   Fehler beim Speichern. Bitte überprüfen Sie Ihre Internetverbindung.
                </p>
                <button 
                  onClick={() => setSubmissionStatus('idle')}
                  className="w-full py-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold text-lg transition-all active:scale-95"
                >
                  Erneut versuchen
                </button>
             </div>
           )}
        </div>,
        document.body
      )}

      {/* Title Bar */}
      <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Package className="text-[#0077B5]" /> Wareneingang prüfen
        </h2>
        <div className="flex items-center gap-4">
           {/* Step Indicator */}
           <div className="flex items-center gap-2 text-sm font-medium">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${step >= 1 ? 'bg-[#0077B5] text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
              <div className={`w-4 h-0.5 ${step >= 2 ? 'bg-[#0077B5]' : 'bg-slate-200'}`} />
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${step >= 2 ? 'bg-[#0077B5] text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
              <div className={`w-4 h-0.5 ${step >= 3 ? 'bg-[#0077B5]' : 'bg-slate-200'}`} />
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${step >= 3 ? 'bg-[#0077B5] text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
             <X size={20} />
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 relative">
        
        {/* STEP 1: KOPFDATEN */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="mb-4">
                <h3 className="text-lg font-bold mb-1">Schritt 1: Lieferung wählen & prüfen</h3>
                <p className="text-sm opacity-70">Bitte geben Sie die Informationen zum Lieferschein ein.</p>
            </div>
            {/* ... Step 1 Content identical to previous ... */}
            <div className="grid grid-cols-1 gap-5">
                {/* PO Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0077B5] uppercase tracking-wide">Bestellung auswählen</label>
                  {linkedPoId ? (
                      <div className={`p-4 rounded-xl border flex items-center justify-between group transition-colors ${isDark ? 'bg-slate-800 border-slate-700 hover:border-[#0077B5]' : 'bg-white border-slate-200 hover:border-[#0077B5]'}`}>
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-mono font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{linkedPoId}</span>
                                  <CheckCircle2 size={16} className="text-[#0077B5]" />
                              </div>
                              <div className="text-sm opacity-70 flex items-center gap-2">
                                  <span>{headerData.lieferant}</span>
                              </div>
                          </div>
                          <button 
                              onClick={() => setShowPoModal(true)}
                              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                          >
                              Ändern
                          </button>
                      </div>
                  ) : (
                      <button 
                          onClick={() => setShowPoModal(true)}
                          className={`w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:border-[#0077B5] group ${isDark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-slate-300 hover:bg-slate-50'}`}
                      >
                          <div className={`p-3 rounded-full transition-transform group-hover:scale-110 ${isDark ? 'bg-slate-800 text-[#0077B5]' : 'bg-slate-100 text-[#0077B5]'}`}>
                              <ClipboardList size={24} />
                          </div>
                          <span className={`font-bold ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>
                              Bestellung aus Liste wählen
                          </span>
                      </button>
                  )}
                </div>
                
                <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-1" />

                {/* Form Fields */}
                <div className="space-y-1">
                  <label className="text-xs font-medium opacity-70">Bestell Nr.</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                    <input 
                      value={headerData.bestellNr}
                      onChange={e => setHeaderData({...headerData, bestellNr: e.target.value})}
                      className={linkedPoId ? `${readOnlyInputClass} pl-10` : `${inputClass} pl-10`}
                      placeholder="Bestell-Nr. eingeben..."
                      disabled={!!linkedPoId}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium opacity-70">Lieferschein Nr. <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                    <input 
                      value={headerData.lieferscheinNr}
                      onChange={e => setHeaderData({...headerData, lieferscheinNr: e.target.value})}
                      className={`${inputClass} pl-10`}
                      placeholder="LS-2024-..."
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-1 relative group">
                  <label className="text-xs font-medium opacity-70">Lieferant <span className="text-red-500">*</span></label>
                  <div className="relative" ref={supplierInputRef}>
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                    <input 
                      value={headerData.lieferant}
                      onChange={e => {
                        setHeaderData({...headerData, lieferant: e.target.value});
                        updateSupplierDropdownPosition();
                      }}
                      onFocus={() => { if (!linkedPoId) updateSupplierDropdownPosition(); }}
                      className={linkedPoId ? `${readOnlyInputClass} pl-10 pr-8` : `${inputClass} pl-10 pr-8`}
                      placeholder="Lieferant suchen oder neu eingeben..."
                      disabled={!!linkedPoId}
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={16} />
                    {showSupplierDropdown && !linkedPoId && filteredSuppliers.length > 0 && createPortal(
                      <div 
                        ref={supplierDropdownRef}
                        style={{ position: 'absolute', top: supplierDropdownCoords.top + 4, left: supplierDropdownCoords.left, width: supplierDropdownCoords.width, zIndex: 9999, maxHeight: '300px' }}
                        className={`rounded-xl border shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                      >
                        {filteredSuppliers.map(supplier => (
                          <button
                            key={supplier}
                            onClick={() => { setHeaderData({...headerData, lieferant: supplier}); setShowSupplierDropdown(false); }}
                            className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between group/item ${isDark ? 'hover:bg-slate-800 text-slate-200 border-b border-slate-800 last:border-0' : 'hover:bg-slate-50 text-slate-700 border-b border-slate-50 last:border-0'}`}
                          >
                            <span>{supplier}</span>
                            {headerData.lieferant === supplier && (<div className="bg-[#0077B5]/10 p-1 rounded-full"><Check size={12} className="text-[#0077B5]" strokeWidth={3} /></div>)}
                          </button>
                        ))}
                      </div>, document.body
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1">
                      <label className="text-xs font-medium opacity-70">Lieferdatum <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                        <input 
                          type="date"
                          value={headerData.lieferdatum}
                          onChange={e => setHeaderData({...headerData, lieferdatum: e.target.value})}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                </div>
                <div className="space-y-1 relative group">
                  <label className="text-xs font-medium opacity-70">Ziel-Lagerort (Global) <span className="text-red-500">*</span></label>
                  <div className="relative" ref={locationInputRef}>
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                    <input 
                      value={headerData.warehouseLocation}
                      onChange={e => {
                        const newLoc = e.target.value;
                        setHeaderData({...headerData, warehouseLocation: newLoc});
                        setCart(prev => prev.map(item => ({ ...item, location: newLoc })));
                        updateLocationDropdownPosition();
                      }}
                      onFocus={updateLocationDropdownPosition}
                      onClick={updateLocationDropdownPosition}
                      className={`${inputClass} pl-10 pr-8`}
                      placeholder="Lagerort auswählen..."
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={16} />
                    {showLocationDropdown && filteredLocations.length > 0 && createPortal(
                      <div 
                        ref={locationDropdownRef}
                        style={{ position: 'absolute', top: locationDropdownCoords.top + 4, left: locationDropdownCoords.left, width: locationDropdownCoords.width, zIndex: 99999, maxHeight: '250px' }}
                        className={`rounded-xl border shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                      >
                        {filteredLocations.map(loc => (
                          <button
                            key={loc}
                            onClick={() => { setHeaderData({...headerData, warehouseLocation: loc}); setCart(prev => prev.map(item => ({ ...item, location: loc }))); setShowLocationDropdown(false); }}
                            className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between group/item ${isDark ? 'hover:bg-slate-800 text-slate-200 border-b border-slate-800 last:border-0' : 'hover:bg-slate-50 text-slate-700 border-b border-slate-50 last:border-0'}`}
                          >
                            <span>{loc}</span>
                            {headerData.warehouseLocation === loc && (<div className="bg-[#0077B5]/10 p-1 rounded-full"><Check size={12} className="text-[#0077B5]" strokeWidth={3} /></div>)}
                          </button>
                        ))}
                      </div>, document.body
                    )}
                  </div>
                </div>
            </div>
          </div>
        )}

        {/* STEP 2: ARTIKEL HINZUFÜGEN / PRÜFEN */}
        {step === 2 && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
             {/* ... Step 2 Search / Create Logic (Unchanged, skipping verbose parts) ... */}
             <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="text-lg font-bold mb-1">
                        {linkedPoId ? 'Schritt 2: Wareneingang prüfen' : 'Schritt 2: Artikel hinzufügen'}
                    </h3>
                    <p className="text-sm opacity-70">
                        {linkedPoId ? 'Vergleichen Sie die gelieferten Mengen mit der Bestellung.' : 'Suchen Sie nach Artikeln oder legen Sie neue an.'}
                    </p>
                </div>
                <button onClick={() => setIsCreatingNew(!isCreatingNew)} className="text-sm text-[#0077B5] font-bold hover:underline flex items-center gap-1">
                   <Plus size={16} /> {isCreatingNew ? 'Zurück zur Suche' : 'Neuen Artikel anlegen'}
                 </button>
             </div>
             
             {/* Search / Create Item Block (Collapsed for brevity as it's unchanged logic) */}
             <div className="space-y-6 relative z-[50]">
                {isCreatingNew ? (
                    <div className={`p-5 rounded-2xl border space-y-4 animate-in slide-in-from-top-2 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                       <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-2 items-start text-sm text-blue-600 dark:text-blue-400">
                          <Info size={18} className="shrink-0 mt-0.5" />
                          <span><b>Hinweis:</b> Der neue Artikel wird automatisch mit dem System und Lagerort ({headerData.warehouseLocation}) angelegt.</span>
                       </div>
                       <input value={newItemData.name} onChange={e => setNewItemData({...newItemData, name: e.target.value})} placeholder="Artikelbezeichnung" className={inputClass} autoFocus />
                       <div className="grid grid-cols-2 gap-4">
                         <input value={newItemData.sku} onChange={e => setNewItemData({...newItemData, sku: e.target.value})} placeholder="Artikelnummer / SKU" className={inputClass} />
                         <div className="relative group" ref={systemInputRef}>
                            <input value={newItemData.system} onChange={e => { setNewItemData({...newItemData, system: e.target.value}); updateSystemDropdownPosition(); }} onFocus={updateSystemDropdownPosition} placeholder="System (z.B. BMA)" className={`${inputClass} pr-8`} />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={16} />
                            {showSystemDropdown && filteredSystems.length > 0 && createPortal(
                              <div ref={systemDropdownRef} style={{ position: 'absolute', top: systemDropdownCoords.top + 4, left: systemDropdownCoords.left, width: systemDropdownCoords.width, zIndex: 9999 }} className={`max-h-40 overflow-y-auto rounded-xl border shadow-xl animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                {filteredSystems.map(sys => (
                                  <button key={sys} onClick={() => { setNewItemData({...newItemData, system: sys}); setShowSystemDropdown(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center justify-between group/item ${isDark ? 'hover:bg-slate-800 text-slate-200 border-b border-slate-800 last:border-0' : 'hover:bg-slate-50 text-slate-700 border-b border-slate-50 last:border-0'}`}>
                                    <span>{sys}</span>
                                  </button>
                                ))}
                              </div>, document.body
                            )}
                         </div>
                       </div>
                       <button onClick={handleCreateNewItem} disabled={!newItemData.name || !newItemData.sku} className="w-full py-3 bg-[#0077B5] text-white rounded-xl font-bold text-sm hover:bg-[#00A0DC] disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20">Artikel erstellen & hinzufügen</button>
                    </div>
                ) : (
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input ref={searchInputRef} value={searchTerm} onChange={e => handleSearchChange(e.target.value)} onFocus={() => { if(searchTerm) updateSearchDropdownPosition(); }} placeholder="Artikel suchen (Name oder SKU)..." className={`${inputClass} pl-10 pr-3 py-3`} autoFocus />
                      {showSearchDropdown && searchResults.length > 0 && createPortal(
                        <div ref={searchDropdownRef} style={{ position: 'absolute', top: searchDropdownCoords.top + 8, left: searchDropdownCoords.left, width: searchDropdownCoords.width, zIndex: 9999, maxHeight: '400px' }} className={`rounded-xl border shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'bg-[#1e293b] border-slate-600' : 'bg-white border-slate-300'}`}>
                          {searchResults.map(item => (
                            <button key={item.id} onClick={() => addToCart(item)} className={`w-full text-left p-4 flex justify-between items-center border-b last:border-0 transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-200' : 'border-slate-100 hover:bg-slate-50 text-slate-800'}`}>
                              <div><div className="font-bold text-base">{item.name}</div><div className="text-sm opacity-70 mt-0.5">Artikelnummer: {item.sku}</div><div className="text-xs opacity-50 mt-0.5">System: {item.system}</div></div>
                              <div className="bg-[#0077B5]/10 p-2 rounded-full"><Plus size={20} className="text-[#0077B5]" /></div>
                            </button>
                          ))}
                        </div>, document.body
                      )}
                    </div>
                )}
             </div>

             {/* Real-Time Feedback Banners */}
             {step === 2 && linkedPoId && (
                <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-top-2">
                    {anomalies.isPerfect && (
                        <div className={`p-3 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                            <CheckCircle2 size={18} />
                            <span className="font-bold text-sm">Alles vollständig – keine Abweichungen.</span>
                        </div>
                    )}
                    {anomalies.hasMissing && (
                        <div className={`p-4 rounded-xl border flex items-center gap-4 ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            <div className={`p-2 rounded-full shrink-0 ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}><AlertTriangle size={24} className={isDark ? 'text-amber-400' : 'text-amber-600'} /></div>
                            <div><h4 className="font-bold text-sm">Achtung: Teillieferung erkannt</h4><p className="text-xs opacity-90 mt-0.5">Fehlende Mengen werden vermerkt.</p></div>
                        </div>
                    )}
                    {anomalies.hasExtra && (
                        <div className={`p-4 rounded-xl border flex items-center gap-4 ${isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                            <div className={`p-2 rounded-full shrink-0 ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}><AlertTriangle size={24} className={isDark ? 'text-orange-400' : 'text-orange-600'} /></div>
                            <div><h4 className="font-bold text-sm">Hinweis: Überlieferung erkannt</h4><p className="text-xs opacity-90 mt-0.5">Sie haben mehr erhalten als bestellt. Bitte wählen Sie eine Aktion für die entsprechenden Positionen.</p></div>
                        </div>
                    )}
                </div>
             )}

             {/* ADDED ITEMS LIST (CART) */}
             <div className="space-y-3 relative z-0">
               <h4 className="text-sm font-bold opacity-70 uppercase tracking-wider mb-2">Erfasste Positionen ({cart.length})</h4>
               
               {cart.length === 0 ? (
                 <div className="p-8 border rounded-xl border-dashed text-center text-slate-500">Noch keine Artikel erfasst.</div>
               ) : (
                 <>
                   {/* DESKTOP TABLE */}
                   <div className="hidden md:block rounded-xl border overflow-hidden shadow-sm">
                      <table className={`w-full text-sm text-left ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                         <thead className={`text-xs uppercase font-bold ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                            <tr>
                               <th className="px-3 py-2">Artikel</th>
                               {linkedPoId && <th className="px-3 py-2 w-24 text-center">Bestellt</th>}
                               {showHistoryColumn && <th className="px-3 py-2 w-20 text-center text-slate-400">Bisher</th>}
                               <th className="px-3 py-2 w-24 text-center">{linkedPoId ? (showHistoryColumn ? 'Aktuell' : 'Geliefert') : 'Menge'}</th>
                               {linkedPoId && <th className="px-3 py-2 w-20 text-center text-amber-500">Offen</th>}
                               {linkedPoId && <th className="px-3 py-2 w-20 text-center text-orange-500">Zu viel</th>}
                               
                               {/* REFINED ISSUE COLUMNS */}
                               <th className="px-3 py-2 w-16 text-center">Schaden</th>
                               <th className="px-3 py-2 w-16 text-center">Falsch</th>
                               
                               <th className="px-3 py-2 w-16 text-center">Abgelehnt</th>
                               <th className="px-3 py-2 w-16 text-center">Aktion</th>
                            </tr>
                         </thead>
                         <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                            {cart.map((line, idx) => {
                               const ordered = line.orderedQty ?? 0;
                               const previous = line.previouslyReceived || 0;
                               const current = line.qty;
                               const totalReceived = previous + current;
                               
                               const pending = Math.max(0, ordered - totalReceived);
                               const over = Math.max(0, totalReceived - ordered);
                               const showOverResolution = linkedPoId && over > 0 && !line.isRejected;

                               return (
                               <React.Fragment key={idx}>
                                   <tr className={`group transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} ${line.isWrongItem || showOverResolution ? (isDark ? 'bg-slate-800/30' : 'bg-slate-50/80') : ''} ${line.isRejected ? 'bg-red-500/5' : ''}`}>
                                      <td className="px-3 py-2">
                                         <div className={line.isRejected ? 'opacity-50' : ''}>
                                            <div className={`font-bold text-sm ${line.isRejected ? 'line-through text-slate-500' : ''}`}>{line.item.name}</div>
                                            <div className="text-xs opacity-60 font-mono">{line.item.sku} • {line.item.system}</div>
                                            {line.isManualAddition && (
                                                <div className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                                    <AlertTriangle size={8} /> Manuell
                                                </div>
                                            )}
                                         </div>
                                         {line.isRejected && (
                                             <div className="mt-2 animate-in fade-in">
                                                 <input 
                                                     value={line.rejectionReason}
                                                     onChange={(e) => updateCartItem(idx, 'rejectionReason', e.target.value)}
                                                     placeholder="Grund für Ablehnung..."
                                                     className={`w-full px-2 py-1 text-xs rounded border outline-none focus:ring-1 focus:ring-red-500 ${isDark ? 'bg-slate-900 border-red-500/30 text-red-400 placeholder:text-red-400/50' : 'bg-white border-red-500/30 text-red-600 placeholder:text-red-300'}`}
                                                 />
                                             </div>
                                         )}
                                      </td>
                                      
                                      {linkedPoId && (
                                        <td className="px-3 py-2 text-center">
                                           <span className={`font-mono opacity-70 text-sm ${line.isRejected ? 'opacity-50' : ''}`}>{line.orderedQty !== undefined ? line.orderedQty : '-'}</span>
                                        </td>
                                      )}

                                      {showHistoryColumn && (
                                          <td className="px-3 py-2 text-center">
                                              <span className={`font-mono text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                  {line.previouslyReceived || 0}
                                              </span>
                                          </td>
                                      )}
                                      
                                      <td className="px-3 py-2 text-center">
                                         <input 
                                           type="number" 
                                           min="0"
                                           value={line.qty === 0 ? '' : line.qty}
                                           placeholder="0"
                                           disabled={line.isRejected}
                                           onKeyDown={(e) => { if (["-", "e", "E"].includes(e.key)) e.preventDefault(); }}
                                           onChange={e => {
                                             const val = parseInt(e.target.value, 10);
                                             updateCartItem(idx, 'qty', isNaN(val) ? 0 : Math.max(0, val));
                                           }}
                                           className={`w-20 px-1 py-1 h-8 rounded border text-center font-bold text-sm outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${line.isRejected ? 'line-through text-slate-400 opacity-50' : ''} ${isDark ? 'bg-slate-950 border-slate-700 focus:ring-blue-500/30' : 'bg-white border-slate-300 focus:ring-[#0077B5]/20'}`}
                                         />
                                      </td>

                                      {linkedPoId && (
                                          <td className={`px-3 py-2 text-center font-bold text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                            {pending > 0 ? pending : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}
                                          </td>
                                      )}
                                      {linkedPoId && (
                                          <td className={`px-3 py-2 text-center font-bold text-sm ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                            {over > 0 ? over : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}
                                          </td>
                                      )}

                                      {/* SCHADEN (DAMAGE) COLUMN */}
                                      <td className="px-3 py-2 text-center">
                                         <label className="inline-flex items-center justify-center cursor-pointer">
                                             <input 
                                                 type="checkbox" 
                                                 checked={line.isDamaged} 
                                                 disabled={line.isRejected}
                                                 onChange={(e) => updateCartItem(idx, 'isDamaged', e.target.checked)} 
                                                 className="hidden"
                                             />
                                             <div className={`p-1.5 rounded-lg transition-colors ${
                                                 line.isDamaged 
                                                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20' 
                                                    : 'text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                             }`}>
                                                <AlertTriangle size={16} />
                                             </div>
                                         </label>
                                      </td>

                                      {/* FALSCH (WRONG ITEM) COLUMN */}
                                      <td className="px-3 py-2 text-center">
                                         <label className="inline-flex items-center justify-center cursor-pointer">
                                             <input 
                                                 type="checkbox" 
                                                 checked={line.isWrongItem} 
                                                 disabled={line.isRejected}
                                                 onChange={(e) => updateCartItem(idx, 'isWrongItem', e.target.checked)} 
                                                 className="hidden"
                                             />
                                             <div className={`p-1.5 rounded-lg transition-colors ${
                                                 line.isWrongItem 
                                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                                                    : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                                             }`}>
                                                <XCircle size={16} />
                                             </div>
                                         </label>
                                      </td>

                                      {/* REJECTED COLUMN */}
                                      <td className="px-3 py-2 text-center">
                                         <label className="inline-flex items-center justify-center cursor-pointer">
                                             <input 
                                                 type="checkbox" 
                                                 checked={line.isRejected} 
                                                 onChange={(e) => updateCartItem(idx, 'isRejected', e.target.checked)} 
                                                 className="hidden"
                                             />
                                             <div className={`p-1.5 rounded-lg transition-colors ${
                                                 line.isRejected 
                                                    ? 'bg-red-500/10 text-red-500 border border-red-500/30' 
                                                    : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                             }`}>
                                                <Ban size={16} />
                                             </div>
                                         </label>
                                      </td>

                                      <td className="px-3 py-2 text-center">
                                         <button 
                                           onClick={() => removeCartItem(idx)}
                                           className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                         >
                                           <Trash2 size={16} />
                                         </button>
                                      </td>
                                   </tr>
                                   
                                   {/* Over-Delivery Resolution Row */}
                                   {showOverResolution && (
                                       <tr className={`animate-in fade-in slide-in-from-top-1 ${isDark ? 'bg-orange-500/5' : 'bg-orange-50'}`}>
                                           <td colSpan={linkedPoId ? (showHistoryColumn ? 10 : 9) : 6} className="px-2 py-2">
                                               <div className={`flex flex-col gap-3 p-3 rounded-lg border ${isDark ? 'border-orange-500/20' : 'border-orange-200'}`}>
                                                   <div className="flex flex-col md:flex-row md:items-center gap-3">
                                                       <div className="flex items-center gap-2 text-orange-500">
                                                           <Info size={16} />
                                                           <span className="text-xs font-bold uppercase">Achtung: {over} Stück zu viel (Gesamt)</span>
                                                       </div>
                                                       <div className="h-4 w-px bg-orange-500/20 hidden md:block"></div>
                                                       <div className="flex items-center gap-2 flex-1">
                                                           <button 
                                                                onClick={() => {
                                                                    const newValue = line.overDeliveryResolution === 'return' ? null : 'return';
                                                                    updateCartItem(idx, 'overDeliveryResolution', newValue);
                                                                }}
                                                                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${line.overDeliveryResolution === 'return' ? 'bg-orange-600 text-white border-transparent shadow-md shadow-orange-600/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20'}`}
                                                           >
                                                               <LogOut size={14} /> Zurückweisen
                                                           </button>
                                                           <button 
                                                                onClick={() => {
                                                                    const newValue = line.overDeliveryResolution === 'keep' ? null : 'keep';
                                                                    updateCartItem(idx, 'overDeliveryResolution', newValue);
                                                                }}
                                                                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${line.overDeliveryResolution === 'keep' ? 'bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-600/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'}`}
                                                           >
                                                               <PlusCircle size={14} /> Behalten (Akzeptieren)
                                                           </button>
                                                       </div>
                                                   </div>
                                                   {line.overDeliveryResolution === 'return' && (
                                                       <div className={`mt-3 pt-3 border-t border-dashed grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 ${isDark ? 'border-orange-500/20' : 'border-orange-200/60'}`}>
                                                           <div className="space-y-1">
                                                               <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-orange-400/70' : 'text-orange-700/70'}`}>Rückversand / Abholung *</label>
                                                               <input value={line.returnMethod || ''} onChange={(e) => updateCartItem(idx, 'returnMethod', e.target.value)} placeholder="z.B. DHL..." className={`w-full text-xs px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-orange-500 ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-orange-200 text-slate-900'}`} />
                                                           </div>
                                                           <div className="space-y-1">
                                                               <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-orange-400/50' : 'text-orange-700/50'}`}>Tracking Nr. (Optional)</label>
                                                               <input value={line.returnTrackingId || ''} onChange={(e) => updateCartItem(idx, 'returnTrackingId', e.target.value)} placeholder="Sendungsnummer..." className={`w-full text-xs px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-orange-500 ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-orange-200 text-slate-900'}`} />
                                                           </div>
                                                       </div>
                                                   )}
                                               </div>
                                           </td>
                                       </tr>
                                   )}

                                   {/* WRONG ITEM REASON INPUT - Revealed when 'Falsch' is checked */}
                                   {line.isWrongItem && !line.isRejected && (
                                       <tr className={`animate-in fade-in slide-in-from-top-1 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/80'}`}>
                                           <td colSpan={linkedPoId ? (showHistoryColumn ? 10 : 9) : 6} className="px-2 pb-2 pt-0">
                                               <div className={`flex items-center gap-3 p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                                   <div className="flex items-center gap-2 px-2 py-1 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 whitespace-nowrap">
                                                       <XCircle size={16} />
                                                       <span className="font-bold text-xs">Falsch geliefert</span>
                                                   </div>
                                                   <div className="h-4 w-px bg-slate-500/20"></div>
                                                   <input 
                                                       value={line.wrongItemReason}
                                                       onChange={(e) => updateCartItem(idx, 'wrongItemReason', e.target.value)}
                                                       placeholder="Falscher Artikel / Grund (z.B. falsche Farbe, anderes Modell)..."
                                                       className={`flex-1 text-xs px-2 py-1.5 h-8 rounded border outline-none focus:ring-1 focus:ring-amber-500 ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`}
                                                       autoFocus
                                                   />
                                               </div>
                                           </td>
                                       </tr>
                                   )}
                               </React.Fragment>
                            );
                            })}
                         </tbody>
                      </table>
                   </div>

                   {/* MOBILE CARDS - Using same data, updated layout */}
                   <div className="md:hidden space-y-3">
                     {cart.map((line, idx) => {
                         const ordered = line.orderedQty ?? 0;
                         const previous = line.previouslyReceived || 0;
                         const current = line.qty;
                         const totalReceived = previous + current;
                         const over = Math.max(0, totalReceived - ordered);
                         const showOverResolution = linkedPoId && over > 0 && !line.isRejected;

                         return (
                           <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-3 group ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} ${line.isRejected ? 'bg-red-500/5 border-red-500/20' : ''}`}>
                              <div className="flex justify-between items-start">
                                 <div className="min-w-0">
                                    <div className={line.isRejected ? 'opacity-50' : ''}>
                                        <div className={`font-bold text-sm truncate ${line.isRejected ? 'line-through' : ''}`}>{line.item.name}</div>
                                        <div className="text-xs text-slate-500">Artikelnummer: {line.item.sku}</div>
                                        <div className="text-xs text-slate-500 opacity-70">System: {line.item.system}</div>
                                        {line.isManualAddition && (<div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}><AlertTriangle size={10} /> Nicht Teil der Bestellung</div>)}
                                    </div>
                                    {line.isRejected && (<div className="mt-2"><input value={line.rejectionReason} onChange={(e) => updateCartItem(idx, 'rejectionReason', e.target.value)} placeholder="Grund für Ablehnung..." className={`w-full px-2 py-1 text-xs rounded border outline-none ${isDark ? 'bg-slate-900 border-red-500/30 text-red-400' : 'bg-white border-red-500/30 text-red-600'}`} /></div>)}
                                 </div>
                                 <button onClick={() => removeCartItem(idx)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                              </div>
                              <div className="grid grid-cols-2 gap-3 items-center">
                                  {linkedPoId && (<div className={`text-left ${line.isRejected ? 'opacity-50' : ''}`}><div className="flex flex-col gap-1"><div><span className="text-[10px] font-bold opacity-60 uppercase block">Bestellt</span><span className="text-sm font-mono opacity-80">{line.orderedQty !== undefined ? line.orderedQty : '-'}</span></div>{(line.previouslyReceived || 0) > 0 && (<div><span className="text-[10px] font-bold opacity-60 uppercase block">Bisher</span><span className="text-sm font-mono opacity-50">{line.previouslyReceived}</span></div>)}</div></div>)}
                                  <div className="text-right ml-auto"><span className="text-[10px] font-bold opacity-60 uppercase block mb-1">{linkedPoId ? 'Aktuell' : 'Menge'}</span><input type="number" min="0" value={line.qty === 0 ? '' : line.qty} disabled={line.isRejected} placeholder="0" onChange={e => { const val = parseInt(e.target.value, 10); updateCartItem(idx, 'qty', isNaN(val) ? 0 : Math.max(0, val)); }} className={`w-24 px-2 py-2 rounded border text-sm font-bold text-center ${line.isRejected ? 'line-through text-slate-400 opacity-50' : ''} ${isDark ? 'bg-slate-900 border-slate-600' : 'bg-slate-50 border-slate-300'}`} /></div>
                              </div>

                              {showOverResolution && (
                                <div className={`p-3 rounded-lg border flex flex-col gap-3 ${isDark ? 'border-orange-500/20 bg-orange-500/5' : 'border-orange-200 bg-orange-50'}`}>
                                    <div className="flex items-center gap-2 text-orange-500 mb-1"><Info size={14} /><span className="text-xs font-bold uppercase">{over} Stück zu viel (Gesamt)</span></div>
                                    <div className="flex gap-2"><button onClick={() => updateCartItem(idx, 'overDeliveryResolution', line.overDeliveryResolution === 'return' ? null : 'return')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${line.overDeliveryResolution === 'return' ? 'bg-orange-600 text-white border-transparent shadow-md shadow-orange-600/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20'}`}>Zurückweisen</button><button onClick={() => updateCartItem(idx, 'overDeliveryResolution', line.overDeliveryResolution === 'keep' ? null : 'keep')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${line.overDeliveryResolution === 'keep' ? 'bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-600/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'}`}>Behalten</button></div>
                                    {line.overDeliveryResolution === 'return' && (<div className={`mt-2 pt-3 border-t border-dashed space-y-3 animate-in fade-in slide-in-from-top-1 ${isDark ? 'border-orange-500/20' : 'border-orange-200/60'}`}><div className="space-y-1"><label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-orange-400/70' : 'text-orange-700/70'}`}>Rückversand / Abholung *</label><input value={line.returnMethod || ''} onChange={(e) => updateCartItem(idx, 'returnMethod', e.target.value)} placeholder="z.B. DHL..." className={`w-full text-xs px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-orange-500 ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-orange-200 text-slate-900'}`} /></div><div className="space-y-1"><label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-orange-400/50' : 'text-orange-700/50'}`}>Tracking Nr. (Optional)</label><input value={line.returnTrackingId || ''} onChange={(e) => updateCartItem(idx, 'returnTrackingId', e.target.value)} placeholder="Sendungsnummer..." className={`w-full text-xs px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-orange-500 ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-orange-200 text-slate-900'}`} /></div></div>)}
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2">
                                  {/* Damage Toggle */}
                                  <button 
                                    onClick={() => updateCartItem(idx, 'isDamaged', !line.isDamaged)}
                                    disabled={line.isRejected}
                                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${line.isDamaged ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'} disabled:opacity-30`}
                                  >
                                      <AlertTriangle size={14} /> Schaden
                                  </button>
                                  
                                  {/* Wrong Item Toggle */}
                                  <button 
                                    onClick={() => updateCartItem(idx, 'isWrongItem', !line.isWrongItem)}
                                    disabled={line.isRejected}
                                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${line.isWrongItem ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'} disabled:opacity-30`}
                                  >
                                      <XCircle size={14} /> Falsch
                                  </button>
                              </div>
                              
                              <button 
                                  onClick={() => updateCartItem(idx, 'isRejected', !line.isRejected)}
                                  className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${line.isRejected ? 'bg-red-500 text-white border-red-600' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                              >
                                  <Ban size={14} /> {line.isRejected ? 'Abgelehnt' : 'Ablehnen'}
                              </button>

                              {line.isWrongItem && !line.isRejected && (
                                  <div className={`p-3 rounded-lg border space-y-3 animate-in fade-in slide-in-from-top-1 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                       <div>
                                           <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Falscher Artikel / Grund</label>
                                           <input value={line.wrongItemReason} onChange={(e) => updateCartItem(idx, 'wrongItemReason', e.target.value)} className={`w-full text-sm p-2 rounded-lg border outline-none focus:ring-1 focus:ring-amber-500 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} placeholder="z.B. Falsche Farbe..." />
                                       </div>
                                  </div>
                              )}
                           </div>
                         );
                     })}
                   </div>
                 </>
               )}
             </div>
          </div>
        )}

        {/* STEP 3: ABSCHLUSS & ZUSAMMENFASSUNG */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="mb-4">
                <h3 className="text-lg font-bold mb-1">Schritt 3: Überprüfung & Abschluss</h3>
                <p className="text-sm opacity-70">Bitte überprüfen Sie die Angaben vor der Buchung.</p>
            </div>

            <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                ['Schaden', 'Schaden + Falsch', 'Falsch geliefert', 'Abgelehnt'].includes(headerData.status) 
                    ? isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                    : headerData.status === 'Übermenge'
                        ? isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'
                        : headerData.status === 'Teillieferung'
                            ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                            : isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
                <div className={`p-2 rounded-full shrink-0 ${
                    ['Schaden', 'Schaden + Falsch', 'Falsch geliefert', 'Abgelehnt'].includes(headerData.status) 
                        ? isDark ? 'bg-red-500/20' : 'bg-red-100'
                        : headerData.status === 'Übermenge'
                            ? isDark ? 'bg-orange-500/20' : 'bg-orange-100'
                            : headerData.status === 'Teillieferung'
                                ? isDark ? 'bg-amber-500/20' : 'bg-amber-100'
                                : isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                }`}>
                    {['Gebucht'].includes(headerData.status) ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                    <h4 className="font-bold text-lg">Status: {headerData.status}</h4>
                    <p className="text-sm opacity-90 mt-0.5">
                        {headerData.status === 'Gebucht' ? 'Wareneingang ist vollständig und fehlerfrei.' :
                         headerData.status === 'Abgelehnt' ? 'Die gesamte Lieferung wurde abgelehnt.' :
                         headerData.status === 'Schaden' ? 'Es wurden beschädigte Artikel gemeldet.' :
                         headerData.status === 'Falsch geliefert' ? 'Es wurden falsche Artikel gemeldet.' :
                         headerData.status === 'Schaden + Falsch' ? 'Kombinierte Probleme (Schaden & Falschlieferung).' :
                         headerData.status === 'Übermenge' ? 'Es wurde mehr geliefert als bestellt.' :
                         'Lieferung unvollständig oder teilweise abgelehnt.'}
                    </p>
                </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                    <div><div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lieferschein</div><div className="font-bold text-base">{headerData.lieferscheinNr}</div></div>
                    <div><div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Datum</div><div className="font-medium flex items-center gap-2"><Calendar size={14} className="opacity-70" /> {new Date(headerData.lieferdatum).toLocaleDateString()}</div></div>
                    <div><div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lieferant</div><div className="font-medium flex items-center gap-2 truncate"><Truck size={14} className="opacity-70 text-[#0077B5]" /> {headerData.lieferant}</div></div>
                    <div><div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ziel-Lagerort</div><div className="font-medium flex items-center gap-2 truncate"><MapPin size={14} className="opacity-70" /> {headerData.warehouseLocation}</div></div>
                    {headerData.bestellNr && (<div className="col-span-2 md:col-span-4 border-t border-slate-500/10 pt-2 mt-1"><div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Verknüpfte Bestellung</div><div className="font-mono font-bold text-[#0077B5] text-sm">{headerData.bestellNr}</div></div>)}
                </div>
            </div>

            <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-sm text-left">
                    <thead className={`text-xs uppercase font-bold ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                        <tr>
                            <th className="px-3 py-2">Artikel</th>
                            {linkedPoId && <th className="px-3 py-2 w-24 text-center">Bestellt</th>}
                            <th className="px-3 py-2 w-24 text-center">{linkedPoId ? 'Geliefert' : 'Menge'}</th>
                            {linkedPoId && <th className="px-3 py-2 w-20 text-center text-amber-500">Offen</th>}
                            {linkedPoId && <th className="px-3 py-2 w-20 text-center text-orange-500">Zu viel</th>}
                            <th className="px-3 py-2 w-32 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {cart.map((line, idx) => {
                            if (line.isRejected) {
                                return (
                                    <tr key={idx} className={`${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} opacity-60 bg-red-500/5`}>
                                        <td className="px-3 py-2">
                                            <div className="font-bold text-sm line-through">{line.item.name}</div>
                                            <div className="text-[10px] opacity-60 font-mono">{line.item.sku}</div>
                                            <div className="text-[10px] text-red-500 font-bold mt-0.5">Grund: {line.rejectionReason || 'Nicht angegeben'}</div>
                                        </td>
                                        <td colSpan={linkedPoId ? 4 : 1} className="px-3 py-2 text-center font-mono text-xs opacity-50">- Abgelehnt -</td>
                                        <td className="px-3 py-2 text-center"><span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20"><Ban size={12} /> Abgelehnt</span></td>
                                    </tr>
                                );
                            }

                            const ordered = line.orderedQty ?? 0;
                            const received = line.qty;
                            const pending = Math.max(0, ordered - received);
                            const over = Math.max(0, received - ordered);
                            
                            return (
                                <tr key={idx} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                    <td className="px-3 py-2">
                                        <div className="font-bold text-sm">{line.item.name}</div>
                                        <div className="text-[10px] opacity-60 font-mono">{line.item.sku}</div>
                                        {line.isManualAddition && (<div className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}><AlertTriangle size={8} /> Manuell</div>)}
                                        {line.overDeliveryResolution === 'return' && over > 0 && (<div className="text-[10px] text-orange-600 font-bold mt-0.5 flex items-center gap-1"><LogOut size={10} /> {over}x Rücksendung</div>)}
                                        {line.overDeliveryResolution === 'keep' && over > 0 && (<div className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1"><PlusCircle size={10} /> {over}x Akzeptiert</div>)}
                                    </td>
                                    {linkedPoId && <td className="px-3 py-2 text-center font-mono opacity-70 text-sm">{ordered > 0 ? ordered : '-'}</td>}
                                    <td className="px-3 py-2 text-center font-bold text-sm">{line.qty}</td>
                                    {linkedPoId && <td className={`px-3 py-2 text-center font-bold text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{pending > 0 ? pending : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}</td>}
                                    {linkedPoId && <td className={`px-3 py-2 text-center font-bold text-sm ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{over > 0 ? over : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}</td>}
                                    <td className="px-3 py-2 text-center">
                                        {(() => {
                                            if (line.isDamaged && line.isWrongItem) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20"><AlertTriangle size={12} /> Schaden+Falsch</span>;
                                            if (line.isDamaged) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20"><AlertTriangle size={12} /> Beschädigt</span>;
                                            if (line.isWrongItem) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20"><XCircle size={12} /> Falsch</span>;
                                            
                                            if (linkedPoId) {
                                                if (received < ordered) return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200'}`}><AlertTriangle size={12} /> Fehlmenge</span>;
                                                if (received > ordered) {
                                                    if (line.overDeliveryResolution === 'return') return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200'}`}><LogOut size={12} /> Rücksendung</span>;
                                                    return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200'}`}><Info size={12} /> Übermenge</span>;
                                                }
                                            }
                                            return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20"><Check size={12} /> OK</span>;
                                        })()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
          </div>
        )}

      </div>

      {/* Footer Navigation */}
      <div className={`p-5 border-t flex justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
         {step > 1 ? (
           <button 
             onClick={handleBack}
             className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
           >
             <ArrowLeft size={20} /> Zurück
           </button>
         ) : (
           <div></div> // Spacer
         )}

         {step < 3 ? (
           <button 
             onClick={handleNext}
             disabled={!canGoNext()}
             className="px-8 py-3 bg-[#0077B5] hover:bg-[#00A0DC] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 transition-all"
           >
             Weiter <ArrowRight size={20} />
           </button>
         ) : (
           <button 
             onClick={handleSubmit}
             disabled={cart.length === 0 || submissionStatus === 'submitting'}
             className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 transition-all"
           >
             {submissionStatus === 'submitting' ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />} Wareneingang buchen
           </button>
         )}
      </div>

      {/* PO Selection Modal Portal */}
      <POSelectionModal 
        isOpen={showPoModal} 
        onClose={() => setShowPoModal(false)}
        orders={availablePOs}
        receiptMasters={receiptMasters}
        onSelect={handleSelectPO}
        theme={theme}
      />

    </div>
  );
};
