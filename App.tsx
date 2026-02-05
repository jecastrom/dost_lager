
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
import { SettingsPage, TicketConfig } from './components/SettingsPage';
import { DocumentationPage } from './components/DocumentationPage';
import { StockLogView } from './components/StockLogView';
import { LogicInspector } from './components/LogicInspector';
import { SupplierView } from './components/SupplierView';

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

  // Global Configuration State
  const [requireDeliveryDate, setRequireDeliveryDate] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('requireDeliveryDate') !== 'false';
    }
    return true;
  });

  // Ticket Automation Config State
  const [ticketConfig, setTicketConfig] = useState<TicketConfig>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ticketConfig');
        if (saved) return JSON.parse(saved);
    }
    return { missing: false, extra: false, damage: true, wrong: true, rejected: true };
  });
  
  // Data State
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

  // Configuration Handler
  const handleSetRequireDeliveryDate = (required: boolean) => {
    setRequireDeliveryDate(required);
    localStorage.setItem('requireDeliveryDate', String(required));
  };

  // Ticket Config Handler
  const handleSetTicketConfig = (newConfig: TicketConfig) => {
    setTicketConfig(newConfig);
    localStorage.setItem('ticketConfig', JSON.stringify(newConfig));
  };

  // Navigation Handler (Resets Transient State)
  const handleNavigation = (module: ActiveModule) => {
    setActiveModule(module);
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
  };

  const handleStockUpdate = (id: string, newLevel: number) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, stockLevel: newLevel, lastUpdated: Date.now() } : item));
  };

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

  const handleQuickReceipt = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    const batchId = `b-${Date.now()}`;
    const timestamp = Date.now();

    const newHeader: ReceiptHeader = {
      batchId,
      lieferscheinNr: 'Ausstehend',
      bestellNr: po.id,
      lieferdatum: new Date().toISOString().split('T')[0],
      lieferant: po.supplier,
      status: 'In Prüfung',
      timestamp,
      itemCount: 0,
      warehouseLocation: 'Wareneingang',
      createdByName: 'Admin User'
    };

    setReceiptHeaders(prev => [newHeader, ...prev]);

    setReceiptMasters(prev => {
        const existing = prev.find(m => m.poId === poId);
        const initialDelivery: DeliveryLog = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            lieferscheinNr: 'Ausstehend',
            items: po.items.map(i => ({
                sku: i.sku,
                receivedQty: 0,
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

    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, linkedReceiptId: batchId } : p));
    handleNavigation('receipt-management');
  };

  const handleReceiptSuccess = (
    headerData: Omit<ReceiptHeader, 'timestamp' | 'itemCount'>, // Note: batchId is optional in Omit if already present, but we handle dynamic check
    cartItems: any[], // Using any[] to accept extra properties from GoodsReceiptFlow like isRejected, previouslyReceived etc.
    newItemsCreated: StockItem[]
  ) => {
    // If batchId was pre-generated by GoodsReceiptFlow (for tickets), use it. Otherwise generate new.
    const batchId = (headerData as any).batchId || `b-${Date.now()}`;
    const timestamp = Date.now();

    // Determine Context
    let context: 'normal' | 'project' | 'po-normal' | 'po-project' = 'normal';
    let source = headerData.lieferscheinNr;
    let isProject = false;
    
    if (headerData.bestellNr) {
        source = `PO: ${headerData.bestellNr} / LS: ${headerData.lieferscheinNr}`;
        const linkedPO = purchaseOrders.find(p => p.id === headerData.bestellNr);
        if (linkedPO && linkedPO.status === 'Projekt') {
            context = 'po-project';
            isProject = true;
        } else {
            context = 'po-normal';
        }
    }

    if (newItemsCreated.length > 0) {
      setInventory(prev => [...prev, ...newItemsCreated]);
    }

    setInventory(prev => {
      const copy = [...prev];
      cartItems.forEach(cartItem => {
         // Log the action (even if qty 0, though mostly qty > 0)
         if (cartItem.qty > 0) {
             handleLogStock(cartItem.item.id, cartItem.item.name, 'add', cartItem.qty, source, context);
         }

         if (!isProject) {
             const idx = copy.findIndex(i => i.id === cartItem.item.id);
             if (idx >= 0) {
               copy[idx] = { 
                 ...copy[idx], 
                 stockLevel: copy[idx].stockLevel + cartItem.qty,
                 lastUpdated: timestamp,
                 warehouseLocation: cartItem.location 
               };
             }
         }
      });
      return copy;
    });

    const newHeader: ReceiptHeader = {
      ...headerData,
      batchId,
      timestamp,
      itemCount: cartItems.length,
      createdByName: 'Admin User'
    };
    setReceiptHeaders(prev => [newHeader, ...prev]);

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

    // Ticket Creation Logic has been moved to GoodsReceiptFlow.handleFinalize 
    // to allow consolidation into a single ticket per receipt.

    if (headerData.bestellNr) {
        const poId = headerData.bestellNr;
        const currentPO = purchaseOrders.find(p => p.id === poId);

        setPurchaseOrders(prev => prev.map(po => {
            if (po.id !== poId) return po;
            const updatedItems = po.items.map(pItem => {
                const receivedLine = cartItems.find(c => c.item.sku === pItem.sku);
                if (receivedLine) {
                    return { ...pItem, quantityReceived: pItem.quantityReceived + receivedLine.qty };
                }
                return pItem;
            });
            const allReceived = updatedItems.every(i => i.quantityReceived >= i.quantityExpected);
            const partiallyReceived = updatedItems.some(i => i.quantityReceived > 0);
            return {
                ...po,
                items: updatedItems,
                status: allReceived ? 'Abgeschlossen' : partiallyReceived ? 'Teilweise geliefert' : 'Offen',
                linkedReceiptId: batchId 
            };
        }));

        setReceiptMasters(prev => {
            const existingMaster = prev.find(m => m.poId === poId);
            const newDeliveryLog: DeliveryLog = {
                id: crypto.randomUUID(),
                date: new Date(timestamp).toISOString(),
                lieferscheinNr: headerData.lieferscheinNr,
                items: cartItems.map(c => {
                    const poItem = currentPO?.items.find(pi => pi.sku === c.item.sku);
                    const ordered = poItem ? poItem.quantityExpected : 0;
                    const previous = poItem ? poItem.quantityReceived : 0;
                    const current = c.qty;
                    const total = previous + current;
                    
                    const offen = Math.max(0, ordered - total);
                    const zuViel = Math.max(0, total - ordered);

                    return {
                        sku: c.item.sku,
                        receivedQty: current,
                        damageFlag: !!c.isDamaged || !!c.issueNotes,
                        manualAddFlag: !c.orderedQty,
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

    handleNavigation('receipt-management');
  };

  const handleRevertReceipt = (batchId: string) => {
      const header = receiptHeaders.find(h => h.batchId === batchId);
      if (!header) return;

      const poId = header.bestellNr;
      const linkedPO = purchaseOrders.find(p => p.id === poId);
      const isProject = linkedPO?.status === 'Projekt';

      const itemsToRevert = receiptItems.filter(i => i.batchId === batchId);
      if (!isProject) {
          setInventory(prev => {
              const copy = [...prev];
              itemsToRevert.forEach(rItem => {
                  const idx = copy.findIndex(i => i.sku === rItem.sku);
                  if (idx >= 0) {
                      copy[idx] = {
                          ...copy[idx],
                          stockLevel: Math.max(0, copy[idx].stockLevel - rItem.quantity),
                          lastUpdated: Date.now()
                      };
                      handleLogStock(
                          copy[idx].id,
                          copy[idx].name,
                          'remove',
                          rItem.quantity,
                          `Storno - ${header.lieferscheinNr}`,
                          'manual'
                      );
                  }
              });
              return copy;
          });
      } else {
          itemsToRevert.forEach(rItem => {
              handleLogStock(
                  rItem.sku,
                  rItem.name,
                  'remove',
                  rItem.quantity,
                  `Storno (Projekt) - ${header.lieferscheinNr}`,
                  'po-project'
              );
          });
      }

      setReceiptHeaders(prev => prev.map(h => h.batchId === batchId ? { ...h, status: 'In Prüfung' } : h));
      
      if (linkedPO) {
           setPurchaseOrders(prev => prev.map(po => {
               if (po.id !== linkedPO.id) return po;
               const newItems = po.items.map(pItem => {
                   const rItem = itemsToRevert.find(ri => ri.sku === pItem.sku);
                   if (rItem) {
                       return { ...pItem, quantityReceived: Math.max(0, pItem.quantityReceived - rItem.quantity) };
                   }
                   return pItem;
               });
               const anyReceived = newItems.some(i => i.quantityReceived > 0);
               return {
                   ...po,
                   items: newItems,
                   status: anyReceived ? 'Teilweise geliefert' : 'Offen'
               };
           }));
      }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      <Sidebar 
        theme={theme}
        activeModule={activeModule}
        onNavigate={handleNavigation}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mode={sidebarMode}
      />
      
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
        />
      )}

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
                    ticketConfig={ticketConfig}
                    onAddTicket={handleAddTicket}
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
                    onNavigate={handleNavigation}
                    onRevertReceipt={handleRevertReceipt}
                  />
                )}
                
                {activeModule === 'create-order' && (
                  <CreateOrderWizard 
                     theme={theme}
                     items={inventory}
                     onNavigate={handleNavigation}
                     onCreateOrder={handleCreateOrder}
                     initialOrder={orderToEdit}
                     requireDeliveryDate={requireDeliveryDate}
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
                     onNavigate={handleNavigation}
                     tickets={tickets}
                  />
                )}

                {activeModule === 'suppliers' && (
                  <SupplierView 
                    receipts={receiptMasters}
                    headers={receiptHeaders}
                    orders={purchaseOrders}
                    theme={theme}
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
                    requireDeliveryDate={requireDeliveryDate}
                    onSetRequireDeliveryDate={handleSetRequireDeliveryDate}
                    ticketConfig={ticketConfig}
                    onSetTicketConfig={handleSetTicketConfig}
                  />
                )}

                {activeModule === 'documentation' && (
                  <DocumentationPage 
                    theme={theme}
                    onBack={() => handleNavigation('settings')}
                  />
                )}

                {activeModule === 'debug' && (
                  <LogicInspector 
                    orders={purchaseOrders}
                    receiptMasters={receiptMasters}
                    onBack={() => handleNavigation('settings')}
                    theme={theme}
                  />
                )}

            </div>
         </div>
      </main>
    </div>
  );
}
