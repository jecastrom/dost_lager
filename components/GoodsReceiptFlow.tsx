import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Search, Plus, Calendar, Truck, Package, 
  Hash, Info, CheckCircle2, AlertCircle, ChevronDown, Check,
  ArrowRight, ArrowLeft, Trash2, MapPin, FileText, Building2,
  AlertTriangle, Loader2, Home, ClipboardList, CheckSquare, MessageSquare, Briefcase
} from 'lucide-react';
import { StockItem, Theme, ReceiptHeader, TRANSACTION_STATUS_OPTIONS, PurchaseOrder } from '../types';
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
    location: string;
    isDamaged: boolean;
    issueNotes: string;
    showIssueInputs?: boolean; // UI state for toggling visibility
}

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
  purchaseOrders?: PurchaseOrder[];
}

export const GoodsReceiptFlow: React.FC<GoodsReceiptFlowProps> = ({ 
  theme, 
  existingItems, 
  onClose, 
  onSuccess,
  purchaseOrders
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
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const poInputRef = useRef<HTMLDivElement>(null);
  const poDropdownRef = useRef<HTMLDivElement>(null);
  const [poDropdownCoords, setPODropdownCoords] = useState({ top: 0, left: 0, width: 0 });

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
        const hasIssues = cart.some(c => c.isDamaged || (c.issueNotes && c.issueNotes.trim().length > 0));
        
        if (hasIssues) {
            suggested = 'Falsch geliefert';
        } else if (linkedPoId) {
            let totalOrdered = 0;
            let totalReceived = 0;
            cart.forEach(c => {
                totalOrdered += (c.orderedQty || 0);
                totalReceived += c.qty;
            });
            if (totalReceived < totalOrdered) suggested = 'Teillieferung';
            else if (totalReceived > totalOrdered) suggested = 'Übermenge';
        }
        
        setHeaderData(prev => ({ ...prev, status: suggested }));
    }
  }, [step, cart, linkedPoId]);

  // -- Event Listeners for Portal Dropdowns --
  useEffect(() => {
    if (!showSystemDropdown && !showSearchDropdown && !showSupplierDropdown && !showLocationDropdown && !showPODropdown) return;
    
    const handleScroll = (e: Event) => {
        if (showPODropdown && poDropdownRef.current && !poDropdownRef.current.contains(e.target as Node)) setShowPODropdown(false);
        if (showSystemDropdown && systemDropdownRef.current && !systemDropdownRef.current.contains(e.target as Node)) setShowSystemDropdown(false);
        if (showSearchDropdown && searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) setShowSearchDropdown(false);
        if (showSupplierDropdown && supplierDropdownRef.current && !supplierDropdownRef.current.contains(e.target as Node)) setShowSupplierDropdown(false);
        if (showLocationDropdown && locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) setShowLocationDropdown(false);
    };

    const handleResize = () => {
        setShowSystemDropdown(false); 
        setShowSupplierDropdown(false);
        setShowLocationDropdown(false);
        setShowPODropdown(false);
        if (showSearchDropdown && searchInputRef.current) {
             const rect = searchInputRef.current.getBoundingClientRect();
             setSearchDropdownCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
             });
        }
    };
    
    window.addEventListener('scroll', handleScroll, true); 
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [showSystemDropdown, showSearchDropdown, showSupplierDropdown, showLocationDropdown, showPODropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showPODropdown && !poInputRef.current?.contains(target) && !poDropdownRef.current?.contains(target)) setShowPODropdown(false);
      if (showSystemDropdown && !systemInputRef.current?.contains(target) && !systemDropdownRef.current?.contains(target)) setShowSystemDropdown(false);
      if (showSearchDropdown && !searchInputRef.current?.contains(target) && !searchDropdownRef.current?.contains(target)) setShowSearchDropdown(false);
      if (showSupplierDropdown && !supplierInputRef.current?.contains(target) && !supplierDropdownRef.current?.contains(target)) setShowSupplierDropdown(false);
      if (showLocationDropdown && !locationInputRef.current?.contains(target) && !locationDropdownRef.current?.contains(target)) setShowLocationDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSystemDropdown, showSearchDropdown, showSupplierDropdown, showLocationDropdown, showPODropdown]);

  // -- Computed Data Helpers --
  
  // FIX: Filter Logic for POs
  // 1. Source from prop OR mock
  // 2. Filter out ONLY 'Abgeschlossen' and 'Storniert'. Keep 'Teilweise geliefert'.
  const availablePOs = useMemo(() => {
      const source = purchaseOrders || MOCK_PURCHASE_ORDERS;
      return source.filter(po => po.status !== 'Abgeschlossen' && po.status !== 'Storniert');
  }, [purchaseOrders]);

  const filteredPOs = useMemo(() => {
    if (!poSearchTerm) return availablePOs;
    return availablePOs.filter(po => 
      po.id.toLowerCase().includes(poSearchTerm.toLowerCase()) || 
      po.supplier.toLowerCase().includes(poSearchTerm.toLowerCase())
    );
  }, [poSearchTerm, availablePOs]);

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

  // NEW: Real-Time Delivery Status Logic
  const deliveryStatusFeedback = useMemo(() => {
    if (!linkedPoId || cart.length === 0) return null;
    
    const hasShortage = cart.some(c => c.qty < (c.orderedQty || 0));
    if (hasShortage) return 'partial';

    const isPerfect = cart.every(c => c.qty === (c.orderedQty || 0));
    if (isPerfect) return 'perfect';

    return null; // Over-delivery or other states not explicitly requested to be bannerized
  }, [cart, linkedPoId]);

  // -- Cart Handlers --
  const addToCart = (item: StockItem) => {
    setCart(prev => [...prev, { 
      item, 
      qty: 1, 
      location: headerData.warehouseLocation, 
      isDamaged: false, 
      issueNotes: '',
      showIssueInputs: false 
    }]);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
    setCart(prev => prev.map((line, i) => i === index ? { ...line, [field]: value } : line));
  };

  const toggleIssueInputs = (index: number) => {
    setCart(prev => prev.map((line, i) => i === index ? { ...line, showIssueInputs: !line.showIssueInputs } : line));
  }

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
    setPoSearchTerm(`${po.id} - ${po.supplier}`);
    setShowPODropdown(false);

    const newCartItems: CartItem[] = po.items.map(poItem => {
        const inventoryItem = existingItems.find(ex => ex.sku === poItem.sku);
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
            qty: poItem.quantityExpected,
            orderedQty: poItem.quantityExpected,
            location: headerData.warehouseLocation,
            isDamaged: false,
            issueNotes: '',
            showIssueInputs: false
        };
    });
    setCart(newCartItems);
  };

  const handleSubmit = async () => {
    if (!headerData.lieferscheinNr || !headerData.lieferant || cart.length === 0) return;

    setSubmissionStatus('submitting');
    
    // -- STATUS FINALIZATION --
    // We use the status that is currently in state (auto-calculated or manually chosen)
    const finalStatus = headerData.status;
    setFinalResultStatus(finalStatus);

    try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const newItemsCreated = cart
          .map(c => c.item)
          .filter(item => !existingItems.find(ex => ex.id === item.id));

        const finalHeader = { ...headerData, status: finalStatus };

        // Clean up UI-only properties before sending to success callback
        const cleanCartItems = cart.map(({ showIssueInputs, ...rest }) => rest);

        onSuccess(finalHeader, cleanCartItems, newItemsCreated);
        setSubmissionStatus('success');
    } catch (err) {
        console.error("Error saving receipt:", err);
        setSubmissionStatus('error');
    }
  };

  // Helper for Success Message Logic
  const getSuccessMessage = () => {
    if (finalResultStatus === 'Falsch geliefert') return "Status auf 'Falsch geliefert' gesetzt aufgrund von gemeldeten Problemen.";
    if (finalResultStatus === 'Teillieferung') return "Teillieferung erfolgreich erfasst. Bestellung bleibt teilweise offen.";
    if (finalResultStatus === 'Übermenge') return "Achtung: Mehr geliefert als bestellt (Übermenge).";
    if (finalResultStatus === 'Gebucht') return "Wareneingang vollständig gebucht. Bestände wurden aktualisiert.";
    if (finalResultStatus === 'Projekt') return "Positionen dem Projekt zugeordnet. Projektteam wird benachrichtigt.";
    return "Vorgang erfolgreich gespeichert.";
  };

  // Dropdown Position Updaters
  // ... (Dropdown logic remains the same)
  const updatePODropdownPosition = () => {
    if (poInputRef.current) {
      const rect = poInputRef.current.getBoundingClientRect();
      setPODropdownCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowPODropdown(true);
    }
  };

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

  // -- Navigation Handlers --
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
                  ['Teillieferung', 'Falsch geliefert'].includes(finalResultStatus) 
                    ? 'bg-red-100 dark:bg-red-500/20' 
                    : ['Übermenge', 'Projekt'].includes(finalResultStatus) 
                      ? 'bg-amber-100 dark:bg-amber-500/20'
                      : 'bg-emerald-100 dark:bg-emerald-500/20'
                }`}>
                   {['Teillieferung', 'Falsch geliefert'].includes(finalResultStatus) ? (
                      <AlertCircle size={48} className="text-red-600 dark:text-red-400" strokeWidth={3} />
                   ) : ['Übermenge'].includes(finalResultStatus) ? (
                      <AlertTriangle size={48} className="text-amber-600 dark:text-amber-400" strokeWidth={3} />
                   ) : finalResultStatus === 'Projekt' ? (
                      <Briefcase size={48} className="text-amber-600 dark:text-amber-400" strokeWidth={3} />
                   ) : (
                      <CheckCircle2 size={48} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                   )}
                </div>
                <h2 className="text-2xl font-bold mb-2 dark:text-white text-slate-900">
                    {finalResultStatus === 'Falsch geliefert' ? 'Reklamation erforderlich' : finalResultStatus === 'Projekt' ? 'Projektbuchung' : 'Abgeschlossen'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                   {getSuccessMessage()}
                </p>
                <button 
                  onClick={onClose}
                  className={`w-full py-4 text-white rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    ['Teillieferung', 'Falsch geliefert'].includes(finalResultStatus)
                      ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30'
                      : ['Übermenge', 'Projekt'].includes(finalResultStatus) 
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/30' 
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30'
                  }`}
                >
                  <Home size={20} /> Zurück zur Wareneingang-Verwaltung
                </button>
             </div>
           )}

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

            <div className="grid grid-cols-1 gap-5">
                
                {/* PO Selection (Auto-Fill) */}
                <div className="space-y-1 relative group">
                  <label className="text-xs font-bold text-[#0077B5] uppercase tracking-wide">Bestellung auswählen (Optional)</label>
                  <div className="relative" ref={poInputRef}>
                    <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0077B5]" size={16} />
                    <input 
                      value={poSearchTerm}
                      onChange={e => {
                        setPoSearchTerm(e.target.value);
                        updatePODropdownPosition();
                      }}
                      onFocus={updatePODropdownPosition}
                      onClick={updatePODropdownPosition}
                      className={`${inputClass} pl-10 pr-8 ring-blue-500/10 border-blue-500/30`}
                      placeholder="Offene Bestellung suchen..."
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={16} />
                    
                    {/* PO Dropdown */}
                    {showPODropdown && filteredPOs.length > 0 && createPortal(
                      <div 
                        ref={poDropdownRef}
                        style={{
                          position: 'absolute',
                          top: poDropdownCoords.top + 4,
                          left: poDropdownCoords.left,
                          width: poDropdownCoords.width,
                          zIndex: 99999,
                          maxHeight: '300px'
                        }}
                        className={`rounded-xl border shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${
                          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                      >
                        {filteredPOs.map(po => (
                          <button
                            key={po.id}
                            onClick={() => handleSelectPO(po)}
                            className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between group/item ${
                              isDark 
                                ? 'hover:bg-slate-800 text-slate-200 border-b border-slate-800 last:border-0' 
                                : 'hover:bg-slate-50 text-slate-700 border-b border-slate-50 last:border-0'
                            }`}
                          >
                            <div>
                                <div className="font-bold flex items-center gap-2">
                                    {po.id} 
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                        po.status === 'Offen' 
                                            ? isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                            : isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>{po.status}</span>
                                </div>
                                <div className="text-xs opacity-70 mt-0.5">{po.supplier}</div>
                            </div>
                            {headerData.bestellNr === po.id && (
                              <div className="bg-[#0077B5]/10 p-1 rounded-full">
                                <Check size={12} className="text-[#0077B5]" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}
                  </div>
                </div>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-1" />

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
                
                {/* Supplier (Lieferant) with Dynamic Combobox */}
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
                      onFocus={() => {
                        if (!linkedPoId) updateSupplierDropdownPosition();
                      }}
                      className={linkedPoId ? `${readOnlyInputClass} pl-10 pr-8` : `${inputClass} pl-10 pr-8`}
                      placeholder="Lieferant suchen oder neu eingeben..."
                      disabled={!!linkedPoId}
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={16} />
                    
                    {/* Supplier Dropdown */}
                    {showSupplierDropdown && !linkedPoId && filteredSuppliers.length > 0 && createPortal(
                      <div 
                        ref={supplierDropdownRef}
                        style={{
                          position: 'absolute',
                          top: supplierDropdownCoords.top + 4,
                          left: supplierDropdownCoords.left,
                          width: supplierDropdownCoords.width,
                          zIndex: 9999,
                          maxHeight: '300px'
                        }}
                        className={`rounded-xl border shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${
                          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                      >
                        {filteredSuppliers.map(supplier => (
                          <button
                            key={supplier}
                            onClick={() => {
                              setHeaderData({...headerData, lieferant: supplier});
                              setShowSupplierDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between group/item ${
                              isDark 
                                ? 'hover:bg-slate-800 text-slate-200 border-b border-slate-800 last:border-0' 
                                : 'hover:bg-slate-50 text-slate-700 border-b border-slate-50 last:border-0'
                            }`}
                          >
                            <span>{supplier}</span>
                            {headerData.lieferant === supplier && (
                              <div className="bg-[#0077B5]/10 p-1 rounded-full">
                                <Check size={12} className="text-[#0077B5]" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>,
                      document.body
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

                {/* Global Lagerort (Location) */}
                <div className="space-y-1 relative group">
                  <label className="text-xs font-medium opacity-70">Ziel-Lagerort (Global für alle Positionen) <span className="text-red-500">*</span></label>
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
                    
                    {/* Location Dropdown */}
                    {showLocationDropdown && filteredLocations.length > 0 && createPortal(
                      <div 
                        ref={locationDropdownRef}
                        style={{
                          position: 'absolute',
                          top: locationDropdownCoords.top + 4,
                          left: locationDropdownCoords.left,
                          width: locationDropdownCoords.width,
                          zIndex: 99999,
                          maxHeight: '250px'
                        }}
                        className={`rounded-xl border shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${
                          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                      >
                        {filteredLocations.map(loc => (
                          <button
                            key={loc}
                            onClick={() => {
                              setHeaderData({...headerData, warehouseLocation: loc});
                              setCart(prev => prev.map(item => ({ ...item, location: loc })));
                              setShowLocationDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between group/item ${
                              isDark 
                                ? 'hover:bg-slate-800 text-slate-200 border-b border-slate-800 last:border-0' 
                                : 'hover:bg-slate-50 text-slate-700 border-b border-slate-50 last:border-0'
                            }`}
                          >
                            <span>{loc}</span>
                            {headerData.warehouseLocation === loc && (
                              <div className="bg-[#0077B5]/10 p-1 rounded-full">
                                <Check size={12} className="text-[#0077B5]" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}
                  </div>
                </div>

            </div>
          </div>
        )}

        {/* STEP 2: ARTIKEL HINZUFÜGEN / PRÜFEN */}
        {step === 2 && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
             <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="text-lg font-bold mb-1">
                        {linkedPoId ? 'Schritt 2: Wareneingang prüfen' : 'Schritt 2: Artikel hinzufügen'}
                    </h3>
                    <p className="text-sm opacity-70">
                        {linkedPoId 
                            ? 'Vergleichen Sie die gelieferten Mengen mit der Bestellung.' 
                            : 'Suchen Sie nach Artikeln oder legen Sie neue an.'}
                    </p>
                </div>
                <button 
                   onClick={() => setIsCreatingNew(!isCreatingNew)}
                   className="text-sm text-[#0077B5] font-bold hover:underline flex items-center gap-1"
                 >
                   <Plus size={16} /> {isCreatingNew ? 'Zurück zur Suche' : 'Neuen Artikel anlegen'}
                 </button>
             </div>

             <div className="space-y-6 relative z-[50]">
                {/* ... (Existing Search/Create logic) ... */}
                {isCreatingNew ? (
                    <div className={`p-5 rounded-2xl border space-y-4 animate-in slide-in-from-top-2 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                       {/* ... Create New Item Inputs ... */}
                       <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-2 items-start text-sm text-blue-600 dark:text-blue-400">
                          <Info size={18} className="shrink-0 mt-0.5" />
                          <span><b>Hinweis:</b> Der neue Artikel wird automatisch mit dem System und Lagerort ({headerData.warehouseLocation}) angelegt.</span>
                       </div>

                       <input 
                         value={newItemData.name} 
                         onChange={e => setNewItemData({...newItemData, name: e.target.value})}
                         placeholder="Artikelbezeichnung" 
                         className={inputClass}
                         autoFocus 
                       />
                       <div className="grid grid-cols-2 gap-4">
                         <input 
                           value={newItemData.sku} 
                           onChange={e => setNewItemData({...newItemData, sku: e.target.value})}
                           placeholder="Artikelnummer / SKU" 
                           className={inputClass} 
                         />
                         
                         <div className="relative group" ref={systemInputRef}>
                            <input 
                              value={newItemData.system} 
                              onChange={e => {
                                setNewItemData({...newItemData, system: e.target.value});
                                updateSystemDropdownPosition();
                              }}
                              onFocus={updateSystemDropdownPosition}
                              placeholder="System (z.B. BMA)" 
                              className={`${inputClass} pr-8`} 
                            />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={16} />
                            
                            {showSystemDropdown && filteredSystems.length > 0 && createPortal(
                              <div 
                                ref={systemDropdownRef}
                                style={{
                                  position: 'absolute',
                                  top: systemDropdownCoords.top + 4,
                                  left: systemDropdownCoords.left,
                                  width: systemDropdownCoords.width,
                                  zIndex: 9999
                                }}
                                className={`max-h-40 overflow-y-auto rounded-xl border shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
                                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                                }`}
                              >
                                {filteredSystems.map(sys => (
                                  <button
                                    key={sys}
                                    onClick={() => {
                                      setNewItemData({...newItemData, system: sys});
                                      setShowSystemDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center justify-between group/item ${
                                      isDark 
                                        ? 'hover:bg-slate-800 text-slate-200 border-b border-slate-800 last:border-0' 
                                        : 'hover:bg-slate-50 text-slate-700 border-b border-slate-50 last:border-0'
                                    }`}
                                  >
                                    <span>{sys}</span>
                                    {newItemData.system === sys && (
                                      <div className="bg-[#0077B5]/10 p-1 rounded-full">
                                        <Check size={12} className="text-[#0077B5]" strokeWidth={3} />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>,
                              document.body
                            )}
                         </div>
                       </div>
                       <button 
                         onClick={handleCreateNewItem}
                         disabled={!newItemData.name || !newItemData.sku}
                         className="w-full py-3 bg-[#0077B5] text-white rounded-xl font-bold text-sm hover:bg-[#00A0DC] disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
                       >
                         Artikel erstellen & hinzufügen
                       </button>
                    </div>
                ) : (
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        ref={searchInputRef}
                        value={searchTerm}
                        onChange={e => handleSearchChange(e.target.value)}
                        onFocus={() => {
                            if(searchTerm) updateSearchDropdownPosition();
                        }}
                        placeholder="Artikel suchen (Name oder SKU)..."
                        className={`${inputClass} pl-10 pr-3 py-3`}
                        autoFocus
                      />
                      {showSearchDropdown && searchResults.length > 0 && createPortal(
                        <div 
                          ref={searchDropdownRef}
                          style={{
                            position: 'absolute',
                            top: searchDropdownCoords.top + 8,
                            left: searchDropdownCoords.left,
                            width: searchDropdownCoords.width,
                            zIndex: 9999,
                            maxHeight: '400px'
                          }}
                          className={`rounded-xl border shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${
                            isDark 
                              ? 'bg-[#1e293b] border-slate-600' 
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {searchResults.map(item => (
                            <button 
                              key={item.id}
                              onClick={() => addToCart(item)}
                              className={`w-full text-left p-4 flex justify-between items-center border-b last:border-0 transition-colors ${
                                isDark 
                                  ? 'border-slate-700 hover:bg-slate-700 text-slate-200' 
                                  : 'border-slate-100 hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-base">{item.name}</div>
                                <div className="text-sm opacity-70 mt-0.5">Artikelnummer: {item.sku}</div>
                                <div className="text-xs opacity-50 mt-0.5">System: {item.system}</div>
                              </div>
                              <div className="bg-[#0077B5]/10 p-2 rounded-full">
                                <Plus size={20} className="text-[#0077B5]" />
                              </div>
                            </button>
                          ))}
                        </div>,
                        document.body
                      )}
                    </div>
                )}
             </div>

             {/* Real-Time Feedback Banner */}
             {step === 2 && deliveryStatusFeedback === 'partial' && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-2 ${
                    isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    <div className={`p-2 rounded-full shrink-0 ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                        <AlertTriangle size={24} className={isDark ? 'text-red-400' : 'text-red-600'} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Teillieferung erkannt</h4>
                        <p className="text-xs opacity-90 mt-0.5">Dieser Wareneingang wird als Teillieferung markiert – fehlende Mengen werden gespeichert.</p>
                    </div>
                </div>
             )}

             {step === 2 && deliveryStatusFeedback === 'perfect' && (
                <div className={`mb-6 p-3 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                    isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                    <CheckCircle2 size={18} />
                    <span className="font-bold text-sm">Alles vollständig – keine Abweichungen.</span>
                </div>
             )}

             {/* ADDED ITEMS LIST (CART) */}
             <div className="space-y-3 relative z-0">
               <h4 className="text-sm font-bold opacity-70 uppercase tracking-wider mb-2">Erfasste Positionen ({cart.length})</h4>
               
               {cart.length === 0 ? (
                 <div className="p-8 border rounded-xl border-dashed text-center text-slate-500">
                    Noch keine Artikel erfasst.
                 </div>
               ) : (
                 <>
                   {/* DESKTOP TABLE */}
                   <div className="hidden md:block rounded-xl border overflow-hidden shadow-sm">
                      <table className={`w-full text-sm text-left ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                         <thead className={`text-xs uppercase font-bold ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                            <tr>
                               <th className="px-4 py-3">Artikel</th>
                               {linkedPoId && <th className="px-4 py-3 w-24 text-center">Bestellt</th>}
                               <th className="px-4 py-3 w-24 text-center">{linkedPoId ? 'Geliefert' : 'Menge'}</th>
                               {linkedPoId && <th className="px-4 py-3 w-20 text-center text-red-500">Offen</th>}
                               {linkedPoId && <th className="px-4 py-3 w-20 text-center text-amber-500">Zu viel</th>}
                               <th className="px-4 py-3 w-16 text-center">Problem</th>
                               <th className="px-4 py-3 w-16 text-center">Aktion</th>
                            </tr>
                         </thead>
                         <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                            {cart.map((line, idx) => {
                               // Calculation Logic for new columns
                               const ordered = line.orderedQty || 0;
                               const received = line.qty;
                               const pending = Math.max(0, ordered - received);
                               const over = Math.max(0, received - ordered);
                               const hasIssue = line.isDamaged || (line.issueNotes && line.issueNotes.length > 0);

                               return (
                               <React.Fragment key={idx}>
                                   <tr className={`group transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} ${line.showIssueInputs ? (isDark ? 'bg-slate-800/30' : 'bg-slate-50/80') : ''}`}>
                                      <td className="px-4 py-3">
                                         <div className="font-bold">{line.item.name}</div>
                                         <div className="text-xs opacity-60 font-mono">Artikelnummer: {line.item.sku}</div>
                                         <div className="text-xs opacity-50 mt-0.5">System: {line.item.system}</div>
                                      </td>
                                      
                                      {/* Ordered Column */}
                                      {linkedPoId && (
                                        <td className="px-4 py-3 text-center">
                                           <span className="font-mono opacity-70">{line.orderedQty || '-'}</span>
                                        </td>
                                      )}
                                      
                                      {/* Received Input */}
                                      <td className="px-4 py-3 text-center">
                                         <input 
                                           type="number" 
                                           value={line.qty}
                                           onChange={e => updateCartItem(idx, 'qty', parseInt(e.target.value) || 0)}
                                           className={`w-24 px-2 py-1.5 rounded border text-center font-bold outline-none focus:ring-2 ${isDark ? 'bg-slate-950 border-slate-700 focus:ring-blue-500/30' : 'bg-white border-slate-300 focus:ring-[#0077B5]/20'}`}
                                         />
                                      </td>

                                      {/* Read-Only Columns */}
                                      {linkedPoId && (
                                          <td className="px-4 py-3 text-center font-bold text-red-500">
                                            {pending > 0 ? pending : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}
                                          </td>
                                      )}
                                      {linkedPoId && (
                                          <td className="px-4 py-3 text-center font-bold text-amber-500">
                                            {over > 0 ? over : <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>}
                                          </td>
                                      )}

                                      {/* Problem Toggle Button */}
                                      <td className="px-4 py-3 text-center">
                                         <button 
                                            onClick={() => toggleIssueInputs(idx)}
                                            className={`p-2 rounded-lg transition-all ${
                                                hasIssue 
                                                ? 'bg-red-500 text-white shadow-md shadow-red-500/20' 
                                                : line.showIssueInputs
                                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                    : 'text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                            }`}
                                            title="Problem melden"
                                         >
                                            <AlertTriangle size={16} />
                                         </button>
                                      </td>

                                      <td className="px-4 py-3 text-center">
                                         <button 
                                           onClick={() => removeCartItem(idx)}
                                           className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                         >
                                           <Trash2 size={16} />
                                         </button>
                                      </td>
                                   </tr>
                                   
                                   {/* Expanded Issue Inputs */}
                                   {line.showIssueInputs && (
                                       <tr className={`animate-in fade-in slide-in-from-top-1 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/80'}`}>
                                           <td colSpan={linkedPoId ? 7 : 4} className="px-4 pb-4 pt-1">
                                               <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-start ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                                   <div className="flex-1 space-y-2 w-full">
                                                       <div className="flex items-center justify-between">
                                                           <label className="text-xs font-bold uppercase text-red-500 flex items-center gap-1.5">
                                                               <AlertTriangle size={12}/> Problem melden
                                                           </label>
                                                       </div>
                                                       <input 
                                                           value={line.issueNotes}
                                                           onChange={(e) => updateCartItem(idx, 'issueNotes', e.target.value)}
                                                           placeholder="Beschreiben Sie das Problem (z.B. Falscher Artikel geliefert)..."
                                                           className={`w-full text-sm p-2 rounded-lg border outline-none focus:ring-1 focus:ring-red-500 ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`}
                                                       />
                                                   </div>
                                                   <div className="pt-6">
                                                       <label 
                                                            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                                                line.isDamaged 
                                                                    ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400' 
                                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                                                            }`}
                                                       >
                                                            <div className={`shrink-0 ${line.isDamaged ? 'text-red-500' : 'text-slate-400'}`}>
                                                                {line.isDamaged ? <CheckSquare size={18} /> : <div className="w-[18px] h-[18px] rounded border-2 border-current" />}
                                                            </div>
                                                            <input 
                                                                type="checkbox" 
                                                                className="hidden" 
                                                                checked={line.isDamaged} 
                                                                onChange={(e) => updateCartItem(idx, 'isDamaged', e.target.checked)} 
                                                            />
                                                            <span className="font-bold text-sm">Ware beschädigt</span>
                                                       </label>
                                                   </div>
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

                   {/* MOBILE CARDS */}
                   <div className="md:hidden space-y-3">
                     {cart.map((line, idx) => {
                         const hasIssue = line.isDamaged || (line.issueNotes && line.issueNotes.length > 0);
                         return (
                           <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-3 group ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                              <div className="flex justify-between items-start">
                                 <div className="min-w-0">
                                    <div className="font-bold text-sm truncate">{line.item.name}</div>
                                    <div className="text-xs text-slate-500">Artikelnummer: {line.item.sku}</div>
                                    <div className="text-xs text-slate-500 opacity-70">System: {line.item.system}</div>
                                 </div>
                                 <button 
                                   onClick={() => removeCartItem(idx)}
                                   className="text-slate-400 hover:text-red-500 p-1"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                              </div>
                              
                              {/* Mobile Inputs */}
                              <div className="grid grid-cols-2 gap-3 items-center">
                                  {linkedPoId && (
                                    <div className="text-left">
                                        <span className="text-[10px] font-bold opacity-60 uppercase block">Bestellt</span>
                                        <span className="text-sm font-mono opacity-80">{line.orderedQty}</span>
                                    </div>
                                  )}
                                  <div className="text-right ml-auto">
                                     <span className="text-[10px] font-bold opacity-60 uppercase block mb-1">{linkedPoId ? 'Geliefert' : 'Menge'}</span>
                                     <input 
                                       type="number" 
                                       value={line.qty}
                                       onChange={e => updateCartItem(idx, 'qty', parseInt(e.target.value) || 0)}
                                       className={`w-24 px-2 py-2 rounded border text-sm font-bold text-center ${isDark ? 'bg-slate-900 border-slate-600' : 'bg-slate-50 border-slate-300'}`}
                                     />
                                  </div>
                              </div>
                              
                              {/* Mobile Issue Toggle */}
                              <button 
                                onClick={() => toggleIssueInputs(idx)}
                                className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                                    hasIssue || line.showIssueInputs
                                    ? 'bg-red-500/10 border-red-500/30 text-red-500'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                  <AlertTriangle size={14} /> 
                                  {line.showIssueInputs ? 'Problem verbergen' : hasIssue ? 'Problem gemeldet' : 'Problem melden?'}
                              </button>

                              {/* Mobile Issue Inputs */}
                              {line.showIssueInputs && (
                                  <div className={`p-3 rounded-lg border space-y-3 animate-in fade-in slide-in-from-top-1 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                       <div>
                                           <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Bemerkung / Fehler</label>
                                           <input 
                                                value={line.issueNotes}
                                                onChange={(e) => updateCartItem(idx, 'issueNotes', e.target.value)}
                                                className={`w-full text-sm p-2 rounded-lg border outline-none focus:ring-1 focus:ring-red-500 ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`}
                                                placeholder="..."
                                           />
                                       </div>
                                       <label className="flex items-center gap-2 cursor-pointer">
                                           <div className={`shrink-0 ${line.isDamaged ? 'text-red-500' : 'text-slate-400'}`}>
                                                {line.isDamaged ? <CheckSquare size={18} /> : <div className="w-[18px] h-[18px] rounded border-2 border-current" />}
                                           </div>
                                           <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={line.isDamaged} 
                                                onChange={(e) => updateCartItem(idx, 'isDamaged', e.target.checked)} 
                                           />
                                           <span className={`text-sm font-bold ${line.isDamaged ? 'text-red-500' : 'text-slate-500'}`}>Ware beschädigt</span>
                                       </label>
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

        {/* STEP 3: REVIEW & COMPLETE */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
             <div className="mb-4">
                <h3 className="text-lg font-bold mb-1">Schritt 3: Überprüfung & Abschluss</h3>
                <p className="text-sm opacity-70">Bitte überprüfen Sie die Positionen und buchen Sie den Wareneingang.</p>
             </div>

             <div className="p-5 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 mb-6">
                {/* ... Header summary ... */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                      <div className="opacity-60 text-xs uppercase font-bold">Lieferschein</div>
                      <div className="font-semibold">{headerData.lieferscheinNr}</div>
                   </div>
                   <div>
                      <div className="opacity-60 text-xs uppercase font-bold">Bestell Nr.</div>
                      <div className="font-semibold">{headerData.bestellNr || 'Nicht angegeben'}</div>
                   </div>
                   <div>
                      <div className="opacity-60 text-xs uppercase font-bold">Lieferant</div>
                      <div className="font-semibold">{headerData.lieferant}</div>
                   </div>
                   <div>
                      <div className="opacity-60 text-xs uppercase font-bold">Lagerort</div>
                      <div className="font-semibold flex items-center gap-1"><MapPin size={12}/> {headerData.warehouseLocation}</div>
                   </div>
                   <div>
                      <div className="opacity-60 text-xs uppercase font-bold">Datum</div>
                      <div className="font-semibold">{new Date(headerData.lieferdatum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                   </div>
                </div>
             </div>

             {/* Status Selector in Step 3 */}
             <div className="space-y-1.5 mb-6">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70">Status des Wareneingangs</label>
                <select 
                    value={headerData.status} 
                    onChange={(e) => setHeaderData({...headerData, status: e.target.value})}
                    className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 focus:ring-blue-500/30' : 'bg-white border-slate-200 focus:ring-[#0077B5]/20'
                    }`}
                >
                    {TRANSACTION_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="text-xs opacity-50 px-1">
                    Der Status wurde automatisch basierend auf den Mengen berechnet, kann aber manuell angepasst werden.
                </p>
             </div>

             {/* Conditional Project Warning Banner */}
             {headerData.status === 'Projekt' && (
                <div className={`p-4 rounded-xl border flex items-start gap-4 mb-6 animate-in fade-in slide-in-from-top-2 ${
                    isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                    <div className={`p-2 rounded-full shrink-0 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                        <Briefcase size={24} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Projekt-Buchung erkannt</h4>
                        <p className="text-sm opacity-90 leading-relaxed">
                            Beim Speichern wird dieser Wareneingang als Projekt gespeichert. Eine E-Mail wird an das Projektteam versendet: "Ihre Ware ist zur Abholung bereit."
                        </p>
                    </div>
                </div>
             )}

             <div className="space-y-3">
               {cart.length === 0 ? (
                 <div className="p-8 border rounded-xl border-dashed text-center text-slate-500">
                    Keine Positionen vorhanden.
                 </div>
               ) : (
                 cart.map((line, idx) => {
                   const hasIssue = line.isDamaged || (line.issueNotes && line.issueNotes.length > 0);
                   return (
                   <div key={idx} className={`p-4 rounded-xl border flex gap-4 items-center relative overflow-hidden ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} ${hasIssue ? 'border-l-4 border-l-red-500' : ''}`}>
                      <div className="flex-1 min-w-0">
                         <div className="font-bold text-sm truncate">{line.item.name}</div>
                         <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                            <div className="font-mono opacity-90">Artikelnummer: {line.item.sku}</div>
                            <div className="opacity-70">System: {line.item.system}</div>
                         </div>
                         {hasIssue && (
                             <div className="mt-2 text-xs font-bold text-red-500 flex flex-wrap gap-2">
                                 {line.isDamaged && <span className="flex items-center gap-1"><AlertCircle size={10} /> Beschädigt</span>}
                                 {line.issueNotes && <span className="flex items-center gap-1"><MessageSquare size={10} /> {line.issueNotes}</span>}
                             </div>
                         )}
                      </div>
                      <div className="text-right">
                         <span className="text-xs opacity-60 uppercase font-bold block">
                             {linkedPoId ? 'Geliefert' : 'Menge'}
                         </span>
                         <span className="text-lg font-bold">{line.qty}</span>
                         {linkedPoId && (
                             <div className="text-xs opacity-60">von {line.orderedQty}</div>
                         )}
                      </div>
                   </div>
                 )})
               )}
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

    </div>
  );
};