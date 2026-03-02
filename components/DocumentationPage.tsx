import React, { useState } from 'react';
import { Theme } from '../types';
import {
  ArrowLeft, Book, Database, Layout, GitBranch, ArrowRight,
  CheckCircle2, AlertTriangle, Box, Calculator, FileText, Truck,
  LogOut, RefreshCw, Briefcase, Ban, Info, Globe, Shield, Settings,
  Package, ClipboardList, Search, BarChart3, Users, Ticket, Eye,
  Sparkles, Calendar, Lock, History, Layers, ChevronDown, ChevronUp,
  Star, Zap, Hash, MapPin, AlertCircle, XCircle, PlusCircle,
  Cloud, CloudOff, WifiOff, Server, HardDrive, Wifi
} from 'lucide-react';

interface DocumentationPageProps {
  theme: Theme;
  onBack: () => void;
}

type DocSection = 'intro' | 'modules' | 'orders' | 'receipt' | 'datamodel' | 'logic' | 'statuses' | 'settings' | 'cloud' | 'offline';
type Lang = 'de' | 'en';

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ theme, onBack }) => {
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<DocSection>('intro');
  const [lang, setLang] = useState<Lang>('de');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const t = (de: string, en: string) => lang === 'de' ? de : en;

  // ── Section Config ──
  const sections: { id: DocSection; label: string; icon: React.ReactNode }[] = [
    { id: 'intro', label: t('Übersicht', 'Overview'), icon: <Layout size={16} /> },
    { id: 'cloud', label: t('Cloud & API', 'Cloud & API'), icon: <Cloud size={16} /> },
    { id: 'offline', label: t('Offline & Sync', 'Offline & Sync'), icon: <WifiOff size={16} /> },
    { id: 'modules', label: t('Module', 'Modules'), icon: <Layers size={16} /> },
    { id: 'orders', label: t('Bestellungen', 'Orders'), icon: <FileText size={16} /> },
    { id: 'receipt', label: t('Wareneingang', 'Goods Receipt'), icon: <ClipboardList size={16} /> },
    { id: 'datamodel', label: t('Daten-Modell', 'Data Model'), icon: <Database size={16} /> },
    { id: 'logic', label: t('Geschäftslogik', 'Business Logic'), icon: <Calculator size={16} /> },
    { id: 'statuses', label: t('Status System', 'Status System'), icon: <GitBranch size={16} /> },
    { id: 'settings', label: t('Einstellungen', 'Settings'), icon: <Settings size={16} /> },
  ];

  // ── Reusable Components ──

  const DocCard = ({ title, icon, children, id }: { title: string; icon: React.ReactNode; children: React.ReactNode; id?: string }) => (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-3 p-4 md:p-5">
        <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-slate-800 text-[#0077B5]' : 'bg-blue-50 text-[#0077B5]'}`}>
          {icon}
        </div>
        <h3 className={`font-bold text-base md:text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
      </div>
      <div className={`px-4 pb-4 md:px-5 md:pb-5 text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {children}
      </div>
    </div>
  );

  const Collapsible = ({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) => {
    const isExpanded = expandedCards.has(id);
    return (
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button
          onClick={() => toggleCard(id)}
          className={`w-full flex items-center gap-3 p-4 md:p-5 text-left transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-slate-800 text-[#0077B5]' : 'bg-blue-50 text-[#0077B5]'}`}>{icon}</div>
          <h3 className={`font-bold text-sm md:text-base flex-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
          {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>
        {isExpanded && (
          <div className={`px-4 pb-4 md:px-5 md:pb-5 text-sm leading-relaxed border-t ${isDark ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-100'}`}>
            <div className="pt-3">{children}</div>
          </div>
        )}
      </div>
    );
  };

  const InfoBox = ({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warn' }) => {
    const color = variant === 'warn'
      ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
      : isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800';
    const IconEl = variant === 'warn' ? AlertTriangle : Info;
    return (
      <div className={`rounded-xl border p-3 md:p-4 flex items-start gap-3 text-xs leading-relaxed ${color}`}>
        <IconEl size={16} className="shrink-0 mt-0.5" />
        <div>{children}</div>
      </div>
    );
  };

  const TechBadge = ({ label }: { label: string }) => (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{label}</span>
  );

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* ── PAGE HEADER ── */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-sm font-bold mb-4 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <ArrowLeft size={16} /> {t('Zurück zu Einstellungen', 'Back to Settings')}
        </button>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#0077B5]/20' : 'bg-[#0077B5]/10'}`}>
              <Book size={28} className="text-[#0077B5]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('App Dokumentation', 'App Documentation')}</h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('Architektur, Module, Datenmodell & Geschäftslogik', 'Architecture, Modules, Data Model & Business Logic')}
              </p>
            </div>
          </div>
          <div className={`flex p-0.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <button onClick={() => setLang('de')} className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${lang === 'de' ? (isDark ? 'bg-slate-600 text-white' : 'bg-white text-slate-800 shadow-sm') : 'opacity-50'}`}>DE</button>
            <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${lang === 'en' ? (isDark ? 'bg-slate-600 text-white' : 'bg-white text-slate-800 shadow-sm') : 'opacity-50'}`}>EN</button>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible scrollbar-hide">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${activeSection === s.id
                  ? 'bg-[#0077B5] text-white shadow-md'
                  : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: OVERVIEW
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'intro' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Systemarchitektur', 'System Architecture')}</h2>
            <p className={`text-sm md:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t(
                'DOST Lager ist eine Progressive Web App (PWA) für den gesamten Procure-to-Pay-Prozess — von der Bestellanlage über den Wareneingang bis zur Reklamation und Lieferantenbewertung. Die App läuft auf Azure Static Web Apps mit einem Azure Functions v4 API-Backend und Azure Cosmos DB als Datenbank.',
                'DOST Lager is a Progressive Web App (PWA) for the entire Procure-to-Pay process — from order creation through goods receipt to complaints management and supplier scoring. The app runs on Azure Static Web Apps with an Azure Functions v4 API backend and Azure Cosmos DB as the database.'
              )}
            </p>
          </div>

          <DocCard title="Tech Stack" icon={<Zap size={20} />}>
            <div className="space-y-3">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Frontend</p>
                <div className="flex flex-wrap gap-2">
                  <TechBadge label="React 19" /><TechBadge label="TypeScript" /><TechBadge label="Tailwind CSS" />
                  <TechBadge label="Vite" /><TechBadge label="Lucide Icons" /><TechBadge label="jsPDF" />
                </div>
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Backend & Infrastructure</p>
                <div className="flex flex-wrap gap-2">
                  <TechBadge label="Azure Static Web Apps" /><TechBadge label="Azure Functions v4" />
                  <TechBadge label="Azure Cosmos DB (NoSQL)" /><TechBadge label="Node.js 20" />
                </div>
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Offline & Storage</p>
                <div className="flex flex-wrap gap-2">
                  <TechBadge label="IndexedDB" /><TechBadge label="Service Worker" />
                  <TechBadge label="localStorage" /><TechBadge label="PWA Manifest" />
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs mt-4">
              <div className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>App.tsx:</strong> {t('Zentraler State-Container mit ~40 Handlern. Hält Orders, Inventory, ReceiptMasters, Tickets, StockLogs. Alle Schreibvorgänge sind optimistisch (UI sofort) + API write-through (Cosmos DB im Hintergrund).', 'Central state container with ~40 handlers. Holds Orders, Inventory, ReceiptMasters, Tickets, StockLogs. All writes are optimistic (instant UI) + API write-through (Cosmos DB in background).')}</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>api.ts:</strong> {t('REST-Client mit 3-Stufen-Fallback: API → IndexedDB Cache → Mock-Daten. Schreibfehler werden automatisch in die Offline-Queue eingereiht.', 'REST client with 3-tier fallback: API → IndexedDB cache → mock data. Write failures are automatically enqueued in the offline queue.')}</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>types.ts:</strong> {t('Definiert alle TypeScript-Interfaces für PurchaseOrder, ReceiptMaster, StockItem, Ticket, StockLog, etc.', 'Defines all TypeScript interfaces for PurchaseOrder, ReceiptMaster, StockItem, Ticket, StockLog, etc.')}</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>data.ts:</strong> {t('Mock-Datenbank (Fallback). Enthält ~800 Artikel aus SharePoint-Import, Bestellungen und Wareneingänge. Wird nur verwendet, wenn API UND Cache leer sind.', 'Mock database (fallback). Contains ~800 items from SharePoint import, orders and receipts. Only used when API AND cache are empty.')}</span></div>
            </div>
          </DocCard>

          <DocCard title={t('Design Philosophie', 'Design Philosophy')} icon={<Star size={20} />}>
            <div className="space-y-3 text-xs">
              <div><strong>Mobile First:</strong> {t('Alle Komponenten sind zuerst für Mobilgeräte entwickelt. Touch-Targets ≥ 44px. Bottom Navigation auf Mobilgeräten, CSS hover-expand Sidebar auf Desktop. Sticky Headers, Swipe-Navigation und Safe-Area-Padding.', 'All components are mobile-first. Touch targets ≥ 44px. Bottom navigation on mobile, CSS hover-expand sidebar on desktop. Sticky headers, swipe navigation and safe-area padding.')}</div>
              <div><strong>Optimistic UI:</strong> {t('Alle Benutzeraktionen aktualisieren sofort den React State. API-Schreibvorgänge laufen im Hintergrund. Bei Netzwerkfehlern werden sie automatisch in die Offline-Queue eingereiht und bei Verbindung nachsynchronisiert.', 'All user actions update React state immediately. API writes run in the background. Network failures are automatically queued and synced when back online.')}</div>
              <div><strong>3 Themes:</strong> {t('Light, Soft (Frosted Aura Farbschema — augenschonende Blaugrau-Töne) und Dark. Soft Mode verwendet einen eigenen Farbsatz (#E8EDF0, #D4DDE2, #5C7E8F) der sich deutlich vom Light Mode unterscheidet.', 'Light, Soft (Frosted Aura color scheme — eye-friendly blue-gray tones) and Dark. Soft mode uses its own distinct color palette (#E8EDF0, #D4DDE2, #5C7E8F) that clearly differs from Light mode.')}</div>
              <div><strong>Ledger Principle:</strong> {t('Daten werden nie gelöscht, nur archiviert. Jede Änderung wird im Audit Trail protokolliert. Bestands-Korrekturen werden im Lagerprotokoll (StockLog) festgehalten.', 'Data is never deleted, only archived. Every change is logged in the audit trail. Stock corrections are recorded in the stock log (StockLog).')}</div>
              <div><strong>PWA:</strong> {t('Installierbar auf iOS und Android. Service Worker cachet App-Shell und CDN-Assets für sofortiges Laden. Funktioniert offline im Lager.', 'Installable on iOS and Android. Service Worker caches app shell and CDN assets for instant loading. Works offline in the warehouse.')}</div>
            </div>
          </DocCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: CLOUD & API
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'cloud' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Cloud-Architektur & API', 'Cloud Architecture & API')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('Die App wurde von einer rein lokalen Anwendung (localStorage) zu einer Multi-User Cloud-Lösung migriert.', 'The app was migrated from a purely local application (localStorage) to a multi-user cloud solution.')}
            </p>
          </div>

          <DocCard title={t('Azure Infrastruktur', 'Azure Infrastructure')} icon={<Server size={20} />}>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2"><Cloud size={14} className="text-[#0077B5] shrink-0 mt-0.5" /><span><strong>Azure Static Web Apps:</strong> {t('Hostet das React-Frontend (Vite Build). Automatisches HTTPS, globales CDN, SPA-Routing via staticwebapp.config.json.', 'Hosts the React frontend (Vite build). Automatic HTTPS, global CDN, SPA routing via staticwebapp.config.json.')}</span></div>
              <div className="flex items-start gap-2"><Server size={14} className="text-[#0077B5] shrink-0 mt-0.5" /><span><strong>Azure Functions v4 (Node.js 20):</strong> {t('RESTful API unter /api/*. Serverless — skaliert automatisch. TypeScript mit @azure/functions v4 Programmiermodell.', 'RESTful API under /api/*. Serverless — scales automatically. TypeScript with @azure/functions v4 programming model.')}</span></div>
              <div className="flex items-start gap-2"><Database size={14} className="text-[#0077B5] shrink-0 mt-0.5" /><span><strong>Azure Cosmos DB (NoSQL):</strong> {t('5 Container mit jeweils eigener Partition Key Strategie. Free Tier (1000 RU/s geteilt). Daten persistiert als JSON-Dokumente.', '5 containers each with their own partition key strategy. Free tier (1000 RU/s shared). Data persisted as JSON documents.')}</span></div>
            </div>
          </DocCard>

          <DocCard title={t('Cosmos DB Container', 'Cosmos DB Containers')} icon={<Database size={20} />}>
            <div className="space-y-2 text-xs font-mono">
              <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div><strong>stock</strong> <span className="opacity-60">partition: /id</span></div>
                <div className="opacity-60 font-sans text-[10px]">{t('~800 Artikel (StockItem Dokumente)', '~800 items (StockItem documents)')}</div>
              </div>
              <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div><strong>orders</strong> <span className="opacity-60">partition: /id</span></div>
                <div className="opacity-60 font-sans text-[10px]">{t('PurchaseOrder Dokumente', 'PurchaseOrder documents')}</div>
              </div>
              <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div><strong>receipts</strong> <span className="opacity-60">partition: /poId</span></div>
                <div className="opacity-60 font-sans text-[10px]">{t('Multi-Typ: master, header, item, comment — unterschieden durch docType Feld', 'Multi-type: master, header, item, comment — distinguished by docType field')}</div>
              </div>
              <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div><strong>tickets</strong> <span className="opacity-60">partition: /poId</span></div>
                <div className="opacity-60 font-sans text-[10px]">{t('Reklamations-Tickets (Schäden, Fehlmengen, etc.)', 'Complaint tickets (damage, shortages, etc.)')}</div>
              </div>
              <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div><strong>delivery-logs</strong> <span className="opacity-60">partition: /poId</span></div>
                <div className="opacity-60 font-sans text-[10px]">{t('Lieferprotokolle (geplant)', 'Delivery logs (planned)')}</div>
              </div>
            </div>
          </DocCard>

          <DocCard title={t('API Endpunkte', 'API Endpoints')} icon={<Globe size={20} />}>
            <div className="space-y-1.5 text-xs font-mono">
              <div>GET /api/stock → {t('Alle Artikel', 'All items')}</div>
              <div>POST /api/stock → {t('Upsert Artikel', 'Upsert item')}</div>
              <div>GET /api/orders → {t('Alle Bestellungen', 'All orders')}</div>
              <div>POST /api/orders → {t('Upsert Bestellung', 'Upsert order')}</div>
              <div>GET /api/receipts → {t('Alle Wareneingänge', 'All receipts')}</div>
              <div>GET /api/receipts?poId=X&docType=Y → {t('Gefiltert', 'Filtered')}</div>
              <div>POST /api/receipts → {t('Upsert Dokument', 'Upsert document')}</div>
              <div>POST /api/receipts/bulk → {t('Massen-Upsert (Array)', 'Bulk upsert (Array)')}</div>
              <div>GET /api/tickets → {t('Alle Tickets', 'All tickets')}</div>
              <div>POST /api/tickets → {t('Upsert Ticket', 'Upsert ticket')}</div>
            </div>
            <div className="mt-3 text-xs">
              <strong>{t('Antwort-Bereinigung', 'Response Cleanup')}:</strong> {t('Frontend cleanDocs() entfernt Cosmos-Metadaten (_rid, _self, _etag, _attachments, _ts) aus allen API-Antworten.', 'Frontend cleanDocs() strips Cosmos metadata (_rid, _self, _etag, _attachments, _ts) from all API responses.')}
            </div>
          </DocCard>

          <DocCard title={t('Datenlade-Strategie', 'Data Loading Strategy')} icon={<RefreshCw size={20} />}>
            <div className="space-y-2 text-xs">
              <p className="font-bold">{t('Beim Start (loadAllData):', 'On startup (loadAllData):')}</p>
              <div className="flex items-start gap-2"><span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>1</span>{t('API aufrufen → bei Erfolg: Daten in IndexedDB cachen → Quelle: "api"', 'Call API → on success: cache data in IndexedDB → source: "api"')}</div>
              <div className="flex items-start gap-2"><span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>2</span>{t('API fehlgeschlagen → IndexedDB Cache lesen → Quelle: "cache"', 'API failed → read IndexedDB cache → source: "cache"')}</div>
              <div className="flex items-start gap-2"><span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>3</span>{t('Cache leer → Mock-Daten aus data.ts → Quelle: "mock"', 'Cache empty → mock data from data.ts → source: "mock"')}</div>
              <p className="mt-2"><strong>{t('Laufender Sync', 'Ongoing Sync')}:</strong> {t('Alle 10 Sekunden pollt syncFromApi() für neue Daten. Zusätzlich bei Browser-Tab-Fokus (visibilitychange Event).', 'Every 10 seconds syncFromApi() polls for new data. Also on browser tab focus (visibilitychange event).')}</p>
            </div>
          </DocCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: OFFLINE & SYNC
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'offline' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Offline-Betrieb & Synchronisation', 'Offline Operation & Synchronization')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('Die App ist für den Einsatz in unterirdischen Lagern und Bereichen ohne Mobilfunkempfang konzipiert. 4 Schichten bilden die Offline-Infrastruktur.', 'The app is designed for use in underground warehouses and areas without cellular reception. 4 layers form the offline infrastructure.')}
            </p>
          </div>

          <DocCard title={t('Schicht 1: IndexedDB Cache (Step 5a)', 'Layer 1: IndexedDB Cache (Step 5a)')} icon={<HardDrive size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Datenbank: procureflow-cache (Version 2). Object Stores: stock, orders, receipts, tickets + _meta (Sync-Zeitstempel) + _writeQueue (Offline-Schreibwarteschlange).', 'Database: procureflow-cache (version 2). Object stores: stock, orders, receipts, tickets + _meta (sync timestamps) + _writeQueue (offline write queue).')}</p>
              <p><strong>{t('Modul', 'Module')}:</strong> <TechBadge label="offlineDb.ts" /></p>
              <p>{t('Funktionen: cacheCollection(), getCachedCollection(), getCachedAppData(), cacheAllData(), clearCache(), getLastSyncTime()', 'Functions: cacheCollection(), getCachedCollection(), getCachedAppData(), cacheAllData(), clearCache(), getLastSyncTime()')}</p>
              <p>{t('Kapazität: Hunderte MB (vs. 5-10 MB bei localStorage). Asynchron — blockiert nicht den Main Thread.', 'Capacity: hundreds of MB (vs. 5-10 MB for localStorage). Asynchronous — does not block the main thread.')}</p>
            </div>
          </DocCard>

          <DocCard title={t('Schicht 2: Offline Write Queue (Step 5b)', 'Layer 2: Offline Write Queue (Step 5b)')} icon={<RefreshCw size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Wenn ein API-Schreibvorgang (POST/PUT/DELETE) wegen Netzwerkfehler fehlschlägt, wird er automatisch in die IndexedDB _writeQueue eingereiht. FIFO-Verarbeitung, max. 5 Wiederholungsversuche pro Eintrag.', 'When an API write (POST/PUT/DELETE) fails due to network error, it is automatically enqueued in the IndexedDB _writeQueue. FIFO processing, max 5 retries per entry.')}</p>
              <p><strong>{t('Modul', 'Module')}:</strong> <TechBadge label="offlineQueue.ts" /></p>
              <p><strong>{t('Flush-Auslöser', 'Flush Triggers')}:</strong></p>
              <div className="space-y-1 ml-2">
                <div className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" /><span className="font-mono">online</span> {t('Event — Browser erkennt Netzwerk wieder', 'event — browser detects network again')}</div>
                <div className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" /><span className="font-mono">visibilitychange</span> {t('Event — Benutzer kehrt zum Tab zurück', 'event — user returns to tab')}</div>
                <div className="flex items-start gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />{t('Beim App-Start (falls Einträge aus letzter Sitzung vorhanden)', 'On app startup (if entries from last session exist)')}</div>
              </div>
              <p><strong>{t('Change Listener', 'Change Listener')}:</strong> {t('onQueueChange() benachrichtigt die UI über Warteschlangen-Änderungen → pendingWrites State in App.tsx → Sync-Indikator im Header.', 'onQueueChange() notifies the UI of queue changes → pendingWrites state in App.tsx → sync indicator in header.')}</p>
            </div>
          </DocCard>

          <DocCard title={t('Schicht 3: Service Worker (Step 5c)', 'Layer 3: Service Worker (Step 5c)')} icon={<Globe size={20} />}>
            <div className="space-y-2 text-xs">
              <p><strong>{t('Modul', 'Module')}:</strong> <TechBadge label="public/sw.js" /></p>
              <p>{t('Registriert beim Laden in index.html. Pre-cached: /, /index.html, /index.css, /manifest.json.', 'Registered on load in index.html. Pre-cached: /, /index.html, /index.css, /manifest.json.')}</p>
              <p><strong>{t('Caching-Strategien', 'Caching Strategies')}:</strong></p>
              <div className="space-y-1.5 ml-2">
                <div><strong>App Shell (HTML):</strong> Stale-while-revalidate — {t('sofortige Anzeige aus Cache, Aktualisierung im Hintergrund', 'instant display from cache, background update')}</div>
                <div><strong>{t('Statische Assets', 'Static Assets')} (JS/CSS/Images):</strong> Cache-first — {t('schnelles Laden, Update bei neuer SW-Version', 'fast loading, update on new SW version')}</div>
                <div><strong>CDN (esm.sh, Google Fonts, Tailwind):</strong> Cache-first — {t('Content-hashed URLs, unveränderlich', 'content-hashed URLs, immutable')}</div>
                <div><strong>API (/api/*):</strong> Network-first — {t('Live-Daten bevorzugt, Cache als Fallback', 'live data preferred, cache as fallback')}</div>
                <div><strong>{t('Schreibvorgänge', 'Writes')} (POST/PUT/DELETE):</strong> Passthrough — {t('von offlineQueue.ts verwaltet', 'managed by offlineQueue.ts')}</div>
              </div>
              <p>{t('Cache-Versionierung: CACHE_VERSION in sw.js hochzählen bei Deploy → alte Caches werden beim Aktivieren gelöscht.', 'Cache versioning: bump CACHE_VERSION in sw.js on deploy → old caches are deleted on activation.')}</p>
            </div>
          </DocCard>

          <DocCard title={t('Schicht 4: Sync-Indikator (Step 5d)', 'Layer 4: Sync Indicator (Step 5d)')} icon={<Wifi size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Immer sichtbar im Header-Bereich. Zeigt den aktuellen Datenstatus:', 'Always visible in the header area. Shows current data status:')}</p>
              <div className="space-y-1.5 ml-2">
                <div className="flex items-center gap-2"><Cloud size={12} className="text-emerald-500" /> <strong className="text-emerald-500">{t('Verbunden', 'Connected')}</strong> — {t('Live API, alle Daten synchron', 'Live API, all data synced')}</div>
                <div className="flex items-center gap-2"><RefreshCw size={12} className="text-amber-500" /> <strong className="text-amber-500">{t('X ausstehend', 'X pending')}</strong> — {t('Verbunden, aber Schreibvorgänge in der Warteschlange', 'Connected but writes queued')}</div>
                <div className="flex items-center gap-2"><HardDrive size={12} className="text-orange-500" /> <strong className="text-orange-500">Offline</strong> — {t('Daten aus IndexedDB Cache', 'Data from IndexedDB cache')}</div>
                <div className="flex items-center gap-2"><CloudOff size={12} className="text-slate-400" /> <strong className="text-slate-400">{t('Lokal', 'Local')}</strong> — {t('Kein Cache, Mock-Daten', 'No cache, mock data')}</div>
              </div>
              <p>{t('Klick auf den Indikator öffnet ein Dropdown mit Details: Verbindungsstatus, Anzahl ausstehender Änderungen und Erklärungstext.', 'Clicking the indicator opens a dropdown with details: connection status, pending changes count and explanatory text.')}</p>
            </div>
          </DocCard>

          <InfoBox>
            {t(
              'Typischer Offline-Ablauf: Techniker geht ins Untergeschoss → App-Shell lädt aus SW-Cache → Daten laden aus IndexedDB → Wareneingang wird verarbeitet → API-Schreibvorgänge schlagen fehl → landen in der Queue → Techniker kommt zurück → "online" Event → Queue wird automatisch abgearbeitet.',
              'Typical offline flow: Technician goes underground → app shell loads from SW cache → data loads from IndexedDB → goods receipt is processed → API writes fail → land in queue → technician returns → "online" event → queue flushes automatically.'
            )}
          </InfoBox>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: MODULES
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'modules' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('App Module', 'App Modules')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('Jedes Modul ist eine eigene React-Komponente, gesteuert über activeModule State in App.tsx. Navigation über Sidebar (Desktop), Bottom Nav (Mobile) oder programmatische Aufrufe.', 'Each module is its own React component, controlled via activeModule state in App.tsx. Navigation via sidebar (desktop), bottom nav (mobile) or programmatic calls.')}
            </p>
          </div>

          <Collapsible id="mod-dashboard" title={t('Dashboard (Lager)', 'Dashboard')} icon={<BarChart3 size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Zentrale Übersicht mit 4 KPI-Karten (Command Center): Offene Bestellungen, Erwartete Lieferungen (heute/morgen), Verspätungen, Abweichungen. Quick-Actions für häufige Aufgaben. Insights-Zeile (InsightsRow) zeigt bestandskritische Highlights.', 'Central overview with 4 KPI cards (Command Center): Open orders, Expected deliveries (today/tomorrow), Delays, Deviations. Quick actions for common tasks. Insights row shows stock-critical highlights.')}</p>
              <p><strong>{t('Letzte Aktivitäten', 'Recent Activities')}:</strong> {t('Kombinierter Activity Feed aus StockLogs, Bestellungen, Wareneingängen und Tickets. Letzte 10 Einträge, sortiert nach Zeitstempel. Mobil-optimierte Kartendarstellung.', 'Combined activity feed from StockLogs, orders, receipts and tickets. Last 10 entries sorted by timestamp. Mobile-optimized card display.')}</p>
              <p><strong>{t('Komponenten', 'Components')}:</strong> <TechBadge label="Dashboard.tsx" /> <TechBadge label="InsightsRow.tsx" /></p>
            </div>
          </Collapsible>

          <Collapsible id="mod-inventory" title={t('Artikelverwaltung', 'Inventory Management')} icon={<Box size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('~800 Artikel mit Grid- und List-Ansicht. Volltextsuche über Name, SKU, System, Hersteller. Inline-Bestandskorrekturen (+/-) mit Bulk-Eingabe. Jede Änderung wird im StockLog protokolliert und an die API persistiert.', '~800 items with grid and list views. Full-text search across name, SKU, system, manufacturer. Inline stock corrections (+/-) with bulk input. Every change is logged in StockLog and persisted to the API.')}</p>
              <p><strong>{t('Features', 'Features')}:</strong> {t('Artikel erstellen, bearbeiten, duplizieren. CSV-Export. Mobile-Karten + Desktop-Tabelle. Lagerort-Feld als ComboboxSelect mit gruppierten Kategorien.', 'Create, edit, duplicate items. CSV export. Mobile cards + desktop table. Warehouse field as ComboboxSelect with grouped categories.')}</p>
              <p><strong>{t('Komponenten', 'Components')}:</strong> <TechBadge label="InventoryView.tsx" /> <TechBadge label="ItemModal.tsx" /></p>
            </div>
          </Collapsible>

          <Collapsible id="mod-orders" title={t('Bestellverwaltung', 'Order Management')} icon={<FileText size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Übersicht aller PurchaseOrders mit Filter-Tabs (Alle, Offen, Teillieferung, Abgeschlossen, Archiv). Status-Badges, Archivierung, Stornierung mit Kaskade (schließt verknüpfte Tickets, archiviert Wareneingänge).', 'Overview of all PurchaseOrders with filter tabs (All, Open, Partial, Completed, Archive). Status badges, archiving, cancellation with cascade (closes linked tickets, archives receipts).')}</p>
              <p><strong>{t('Erstellung', 'Creation')}:</strong> {t('CreateOrderWizard — Schritt-für-Schritt Wizard mit Lieferant, Artikel, Lieferdatum. Smart Import (PDF/Text → automatische Artikelerkennung). Unterstützt Lager- und Projekt-Bestellungen. Bulk-Erstellung (Sammelbestellung für mehrere Lieferanten).', 'CreateOrderWizard — step-by-step wizard with supplier, items, delivery date. Smart import (PDF/text → automatic item recognition). Supports warehouse and project orders. Bulk creation (collective order for multiple suppliers).')}</p>
              <p><strong>{t('Komponenten', 'Components')}:</strong> <TechBadge label="OrderManagement.tsx" /> <TechBadge label="CreateOrderWizard.tsx" /></p>
            </div>
          </Collapsible>

          <Collapsible id="mod-receipt" title={t('Wareneingangsverwaltung', 'Receipt Management')} icon={<ClipboardList size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Verwaltung aller Wareneingänge mit automatischer Gruppierung nach Bestellnummer. 3-Badge-Statussystem (Identität, Status, Tickets). Detail-Ansicht mit Lieferverlauf (Lieferhistorie), Positionen und Historie & Notizen (Ticket-System).', 'Management of all goods receipts with automatic grouping by order number. 3-badge status system (identity, status, tickets). Detail view with delivery history, positions and history & notes (ticket system).')}</p>
              <p><strong>{t('Retouren', 'Returns')}:</strong> {t('Vollständiger Rücksendungs-Flow mit Grund, Versandart, Tracking-Nummer. Automatische Bestandskorrektur, automatische Ticket-Erstellung, Auto-Kommentare in Historie & Notizen. Orangene LKW-Icons mit Pulse-Animation.', 'Complete return flow with reason, carrier, tracking number. Automatic stock correction, automatic ticket creation, auto-comments in history & notes. Orange truck icons with pulse animation.')}</p>
              <p><strong>{t('Komponenten', 'Components')}:</strong> <TechBadge label="ReceiptManagement.tsx" /> <TechBadge label="GoodsReceiptFlow.tsx" /> <TechBadge label="ReceiptStatusBadges.tsx" /> <TechBadge label="StatusDescription.tsx" /> <TechBadge label="TicketSystem.tsx" /></p>
            </div>
          </Collapsible>

          <Collapsible id="mod-suppliers" title={t('Lieferantenbewertung', 'Supplier Scoring')} icon={<Users size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Automatische Bewertung aller Lieferanten basierend auf Lieferhistorie: Pünktlichkeit, Qualität (Schäden, Falschlieferungen), Vollständigkeit. Score von 0-100. Abgeleitet aus ReceiptMasters und ReceiptHeaders.', 'Automatic scoring of all suppliers based on delivery history: punctuality, quality (damage, wrong deliveries), completeness. Score from 0-100. Derived from ReceiptMasters and ReceiptHeaders.')}</p>
              <p><strong>{t('Komponente', 'Component')}:</strong> <TechBadge label="SupplierView.tsx" /></p>
            </div>
          </Collapsible>

          <Collapsible id="mod-stocklog" title={t('Lagerprotokoll', 'Stock Logs')} icon={<History size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Chronologisches Protokoll aller Bestandsbewegungen. Filtert nach Zeitraum, Benutzer, Vorgang. Zeigt Quelle (Wareneingang, Manuelle Korrektur, Rücksendung) und Kontext (Normal, Projekt). Persistiert in localStorage (max. 500 Einträge).', 'Chronological log of all stock movements. Filters by period, user, action. Shows source (goods receipt, manual correction, return) and context (normal, project). Persisted in localStorage (max 500 entries).')}</p>
              <p><strong>{t('Komponente', 'Component')}:</strong> <TechBadge label="StockLogView.tsx" /></p>
            </div>
          </Collapsible>

          <Collapsible id="mod-tickets" title={t('Ticket-System (Reklamationen)', 'Ticket System (Complaints)')} icon={<Ticket size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Automatisch oder manuell erstellte Support-Fälle bei Abweichungen. Jedes Ticket ist an einen Wareneingang gebunden. Status: Open → In Progress → Resolved → Closed. Prioritäten: Low, Medium, High, Critical. Ticket-Typen: damage, shortage, excess, wrong, rejected. Konfigurierbar über Globale Einstellungen (welche Abweichungen automatisch Tickets erstellen).', 'Automatically or manually created support cases for deviations. Each ticket is linked to a goods receipt. Status: Open → In Progress → Resolved → Closed. Priorities: Low, Medium, High, Critical. Types: damage, shortage, excess, wrong, rejected. Configurable via Global Settings (which deviations auto-create tickets).')}</p>
              <p><strong>{t('Komponente', 'Component')}:</strong> <TechBadge label="TicketSystem.tsx" /> {t('(eingebettet in ReceiptManagement)', '(embedded in ReceiptManagement)')}</p>
            </div>
          </Collapsible>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: ORDERS (DETAILED)
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'orders' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Bestellungen — Detailansicht', 'Orders — Detailed View')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('Der gesamte Lebenszyklus einer Bestellung von Erstellung bis Archivierung.', 'The complete lifecycle of an order from creation to archival.')}
            </p>
          </div>

          <DocCard title={t('Bestelltypen', 'Order Types')} icon={<FileText size={20} />}>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2"><Box size={14} className="text-slate-500 shrink-0 mt-0.5" /><span><strong>Lager:</strong> {t('Standard-Lagerbestellung. Bestand wird bei Wareneingang zum Lager addiert. Status-Zyklus: Offen → Teilweise geliefert → Abgeschlossen.', 'Standard warehouse order. Stock is added to warehouse on receipt. Status cycle: Open → Partial → Completed.')}</span></div>
              <div className="flex items-start gap-2"><Briefcase size={14} className="text-blue-500 shrink-0 mt-0.5" /><span><strong>Projekt:</strong> {t('Projektbezogene Bestellung. Bestand wird NICHT zum Lager addiert (wird direkt an Projekt verbucht). Unterschiedliche Badge-Farbe (blau). Status bleibt "Projekt" bis manuell geschlossen.', 'Project-related order. Stock is NOT added to warehouse (booked directly to project). Different badge color (blue). Status stays "Projekt" until manually closed.')}</span></div>
            </div>
          </DocCard>

          <DocCard title={t('Kaskadierende Aktionen', 'Cascading Actions')} icon={<GitBranch size={20} />}>
            <div className="space-y-3 text-xs">
              <div>
                <strong>{t('Archivierung', 'Archiving')}:</strong>
                <div className="ml-4 mt-1 space-y-1">
                  <div>→ {t('Setzt isArchived: true auf PurchaseOrder', 'Sets isArchived: true on PurchaseOrder')}</div>
                  <div>→ {t('Archiviert alle verknüpften Receipt-Gruppen (via archivedReceiptGroups)', 'Archives all linked receipt groups (via archivedReceiptGroups)')}</div>
                  <div>→ {t('Schließt automatisch alle offenen Tickets mit System-Nachricht', 'Automatically closes all open tickets with system message')}</div>
                  <div>→ {t('Persistiert an Cosmos DB', 'Persists to Cosmos DB')}</div>
                </div>
              </div>
              <div>
                <strong>{t('Stornierung', 'Cancellation')}:</strong>
                <div className="ml-4 mt-1 space-y-1">
                  <div>→ {t('Status → "Storniert", isArchived: true', 'Status → "Storniert", isArchived: true')}</div>
                  <div>→ {t('ReceiptMaster Status → "Storniert"', 'ReceiptMaster status → "Storniert"')}</div>
                  <div>→ {t('Alle ReceiptHeaders → Status "Storniert"', 'All ReceiptHeaders → status "Storniert"')}</div>
                  <div>→ {t('Alle offenen Tickets geschlossen', 'All open tickets closed')}</div>
                  <div>→ {t('Alles an Cosmos DB persistiert', 'Everything persisted to Cosmos DB')}</div>
                </div>
              </div>
            </div>
          </DocCard>

          <DocCard title={t('Smart Import', 'Smart Import')} icon={<Sparkles size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Text-Import-Tool im CreateOrderWizard. Erkennt automatisch Artikelnummern, Mengen und Beschreibungen aus kopierten Bestellbestätigungen oder Angeboten. Matching gegen vorhandene ~800 Artikel im Bestand (Fuzzy-Match auf Name und SKU).', 'Text import tool in CreateOrderWizard. Automatically recognizes item numbers, quantities and descriptions from copied order confirmations or quotes. Matching against existing ~800 items in stock (fuzzy match on name and SKU).')}</p>
              <p>{t('Konfigurierbar über Globale Einstellungen (Smart Import an/aus).', 'Configurable via Global Settings (Smart Import on/off).')}</p>
            </div>
          </DocCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 6: GOODS RECEIPT (DETAILED)
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'receipt' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Wareneingang — Prozessdetails', 'Goods Receipt — Process Details')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('Der Wareneingang ist der Kernprozess der App. Hier werden Lieferungen geprüft, Bestände aktualisiert und Abweichungen dokumentiert.', 'The goods receipt is the core process of the app. Here deliveries are inspected, stock levels updated and deviations documented.')}
            </p>
          </div>

          <DocCard title={t('Prüfungs-Flow (GoodsReceiptFlow)', 'Inspection Flow (GoodsReceiptFlow)')} icon={<ClipboardList size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Vollbild-Wizard (mobil-optimiert) mit folgenden Schritten:', 'Full-screen wizard (mobile-optimized) with these steps:')}</p>
              <div className="space-y-1.5 ml-2">
                <div className="flex items-start gap-2"><span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>1</span>{t('Lieferschein-Daten eingeben (Nummer, Lieferant)', 'Enter delivery note data (number, supplier)')}</div>
                <div className="flex items-start gap-2"><span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>2</span>{t('Pro Artikel: Menge prüfen, Akzeptiert/Abgelehnt/Überliefert', 'Per item: check quantity, accepted/rejected/over-delivered')}</div>
                <div className="flex items-start gap-2"><span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>3</span>{t('Bei Abweichungen: Ablehnungsgrund, Fotos, Notizen', 'On deviations: rejection reason, photos, notes')}</div>
                <div className="flex items-start gap-2"><span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>4</span>{t('Zusammenfassung → Buchen', 'Summary → Book')}</div>
              </div>
            </div>
          </DocCard>

          <DocCard title={t('Lieferung ablehnen', 'Delivery Refusal')} icon={<Ban size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Komplette Lieferung kann abgelehnt werden (z.B. falsche Ware, beschädigtes Paket). Erstellt automatisch ein Ticket, setzt ReceiptMaster auf "Abgelehnt", postet Auto-Kommentar in Historie & Notizen.', 'Complete delivery can be refused (e.g. wrong goods, damaged package). Automatically creates a ticket, sets ReceiptMaster to "Abgelehnt", posts auto-comment in History & Notes.')}</p>
            </div>
          </DocCard>

          <DocCard title={t('Retouren-Prozess', 'Returns Process')} icon={<Truck size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Aus der Wareneingangsverwaltung: "Rücksendung" Modus wählen → Menge, Grund, Versandart, Tracking-Nummer eingeben → Verarbeiten.', 'From receipt management: select "Return" mode → enter quantity, reason, carrier, tracking number → process.')}</p>
              <p><strong>{t('Automatische Aktionen', 'Automatic Actions')}:</strong></p>
              <div className="space-y-1 ml-2">
                <div>→ {t('Bestand wird um Rücksendemenge reduziert (bei Lager-Bestellungen)', 'Stock is reduced by return quantity (for warehouse orders)')}</div>
                <div>→ {t('PO-Status wird ggf. auf "Offen" zurückgesetzt', 'PO status may be reset to "Offen"')}</div>
                <div>→ {t('ReceiptMaster wird aktualisiert (deliveries Array)', 'ReceiptMaster is updated (deliveries array)')}</div>
                <div>→ {t('Rücksende-Header + Items als Receipt-Dokumente gespeichert', 'Return header + items saved as receipt documents')}</div>
                <div>→ {t('Auto-Ticket erstellt (Typ: Rücksendung)', 'Auto-ticket created (type: return)')}</div>
                <div>→ {t('Formatierter Auto-Kommentar in Historie & Notizen', 'Formatted auto-comment in History & Notes')}</div>
                <div>→ {t('Cross-Post an offene Tickets derselben Bestellung', 'Cross-post to open tickets for same order')}</div>
              </div>
              <p><strong>{t('Visuelle Kennzeichnung', 'Visual Indicators')}:</strong> {t('Orangene LKW-Icons (Truck) mit Fade-in Pulse-Animation. Label wechselt von "Lieferschein" zu "Zurücksendung". Rücksende-Nummer enthält Datum-Formatierung.', 'Orange truck icons with fade-in pulse animation. Label changes from "Lieferschein" to "Zurücksendung". Return number contains date formatting.')}</p>
            </div>
          </DocCard>

          <DocCard title={t('API Persistierung (handleReceiptSuccess)', 'API Persistence (handleReceiptSuccess)')} icon={<Database size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Kritischer Handler — alle Schreibvorgänge inline in setState-Callbacks (keine setTimeout, keine stale Closures):', 'Critical handler — all writes inline in setState callbacks (no setTimeout, no stale closures):')}</p>
              <div className="space-y-1 ml-2 font-mono text-[10px]">
                <div>setPurchaseOrders(prev =&gt; ...) → ordersApi.upsert()</div>
                <div>setReceiptMasters(prev =&gt; ...) → receiptsApi.upsert()</div>
                <div>setInventory(prev =&gt; ...) → stockApi.upsert()</div>
                <div>receiptsApi.bulkUpsert([header, ...items])</div>
                <div>{t('Auto-Kommentare + Auto-Tickets separat persistiert', 'Auto-comments + auto-tickets persisted separately')}</div>
              </div>
            </div>
          </DocCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 7: DATA MODEL
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'datamodel' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Daten-Modell', 'Data Model')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('Alle Kern-Entitäten, ihre TypeScript-Interfaces und Cosmos DB Beziehungen.', 'All core entities, their TypeScript interfaces and Cosmos DB relationships.')}
            </p>
          </div>

          <Collapsible id="dm-po" title="PurchaseOrder" icon={<FileText size={20} />}>
            <div className="space-y-1 text-xs font-mono">
              <div>id: <span className="opacity-60">string</span> — {t('Bestell-Nr. (z.B. "BEST-992")', 'Order No. (e.g. "BEST-992")')}</div>
              <div>supplier: <span className="opacity-60">string</span></div>
              <div>status: <span className="opacity-60">'Offen' | 'Teilweise geliefert' | 'Abgeschlossen' | 'Storniert' | 'Projekt' | 'Lager'</span></div>
              <div>items: <span className="opacity-60">PurchaseOrderItem[]</span> — {t('Jeder mit quantityExpected + quantityReceived', 'Each with quantityExpected + quantityReceived')}</div>
              <div>isArchived / isForceClosed: <span className="opacity-60">boolean</span></div>
              <div>linkedReceiptId: <span className="opacity-60">string?</span> — FK → ReceiptMaster</div>
              <div>createdAt / lastUpdated: <span className="opacity-60">number</span></div>
            </div>
            <div className="mt-2 text-xs opacity-70">{t('Cosmos Container: orders (Partition: /id)', 'Cosmos container: orders (partition: /id)')}</div>
          </Collapsible>

          <Collapsible id="dm-rm" title="ReceiptMaster" icon={<ClipboardList size={20} />}>
            <div className="space-y-1 text-xs font-mono">
              <div>id: <span className="opacity-60">string</span></div>
              <div>poId: <span className="opacity-60">string</span> — FK → PurchaseOrder</div>
              <div>status: <span className="opacity-60">ReceiptMasterStatus</span></div>
              <div>deliveries: <span className="opacity-60">DeliveryLog[]</span> — {t('Array aller Lieferungen/Retouren', 'Array of all deliveries/returns')}</div>
              <div>docType: <span className="opacity-60">"master"</span></div>
            </div>
            <div className="mt-2 text-xs opacity-70">{t('Cosmos Container: receipts (Partition: /poId, docType: "master")', 'Cosmos container: receipts (partition: /poId, docType: "master")')}</div>
          </Collapsible>

          <Collapsible id="dm-item" title="StockItem" icon={<Box size={20} />}>
            <div className="space-y-1 text-xs font-mono">
              <div>id / sku: <span className="opacity-60">string</span> — {t('Artikelnummer', 'Item number')}</div>
              <div>name: <span className="opacity-60">string</span></div>
              <div>system: <span className="opacity-60">string</span> — {t('Warengruppe (z.B. "USV", "Brandmeldetechnik")', 'Product group')}</div>
              <div>stockLevel / minStock: <span className="opacity-60">number</span></div>
              <div>warehouseLocation: <span className="opacity-60">string?</span></div>
              <div>isAkku / capacityAh: <span className="opacity-60">boolean / number</span></div>
            </div>
            <div className="mt-2 text-xs opacity-70">{t('Cosmos Container: stock (Partition: /id)', 'Cosmos container: stock (partition: /id)')}</div>
          </Collapsible>

          <Collapsible id="dm-ticket" title="Ticket" icon={<Ticket size={20} />}>
            <div className="space-y-1 text-xs font-mono">
              <div>id: <span className="opacity-60">string</span></div>
              <div>receiptId: <span className="opacity-60">string</span> — FK → ReceiptHeader.batchId</div>
              <div>subject / description: <span className="opacity-60">string</span></div>
              <div>priority: <span className="opacity-60">'Low' | 'Medium' | 'High' | 'Critical'</span></div>
              <div>status: <span className="opacity-60">'Open' | 'In Progress' | 'Resolved' | 'Closed'</span></div>
              <div>type: <span className="opacity-60">'damage' | 'shortage' | 'excess' | 'wrong' | 'rejected' | 'other'</span></div>
              <div>messages: <span className="opacity-60">TicketMessage[]</span></div>
              <div>poId: <span className="opacity-60">string</span> — {t('Partition Key für Cosmos', 'Partition key for Cosmos')}</div>
            </div>
            <div className="mt-2 text-xs opacity-70">{t('Cosmos Container: tickets (Partition: /poId)', 'Cosmos container: tickets (partition: /poId)')}</div>
          </Collapsible>

          <Collapsible id="dm-header" title="ReceiptHeader / ReceiptItem / ReceiptComment" icon={<Database size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Alle drei Typen leben im selben Cosmos Container (receipts), unterschieden durch das docType Feld:', 'All three types live in the same Cosmos container (receipts), distinguished by the docType field:')}</p>
              <div className="font-mono space-y-1">
                <div>ReceiptHeader → docType: <span className="opacity-60">"header"</span></div>
                <div>ReceiptItem → docType: <span className="opacity-60">"item"</span></div>
                <div>ReceiptComment → docType: <span className="opacity-60">"comment"</span></div>
              </div>
              <p>{t('Alle partitioniert nach /poId für effiziente Abfragen pro Bestellung.', 'All partitioned by /poId for efficient per-order queries.')}</p>
            </div>
          </Collapsible>

          <Collapsible id="dm-stocklog" title="StockLog" icon={<History size={20} />}>
            <div className="space-y-1 text-xs font-mono">
              <div>id: <span className="opacity-60">string</span></div>
              <div>timestamp: <span className="opacity-60">Date</span></div>
              <div>userId / userName: <span className="opacity-60">string</span></div>
              <div>itemId / itemName: <span className="opacity-60">string</span></div>
              <div>action: <span className="opacity-60">'add' | 'remove'</span></div>
              <div>quantity: <span className="opacity-60">number</span></div>
              <div>source: <span className="opacity-60">string?</span> — {t('"Wareneingang PO-xxx", "Manuell (Bestand)", "Rücksendung"', '"Goods receipt PO-xxx", "Manual (stock)", "Return"')}</div>
              <div>context: <span className="opacity-60">'normal' | 'project' | 'manual' | 'po-normal' | 'po-project'</span></div>
            </div>
            <div className="mt-2 text-xs opacity-70">{t('Gespeichert in: localStorage (max. 500 Einträge, serialisiert als JSON)', 'Stored in: localStorage (max 500 entries, serialized as JSON)')}</div>
          </Collapsible>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 8: BUSINESS LOGIC
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'logic' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Geschäftslogik & Formeln', 'Business Logic & Formulas')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('Die mathematischen Regeln hinter Bestandsbewegungen, Statusberechnung und Korrekturen.', 'The mathematical rules behind stock movements, status calculation and corrections.')}
            </p>
          </div>

          <DocCard title={t('Bestandsberechnung', 'Stock Calculation')} icon={<Calculator size={20} />}>
            <div className="space-y-2 text-xs">
              <div className="font-mono">Lager: newStock = currentStock + quantityAccepted</div>
              <div className="font-mono">Projekt: newStock = currentStock {t('(unverändert)', '(unchanged)')}</div>
              <div className="font-mono">Rücksendung: newStock = currentStock - returnQuantity</div>
              <div className="font-mono">{t('Manuell', 'Manual')}: newStock = userInput (min: 0)</div>
            </div>
          </DocCard>

          <DocCard title={t('Lieferstatus-Berechnung (ReceiptMaster)', 'Delivery Status Calculation (ReceiptMaster)')} icon={<GitBranch size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Wird in getDeliveryDateBadge() berechnet basierend auf:', 'Calculated in getDeliveryDateBadge() based on:')}</p>
              <div className="space-y-1 ml-2">
                <div>{t('• Kein Lieferdatum gesetzt', 'No delivery date set')} → "Wartet auf Lieferung"</div>
                <div>{t('• Lieferdatum = heute', 'Delivery date = today')} → "Lieferung heute"</div>
                <div>{t('• Lieferdatum = morgen', 'Delivery date = tomorrow')} → "Lieferung morgen"</div>
                <div>{t('• Lieferdatum in Vergangenheit + nicht geliefert', 'Delivery date in past + not delivered')} → "Verspätet"</div>
                <div>{t('• Alle Artikel vollständig geliefert', 'All items fully delivered')} → "Vollständig"</div>
                <div>{t('• Teilweise geliefert', 'Partially delivered')} → "Teillieferung"</div>
              </div>
            </div>
          </DocCard>

          <DocCard title={t('Write-Through Muster', 'Write-Through Pattern')} icon={<Database size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Jeder Handler in App.tsx folgt dem gleichen Muster:', 'Every handler in App.tsx follows the same pattern:')}</p>
              <div className={`rounded-lg p-3 font-mono text-[10px] ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div>1. setState(prev =&gt; {'{'}</div>
                <div className="ml-4">{t('// Berechne neuen State', '// Calculate new state')}</div>
                <div className="ml-4">{t('// API write-through (inline, kein setTimeout)', '// API write-through (inline, no setTimeout)')}</div>
                <div className="ml-4">api.upsert(newValue).catch(console.warn);</div>
                <div className="ml-4">return updatedState;</div>
                <div>{'}'})</div>
              </div>
              <p>{t('Warum inline? setTimeout-Callbacks fangen stale React State Closures ein. Durch Inline-Calls in setState haben wir immer den frischen berechneten Wert.', 'Why inline? setTimeout callbacks capture stale React state closures. Inline calls in setState always have the fresh computed value.')}</p>
              <p>{t('Bei Netzwerkfehler: apiFetch() fängt TypeError ("fetch") → enqueueWrite() → Queue in IndexedDB → flushQueue() bei Verbindung.', 'On network error: apiFetch() catches TypeError ("fetch") → enqueueWrite() → queue in IndexedDB → flushQueue() on connection.')}</p>
            </div>
          </DocCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 9: STATUS SYSTEM
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'statuses' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('3-Badge Status System', '3-Badge Status System')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('Einheitliches Status-System über alle Ansichten. Implementiert in ReceiptStatusBadges.tsx (Single Source of Truth).', 'Unified status system across all views. Implemented in ReceiptStatusBadges.tsx (single source of truth).')}
            </p>
          </div>

          <DocCard title={t('Badge 1: Identität (Quelle)', 'Badge 1: Identity (Source)')} icon={<Briefcase size={20} />}>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>PROJEKT</span> {t('Projektbestellung — Bestand wird nicht zum Lager addiert', 'Project order — stock not added to warehouse')}</div>
              <div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>LAGER</span> {t('Standard-Lagerbestellung', 'Standard warehouse order')}</div>
            </div>
          </DocCard>

          <DocCard title={t('Badge 2: Prozess-Status', 'Badge 2: Process Status')} icon={<GitBranch size={20} />}>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> <strong>Gebucht</strong> — {t('Wareneingang erfasst, noch nicht geprüft', 'Receipt recorded, not yet inspected')}</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> <strong>Wartet auf Lieferung</strong> — {t('Bestellt, Lieferung ausstehend', 'Ordered, delivery pending')}</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> <strong>Lieferung heute / morgen</strong></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> <strong>Verspätet</strong> — {t('Lieferdatum überschritten', 'Delivery date exceeded')}</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500" /> <strong>Teillieferung</strong> — {t('Teilweise geliefert, Rest ausstehend', 'Partially delivered, rest pending')}</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-600" /> <strong>Vollständig</strong> — {t('Alle Artikel geliefert und geprüft', 'All items delivered and inspected')}</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500" /> <strong>Abgeschlossen</strong> — {t('Manuell geschlossen', 'Manually closed')}</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" /> <strong>Schaden / Falsch / Übermenge</strong> — {t('Qualitätsprobleme', 'Quality issues')}</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600" /> <strong>Abgelehnt / Storniert</strong></div>
            </div>
          </DocCard>

          <DocCard title={t('Badge 3: Tickets', 'Badge 3: Tickets')} icon={<Ticket size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Optional. Wird nur angezeigt wenn offene Tickets für die Bestellung existieren. Zeigt Anzahl und höchste Priorität.', 'Optional. Only shown when open tickets exist for the order. Shows count and highest priority.')}</p>
              <p>{t('Konfiguration: Welche Abweichungstypen automatisch Tickets erstellen (damage, shortage, excess, wrong, rejected) — steuerbar über Globale Einstellungen.', 'Configuration: Which deviation types auto-create tickets (damage, shortage, excess, wrong, rejected) — controllable via Global Settings.')}</p>
            </div>
          </DocCard>

          <InfoBox>
            {t(
              'Status-Badges werden als standardisierte "Pills" mit fester Mindestbreite (130px) dargestellt, vertikal gestapelt. CSS-Klasse: .status-pill-stack. Die Spaltenreihenfolge (Status zuerst oder zweite Spalte) ist über Globale Einstellungen konfigurierbar.',
              'Status badges are rendered as standardized "pills" with fixed minimum width (130px), stacked vertically. CSS class: .status-pill-stack. Column order (status first or second) is configurable via Global Settings.'
            )}
          </InfoBox>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 10: SETTINGS
          ═══════════════════════════════════════════════════════ */}
      {activeSection === 'settings' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Einstellungen — Architektur', 'Settings — Architecture')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('Zwei getrennte Einstellungsebenen: Benutzer-Präferenzen und Globale System-Einstellungen. Alle Settings werden in localStorage persistiert und überleben Browser-Refreshes.', 'Two separate settings layers: user preferences and global system settings. All settings are persisted in localStorage and survive browser refreshes.')}
            </p>
          </div>

          <DocCard title={t('Benutzer-Einstellungen (SettingsPage)', 'User Settings (SettingsPage)')} icon={<Settings size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Persönliche Präferenzen, die nur die Darstellung betreffen:', 'Personal preferences that only affect display:')}</p>
              <div className="flex items-start gap-2"><Eye size={12} className="shrink-0 mt-0.5 text-[#0077B5]" /><span><strong>{t('Erscheinungsbild', 'Appearance')}:</strong> Light / Soft (Frosted Aura) / Dark — {t('3-Wege-Toggle im Header (Icon = Ziel-Modus). Persistiert in localStorage.', '3-way toggle in header (icon = target mode). Persisted in localStorage.')}</span></div>
              <div className="flex items-start gap-2"><Box size={12} className="shrink-0 mt-0.5 text-[#0077B5]" /><span><strong>{t('Artikel-Ansicht', 'Item View')}:</strong> Grid / List</span></div>
              <div className="flex items-start gap-2"><Database size={12} className="shrink-0 mt-0.5 text-[#0077B5]" /><span><strong>{t('Daten-Management', 'Data Management')}:</strong> {t('JSON-Import / Zurücksetzen auf Mock-Daten', 'JSON import / Reset to mock data')}</span></div>
            </div>
          </DocCard>

          <DocCard title={t('Globale Einstellungen (GlobalSettingsPage)', 'Global Settings (GlobalSettingsPage)')} icon={<Shield size={20} />}>
            <div className="space-y-3 text-xs">
              <p>{t('System-weite Einstellungen, die alle Benutzer betreffen. In Zukunft nur für Admins zugänglich (Entra ID Rollen).', 'System-wide settings affecting all users. In future, only accessible to admins (Entra ID roles).')}</p>
              <div className="space-y-2">
                <div><strong>{t('Tabellen & Anzeige', 'Tables & Display')}:</strong> {t('Status-Spalte zuerst in Tabellen (an/aus)', 'Status column first in tables (on/off)')}</div>
                <div><strong>{t('Einkauf & Bestellungen', 'Purchasing & Orders')}:</strong> {t('Smart Import (an/aus), Lieferdatum Pflichtfeld (an/aus)', 'Smart Import (on/off), delivery date required field (on/off)')}</div>
                <div><strong>{t('Ticket-Automation', 'Ticket Automation')}:</strong> {t('Pro Abweichungstyp konfigurierbar: Fehlmenge, Übermenge, Schaden, Falschlieferung, Ablehnung', 'Configurable per deviation type: shortage, excess, damage, wrong delivery, rejection')}</div>
                <div><strong>{t('Timeline Auto-Post', 'Timeline Auto-Post')}:</strong> {t('Gleiche Konfiguration wie Ticket-Automation, steuert automatische Kommentare in Historie & Notizen', 'Same configuration as ticket automation, controls automatic comments in History & Notes')}</div>
                <div><strong>{t('Lagerorte', 'Warehouse Locations')}:</strong> {t('Kategorien-basierte Verwaltung (Objekte, Service, etc.). Wird als ComboboxSelect in Artikeln verwendet.', 'Category-based management (Objekte, Service, etc.). Used as ComboboxSelect in items.')}</div>
                <div><strong>{t('Audit Trail', 'Audit Trail')}:</strong> {t('Protokoll aller Systemaktionen (max. 500 Einträge). Zeigt Benutzer, Zeitstempel, Event-Typ und Details.', 'Log of all system actions (max 500 entries). Shows user, timestamp, event type and details.')}</div>
              </div>
            </div>
          </DocCard>

          <InfoBox>
            {t(
              'Geplant: Alle Settings → Cosmos DB "user-prefs" Container (pro Benutzer). Globale Settings → eigener Container mit Rollenprüfung. Authentifizierung via Microsoft Entra ID (bereits provisioniert, noch nicht verdrahtet).',
              'Planned: All settings → Cosmos DB "user-prefs" container (per user). Global settings → dedicated container with role check. Authentication via Microsoft Entra ID (already provisioned, not yet wired).'
            )}
          </InfoBox>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-12 pt-6 border-t text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p className="text-xs text-slate-500">
          DOST Lager v0.3.0 — {t('Letzte Aktualisierung', 'Last updated')}: {t('März', 'March')} 2026
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          {t('Entwickelt von DOST INFOSYS', 'Developed by DOST INFOSYS')}
        </p>
      </div>
    </div>
  );
};