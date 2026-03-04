
import React, { useState, useEffect, useRef } from 'react';
import {
  MOCK_ITEMS, MOCK_RECEIPT_HEADERS, MOCK_RECEIPT_ITEMS, MOCK_COMMENTS,
  MOCK_PURCHASE_ORDERS, MOCK_RECEIPT_MASTERS, MOCK_TICKETS
} from './data';
import {
  StockItem, ReceiptHeader, ReceiptItem, ReceiptComment, ViewMode, Theme,
  ActiveModule, PurchaseOrder, ReceiptMaster, Ticket, DeliveryLog, StockLog, ReceiptMasterStatus, AuditEntry, LagerortCategory,
  AuthUser
} from './types';
import { getDeliveryDateBadge } from './components/ReceiptStatusConfig';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InventoryView } from './components/InventoryView';
import { GoodsReceiptFlow } from './components/GoodsReceiptFlow';
import { ReceiptManagement } from './components/ReceiptManagement';
import { OrderManagement } from './components/OrderManagement';
import { CreateOrderWizard } from './components/CreateOrderWizard';
import { SettingsPage, TicketConfig, TimelineConfig } from './components/SettingsPage';
import { GlobalSettingsPage } from './components/GlobalSettingsPage';
import { DocumentationPage } from './components/DocumentationPage';
import { StockLogView } from './components/StockLogView';
import { LogicInspector } from './components/LogicInspector';
import { SupplierView } from './components/SupplierView';
import { BottomNav } from './components/BottomNav';
import { LoginPage } from './components/LoginPage';
import { TeamManagement } from './components/TeamManagement';
import { loadAllData, stockApi, ordersApi, receiptsApi, ticketsApi, DataSource } from './api';
import { flushQueue, onQueueChange, getQueueCount } from './offlineQueue';

