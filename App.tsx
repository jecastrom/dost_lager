import React, { useState, useEffect } from 'react';
import { 
  MOCK_ITEMS, MOCK_RECEIPT_HEADERS, MOCK_RECEIPT_ITEMS, MOCK_COMMENTS, 
  MOCK_PURCHASE_ORDERS, MOCK_RECEIPT_MASTERS, MOCK_TICKETS 
} from './data';
import { 
  StockItem, ReceiptHeader, ReceiptItem, ReceiptComment, ViewMode, Theme, 
  ActiveModule, PurchaseOrder, ReceiptMaster, Ticket, DeliveryLog, StockLog 
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard'; 
import { InventoryView } from './components/InventoryView';
import { GoodsReceiptFlow } from './components/GoodsReceiptFlow';
import { ReceiptManagement } from './components/ReceiptManagement';
import { OrderManagement } from './components/OrderManagement';
import { CreateOrderWizard } from './components/CreateOrderWizard';
import { SettingsPage } from './components/SettingsPage';
import { DocumentationPage } from './components/DocumentationPage';
import { StockLogView } from './components/StockLogView';

export default function App() {
  // State
  const [theme, setTheme] = useState<Theme>('light');
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  
  // Persistent Inventory View Mode
  const [inventoryViewMode, setInventoryViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
        return (localStorage.getItem('inventoryViewMode') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });
  
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile Toggle
  const [sidebarMode, setSidebarMode] = useState<'full' | 'slim'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sidebarMode');
        return (saved === 'full' || saved === 'slim') ? saved : 'full';
    }
    return 'full';
  });
  
  // Data State - Renamed from 'items' to 'inventory' as requested
  const [inventory, setInventory] = useState<StockItem[]>(MOCK_ITEMS);
  const [receiptHeaders, setReceiptHeaders] = useState<ReceiptHeader[]>(MOCK_RECEIPT_HEADERS);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>(MOCK_RECEIPT_ITEMS);
  const [comments, setComments] = useState<ReceiptComment[]>(MOCK_COMMENTS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
  const [receiptMasters, setReceiptMasters] = useState<ReceiptMaster[]>(MOCK_RECEIPT_MASTERS);
  
  // Ticket State (Case Management)
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  
  // Logging State
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  
  // Transient State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);

  // Toggle Theme
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Sidebar Handler
  const handleSetSidebarMode = (mode: 'full' | 'slim') => {
    setSidebarMode(mode);
    localStorage.setItem('sidebarMode', mode);
  };

  // Inventory View Mode Handler
  const handleSetInventoryViewMode = (mode: 'grid' | 'list') => {
    setInventoryViewMode(mode);
    localStorage.setItem('inventoryViewMode', mode);
  };

  // Navigation Handler (Resets Transient State)
  const handleNavigation = (module: ActiveModule) => {
    setActiveModule(module);
    // Reset specific states when leaving modules
    if (module !== 'create-order') setOrderToEdit(null);
    if (module !== 'goods-receipt') setSelectedPoId(null);
  };

  // Handlers
  const handleLogStock = (itemId: string, itemName: string, action: 'add' | 'remove', quantity: number, source?: string, context?: 'normal' | 'project' | 'manual' | 'po-normal' | 'po-project') => {
    const item = inventory.find(i => i.id === itemId);
    const newLog: StockLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        userId: 'current-user-id',
        userName: 'Admin User',
        itemId,
        itemName,
        action,
        quantity,
        warehouse: item?.warehouseLocation || 'Hauptlager',
        source,
        context
    };
    
    setStockLogs(prev => [newLog, ...prev]);
    console.log('Stock Log Created:', newLog);
  };

  const handleStockUpdate = (id: string, newLevel: number) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, stockLevel: newLevel, lastUpdated: Date.now() } : item));
  };

  // New Handlers for Editability
  const handleUpdateItem = (updatedItem: StockItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleCreateItem = (newItem: StockItem) => {
    setInventory(prev => [newItem, ...prev]);
  };

  const handleAddStock = () => {
     handleNavigation('goods-receipt');
  };

  const handleReceiptStatusUpdate = (batchId: string, newStatus: string) => {
    setReceiptHeaders(prev => prev.map(h => h.batchId === batchId ? { ...h, status: newStatus } : h));
  };

  const handleAddComment = (batchId: string, type: 'note' | 'email' | 'call', message: string) => {
    const newComment: ReceiptComment = {
      id: crypto.randomUUID(),
      batchId,
      userId: 'currentUser',
      userName: 'Admin User',
      timestamp: Date.now(),
      type,
      message
    };
    setComments(prev => [newComment, ...prev]);
  };

  // Ticket Handlers
  const handleAddTicket = (ticket: Ticket) => {
    setTickets(prev => [...prev, ticket]);
  };

  const handleUpdateTicket = (ticket: Ticket) => {
    setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
  };

  const handleCreateOrder = (order: PurchaseOrder) => {
    setPurchaseOrders(prev => [order, ...prev]);
  };

  const handleArchiveOrder = (id: string) => {
    setPurchaseOrders(prev => prev.map(o => o.id === id ? { ...o, isArchived: true } : o));
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setOrderToEdit(order);
    handleNavigation('create-order');
  };

  const handleReceiveGoods = (poId: string) => {
    setSelectedPoId(poId);
    handleNavigation('goods-receipt');
  };

  // Handle Quick Receipt Creation
  const handleQuickReceipt = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    const batchId = `b-${Date.now()}`;
    const timestamp = Date.now();

    // 1. Create Placeholder Receipt Header (Visible in UI)
    const newHeader: ReceiptHeader = {
      batchId,
      lieferscheinNr: 'Ausstehend', // Localized from 'PENDING'
      bestellNr: po.id,
      lieferdatum: new Date().toISOString().split('T')[0],
      lieferant: po.supplier,
      status: 'In Prüfung', // Special status to indicate needs action
      timestamp,
      itemCount: 0,
      warehouseLocation: 'Wareneingang',
      createdByName: 'Admin User'
    };

    setReceiptHeaders(prev => [newHeader, ...prev]);

    // 2. Create Receipt Master with Initial Delivery Log
    setReceiptMasters(prev => {
        const existing = prev.find(m => m.poId === poId);
        
        // Create initial delivery log with 0 quantities as placeholder
        const initialDelivery: DeliveryLog = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            lieferscheinNr: 'Ausstehend', // Localized from 'PENDING'
            items: po.items.map(i => ({
                sku: i.sku,
                receivedQty: 0, // Initialize with 0
                damageFlag: false,
                manualAddFlag: false,
                orderedQty: i.quantityExpected,
                previousReceived: 0,
                offen: i.quantityExpected,
                zuViel: 0
            }))
        };

        if (existing) {
            return prev.map(m => m.poId === poId ? { 
                ...m, 
                deliveries: [...m.deliveries, initialDelivery] 
            } : m);
        } else {
            return [...prev, {
                id: `RM-${Date.now()}`,
                poId,
                status: 'In Prüfung' as any, 
                deliveries: [initialDelivery]
            }];
        }
    });

    // 3. Link PO to this receipt (to indicate a receipt process started)
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, linkedReceiptId: batchId } : p));

    // 4. Navigate to Receipt Management to show the new entry
    handleNavigation('receipt-management');
  };

  const handleReceiptSuccess = (
    headerData: Omit<ReceiptHeader, 'batchId' | 'timestamp' | 'itemCount'>,
    cartItems: { item: StockItem; qty: number; location: string; isDamaged?: boolean; issueNotes?: string; orderedQty?: number }[],
    newItemsCreated: StockItem[]
  ) => {
    const batchId = `b-${Date.now()}`;
    const timestamp = Date.now();

    // Determine Context & Source for Logging
    let context: 'normal' | 'project' | 'po-normal' | 'po-project' = 'normal';
    let source = headerData.lieferscheinNr;
    
    if (headerData.bestellNr) {
        source = `PO: ${headerData.bestellNr} / LS: ${headerData.lieferscheinNr}`;
        const linkedPO = purchaseOrders.find(p => p.id === headerData.bestellNr);
        if (linkedPO && linkedPO.status === 'Projekt') {
            context = 'po-project';
        } else {
            context = 'po-normal';
        }
    }

    // 1. Add New Items to Inventory
    if (newItemsCreated.length > 0) {
      setInventory(prev => [...prev, ...newItemsCreated]);
    }

    // 2. Update Inventory Levels & Log Changes
    setInventory(prev => {
      const copy = [...prev];
      cartItems.forEach(cartItem => {
         // LOGGING: Track addition with Source & Context
         handleLogStock(cartItem.item.id, cartItem.item.name, 'add', cartItem.qty, source, context);

         const idx = copy.findIndex(i => i.id === cartItem.item.id);
         if (idx >= 0) {
           copy[idx] = { 
             ...copy[idx], 
             stockLevel: copy[idx].stockLevel + cartItem.qty,
             lastUpdated: timestamp,
             warehouseLocation: cartItem.location // Update location if changed
           };
         }
      });
      return copy;
    });

    // 3. Create Receipt Header
    const newHeader: ReceiptHeader = {
      ...headerData,
      batchId,
      timestamp,
      itemCount: cartItems.length,
      createdByName: 'Admin User'
    };
    setReceiptHeaders(prev => [newHeader, ...prev]);

    // 4. Create Receipt Items
    const newReceiptItems: ReceiptItem[] = cartItems.map((c, idx) => ({
      id: `ri-${batchId}-${idx}`,
      batchId,
      sku: c.item.sku,
      name: c.item.name,
      quantity: c.qty,
      targetLocation: c.location,
      isDamaged: c.isDamaged,
      issueNotes: c.issueNotes
    }));
    setReceiptItems(prev => [...prev, ...newReceiptItems]);

    // 5. Create Ticket if Issues exist
    cartItems.forEach(c => {
        if (c.isDamaged || (c.issueNotes && c.issueNotes.length > 0)) {
            const ticket: Ticket = {
                id: crypto.randomUUID(),
                receiptId: batchId,
                subject: c.isDamaged ? 'Ware beschädigt' : 'Unstimmigkeit bei Wareneingang',
                priority: c.isDamaged ? 'High' : 'Normal',
                status: 'Open',
                messages: [{
                    id: crypto.randomUUID(),
                    author: 'System',
                    text: `Automatisch erstellt bei Wareneingang. Artikel: ${c.item.name} (${c.item.sku}). Menge: ${c.qty}. Notiz: ${c.issueNotes || 'Keine Notiz'}`,
                    timestamp,
                    type: 'system'
                }]
            };
            setTickets(prev => [...prev, ticket]);
        }
    });

    // 6. Update Purchase Order & Receipt Master (if linked)
    if (headerData.bestellNr) {
        const poId = headerData.bestellNr;
        
        // IMPORTANT: We must get the state of the PO *before* this update to calculate 'previousReceived' correctly.
        // Since purchaseOrders in this scope is the state at render time, it is correct.
        const currentPO = purchaseOrders.find(p => p.id === poId);

        // Update PO Quantities & Status
        setPurchaseOrders(prev => prev.map(po => {
            if (po.id !== poId) return po;

            const updatedItems = po.items.map(pItem => {
                const receivedLine = cartItems.find(c => c.item.sku === pItem.sku);
                if (receivedLine) {
                    return { ...pItem, quantityReceived: pItem.quantityReceived + receivedLine.qty };
                }
                return pItem;
            });

            // Calculate new PO Status
            const allReceived = updatedItems.every(i => i.quantityReceived >= i.quantityExpected);
            const partiallyReceived = updatedItems.some(i => i.quantityReceived > 0);
            
            return {
                ...po,
                items: updatedItems,
                status: allReceived ? 'Abgeschlossen' : partiallyReceived ? 'Teilweise geliefert' : 'Offen',
                linkedReceiptId: batchId // Ensure link is set
            };
        }));

        // Update Receipt Master Logs
        setReceiptMasters(prev => {
            const existingMaster = prev.find(m => m.poId === poId);
            
            const newDeliveryLog: DeliveryLog = {
                id: crypto.randomUUID(),
                date: new Date(timestamp).toISOString(),
                lieferscheinNr: headerData.lieferscheinNr,
                items: cartItems.map(c => {
                    // Find corresponding PO Item to get historical data
                    const poItem = currentPO?.items.find(pi => pi.sku === c.item.sku);
                    
                    // Snapshot Data Calculation
                    const ordered = poItem ? poItem.quantityExpected : 0;
                    const previous = poItem ? poItem.quantityReceived : 0; // Value BEFORE this delivery
                    const current = c.qty;
                    const total = previous + current;
                    
                    const offen = Math.max(0, ordered - total);
                    const zuViel = Math.max(0, total - ordered);

                    return {
                        sku: c.item.sku,
                        receivedQty: current,
                        damageFlag: !!c.isDamaged || !!c.issueNotes,
                        manualAddFlag: !c.orderedQty, // If orderedQty is undefined/0 it might be manual
                        // Store Snapshots
                        orderedQty: ordered,
                        previousReceived: previous,
                        offen: offen,
                        zuViel: zuViel
                    };
                })
            };

            if (existingMaster) {
                return prev.map(m => m.id === existingMaster.id ? { 
                    ...m, 
                    deliveries: [...m.deliveries, newDeliveryLog] 
                } : m);
            } else {
                return [...prev, {
                    id: crypto.randomUUID(),
                    poId,
                    status: 'Offen',
                    deliveries: [newDeliveryLog]
                }];
            }
        });
    }

    // Redirect to Receipt Management instead of Dashboard
    handleNavigation('receipt-management');
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {/* Extracted Sidebar Component */}
      <Sidebar 
        theme={theme}
        activeModule={activeModule}
        onNavigate={handleNavigation}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mode={sidebarMode}
      />
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - Dynamic Margin based on Sidebar Mode */}
      <main className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ${
         sidebarMode === 'slim' ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
         <Header 
            theme={theme}
            toggleTheme={toggleTheme}
            totalItems={inventory.length}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
         />

         <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
            <div className="max-w-[1600px] mx-auto h-full">
                
                {activeModule === 'dashboard' && (
                  <Dashboard 
                    inventory={inventory}
                    logs={stockLogs}
                    theme={theme}
                    onAddStock={handleAddStock}
                    onNavigate={handleNavigation}
                    orders={purchaseOrders}
                    receipts={receiptMasters}
                    tickets={tickets}
                  />
                )}

                {activeModule === 'inventory' && (
                  <InventoryView 
                    inventory={inventory}
                    theme={theme}
                    viewMode={inventoryViewMode}
                    onUpdate={handleStockUpdate}
                    onUpdateItem={handleUpdateItem}
                    onCreateItem={handleCreateItem}
                    onAddStock={handleAddStock}
                    onLogStock={handleLogStock}
                  />
                )}

                {activeModule === 'stock-logs' && (
                    <StockLogView 
                        logs={stockLogs} 
                        onBack={() => handleNavigation('dashboard')} 
                        theme={theme} 
                    />
                )}

                {activeModule === 'goods-receipt' && (
                  <GoodsReceiptFlow 
                    theme={theme}
                    existingItems={inventory}
                    onClose={() => handleNavigation('dashboard')}
                    onSuccess={handleReceiptSuccess}
                    onLogStock={handleLogStock}
                    purchaseOrders={purchaseOrders}
                    initialPoId={selectedPoId}
                    receiptMasters={receiptMasters}
                  />
                )}

                {activeModule === 'receipt-management' && (
                  <ReceiptManagement 
                    headers={receiptHeaders}
                    items={receiptItems}
                    comments={comments}
                    tickets={tickets}
                    purchaseOrders={purchaseOrders}
                    receiptMasters={receiptMasters}
                    theme={theme}
                    onUpdateStatus={handleReceiptStatusUpdate}
                    onAddComment={handleAddComment}
                    onAddTicket={handleAddTicket}
                    onUpdateTicket={handleUpdateTicket}
                    onReceiveGoods={handleReceiveGoods}
                  />
                )}
                
                {activeModule === 'create-order' && (
                  <CreateOrderWizard 
                     theme={theme}
                     items={inventory}
                     onNavigate={handleNavigation}
                     onCreateOrder={handleCreateOrder}
                     initialOrder={orderToEdit}
                  />
                )}

                {activeModule === 'order-management' && (
                  <OrderManagement 
                     orders={purchaseOrders}
                     theme={theme}
                     onArchive={handleArchiveOrder}
                     onEdit={handleEditOrder}
                     onReceiveGoods={handleReceiveGoods}
                     onQuickReceipt={handleQuickReceipt}
                     receiptMasters={receiptMasters}
                  />
                )}

                {activeModule === 'settings' && (
                  <SettingsPage 
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onNavigate={handleNavigation}
                    onUploadData={(newItems) => setInventory(newItems)}
                    onClearData={() => setInventory(MOCK_ITEMS)}
                    hasCustomData={inventory !== MOCK_ITEMS}
                    sidebarMode={sidebarMode}
                    onSetSidebarMode={handleSetSidebarMode}
                    inventoryViewMode={inventoryViewMode}
                    onSetInventoryViewMode={handleSetInventoryViewMode}
                  />
                )}

                {activeModule === 'documentation' && (
                  <DocumentationPage 
                    theme={theme}
                    onBack={() => handleNavigation('settings')}
                  />
                )}

            </div>
         </div>
      </main>
    </div>
  );
}