// Error Boundary Component
interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<ErrorBoundaryProps>, ErrorBoundaryState> {
  declare props: React.PropsWithChildren<ErrorBoundaryProps>;
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Die Anwendung ist auf einen unerwarteten Fehler gestoßen. Bitte laden Sie die Seite neu.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Technische Details
                </summary>
                <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto text-red-600 dark:text-red-400">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReload}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  // State
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme | null;
      if (saved === 'dark' || saved === 'light' || saved === 'soft') return saved;
    }
    return 'light';
  });
  // --- Authentication State ---
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check Azure SWA auth on mount, then fetch user profile from Cosmos DB
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        // Step 1: Check Azure SWA authentication
        const res = await fetch('/.auth/me');
        if (!res.ok) {
          setAuthLoading(false);
          return;
        }
        const data = await res.json();
        const principal = data?.clientPrincipal;

        if (!principal) {
          if (!cancelled) setAuthLoading(false);
          return;
        }

        // Step 2: Look up user profile in Cosmos DB (by userId first, then email fallback)
        let profile: any = null;
        const profileRes = await fetch(`/api/user-profiles?userId=${encodeURIComponent(principal.userId)}`);

        if (profileRes.ok) {
          profile = await profileRes.json();
        } else if (profileRes.status === 404) {
          // userId not found — try matching by email (first login scenario)
          const userEmail = principal.userDetails; // Azure SWA puts email in userDetails
          if (userEmail) {
            const emailRes = await fetch(`/api/user-profiles?email=${encodeURIComponent(userEmail)}`);
            if (emailRes.ok) {
              const emailProfile = await emailRes.json();
              // Found by email! Auto-link the profile to this userId
              // Delete old profile (with placeholder ID) and create new one with real userId
              const oldId = emailProfile.id;
              const updatedProfile = { ...emailProfile, id: principal.userId };
              delete updatedProfile._rid;
              delete updatedProfile._self;
              delete updatedProfile._etag;
              delete updatedProfile._attachments;
              delete updatedProfile._ts;
              updatedProfile.updatedAt = Date.now();
              updatedProfile.lastLogin = Date.now();

              // Create profile with real userId
              await fetch('/api/user-profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProfile),
              });

              // Delete the old placeholder profile (if ID was different)
              if (oldId !== principal.userId) {
                await fetch(`/api/user-profiles?userId=${encodeURIComponent(oldId)}`, {
                  method: 'DELETE',
                });
              }

              profile = updatedProfile;
            }
          }
        }

        if (!profile) {
          // User exists in Azure but not provisioned in our app
          if (!cancelled) {
            setAuthError('NOT_PROVISIONED');
            setCurrentUser({
              userId: principal.userId,
              identityProvider: principal.identityProvider,
              userDetails: principal.userDetails,
              displayName: principal.claims?.find((c: any) => c.typ === 'name')?.val || principal.userDetails,
              role: 'team',
              featureAccess: [],
            });
          }
          if (!cancelled) setAuthLoading(false);
          return;
        }

        // Profile was already loaded above — check active status and set user
        if (!profile.isActive) {
          if (!cancelled) setAuthError('ACCOUNT_DEACTIVATED');
          if (!cancelled) setAuthLoading(false);
          return;
        }

        if (!cancelled) {
          setCurrentUser({
            userId: principal.userId,
            identityProvider: principal.identityProvider,
            userDetails: principal.userDetails,
            displayName: `${profile.firstName} ${profile.lastName}`.trim() || principal.userDetails,
            role: profile.role,
            featureAccess: profile.featureAccess || [],
          });
        }
      } catch (err) {
        console.warn('[Auth] Failed to check auth status:', err);
        if (!cancelled) setAuthError('Authentifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');

  // -- UX State: Force View Refresh --
  const [viewKey, setViewKey] = useState(0);

  // Persistent Inventory View Mode
  const [inventoryViewMode, setInventoryViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('inventoryViewMode') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });

  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile Toggle

  // Mobile bottom nav scroll-hide — uses touch events so it works on ANY scrollable container
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const touchStartY = useRef(0);
  const touchDirLocked = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only run on mobile-sized screens
    const isMobile = () => window.innerWidth < 1024;

    const onTouchStart = (e: TouchEvent) => {
      if (!isMobile()) return;
      touchStartY.current = e.touches[0].clientY;
      touchDirLocked.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isMobile()) return;
      const currentY = e.touches[0].clientY;
      const delta = touchStartY.current - currentY; // positive = finger moving up = scroll down

      // 12px dead-zone to avoid jitter on taps
      if (Math.abs(delta) < 12) return;

      if (!touchDirLocked.current) {
        touchDirLocked.current = true;
        if (delta > 0) setBottomNavHidden(true);   // Scrolling down → hide
        else setBottomNavHidden(false);              // Scrolling up → show
      }

      // Reset idle timer on every move
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setBottomNavHidden(false), 1500);
    };

    const onTouchEnd = () => {
      if (!isMobile()) return;
      // Idle timeout: show nav after 1.5s of no touch
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setBottomNavHidden(false), 1500);
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // Global Configuration State
  // UPDATED: Default is now FALSE (Optional)
  const [requireDeliveryDate, setRequireDeliveryDate] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('requireDeliveryDate');
      // Only return true if explicitly saved as 'true'. Default (null) becomes false.
      return saved === 'true';
    }
    return false;
  });

  // Smart Import Feature Flag
  const [enableSmartImport, setEnableSmartImport] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('enableSmartImport');
      // Default to TRUE if not set, or parse existing
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Status Column Position Setting
  const [statusColumnFirst, setStatusColumnFirst] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('statusColumnFirst') === 'true';
    }
    return false;
  });

  // Ticket Automation Config State
  // UPDATED: All defaults set to TRUE for maximum coverage
  const [ticketConfig, setTicketConfig] = useState<TicketConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ticketConfig');
      if (saved) return JSON.parse(saved);
    }
    return { missing: true, extra: true, damage: true, wrong: true, rejected: true };
  });

  // Timeline Auto-Post Config (Historie & Notizen)
  const [timelineConfig, setTimelineConfig] = useState<TimelineConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('timelineConfig');
      if (saved) return JSON.parse(saved);
    }
    return { missing: true, extra: true, damage: true, wrong: true, rejected: true };
  });

  // Lagerort Categories (managed in Global Settings)
  const DEFAULT_LAGERORT_CATEGORIES: LagerortCategory[] = [
    {
      id: 'cat-objekte',
      name: 'Objekte',
      items: [
        "EKZFK", "GERAS", "HaB", "HAB", "HaB Altbestand Kunde", "HLU", "HTW", "KEH",
        "Kitas", "KWF", "LHW", "MPC", "Pfefferwerk/WAB", "RAS_Zubehör", "RBB", "RBB_SSP",
        "Tau13", "ukb", "UKB Lager"
      ]
    },
    {
      id: 'cat-service',
      name: 'Service',
      items: [
        "Akku Service", "Brandt, Service, B DI 446E", "Dallmann, Service",
        "Koplin, Service, B DI 243", "Lavrenz, Service", "Stöwhaas,Service",
        "Trittel, Service", "UKB Service", "Wartungsklebchen"
      ]
    }
  ];

  // Migration helper: convert old flat string[] from localStorage to LagerortCategory[]
  const migrateFlatToCategories = (flat: string[]): LagerortCategory[] => {
    const serviceKeywords = ['service', 'wartungsklebchen'];
    const serviceItems: string[] = [];
    const objekteItems: string[] = [];
    flat.forEach(item => {
      if (serviceKeywords.some(kw => item.toLowerCase().includes(kw))) {
        serviceItems.push(item);
      } else {
        objekteItems.push(item);
      }
    });
    return [
      { id: 'cat-objekte', name: 'Objekte', items: objekteItems },
      { id: 'cat-service', name: 'Service', items: serviceItems }
    ];
  };

  const [lagerortCategories, setLagerortCategories] = useState<LagerortCategory[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lagerortCategories');
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      }
      // Migrate from old flat format if it exists
      const oldFlat = localStorage.getItem('lagerortOptions');
      if (oldFlat) {
        try {
          const flat: string[] = JSON.parse(oldFlat);
          if (Array.isArray(flat) && flat.length > 0 && typeof flat[0] === 'string') {
            const migrated = migrateFlatToCategories(flat);
            localStorage.setItem('lagerortCategories', JSON.stringify(migrated));
            localStorage.removeItem('lagerortOptions'); // Clean up old key
            return migrated;
          }
        } catch { /* fall through */ }
      }
    }
    return DEFAULT_LAGERORT_CATEGORIES;
  });

  // Flat helper — used by components that still need a simple string[]
  const lagerortOptionsFlat = lagerortCategories.flatMap(c => c.items);

  const handleSetLagerortCategories = (cats: LagerortCategory[]) => {
    setLagerortCategories(cats);
    localStorage.setItem('lagerortCategories', JSON.stringify(cats));
  };

  // Data State
  const [inventory, setInventory] = useState<StockItem[]>(MOCK_ITEMS);
  const [receiptHeaders, setReceiptHeaders] = useState<ReceiptHeader[]>(MOCK_RECEIPT_HEADERS);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>(MOCK_RECEIPT_ITEMS);
  const [comments, setComments] = useState<ReceiptComment[]>(MOCK_COMMENTS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
  const [receiptMasters, setReceiptMasters] = useState<ReceiptMaster[]>(MOCK_RECEIPT_MASTERS);

  // Ticket State (Case Management)
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);

  // API Loading State
  const [isLoading, setIsLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // K14 Fix: Write-cooldown prevents sync polling from overwriting optimistic updates
  const lastWriteTimestampRef = useRef<number>(0);
  const markWrite = () => { lastWriteTimestampRef.current = Date.now(); };

  // Ref mirror of pending write count — accessible in sync without stale closure
  const pendingWritesRef = useRef<number>(0);

  // Logging State
  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stockLogs');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Restore Date objects from ISO strings
          return parsed.map((log: any) => ({ ...log, timestamp: new Date(log.timestamp) }));
        } catch { /* corrupted data, start fresh */ }
      }
    }
    return [];
  });
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auditTrail');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const addAudit = (event: string, details: Record<string, any>) => {
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      event,
      user: currentUser?.displayName || 'Unknown',
      timestamp: Date.now(),
      ip: '192.168.1.xxx',
      details
    };
    setAuditTrail(prev => {
      const next = [entry, ...prev].slice(0, 500);
      localStorage.setItem('auditTrail', JSON.stringify(next));
      return next;
    });
  };

  // Transient State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [goodsReceiptMode, setGoodsReceiptMode] = useState<'standard' | 'return' | 'problem'>('standard');
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);

  // Toggle Theme
  const toggleTheme = () => setTheme(prev => {
    const next = prev === 'light' ? 'soft' : prev === 'soft' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    return next;
  });

  useEffect(() => {
    addAudit('User Login', { device: navigator.userAgent.substring(0, 80), screen: `${window.innerWidth}x${window.innerHeight}` });
  }, []);

  // Fetch data from API on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        // If online with queued writes, flush them FIRST so the API has our latest data
        if (navigator.onLine) {
          const queueCount = await getQueueCount();
          if (queueCount > 0) {
            console.info(`[App] Flushing ${queueCount} queued writes before loading data…`);
            await flushQueue();
          }
        }

        const result = await loadAllData();
        if (cancelled) return;

        if (result) {
          const { data, source } = result;
          setApiConnected(source === 'api');
          setDataSource(source);

          // Stock → inventory
          if (data.stock.length > 0) {
            setInventory(data.stock);
          }

          // Orders
          if (data.orders.length > 0) {
            setPurchaseOrders(data.orders);
          }

          // Receipts — split by docType
          if (data.receipts.length > 0) {
            const masters = data.receipts.filter((r: any) => r.docType === 'master');
            const headers = data.receipts.filter((r: any) => r.docType === 'header');
            const items = data.receipts.filter((r: any) => r.docType === 'item');
            const receiptComments = data.receipts.filter((r: any) => r.docType === 'comment');

            if (masters.length > 0) setReceiptMasters(masters);
            if (headers.length > 0) setReceiptHeaders(headers);
            if (items.length > 0) setReceiptItems(items);
            if (receiptComments.length > 0) setComments(receiptComments);
          }

          // Tickets
          if (data.tickets.length > 0) {
            setTickets(data.tickets);
          }

          if (source === 'cache') {
            console.info('[App] Running from cached data — writes will queue when offline support is complete');
          }
        } else {
          setDataSource('mock');
        }
      } catch (err) {
        console.warn('Failed to load from API, using local data:', err);
        setDataSource('mock');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();

    // Shared sync function — reusable for visibility + polling
    const syncFromApi = () => {
      if (cancelled) return;

      // GUARD 1: Never sync when offline — cache contains stale data that would overwrite optimistic UI
      if (!navigator.onLine) {
        console.debug('[Sync] Skipped — device is offline');
        return;
      }

      // GUARD 2: Skip if pending writes exist — local state is ahead of both API and cache
      if (pendingWritesRef.current > 0) {
        console.debug('[Sync] Skipped — pending writes in queue:', pendingWritesRef.current);
        return;
      }

      // GUARD 3: K14 cooldown — skip if a local write happened within last 15 seconds
      if (Date.now() - lastWriteTimestampRef.current < 15000) {
        console.debug('[Sync] Skipped — write cooldown active');
        return;
      }

      loadAllData().then(result => {
        if (cancelled || !result) return;
        const { data, source } = result;

        // GUARD 4: Only overwrite state from live API, never from stale cache
        if (source !== 'api') {
          console.debug('[Sync] Skipped state update — source is', source, '(not live API)');
          setApiConnected(false);
          setDataSource(source);
          return;
        }

        setApiConnected(true);
        setDataSource('api');
        if (data.stock.length > 0) setInventory(data.stock);
        if (data.orders.length > 0) setPurchaseOrders(data.orders);
        if (data.receipts.length > 0) {
          const masters = data.receipts.filter((r: any) => r.docType === 'master');
          const headers = data.receipts.filter((r: any) => r.docType === 'header');
          const items = data.receipts.filter((r: any) => r.docType === 'item');
          const receiptComments = data.receipts.filter((r: any) => r.docType === 'comment');
          if (masters.length > 0) setReceiptMasters(masters);
          if (headers.length > 0) setReceiptHeaders(headers);
          if (items.length > 0) setReceiptItems(items);
          if (receiptComments.length > 0) setComments(receiptComments);
        }
        if (data.tickets.length > 0) setTickets(data.tickets);
      }).catch(console.warn);
    };

    // Re-fetch when user returns to tab/PWA (only if online)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) syncFromApi();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Poll every 10s while tab is visible for near-real-time sync
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') syncFromApi();
    }, 60000);

    return () => { cancelled = true; document.removeEventListener('visibilitychange', handleVisibility); clearInterval(pollInterval); };
  }, []);

  // Step 5b: Offline write queue — flush when back online, track pending count
  useEffect(() => {
    // Subscribe to queue count changes (for UI badge + sync guard ref)
    const unsubscribe = onQueueChange(count => {
      setPendingWrites(count);
      pendingWritesRef.current = count;
    });

    // Flush queue when browser comes back online
    const handleOnline = () => {
      console.info('[Queue] Online detected — flushing write queue');
      flushQueue().catch(console.warn);
    };
    window.addEventListener('online', handleOnline);

    // Also flush when user returns to tab (catches cases where 'online' event was missed)
    const handleVisibilityFlush = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        flushQueue().catch(console.warn);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityFlush);

    // Initial flush attempt on mount (in case there are queued writes from last session)
    if (navigator.onLine) {
      flushQueue().catch(console.warn);
    }

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityFlush);
    };
  }, []);

  useEffect(() => {
    // Clean up class list
    document.documentElement.classList.remove('dark', 'soft');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'soft') {
      document.documentElement.classList.add('soft');
    }
  }, [theme]);

  // Real-time online/offline detection — updates indicator immediately
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Sidebar Handler
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

  const handleSetEnableSmartImport = (enabled: boolean) => {
    setEnableSmartImport(enabled);
    localStorage.setItem('enableSmartImport', String(enabled));
  };

  const handleSetStatusColumnFirst = (val: boolean) => {
    setStatusColumnFirst(val);
    localStorage.setItem('statusColumnFirst', String(val));
  };

  // Ticket Config Handler
  const handleSetTicketConfig = (newConfig: TicketConfig) => {
    setTicketConfig(newConfig);
    localStorage.setItem('ticketConfig', JSON.stringify(newConfig));
  };

  const handleSetTimelineConfig = (config: TimelineConfig) => {
    setTimelineConfig(config);
    localStorage.setItem('timelineConfig', JSON.stringify(config));
  };

  // Module → featureAccess key mapping (null = always accessible)
  const MODULE_FEATURE_MAP: Record<string, string | null> = {
    'dashboard': null,
    'inventory': 'stock',
    'stock-logs': 'stock',
    'order-management': 'orders',
    'create-order': 'orders',
    'receipt-management': 'receipts',
    'goods-receipt': 'receipts',
    'suppliers': 'suppliers',
    'settings': null,
    'documentation': null,
    'global-settings': 'global-settings',
    'team-management': null, // Admin-only enforced by UI, but guard added below
    'debug': null,
  };

  const userHasAccess = (module: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const requiredFeature = MODULE_FEATURE_MAP[module];
    if (requiredFeature === null || requiredFeature === undefined) return true;
    return (currentUser.featureAccess || []).includes(requiredFeature);
  };

  // Navigation Handler (Resets Transient State)
  const handleNavigation = (module: ActiveModule) => {
    // Guard: Block navigation to modules the user cannot access
    if (!userHasAccess(module)) {
      console.warn(`[Nav] Blocked: user lacks access to "${module}"`);
      return;
    }

    // Logic: If clicking the active module again, force a reset/remount
    if (activeModule === module) {
      setViewKey(prev => prev + 1);
    } else {
      setActiveModule(module);
    }

    if (module !== 'create-order') setOrderToEdit(null);
    if (module !== 'goods-receipt') {
      setSelectedPoId(null);
      setGoodsReceiptMode('standard'); // Reset mode on exit
    }
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

    setStockLogs(prev => {
      const next = [newLog, ...prev].slice(0, 500); // Cap at 500 entries
      localStorage.setItem('stockLogs', JSON.stringify(next));
      return next;
    });
  };

  const handleStockUpdate = (id: string, newLevel: number) => {
    markWrite(); // K14: Prevent sync overwrite
    setInventory(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, stockLevel: newLevel, lastUpdated: Date.now() } : item);
      // API write-through
      const changedItem = updated.find(i => i.id === id);
      if (changedItem) stockApi.upsert(changedItem).catch(console.warn);
      return updated;
    });
  };

  const handleUpdateItem = (updatedItem: StockItem) => {
    markWrite(); // K14: Prevent sync overwrite
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    stockApi.upsert(updatedItem).catch(console.warn);
  };

  const handleCreateItem = (newItem: StockItem) => {
    setInventory(prev => [newItem, ...prev]);
    stockApi.upsert(newItem).catch(console.warn);
  };

  const handleAddStock = () => {
    handleNavigation('goods-receipt');
  };

  const handleReceiptStatusUpdate = (batchId: string, newStatus: string) => {
    markWrite(); // K14: Prevent sync overwrite
    const oldHeader = receiptHeaders.find(h => h.batchId === batchId);
    addAudit('Status Changed', { receiptId: batchId, po: oldHeader?.bestellNr || '-', oldStatus: oldHeader?.status || '-', newStatus });
    setReceiptHeaders(prev => prev.map(h => h.batchId === batchId ? { ...h, status: newStatus } : h));

    // When manually closing (Abgeschlossen), propagate to master + PO
    if (newStatus === 'Abgeschlossen') {
      const header = receiptHeaders.find(h => h.batchId === batchId);
      if (header?.bestellNr) {
        const poId = header.bestellNr;
        const master = receiptMasters.find(m => m.poId === poId);
        const wasPreReceipt = master?.status === 'Wartet auf Lieferung' || master?.status === 'Lieferung morgen' || master?.status === 'Lieferung heute' || master?.status === 'Verspätet';

        if (wasPreReceipt) {
          // PRE-RECEIPT CANCEL: No goods were received — reset PO to Offen
          setReceiptMasters(prev => prev.map(m => m.poId === poId ? { ...m, status: 'Abgeschlossen' as ReceiptMasterStatus } : m));
          setPurchaseOrders(prev => prev.map(po => {
            if (po.id !== poId) return po;
            let nextStatus = po.status;
            if (po.status !== 'Projekt' && po.status !== 'Lager') {
              nextStatus = 'Offen';
            }
            return { ...po, status: nextStatus, linkedReceiptId: undefined, isForceClosed: false };
          }));
        } else {
          // NORMAL CLOSE: Actual inspection happened — mark as Abgeschlossen
          setReceiptMasters(prev => prev.map(m => m.poId === poId ? { ...m, status: 'Abgeschlossen' as ReceiptMasterStatus } : m));
          setPurchaseOrders(prev => prev.map(po => {
            if (po.id !== poId) return po;
            let nextStatus = po.status;
            if (po.status !== 'Projekt' && po.status !== 'Lager') {
              nextStatus = 'Abgeschlossen';
            }
            return { ...po, status: nextStatus, isForceClosed: true };
          }));
        }
        // API write-through — persist master + PO
        const updMaster = receiptMasters.find(m => m.poId === poId);
        if (updMaster) receiptsApi.upsert({ ...updMaster, status: 'Abgeschlossen', docType: 'master' }).catch(console.warn);
        const updPO = purchaseOrders.find(p => p.id === poId);
        if (updPO) ordersApi.upsert({ ...updPO, status: wasPreReceipt ? 'Offen' : 'Abgeschlossen' }).catch(console.warn);
      }
    }
    // API write-through — persist header status change
    const updHeader = receiptHeaders.find(h => h.batchId === batchId);
    if (updHeader) receiptsApi.upsert({ ...updHeader, id: batchId, status: newStatus, docType: 'header', poId: updHeader.bestellNr || batchId }).catch(console.warn);
  };

  const handleAddComment = (batchId: string, type: 'note' | 'email' | 'call', message: string) => {
    addAudit('Comment Added', { receiptId: batchId, type, messagePreview: message.substring(0, 60) });
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
    // API write-through — receipts container needs docType + poId
    const header = receiptHeaders.find(h => h.batchId === batchId);
    receiptsApi.upsert({ ...newComment, docType: 'comment', poId: header?.bestellNr || batchId }).catch(console.warn);
  };

  const handleAddTicket = (ticket: Ticket) => {
    addAudit('Ticket Created', { ticketId: ticket.id, subject: ticket.subject, priority: ticket.priority, receiptId: ticket.receiptId });
    setTickets(prev => [...prev, ticket]);
    // API write-through — tickets container partition key is /poId
    // Fallback chain: header lookup → selectedPoId (set before goods receipt) → empty
    const header = receiptHeaders.find(h => h.batchId === ticket.receiptId);
    const resolvedPoId = header?.bestellNr || selectedPoId || '';
    ticketsApi.upsert({ ...ticket, poId: resolvedPoId }).catch(console.warn);
  };

  const handleUpdateTicket = (ticket: Ticket) => {
    const old = tickets.find(t => t.id === ticket.id);
    if (old && old.status !== ticket.status) {
      addAudit('Ticket Status Changed', { ticketId: ticket.id, subject: ticket.subject, oldStatus: old.status, newStatus: ticket.status });
    }
    setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
    // API write-through
    const header = receiptHeaders.find(h => h.batchId === ticket.receiptId);
    ticketsApi.upsert({ ...ticket, poId: header?.bestellNr || '' }).catch(console.warn);
  };

  const handleCreateOrder = (order: PurchaseOrder) => {
    markWrite(); // K14: Prevent sync overwrite
    const exists = purchaseOrders.some(o => o.id === order.id);
    addAudit(exists ? 'Order Updated' : 'Order Created', { po: order.id, supplier: order.supplier, itemCount: order.items.length, status: order.status });

    // --- AUTO-CREATE RECEIPT on NEW order ---
    if (!exists) {
      const batchId = `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timestamp = Date.now();
      const poId = order.id;

      // Compute date-aware status
      const dateBadge = getDeliveryDateBadge(order.expectedDeliveryDate, 'Offen');
      const receiptStatus: string = dateBadge || 'Wartet auf Lieferung';

      const newHeader: ReceiptHeader = {
        batchId,
        lieferscheinNr: 'Ausstehend',
        bestellNr: poId,
        lieferdatum: new Date().toISOString().split('T')[0],
        lieferant: order.supplier,
        status: receiptStatus,
        timestamp,
        itemCount: 0,
        warehouseLocation: 'Wareneingang',
        createdByName: 'Admin User'
      };
      setReceiptHeaders(prev => [newHeader, ...prev]);

      const initialDelivery: DeliveryLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        lieferscheinNr: 'Ausstehend',
        items: order.items.filter(i => !i.isDeleted).map(i => ({
          sku: i.sku,
          receivedQty: 0,
          quantityAccepted: 0,
          quantityRejected: 0,
          damageFlag: false,
          manualAddFlag: false,
          orderedQty: i.quantityExpected,
          previousReceived: 0,
          offen: i.quantityExpected,
          zuViel: 0
        }))
      };

      const newMaster = {
        id: `RM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        poId,
        status: receiptStatus as ReceiptMasterStatus,
        deliveries: [initialDelivery]
      };
      setReceiptMasters(prev => [...prev, newMaster]);

      // API write-through — persist new receipt header + master
      receiptsApi.upsert({ ...newHeader, id: batchId, docType: 'header', poId }).catch(console.warn);
      receiptsApi.upsert({ ...newMaster, docType: 'master' }).catch(console.warn);

      // Link receipt to PO
      order = { ...order, linkedReceiptId: batchId };
    }

    // --- RECALCULATE RECEIPT STATUS + CASCADE SUPPLIER on EDIT ---
    if (exists) {
      // Always cascade supplier name to linked receipt headers (fixes "-" supplier bug)
      setReceiptHeaders(prev => {
        const updated = prev.map(h => h.bestellNr === order.id ? { ...h, lieferant: order.supplier } : h);
        // API write-through for updated headers
        updated.filter(h => h.bestellNr === order.id).forEach(h => {
          receiptsApi.upsert({ ...h, id: h.batchId, docType: 'header', poId: order.id }).catch(console.warn);
        });
        return updated;
      });

      const linkedMaster = receiptMasters.find(m => m.poId === order.id);
      if (linkedMaster) {
        const currentStatus = linkedMaster.status;
        const isPreReceiptStatus = ['Wartet auf Lieferung', 'Lieferung morgen', 'Lieferung heute', 'Verspätet'].includes(currentStatus);
        if (isPreReceiptStatus) {
          const dateBadge = getDeliveryDateBadge(order.expectedDeliveryDate, 'Offen');
          const newStatus: string = dateBadge || 'Wartet auf Lieferung';
          setReceiptMasters(prev => prev.map(m => m.poId === order.id ? { ...m, status: newStatus as ReceiptMasterStatus } : m));
          // Status already cascaded in setReceiptHeaders above, but update status too
          setReceiptHeaders(prev => prev.map(h => h.bestellNr === order.id ? { ...h, status: newStatus } : h));
        }
      }
    }

    setPurchaseOrders(prev => {
      if (exists) {
        return prev.map(o => o.id === order.id ? order : o);
      }
      return [order, ...prev];
    });
    // API write-through — persist order
    ordersApi.upsert(order).catch(console.warn);
    // If edit changed receipt master status, persist that too
    if (exists) {
      const updatedMaster = receiptMasters.find(m => m.poId === order.id);
      if (updatedMaster) receiptsApi.upsert({ ...updatedMaster, docType: 'master' }).catch(console.warn);
    }
  };

  const handleUpdateOrder = (updatedOrder: PurchaseOrder) => {
    markWrite(); // K14: Prevent sync overwrite
    setPurchaseOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    ordersApi.upsert(updatedOrder).catch(console.warn);
  };

  const handleArchiveOrder = (id: string) => {
    markWrite(); // K14: Prevent sync overwrite
    addAudit('Order Archived', { po: id });
    setPurchaseOrders(prev => prev.map(o => o.id === id ? { ...o, isArchived: true } : o));

    // CASCADE: Archive linked receipts (write directly to localStorage — state lives in ReceiptManagement)
    const poHeaders = receiptHeaders.filter(h => h.bestellNr === id);
    if (poHeaders.length > 0) {
      try {
        const saved = localStorage.getItem('archivedReceiptGroups');
        const archived: Set<string> = saved ? new Set(JSON.parse(saved)) : new Set();
        archived.add(id);
        localStorage.setItem('archivedReceiptGroups', JSON.stringify([...archived]));
      } catch (e) { /* localStorage unavailable */ }
    }

    // CASCADE: Close all linked open tickets
    const linkedBatchIds = poHeaders.map(h => h.batchId);
    if (linkedBatchIds.length > 0) {
      setTickets(prev => {
        const updated = prev.map(t => {
          if (linkedBatchIds.includes(t.receiptId) && t.status === 'Open') {
            const closed = { ...t, status: 'Closed' as const, messages: [...t.messages, { id: crypto.randomUUID(), author: 'System', text: 'Ticket automatisch geschlossen — Bestellung archiviert.', timestamp: Date.now(), type: 'system' as const }] };
            ticketsApi.upsert({ ...closed, poId: id }).catch(console.warn);
            return closed;
          }
          return t;
        });
        return updated;
      });
    }

    // API write-through — persist archived order
    const archivedOrder = purchaseOrders.find(o => o.id === id);
    if (archivedOrder) ordersApi.upsert({ ...archivedOrder, isArchived: true }).catch(console.warn);
  };

  const handleCancelOrder = (id: string) => {
    markWrite(); // K14: Prevent sync overwrite
    addAudit('Order Cancelled', { po: id });

    // 1. Cancel + auto-archive PO
    setPurchaseOrders(prev => prev.map(o => {
      if (o.id === id) {
        return { ...o, status: 'Storniert', isArchived: true };
      }
      return o;
    }));

    // 2. CASCADE: Set linked receipt to Storniert
    setReceiptMasters(prev => prev.map(m => m.poId === id ? { ...m, status: 'Abgeschlossen' as ReceiptMasterStatus } : m));
    setReceiptHeaders(prev => prev.map(h => h.bestellNr === id ? { ...h, status: 'Storniert' } : h));

    // 3. CASCADE: Auto-archive receipt (write directly to localStorage — state lives in ReceiptManagement)
    try {
      const saved = localStorage.getItem('archivedReceiptGroups');
      const archived: Set<string> = saved ? new Set(JSON.parse(saved)) : new Set();
      archived.add(id);
      localStorage.setItem('archivedReceiptGroups', JSON.stringify([...archived]));
    } catch (e) { /* localStorage unavailable */ }

    // 4. CASCADE: Close all linked tickets
    const linkedBatchIds = receiptHeaders.filter(h => h.bestellNr === id).map(h => h.batchId);
    if (linkedBatchIds.length > 0) {
      setTickets(prev => {
        const updated = prev.map(t => {
          if (linkedBatchIds.includes(t.receiptId) && t.status === 'Open') {
            const closed = { ...t, status: 'Closed' as const, messages: [...t.messages, { id: crypto.randomUUID(), author: 'System', text: 'Ticket automatisch geschlossen — Bestellung storniert.', timestamp: Date.now(), type: 'system' as const }] };
            ticketsApi.upsert({ ...closed, poId: id }).catch(console.warn);
            return closed;
          }
          return t;
        });
        return updated;
      });
    }

    // API write-through — persist cancelled order + receipt master + headers
    const cancelledOrder = purchaseOrders.find(o => o.id === id);
    if (cancelledOrder) ordersApi.upsert({ ...cancelledOrder, status: 'Storniert', isArchived: true }).catch(console.warn);
    const cancelledMaster = receiptMasters.find(m => m.poId === id);
    if (cancelledMaster) receiptsApi.upsert({ ...cancelledMaster, status: 'Abgeschlossen', docType: 'master' }).catch(console.warn);
    receiptHeaders.filter(h => h.bestellNr === id).forEach(h => {
      receiptsApi.upsert({ ...h, id: h.batchId, status: 'Storniert', docType: 'header', poId: id }).catch(console.warn);
    });
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setOrderToEdit(order);
    handleNavigation('create-order');
  };

  const handleDeliveryRefusal = (poId: string, reason: string, notes: string) => {
    // 1. Update ReceiptMaster status → Abgelehnt + store refusal data
    setReceiptMasters(prev => prev.map(m =>
      m.poId === poId ? { ...m, status: 'Abgelehnt' as const, refusalReason: reason, refusalNotes: notes, refusalDate: new Date().toISOString() } : m
    ));

    // 2. Auto-comment on all linked receipt headers
    const linkedBatchIds = receiptHeaders.filter(h => h.bestellNr === poId).map(h => h.batchId);
    const commentText = `📛 **Lieferung abgelehnt — Annahmeverweigerung**\n\n**Grund:** ${reason}${notes ? `\n**Anmerkung:** ${notes}` : ''}\n\nKeine Warenannahme erfolgt. Bestellung bleibt offen.`;
    linkedBatchIds.forEach(batchId => {
      handleAddComment(batchId, 'note', commentText);
    });

    // 3. If no receipt headers exist yet, create a system comment on a placeholder
    if (linkedBatchIds.length === 0) {
      // Create a minimal receipt header so the refusal is tracked
      const refusalBatchId = `ref-${Date.now()}`;
      const po = purchaseOrders.find(p => p.id === poId);
      const newHeader: ReceiptHeader = {
        batchId: refusalBatchId,
        lieferscheinNr: `ABGELEHNT-${new Date().toISOString().split('T')[0]}`,
        bestellNr: poId,
        lieferdatum: new Date().toISOString().split('T')[0],
        lieferant: po?.supplier || '',
        status: 'Abgelehnt',
        timestamp: Date.now(),
        itemCount: 0,
        warehouseLocation: '',
      };
      setReceiptHeaders(prev => [...prev, newHeader]);
      handleAddComment(refusalBatchId, 'note', commentText);

      // Create ReceiptMaster if none exists
      const existingMaster = receiptMasters.find(m => m.poId === poId);
      if (!existingMaster) {
        setReceiptMasters(prev => [...prev, {
          id: `rm-${Date.now()}`,
          poId,
          status: 'Abgelehnt' as const,
          deliveries: [],
          refusalReason: reason,
          refusalNotes: notes,
          refusalDate: new Date().toISOString(),
        }]);
      }
    }

    // 4. Auto-ticket (if ticket automation configured for rejections)
    if (ticketConfig.autoCreateOnRejection) {
      const ticket: Ticket = {
        id: `t-${Date.now()}`,
        receiptId: linkedBatchIds[0] || `ref-${Date.now()}`,
        subject: `Annahmeverweigerung — ${poId}`,
        status: 'Open',
        priority: 'High',
        messages: [{
          id: crypto.randomUUID(),
          author: 'System',
          text: `Lieferung für Bestellung ${poId} wurde abgelehnt.\n\n**Grund:** ${reason}${notes ? `\n**Anmerkung:** ${notes}` : ''}`,
          timestamp: Date.now(),
          type: 'system',
        }],
      };
      handleAddTicket(ticket);
    }

    // 5. Audit trail
    addAudit('Delivery Refused', { po: poId, reason, notes: notes || '—' });

    // API write-through — persist refused master
    const refusedMaster = receiptMasters.find(m => m.poId === poId);
    if (refusedMaster) receiptsApi.upsert({ ...refusedMaster, status: 'Abgelehnt', refusalReason: reason, refusalNotes: notes, refusalDate: new Date().toISOString(), docType: 'master' }).catch(console.warn);

    // 6. Navigate back
    handleNavigation('receipt-management');
  };

  const handleReceiveGoods = (poId: string, mode: 'standard' | 'return' | 'problem' = 'standard') => {
    if (mode === 'problem') {
      addAudit('Reinspection Started', { po: poId, reason: 'Nachträgliche Korrektur via Problem-Button' });
    }
    setSelectedPoId(poId);
    setGoodsReceiptMode(mode);
    handleNavigation('goods-receipt');
  };

  const handleReceiptSuccess = (
    headerData: Omit<ReceiptHeader, 'timestamp' | 'itemCount'>,
    cartItems: any[],
    newItemsCreated: StockItem[],
    forceClose: boolean = false // Accepts new Force Close flag
  ) => {
    // If batchId was pre-generated by GoodsReceiptFlow (for tickets), use it. Otherwise generate new.
    const batchId = (headerData as any).batchId || `b-${Date.now()}`;
    const timestamp = Date.now();

    // --- PROBLEM MODE: Cancel old delivery + reverse stock BEFORE creating new ---
    const problemCanceledQty = new Map<string, number>();
    if (goodsReceiptMode === 'problem' && headerData.bestellNr) {
      const oldPoId = headerData.bestellNr;
      const oldMaster = receiptMasters.find(m => m.poId === oldPoId);
      if (oldMaster && oldMaster.deliveries.length > 0) {
        // Find the latest non-storniert delivery
        const lastDelivery = [...oldMaster.deliveries].reverse().find(d => !d.isStorniert);
        if (lastDelivery) {
          // 1. Reverse stock from old delivery
          const linkedPO = purchaseOrders.find(p => p.id === oldPoId);
          const isProject = linkedPO?.status === 'Projekt';
          if (!isProject) {
            setInventory(prev => {
              const copy = [...prev];
              lastDelivery.items.forEach(oldItem => {
                const idx = copy.findIndex(i => i.sku === oldItem.sku);
                if (idx >= 0) {
                  copy[idx] = { ...copy[idx], stockLevel: Math.max(0, copy[idx].stockLevel - oldItem.quantityAccepted), lastUpdated: timestamp };
                  handleLogStock(copy[idx].id, copy[idx].name, 'remove', oldItem.quantityAccepted, `Storno (Korrektur) — ${lastDelivery.lieferscheinNr}`, 'po-normal');
                }
              });
              return copy;
            });
          }
          // 2. Reverse PO quantityReceived
          setPurchaseOrders(prev => prev.map(po => {
            if (po.id !== oldPoId) return po;
            return {
              ...po, items: po.items.map(pItem => {
                const oldLine = lastDelivery.items.find(d => d.sku === pItem.sku);
                if (oldLine) return { ...pItem, quantityReceived: Math.max(0, pItem.quantityReceived - oldLine.quantityAccepted) };
                return pItem;
              })
            };
          }));
          // 3. Mark old delivery as storniert
          setReceiptMasters(prev => prev.map(m => {
            if (m.poId !== oldPoId) return m;
            return { ...m, deliveries: m.deliveries.map(d => d.id === lastDelivery.id ? { ...d, isStorniert: true } : d) };
          }));
          // 4. Mark old receipt header as Storniert
          const oldHeader = receiptHeaders.find(h => h.lieferscheinNr === lastDelivery.lieferscheinNr && h.bestellNr === oldPoId);
          if (oldHeader) {
            setReceiptHeaders(prev => prev.map(h => h.batchId === oldHeader.batchId ? { ...h, status: 'Storniert' } : h));
            addAudit('Receipt Nullified', { oldReceiptId: oldHeader.batchId, newReceiptId: batchId, po: oldPoId, oldLieferschein: lastDelivery.lieferscheinNr, reason: 'Nachträgliche Korrektur via Problem-Button', canceledItems: lastDelivery.items.map(i => ({ sku: i.sku, qtyReversed: i.quantityAccepted })) });
          }
          // 5. Build local map of canceled quantities (avoids stale React state)
          lastDelivery.items.forEach(oldItem => {
            problemCanceledQty.set(oldItem.sku, oldItem.quantityAccepted);
          });
        }
      }
      // Reset mode after handling
      setGoodsReceiptMode('standard');
    }

    // Determine Context & Log Type
    let isProject = false;
    let logContext: 'po-normal' | 'po-project' = 'po-normal';

    if (headerData.bestellNr) {
      const linkedPO = purchaseOrders.find(p => p.id === headerData.bestellNr);
      if (linkedPO && linkedPO.status === 'Projekt') {
        isProject = true;
        logContext = 'po-project';
      }
    }

    if (newItemsCreated.length > 0) {
      setInventory(prev => [...prev, ...newItemsCreated]);
    }

    // --- 0. PERFORM LOGGING (MOVED HERE FOR CORRECT CONTEXT) ---
    cartItems.forEach(cartItem => {
      const qtyToAdd = cartItem.qtyAccepted ?? cartItem.qty;
      if (qtyToAdd !== 0) {
        const action = qtyToAdd > 0 ? 'add' : 'remove';
        handleLogStock(
          cartItem.item.id,
          cartItem.item.name,
          action,
          Math.abs(qtyToAdd),
          `Wareneingang ${headerData.lieferscheinNr}`,
          logContext
        );
      }
    });

    // --- 1. UPDATE STOCK INVENTORY (ACCEPTED QTY ONLY) ---
    setInventory(prev => {
      const copy = [...prev];
      cartItems.forEach(cartItem => {
        if (!isProject) {
          const idx = copy.findIndex(i => i.id === cartItem.item.id);
          if (idx >= 0) {
            const qtyToAdd = cartItem.qtyAccepted ?? cartItem.qty;
            copy[idx] = {
              ...copy[idx],
              stockLevel: copy[idx].stockLevel + qtyToAdd,
              lastUpdated: timestamp,
              warehouseLocation: cartItem.location
            };
            stockApi.upsert(copy[idx]).catch(console.warn);
          }
        }
      });
      return copy;
    });

    // --- 2. UPDATE PO STATUS & RECEIPT MASTER (HISTORY) ---
    // Safety Net: Default to 'Gebucht' if status comes in empty
    let finalReceiptStatus = headerData.status || 'Gebucht';

    // Detect quality issues from actual cart data (overrides empty/stale status)
    const cartHasDamage = cartItems.some((c: any) => c.qtyDamaged > 0);
    const cartHasWrong = cartItems.some((c: any) => c.qtyWrong > 0);
    const cartAllRejected = cartItems.length > 0 && cartItems.every((c: any) => c.qtyRejected === c.qtyReceived && c.qtyReceived > 0);
    if (cartAllRejected) finalReceiptStatus = 'Abgelehnt';
    else if (cartHasDamage && cartHasWrong) finalReceiptStatus = 'Schaden + Falsch';
    else if (cartHasDamage) finalReceiptStatus = 'Schaden';
    else if (cartHasWrong) finalReceiptStatus = 'Falsch geliefert';

    if (headerData.bestellNr) {
      const poId = headerData.bestellNr;
      const currentPO = purchaseOrders.find(p => p.id === poId);

      // --- NEW STATUS CALCULATION (PARTIAL vs COMPLETED) ---
      if (currentPO) {
        let totalOrdered = 0;
        let totalReceivedIncludingCurrent = 0;

        currentPO.items.forEach(item => {
          totalOrdered += item.quantityExpected;

          // History from PO state
          let itemTotal = item.quantityReceived;

          // Add Current Accepted Amount (not yet in PO state)
          const cartLine = cartItems.find(c => c.item.sku === item.sku);
          if (cartLine) {
            itemTotal += (cartLine.qtyAccepted ?? cartLine.qty);
          }

          totalReceivedIncludingCurrent += itemTotal;
        });

        // Apply Logic: Only override if it's not already a critical error status
        const isErrorStatus = ['Abgelehnt', 'Schaden', 'Schaden + Falsch', 'Falsch geliefert', 'Beschädigt', 'Übermenge'].includes(finalReceiptStatus);

        if (!isErrorStatus) {
          if (forceClose) {
            // FORCE CLOSE: Treat as 'Gebucht' regardless of math
            finalReceiptStatus = 'Gebucht';
          } else if (totalReceivedIncludingCurrent > totalOrdered) {
            finalReceiptStatus = 'Übermenge';
          } else if (totalReceivedIncludingCurrent < totalOrdered) {
            // If we received less than total ordered, it is Partial.
            finalReceiptStatus = 'Teillieferung';
          } else {
            // Exact match
            finalReceiptStatus = 'Gebucht';
          }
        }
      }
      // -----------------------------------------------------------

      setPurchaseOrders(prev => prev.map(po => {
        if (po.id !== poId) return po;

        const updatedItems = po.items.map(pItem => {
          const receivedLine = cartItems.find(c => c.item.sku === pItem.sku);
          if (receivedLine) {
            const qtyToAdd = receivedLine.qtyAccepted ?? receivedLine.qty;
            return { ...pItem, quantityReceived: Math.max(0, pItem.quantityReceived + qtyToAdd) };
          }
          return pItem;
        });

        // Logic Checks for PO STATUS (Distinct from Receipt Status)
        const allReceived = updatedItems.every(i => i.quantityReceived >= i.quantityExpected);
        const partiallyReceived = updatedItems.some(i => i.quantityReceived > 0);

        // GUARD CLAUSE: Protect Identity Statuses (Projekt/Lager)
        // If Force Close is true, we force completion unless it's a special type.
        let nextStatus = po.status;
        if (po.status !== 'Projekt' && po.status !== 'Lager') {
          if (forceClose) {
            nextStatus = 'Abgeschlossen';
          } else {
            nextStatus = allReceived ? 'Abgeschlossen' : partiallyReceived ? 'Teilweise geliefert' : 'Offen';
          }
        }

        const updatedPO = {
          ...po,
          items: updatedItems,
          status: nextStatus,
          linkedReceiptId: batchId,
          isForceClosed: forceClose || po.isForceClosed // Persist force close state
        };
        ordersApi.upsert(updatedPO).catch(console.warn);
        return updatedPO;
      }));

      // --- 3. CREATE RECEIPT MASTER & DELIVERY LOG ---
      setReceiptMasters(prev => {
        const existingMaster = prev.find(m => m.poId === poId);
        const newDeliveryLog: DeliveryLog = {
          id: crypto.randomUUID(),
          date: new Date(timestamp).toISOString(),
          lieferscheinNr: headerData.lieferscheinNr,
          items: cartItems.map(c => {
            const poItem = currentPO?.items.find(pi => pi.sku === c.item.sku);
            const ordered = poItem ? poItem.quantityExpected : 0;
            const rawPrevious = poItem ? poItem.quantityReceived : 0;
            // In problem mode, subtract canceled qty (React state is stale)
            const previous = rawPrevious - (problemCanceledQty.get(c.item.sku) || 0);

            // Stats for Snapshot
            const currentAccepted = c.qtyAccepted ?? c.qty;
            const totalAccepted = previous + currentAccepted;

            const offen = Math.max(0, ordered - totalAccepted);
            const zuViel = Math.max(0, totalAccepted - ordered);

            return {
              sku: c.item.sku,
              receivedQty: c.qtyReceived, // Total Physical Count
              quantityAccepted: c.qtyAccepted, // Good Stock
              quantityRejected: c.qtyRejected, // Returned/Bad

              // New Logistics Fields
              rejectionReason: c.rejectionReason,
              returnCarrier: c.returnCarrier,
              returnTrackingId: c.returnTrackingId,
              notes: c.rejectionNotes || undefined,

              damageFlag: (c.qtyDamaged || 0) > 0,
              manualAddFlag: !c.orderedQty,
              orderedQty: ordered,
              previousReceived: previous,
              offen: offen,
              zuViel: zuViel
            };
          })
        };

        if (existingMaster) {
          const updatedMaster = {
            ...existingMaster,
            status: finalReceiptStatus as ReceiptMasterStatus,
            deliveries: [...existingMaster.deliveries, newDeliveryLog]
          };
          receiptsApi.upsert({ ...updatedMaster, docType: 'master' }).catch(console.warn);
          return prev.map(m => m.id === existingMaster.id ? updatedMaster : m);
        } else {
          const newMaster = {
            id: crypto.randomUUID(),
            poId,
            status: finalReceiptStatus as ReceiptMasterStatus,
            deliveries: [newDeliveryLog]
          };
          receiptsApi.upsert({ ...newMaster, docType: 'master' }).catch(console.warn);
          return [...prev, newMaster];
        }
      });
    }

    // --- 4. CREATE RECEIPT HEADER & ITEMS ---
    const newHeader: ReceiptHeader = {
      ...headerData,
      status: finalReceiptStatus, // Persist the calculated status
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
      quantity: c.qtyAccepted ?? c.qty, // Record only what was accepted into stock for the simple view
      targetLocation: c.location,
      isDamaged: (c.qtyDamaged || 0) > 0,
      issueNotes: c.rejectionNotes || ''
    }));
    setReceiptItems(prev => [...prev, ...newReceiptItems]);

    // --- 4b. AUTO-POST TO TIMELINE (Historie & Notizen) ---
    {
      const tlc = timelineConfig;
      const autoMessages: string[] = [];
      const poId = headerData.bestellNr;

      cartItems.forEach((c: any) => {
        const lbl = `${c.item?.name || c.name} (${c.item?.sku || c.sku})`;
        const qtyDamaged = c.qtyDamaged || 0;
        const qtyWrong = c.qtyWrong || 0;
        const qtyRejected = c.quantityRejected || c.qtyRejected || 0;
        const notes = c.rejectionNotes || c.issueNotes || '';

        if (tlc.damage && qtyDamaged > 0) {
          autoMessages.push(`⚠️ Beschädigung: ${lbl}\n   ${qtyDamaged}x beschädigt${notes ? ` — ${notes}` : ''}`);
        }
        if (tlc.wrong && qtyWrong > 0) {
          autoMessages.push(`🚫 Falschlieferung: ${lbl}\n   ${qtyWrong}x falscher Artikel${notes ? ` — ${notes}` : ''}`);
        }
        if (tlc.rejected && qtyRejected > 0 && qtyDamaged === 0 && qtyWrong === 0) {
          autoMessages.push(`❌ Ablehnung: ${lbl}\n   ${qtyRejected}x abgelehnt${notes ? ` — ${notes}` : ''}`);
        }
      });

      // Check for shortage (missing)
      if (tlc.missing && poId) {
        const linkedPO = purchaseOrders.find(p => p.id === poId);
        const master = receiptMasters.find(m => m.poId === poId);
        if (linkedPO) {
          linkedPO.items.forEach(poItem => {
            let hist = 0;
            if (master) master.deliveries.forEach(d => { const di = d.items.find((x: any) => x.sku === poItem.sku); if (di) hist += di.quantityAccepted; });
            const ci = cartItems.find((c: any) => (c.item?.sku || c.sku) === poItem.sku);
            const thisDelivery = ci ? (ci.qtyAccepted ?? ci.qty ?? 0) : 0;
            const total = hist + thisDelivery;
            const offen = poItem.quantityExpected - total;
            if (offen > 0) {
              autoMessages.push(`📦 Fehlmenge: ${poItem.name || poItem.sku} (${poItem.sku})\n   Bestellt: ${poItem.quantityExpected}, Gesamt erhalten: ${total}, Offen: ${offen}`);
            }
          });
        }
      }

      // Check for overdelivery (extra)
      if (tlc.extra && poId) {
        const linkedPO = purchaseOrders.find(p => p.id === poId);
        const master = receiptMasters.find(m => m.poId === poId);
        if (linkedPO) {
          linkedPO.items.forEach(poItem => {
            let hist = 0;
            if (master) master.deliveries.forEach(d => { const di = d.items.find((x: any) => x.sku === poItem.sku); if (di) hist += di.quantityAccepted; });
            const ci = cartItems.find((c: any) => (c.item?.sku || c.sku) === poItem.sku);
            const thisDelivery = ci ? (ci.qtyAccepted ?? ci.qty ?? 0) : 0;
            const total = hist + thisDelivery;
            const zuViel = total - poItem.quantityExpected;
            if (zuViel > 0) {
              autoMessages.push(`📈 Übermenge: ${poItem.name || poItem.sku} (${poItem.sku})\n   Bestellt: ${poItem.quantityExpected}, Gesamt erhalten: ${total}, Zu viel: ${zuViel}`);
            }
          });
        }
      }

      if (autoMessages.length > 0) {
        // Group messages by type for cleaner formatting
        const damageLines = autoMessages.filter(m => m.startsWith('⚠️'));
        const wrongLines = autoMessages.filter(m => m.startsWith('🚫'));
        const shortageLines = autoMessages.filter(m => m.startsWith('📦 Fehlmenge'));
        const overLines = autoMessages.filter(m => m.startsWith('📈'));
        const otherLines = autoMessages.filter(m => !m.startsWith('⚠️') && !m.startsWith('🚫') && !m.startsWith('📦 Fehlmenge') && !m.startsWith('📈'));

        const sections: string[] = [];
        if (damageLines.length > 0) sections.push(`── Beschädigungen ──\n${damageLines.join('\n')}`);
        if (wrongLines.length > 0) sections.push(`── Falschlieferungen ──\n${wrongLines.join('\n')}`);
        if (shortageLines.length > 0) sections.push(`── Fehlmengen ──\n${shortageLines.map(l => l.replace('📦 Fehlmenge: ', '📦 ')).join('\n')}`);
        if (overLines.length > 0) sections.push(`── Übermengen ──\n${overLines.join('\n')}`);
        if (otherLines.length > 0) sections.push(otherLines.join('\n'));

        const autoComment: ReceiptComment = {
          id: `auto-${crypto.randomUUID()}`,
          batchId,
          userId: 'system',
          userName: 'System',
          timestamp: Date.now(),
          type: 'note',
          message: `📋 Automatische Prüfmeldung\n\n${sections.join('\n\n')}`
        };
        setComments(prev => [autoComment, ...prev]);
        // API write-through — persist auto-comment
        receiptsApi.upsert({ ...autoComment, docType: 'comment', poId: headerData.bestellNr || batchId }).catch(console.warn);
      }
    }

    // --- 5. AUTO-UPDATE TICKETS FOR RETURNS ---
    if (cartItems.some(c => c.quantityRejected > 0) && headerData.bestellNr) {
      const poId = headerData.bestellNr;
      const returnItems = cartItems.filter(c => c.quantityRejected > 0);

      const reasonMap: Record<string, string> = { 'Damaged': 'Beschädigung', 'Wrong': 'Falschlieferung', 'Overdelivery': 'Übermenge', 'Other': 'Sonstiges' };

      // Rich formatted return message (matching quality issue style)
      const returnItemDetails = returnItems.map(c => {
        const reason = reasonMap[c.rejectionReason] || c.rejectionReason || 'Sonstiges';
        return `**${c.item.name}** (${c.item.sku})\n   Menge: ${c.quantityRejected} Stk\n   Grund: ${reason}${c.rejectionNotes ? `\n   Notiz: ${c.rejectionNotes}` : ''}${c.returnCarrier ? `\n   Versand: ${c.returnCarrier}${c.returnTrackingId ? ` (${c.returnTrackingId})` : ''}` : ''}`;
      });

      const richReturnMsg = `📦 Rücksendung erfasst\n\n**Bestellnummer:** ${poId}\n**Lieferant:** ${headerData.lieferant}\n**Lieferschein:** ${headerData.lieferscheinNr}\n**Datum:** ${headerData.lieferdatum.split('-').reverse().join('.')}\n\n── Rücksendepositionen ──\n${returnItemDetails.join('\n\n')}\n\nGesamt: ${returnItems.reduce((s, c) => s + c.quantityRejected, 0)} Stk zurückgesendet`;

      // Post auto-comment in Historie & Notizen
      const returnAutoComment: ReceiptComment = {
        id: `auto-ret-${crypto.randomUUID()}`,
        batchId,
        userId: 'system',
        userName: 'System',
        timestamp: Date.now() + 50,
        type: 'note',
        message: richReturnMsg
      };
      setComments(prev => [returnAutoComment, ...prev]);
      receiptsApi.upsert({ ...returnAutoComment, docType: 'comment', poId }).catch(console.warn);

      // Post rich update to all open tickets for this PO
      setTickets(prevTickets => prevTickets.map(ticket => {
        if (ticket.status !== 'Open') return ticket;

        let isMatch = false;
        if (ticket.receiptId === batchId) {
          isMatch = true;
        } else {
          const tHeader = receiptHeaders.find(h => h.batchId === ticket.receiptId);
          if (tHeader && tHeader.bestellNr === poId) {
            isMatch = true;
          }
        }

        if (isMatch) {
          return {
            ...ticket,
            messages: [...ticket.messages, {
              id: crypto.randomUUID(),
              author: 'System',
              text: `📦 Rücksendung verarbeitet\n\n${returnItems.map(c => `**${c.item.name}:** ${c.quantityRejected} Stk zurückgesendet (${reasonMap[c.rejectionReason] || 'Sonstiges'})`).join('\n')}${returnItems.some(c => c.returnCarrier) ? `\n\n── Versanddetails ──\n${returnItems.filter(c => c.returnCarrier).map(c => `${c.item.name}: ${c.returnCarrier}${c.returnTrackingId ? ` (${c.returnTrackingId})` : ''}`).join('\n')}` : ''}`,
              timestamp: Date.now() + 100,
              type: 'system' as const
            }]
          };
        }
        return ticket;
      }));
    }

    // --- 6. SIMULATE NOTIFICATION FOR PROJECT COMPLETION ---
    if (isProject && finalReceiptStatus === 'Gebucht') {
      console.log(`[M365 Mock] Sending email to 'technik-verteiler@dost.de': "Wareneingang für Projekt ${headerData.bestellNr} abgeschlossen. Bereit zur Abholung."`);
      // Visual feedback via setTimeout to allow state to settle or simple alert
      setTimeout(() => {
        alert("📧 Automatische E-Mail an das Technik-Team gesendet (Abholbereit).");
      }, 500);
    }

    addAudit('Receipt Confirmed', { receiptId: batchId, po: headerData.bestellNr || '-', lieferschein: headerData.lieferscheinNr, status: finalReceiptStatus, itemCount: cartItems.length, isProject });

    // --- API WRITE-THROUGH (header + items + new stock items) ---
    const apiPoId = headerData.bestellNr || batchId;
    const apiDocs: any[] = [];
    apiDocs.push({ ...newHeader, id: batchId, docType: 'header', poId: apiPoId });
    newReceiptItems.forEach(ri => apiDocs.push({ ...ri, docType: 'item', poId: apiPoId }));
    receiptsApi.bulkUpsert(apiDocs).catch(console.warn);

    // Persist any brand-new stock items created during receipt
    newItemsCreated.forEach(ni => stockApi.upsert(ni).catch(console.warn));

    handleNavigation('receipt-management');
  };

  const handleRevertReceipt = (batchId: string) => {
    const header = receiptHeaders.find(h => h.batchId === batchId);
    if (!header) return;
    addAudit('Receipt Reverted', { receiptId: batchId, po: header.bestellNr || '-', lieferschein: header.lieferscheinNr });

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

        // GUARD CLAUSE: Protect Identity Statuses (Projekt/Lager) upon Revert
        let nextStatus = po.status;
        if (po.status !== 'Projekt' && po.status !== 'Lager') {
          nextStatus = anyReceived ? 'Teilweise geliefert' : 'Offen';
        }

        const updatedPO = {
          ...po,
          items: newItems,
          status: nextStatus
        };
        ordersApi.upsert(updatedPO).catch(console.warn);
        return updatedPO;
      }));
    }

    // API write-through — persist return data
    setTimeout(() => {
      receiptsApi.upsert({ ...header, id: batchId, status: 'In Prüfung', docType: 'header', poId: poId || batchId }).catch(console.warn);
      if (linkedPO) {
        const updPO = purchaseOrders.find(p => p.id === linkedPO.id);
        if (updPO) ordersApi.upsert(updPO).catch(console.warn);
      }
      // Persist reverted stock items
      itemsToRevert.forEach(rItem => {
        const item = inventory.find(i => i.sku === rItem.sku);
        if (item) stockApi.upsert(item).catch(console.warn);
      });
    }, 100);
  };



  // --- DIRECT RETURN PROCESSING (No wizard) ---
  const handleProcessReturn = (poId: string, data: { quantity: number; reason: string; carrier: string; trackingId: string }) => {
    markWrite(); // K14: Prevent sync overwrite
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    addAudit('Return Processed', { po: poId, quantity: data.quantity, reason: data.reason, carrier: data.carrier || '-', trackingId: data.trackingId || '-' });

    const master = receiptMasters.find(m => m.poId === poId);
    if (!master) return;

    const batchId = `b-ret-${Date.now()}`;
    const timestamp = Date.now();
    const d = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const lieferscheinNr = `RÜCK-${d}`;
    const isProject = po.status === 'Projekt';

    // Distribute return quantity across items with overdelivery
    let remaining = data.quantity;
    const returnLines: Array<{ sku: string; name: string; qty: number }> = [];

    po.items.forEach(poItem => {
      if (remaining <= 0) return;
      let totalAccepted = 0;
      master.deliveries.forEach(del => {
        const di = del.items.find(x => x.sku === poItem.sku);
        if (di) totalAccepted += di.quantityAccepted;
      });
      const overQty = Math.max(0, totalAccepted - poItem.quantityExpected);
      if (overQty > 0) {
        const returnQty = Math.min(overQty, remaining);
        returnLines.push({ sku: poItem.sku, name: poItem.name, qty: returnQty });
        remaining -= returnQty;
      }
    });

    // Fallback: if no overdelivery items found, apply to first item
    if (returnLines.length === 0 && po.items.length > 0) {
      returnLines.push({ sku: po.items[0].sku, name: po.items[0].name, qty: data.quantity });
    }

    if (returnLines.length === 0) return;

    // 1. Stock adjustment (subtract returned qty)
    if (!isProject) {
      setInventory(prev => {
        const copy = [...prev];
        returnLines.forEach(rl => {
          const idx = copy.findIndex(i => i.sku === rl.sku);
          if (idx >= 0) {
            copy[idx] = { ...copy[idx], stockLevel: Math.max(0, copy[idx].stockLevel - rl.qty), lastUpdated: timestamp };
            stockApi.upsert(copy[idx]).catch(console.warn);
          }
        });
        return copy;
      });
    }

    // 2. Log stock removals
    returnLines.forEach(rl => {
      const item = inventory.find(i => i.sku === rl.sku);
      if (item) {
        handleLogStock(item.id, item.name, 'remove', rl.qty, `Rücksendung ${lieferscheinNr}`, isProject ? 'po-project' : 'po-normal');
      }
    });

    // 3. Update PO items (decrease quantityReceived) + recalc status
    setPurchaseOrders(prev => prev.map(p => {
      if (p.id !== poId) return p;
      const updatedItems = p.items.map(pItem => {
        const rl = returnLines.find(r => r.sku === pItem.sku);
        if (rl) return { ...pItem, quantityReceived: Math.max(0, pItem.quantityReceived - rl.qty) };
        return pItem;
      });
      let nextStatus = p.status;
      if (p.status !== 'Projekt' && p.status !== 'Lager') {
        const allReceived = updatedItems.every(i => i.quantityReceived >= i.quantityExpected);
        const anyReceived = updatedItems.some(i => i.quantityReceived > 0);
        nextStatus = allReceived ? 'Abgeschlossen' : anyReceived ? 'Teilweise geliefert' : 'Offen';
      }
      const updatedPO = { ...p, items: updatedItems, status: nextStatus };
      // API write-through — persist PO update inline (avoids stale closure)
      ordersApi.upsert(updatedPO).catch(console.warn);
      return updatedPO;
    }));

    // 4. Create receipt header for the return
    const newHeader: ReceiptHeader = {
      batchId,
      lieferscheinNr,
      bestellNr: poId,
      lieferdatum: new Date().toISOString().split('T')[0],
      lieferant: po.supplier,
      status: 'Rücklieferung',
      timestamp,
      itemCount: returnLines.length,
      warehouseLocation: 'Rücksendung',
      createdByName: 'Admin User'
    };
    setReceiptHeaders(prev => [newHeader, ...prev]);

    // 5. Create receipt items (negative qty to show as return)
    const newReceiptItems: ReceiptItem[] = returnLines.map((rl, idx) => ({
      id: `ri-${batchId}-${idx}`,
      batchId,
      sku: rl.sku,
      name: rl.name,
      quantity: -rl.qty,
      targetLocation: 'Rücksendung',
      isDamaged: data.reason === 'Schaden',
      issueNotes: `Rücksendung: ${data.reason}${data.carrier ? ` via ${data.carrier}` : ''}${data.trackingId ? ` (${data.trackingId})` : ''}`
    }));
    setReceiptItems(prev => [...prev, ...newReceiptItems]);

    // 6. Update ReceiptMaster: add return delivery log + recalc master status
    const mapReason = (r: string): 'Damaged' | 'Wrong' | 'Overdelivery' | 'Other' => {
      if (r === 'Schaden') return 'Damaged';
      if (r === 'Falsch geliefert') return 'Wrong';
      if (r === 'Übermenge') return 'Overdelivery';
      return 'Other';
    };

    setReceiptMasters(prev => {
      const existing = prev.find(m => m.poId === poId);
      if (!existing) return prev;

      const deliveryLog: DeliveryLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        lieferscheinNr,
        items: returnLines.map(rl => ({
          sku: rl.sku,
          receivedQty: 0,
          quantityAccepted: 0,
          quantityRejected: rl.qty,
          rejectionReason: mapReason(data.reason),
          returnCarrier: data.carrier,
          returnTrackingId: data.trackingId,
          damageFlag: data.reason === 'Schaden',
          manualAddFlag: false,
          orderedQty: po.items.find(pi => pi.sku === rl.sku)?.quantityExpected || 0,
          previousReceived: po.items.find(pi => pi.sku === rl.sku)?.quantityReceived || 0,
          offen: 0,
          zuViel: 0
        }))
      };

      // Recalculate effective totals after the return
      let totalOrdered = 0;
      let totalEffective = 0;
      po.items.forEach(pi => {
        totalOrdered += pi.quantityExpected;
        let accepted = 0;
        existing.deliveries.forEach(del => {
          const di = del.items.find(x => x.sku === pi.sku);
          if (di) accepted += di.quantityAccepted;
        });
        const rl = returnLines.find(r => r.sku === pi.sku);
        totalEffective += accepted - (rl ? rl.qty : 0);
      });

      let newStatus: ReceiptMasterStatus = totalEffective >= totalOrdered ? 'Gebucht'
        : totalEffective > 0 ? 'Teillieferung'
          : 'Offen';

      const updatedMaster = {
        ...existing,
        status: newStatus,
        deliveries: [...existing.deliveries, deliveryLog]
      };
      receiptsApi.upsert({ ...updatedMaster, docType: 'master' }).catch(console.warn);
      return prev.map(m => m.id === existing.id ? updatedMaster : m);
    });

    // 7. Auto-comment in Historie & Notizen (rich format matching quality issues)
    const returnItemDetails = returnLines.map(rl =>
      `**${rl.name}** (${rl.sku})\n   Menge: ${rl.qty} Stk\n   Grund: ${data.reason}${data.carrier ? `\n   Versand: ${data.carrier}${data.trackingId ? ` (${data.trackingId})` : ''}` : ''}`
    );

    const returnCommentText = `📦 Rücksendung erfasst\n\n**Bestellnummer:** ${poId}\n**Lieferant:** ${po.supplier}\n**Lieferschein:** ${lieferscheinNr}\n**Datum:** ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}\n\n── Rücksendepositionen ──\n${returnItemDetails.join('\n\n')}\n\nGesamt: ${returnLines.reduce((s, r) => s + r.qty, 0)} Stk zurückgesendet`;

    // Post return comment to the RETURN receipt (batchId from step 4)
    const returnComment: ReceiptComment = {
      id: `auto-ret-${crypto.randomUUID()}`,
      batchId,
      userId: 'system',
      userName: 'System',
      timestamp: Date.now(),
      type: 'note',
      message: returnCommentText
    };
    setComments(prev => [returnComment, ...prev]);
    receiptsApi.upsert({ ...returnComment, docType: 'comment', poId }).catch(console.warn);

    // Also post to the original receipt so it appears in both Historie views
    const originalHeader = receiptHeaders.find(h => h.bestellNr === poId && h.batchId !== batchId);
    if (originalHeader) {
      const originalComment: ReceiptComment = {
        id: `auto-ret-orig-${crypto.randomUUID()}`,
        batchId: originalHeader.batchId,
        userId: 'system',
        userName: 'System',
        timestamp: Date.now() + 1,
        type: 'note',
        message: returnCommentText
      };
      setComments(prev => [originalComment, ...prev]);
      receiptsApi.upsert({ ...originalComment, docType: 'comment', poId }).catch(console.warn);
    }

    // 8. Post return update to existing open tickets for this PO (no new ticket created)
    setTickets(prevTickets => prevTickets.map(ticket => {
      if (ticket.status !== 'Open') return ticket;
      const tHeader = receiptHeaders.find(h => h.batchId === ticket.receiptId);
      if (tHeader && tHeader.bestellNr === poId) {
        const updated = {
          ...ticket,
          messages: [...ticket.messages, {
            id: crypto.randomUUID(),
            author: 'System',
            text: `📦 Rücksendung verarbeitet\n\n${returnLines.map(rl => `**${rl.name}:** ${rl.qty} Stk zurückgesendet (${data.reason})`).join('\n')}${data.carrier ? `\n\n**Versand:** ${data.carrier}${data.trackingId ? ` (${data.trackingId})` : ''}` : ''}`,
            timestamp: Date.now() + 100,
            type: 'system' as const
          }]
        };
        ticketsApi.upsert({ ...updated, poId }).catch(console.warn);
        return updated;
      }
      return ticket;
    }));

    // API write-through — persist return header + items (local vars, no stale closure)
    const apiDocs: any[] = [
      { ...newHeader, id: batchId, docType: 'header', poId },
      ...newReceiptItems.map(ri => ({ ...ri, docType: 'item', poId }))
    ];
    receiptsApi.bulkUpsert(apiDocs).catch(console.warn);
    // Master, PO, and stock are now persisted inline in their respective setState callbacks above
  };

  // --- Auth Gate: Show login page if not authenticated ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0077B5] to-[#00A0DC] flex items-center justify-center shadow-xl animate-pulse">
            <svg className="text-white w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16Z" />
              <path d="M3.27 6.96L12 12.01l8.73-5.05" />
              <path d="M12 22.08V12" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">Lade DOST Lager…</p>
        </div>
      </div>
    );
  }

  if (!currentUser || authError === 'ACCOUNT_DEACTIVATED') {
    return (
      <LoginPage
        error={authError === 'ACCOUNT_DEACTIVATED' ? 'Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Administrator.' : authError}
        isOffline={!navigator.onLine}
      />
    );
  }

  if (authError === 'NOT_PROVISIONED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg className="text-white w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Zugang ausstehend</h1>
          <p className="text-sm text-slate-400 mb-6">
            Ihr Microsoft-Konto (<span className="text-slate-300 font-medium">{currentUser.userDetails}</span>) wurde noch nicht für DOST Lager freigeschaltet. Bitte kontaktieren Sie Ihren Administrator.
          </p>
          <button
            onClick={() => { window.location.href = '/.auth/logout?post_logout_redirect_uri=/'; }}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            Abmelden
          </button>
          <div className="mt-8 flex items-center justify-center gap-1.5">
            <span className="font-black italic text-[#0077B5] text-xs tracking-tighter">DOST</span>
            <span className="font-black italic text-[#E2001A] text-xs tracking-tighter">INFOSYS</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a] text-slate-100' :
        theme === 'soft' ? 'theme-soft bg-[#E8EDF0] text-[#2C3E47]' :
          'bg-[#f8fafc] text-slate-900'
        }`}>

        <Sidebar
          theme={theme}
          activeModule={activeModule}
          onNavigate={handleNavigation}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
        />

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 lg:ml-[68px]">
          <Header
            theme={theme}
            toggleTheme={toggleTheme}
            totalItems={inventory.length}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            dataSource={dataSource}
            pendingWrites={pendingWrites}
            isOnline={isOnline}
          />

          <div className={`flex-1 ${activeModule === 'create-order' || activeModule === 'goods-receipt' ? 'overflow-hidden' : 'overflow-y-auto p-4 pb-24 md:p-6 lg:p-8 lg:pb-8 scroll-smooth'}`}>
            <div className={`mx-auto h-full ${activeModule === 'create-order' || activeModule === 'goods-receipt' ? '' : 'max-w-[1600px]'}`}>

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
                  currentUser={currentUser}
                />
              )}

              {activeModule === 'inventory' && (
                <InventoryView
                  key={viewKey}
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
                  key={viewKey}
                  logs={stockLogs}
                  onBack={() => handleNavigation('dashboard')}
                  theme={theme}
                />
              )}

              {activeModule === 'goods-receipt' && (
                <GoodsReceiptFlow
                  theme={theme}
                  existingItems={inventory}
                  onClose={() => handleNavigation('receipt-management')}
                  onSuccess={handleReceiptSuccess}
                  lagerortOptions={lagerortOptionsFlat}
                  onUpdateLagerortOptions={(opts: string[]) => {
                    // When GoodsReceiptFlow adds a new lagerort, append to first category
                    const newItems = opts.filter(o => !lagerortOptionsFlat.includes(o));
                    if (newItems.length > 0) {
                      const updated = lagerortCategories.map((cat, idx) =>
                        idx === 0 ? { ...cat, items: [...cat.items, ...newItems] } : cat
                      );
                      handleSetLagerortCategories(updated);
                    }
                  }}
                  lagerortCategories={lagerortCategories}
                  // onLogStock removed to prevent double logging - handled in onSuccess
                  purchaseOrders={purchaseOrders}
                  initialPoId={selectedPoId}
                  initialMode={goodsReceiptMode} // Pass mode prop
                  receiptMasters={receiptMasters}
                  ticketConfig={ticketConfig}
                  onAddTicket={handleAddTicket}
                  onRefuseDelivery={handleDeliveryRefusal}
                />
              )}

              {activeModule === 'receipt-management' && (
                <ReceiptManagement
                  key={viewKey}
                  headers={receiptHeaders}
                  items={receiptItems}
                  comments={comments}
                  tickets={tickets}
                  purchaseOrders={purchaseOrders}
                  receiptMasters={receiptMasters}
                  stockItems={inventory}
                  theme={theme}
                  onUpdateStatus={handleReceiptStatusUpdate}
                  onAddComment={handleAddComment}
                  onAddTicket={handleAddTicket}
                  onUpdateTicket={handleUpdateTicket}
                  onReceiveGoods={handleReceiveGoods}
                  onNavigate={handleNavigation}
                  onRevertReceipt={handleRevertReceipt}
                  onProcessReturn={handleProcessReturn}
                  onInspect={(po, mode) => handleReceiveGoods(po.id, mode as 'standard' | 'return' | 'problem')} // Pass mode to handler
                  statusColumnFirst={statusColumnFirst}
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
                  enableSmartImport={enableSmartImport}
                  existingOrderIds={purchaseOrders.map(o => o.id)}
                />
              )}

              {activeModule === 'order-management' && (
                <OrderManagement
                  key={viewKey}
                  orders={purchaseOrders}
                  theme={theme}
                  onArchive={handleArchiveOrder}
                  onEdit={handleEditOrder}
                  onReceiveGoods={handleReceiveGoods}
                  onCancelOrder={handleCancelOrder}
                  onUpdateOrder={handleUpdateOrder}
                  receiptMasters={receiptMasters}
                  onNavigate={handleNavigation}
                  tickets={tickets}
                  statusColumnFirst={statusColumnFirst}
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
                  onSetTheme={(t) => { setTheme(t); localStorage.setItem('theme', t); }}
                  onNavigate={handleNavigation}
                  onUploadData={(newItems) => setInventory(newItems)}
                  onClearData={() => setInventory(MOCK_ITEMS)}
                  hasCustomData={inventory !== MOCK_ITEMS}
                  inventoryViewMode={inventoryViewMode}
                  onSetInventoryViewMode={handleSetInventoryViewMode}
                  currentUser={currentUser}
                />
              )}



              {activeModule === 'global-settings' && (
                <GlobalSettingsPage
                  theme={theme}
                  onNavigate={handleNavigation}
                  statusColumnFirst={statusColumnFirst}
                  onSetStatusColumnFirst={handleSetStatusColumnFirst}
                  enableSmartImport={enableSmartImport}
                  onSetEnableSmartImport={handleSetEnableSmartImport}
                  requireDeliveryDate={requireDeliveryDate}
                  onSetRequireDeliveryDate={handleSetRequireDeliveryDate}
                  ticketConfig={ticketConfig}
                  onSetTicketConfig={handleSetTicketConfig}
                  timelineConfig={timelineConfig}
                  onSetTimelineConfig={handleSetTimelineConfig}
                  auditTrail={auditTrail}
                  lagerortCategories={lagerortCategories}
                  onSetLagerortCategories={handleSetLagerortCategories}
                />
              )}

              {activeModule === 'team-management' && currentUser && (
                <TeamManagement
                  theme={theme}
                  currentUser={currentUser}
                  onNavigate={handleNavigation}
                  addAudit={addAudit}
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

        {/* Mobile Bottom Navigation — hidden during full-screen flows or scroll-down */}
        <BottomNav
          theme={theme}
          activeModule={activeModule}
          onNavigate={handleNavigation}
          hidden={activeModule === 'create-order' || activeModule === 'goods-receipt' || bottomNavHidden}
          currentUser={currentUser}
        />
      </div>
    </ErrorBoundary>
  );
}