import React, { useState } from 'react';
import { Theme } from '../types';
import {
  ArrowLeft, Book, Database, Layout, GitBranch, ArrowRight,
  CheckCircle2, AlertTriangle, Box, Calculator, FileText, Truck,
  LogOut, RefreshCw, Briefcase, Ban, Info, Globe, Shield, Settings,
  Package, ClipboardList, Search, BarChart3, Users, Ticket, Eye,
  Sparkles, Calendar, Lock, History, Layers, ChevronDown, ChevronUp,
  Star, Zap, Hash, MapPin, AlertCircle, XCircle, PlusCircle,
  Cloud, CloudOff, WifiOff, Server, HardDrive, Wifi, ClipboardCheck, Bell
} from 'lucide-react';

interface DocumentationPageProps {
  theme: Theme;
  onBack: () => void;
}

type DocSection = 'intro' | 'modules' | 'orders' | 'receipt' | 'audit' | 'datamodel' | 'logic' | 'statuses' | 'settings' | 'cloud' | 'offline';
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

  const sections: { id: DocSection; label: string; icon: React.ReactNode }[] = [
    { id: 'intro', label: t('Übersicht', 'Overview'), icon: <Layout size={16} /> },
    { id: 'cloud', label: t('Cloud & API', 'Cloud & API'), icon: <Cloud size={16} /> },
    { id: 'offline', label: t('Offline & Sync', 'Offline & Sync'), icon: <WifiOff size={16} /> },
    { id: 'modules', label: t('Module', 'Modules'), icon: <Layers size={16} /> },
    { id: 'orders', label: t('Bestellungen', 'Orders'), icon: <FileText size={16} /> },
    { id: 'receipt', label: t('Wareneingang', 'Goods Receipt'), icon: <ClipboardList size={16} /> },
    { id: 'audit', label: t('Inventur', 'Audit'), icon: <ClipboardCheck size={16} /> },
    { id: 'datamodel', label: t('Daten-Modell', 'Data Model'), icon: <Database size={16} /> },
    { id: 'logic', label: t('Geschäftslogik', 'Business Logic'), icon: <Calculator size={16} /> },
    { id: 'statuses', label: t('Status System', 'Status System'), icon: <GitBranch size={16} /> },
    { id: 'settings', label: t('Einstellungen', 'Settings'), icon: <Settings size={16} /> },
  ];

  const DocCard = ({ title, icon, children, id }: { title: string; icon: React.ReactNode; children: React.ReactNode; id?: string }) => (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-3 p-4 md:p-5">
        <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-slate-800 text-[#0077B5]' : 'bg-blue-50 text-[#0077B5]'}`}>{icon}</div>
        <h3 className={`font-bold text-base md:text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
      </div>
      <div className={`px-4 pb-4 md:px-5 md:pb-5 text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{children}</div>
    </div>
  );

  const Collapsible = ({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) => {
    const isExpanded = expandedCards.has(id);
    return (
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button onClick={() => toggleCard(id)} className={`w-full flex items-center gap-3 p-4 md:p-5 text-left transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
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
      <div className="mb-6">
        <button onClick={onBack} className={`flex items-center gap-2 text-sm font-bold mb-4 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
          <ArrowLeft size={16} /> {t('Zurück zu Einstellungen', 'Back to Settings')}
        </button>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#0077B5]/20' : 'bg-[#0077B5]/10'}`}><Book size={28} className="text-[#0077B5]" /></div>
            <div>
              <h1 className="text-2xl font-bold">{t('App Dokumentation', 'App Documentation')}</h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('Architektur, Module, Datenmodell & Geschäftslogik', 'Architecture, Modules, Data Model & Business Logic')}</p>
            </div>
          </div>
          <div className={`flex p-0.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <button onClick={() => setLang('de')} className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${lang === 'de' ? (isDark ? 'bg-slate-600 text-white' : 'bg-white text-slate-800 shadow-sm') : 'opacity-50'}`}>DE</button>
            <button onClick={() => setLang('en')} className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${lang === 'en' ? (isDark ? 'bg-slate-600 text-white' : 'bg-white text-slate-800 shadow-sm') : 'opacity-50'}`}>EN</button>
          </div>
        </div>
      </div>

      <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible scrollbar-hide">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${activeSection === s.id ? 'bg-[#0077B5] text-white shadow-md' : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION: AUDIT */}
      {activeSection === 'audit' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Inventur — Bestandszählung', 'Audit — Inventory Count')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('Shopping-Cart-Erlebnis für Bestandszählungen. Zwei Modi (Schnell / Normal), Offline-fähig, mit Genehmigungsworkflow und vollständiger Rückverfolgbarkeit im Lagerprotokoll.', 'Shopping cart experience for inventory counts. Two modes (Quick / Normal), offline-capable, with approval workflow and full traceability in the stock log.')}</p>
          </div>

          <DocCard title={t('Konzept: Baue was du findest', 'Concept: Build What You Find')} icon={<ClipboardCheck size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Keine vorausgefüllten Listen, keine erwarteten Mengen vorab. Der Zähler startet mit einem leeren "Warenkorb", sucht Artikel per Name/SKU/System, fügt sie einzeln hinzu und gibt die tatsächlich gezählte Menge ein. Erst in der Zusammenfassung zeigt die App die Abweichungen.', 'No pre-filled lists, no expected quantities upfront. The counter starts with an empty "cart", searches items by name/SKU/system, adds them one by one and enters the actually counted quantity. Only in the summary does the app reveal variances.')}</p>
            </div>
          </DocCard>

          <DocCard title={t('Zwei Modi', 'Two Modes')} icon={<Zap size={20} />}>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-1"><Zap size={14} className="text-amber-500" /><strong>{t('Schnellzählung (Quick Count)', 'Quick Count')}</strong></div>
                <p>{t('Schnell, ohne Drama. Zählen → Zusammenfassung → sofort buchen. Bestand wird direkt aktualisiert. Übermengen als Zugang, Fehlmengen als Abschreibung (write-off) im Lagerprotokoll.', 'Fast, no drama. Count → summary → instant booking. Stock updated immediately. Overages as additions, shortages as write-offs in the stock log.')}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1"><Shield size={14} className="text-blue-500" /><strong>{t('Normale Inventur (Normal Audit)', 'Normal Audit')}</strong></div>
                <p>{t('Für offizielle Zählungen mit Vier-Augen-Prinzip. Zählen → Zusammenfassung → zur Prüfung einreichen → Manager prüft → genehmigt oder lehnt ab. Erst nach Genehmigung wird der Bestand aktualisiert.', 'For official counts with four-eyes principle. Count → summary → submit for review → manager reviews → approves or rejects. Stock is only updated after approval.')}</p>
              </div>
            </div>
          </DocCard>

          <DocCard title={t('Ablauf — Schritt für Schritt', 'Flow — Step by Step')} icon={<ArrowRight size={20} />}>
            <div className="space-y-3 text-xs">
              <div><strong>{t('1. Setup', '1. Setup')}</strong><p>{t('Bezeichnung eingeben, Lager/Standort wählen (Grid-Picker), Modus wählen (Schnell/Normal), optional Blindmodus aktivieren.', 'Enter name, pick warehouse/location (grid picker), choose mode (Quick/Normal), optionally enable blind mode.')}</p></div>
              <div><strong>{t('2. Zählung — Warenkorb', '2. Counting — Shopping Cart')}</strong><p>{t('Leerer Warenkorb mit Suchleiste. Artikelsuche per Name, SKU, System, Hersteller (Live-Autocomplete). Antippen fügt als Karte hinzu. Pro Karte: Produktinfo, große +/−-Stepper (44px), Direkteingabe, Notiz-Toggle, Entfernen. Swipe-Gesten: links = entfernen, rechts = Notiz.', 'Empty cart with search bar. Search by name, SKU, system, manufacturer (live autocomplete). Tapping adds as card. Per card: product info, large +/− steppers (44px), direct entry, note toggle, remove. Swipe gestures: left = remove, right = note.')}</p></div>
              <div><strong>{t('3. Zusammenfassung — Die Enthüllung', '3. Summary — The Reveal')}</strong><p>{t('Übersichtskarte mit Gesamtzahlen. Kategorisierung: Grün (OK), Orange (Übermenge), Rot (Fehlmenge). Jede Abweichung aufklappbar. Schnell: "Bestand aktualisieren" (Bestätigung bei Fehlmengen). Normal: "Zur Prüfung einreichen".', 'Stats card with totals. Categorization: green (OK), orange (overage), red (shortage). Each variance expandable. Quick: "Update stock" (confirmation for shortages). Normal: "Submit for review".')}</p></div>
              <div><strong>{t('4. Prüfung (nur Normal)', '4. Review (Normal only)')}</strong><p>{t('Manager sieht Zusammenfassung + Meta-Daten. Optionaler Kommentar. Genehmigen → Bestand aktualisiert + Lagerprotokoll. Ablehnen → Keine Änderung, Zähler wird benachrichtigt.', 'Manager sees summary + metadata. Optional comment. Approve → stock updated + stock log. Reject → no change, counter gets notified.')}</p></div>
            </div>
          </DocCard>

          <DocCard title={t('Blindmodus', 'Blind Mode')} icon={<Eye size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Optional beim Setup aktivierbar. Verbirgt die erwarteten Bestandsmengen während der gesamten Zählung — die "Bestand"-Spalte in den Suchergebnissen wird ausgeblendet. Erst in der Zusammenfassung werden Erwartet vs. Gezählt offengelegt. Verhindert bestätigungsverzerrte Zählungen.', 'Optionally enabled during setup. Hides expected stock quantities throughout the entire count — the "Stock" column in search results is hidden. Only the summary reveals expected vs. counted. Prevents confirmation-biased counts.')}</p>
            </div>
          </DocCard>

          <DocCard title={t('Warenkorb-UX — Premium-Feeling', 'Cart UX — Premium Feel')} icon={<Package size={20} />}>
            <div className="space-y-2 text-xs">
              <p><strong>{t('Gesten', 'Gestures')}:</strong> {t('Swipe links = entfernen (rote Aktion). Swipe rechts = Notiz (blaue Aktion). 40px Totes-Zone. Vertikales Scrollen hat Priorität.', 'Swipe left = remove (red action). Swipe right = note (blue action). 40px dead zone. Vertical scrolling has priority.')}</p>
              <p><strong>{t('Animationen', 'Animations')}:</strong> {t('Karten-Bounce beim Hinzufügen. Mengen-Blitz (blauer Puls) bei +/−. Zusammenfassung: gestaffelte Fade-Ups. Stat-Zahlen Pop-In. Konfetti bei perfekter Übereinstimmung.', 'Card bounce on add. Quantity flash (blue pulse) on +/−. Summary: staggered fade-ups. Stat number pop-in. Confetti on perfect match.')}</p>
              <p><strong>{t('Haptik', 'Haptics')}:</strong> {t('Vibration (Android): 5ms +/−, 10ms Hinzufügen, 15ms Swipe-Entfernen. iOS: Kein navigator.vibrate — visuelle Animationen kompensieren.', 'Vibration (Android): 5ms +/−, 10ms add, 15ms swipe remove. iOS: no navigator.vibrate — visual animations compensate.')}</p>
              <p><strong>{t('Bodenleiste', 'Bottom Bar')}:</strong> {t('Fixiert, Artikelanzahl, Stück-Gesamt, Fortschrittsbalken, "Fertig →". Safe-area-inset + Sidebar-Offset.', 'Fixed, item count, piece total, progress bar, "Done →". Safe-area-inset + sidebar offset.')}</p>
            </div>
          </DocCard>

          <DocCard title={t('Lagerprotokoll-Integration', 'Stock Log Integration')} icon={<History size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Jede genehmigte Inventur erzeugt Einträge im Lagerprotokoll. Neue Felder auf StockLog:', 'Every approved audit generates stock log entries. New fields on StockLog:')}</p>
              <div className="space-y-1 ml-2 font-mono text-[10px]">
                <div>action: 'add' | 'remove' | <strong>'write-off'</strong></div>
                <div>context: ... | <strong>'audit-quick'</strong> | <strong>'audit-normal'</strong></div>
                <div>auditSessionId?, auditSessionName?, countedByName?, approvedByName?</div>
              </div>
              <p>{t('Neuer "Inventur"-Filter-Tab. Lila SCHNELL/INVENTUR-Badge, rotes ABSCHREIBUNG-Badge. Referenz zeigt Inventur-Name + Genehmiger.', 'New "Inventur" filter tab. Purple SCHNELL/INVENTUR badge, red ABSCHREIBUNG badge. Reference shows audit name + approver.')}</p>
            </div>
          </DocCard>

          {/* RICH OFFLINE SECTION */}
          <DocCard title={t('Offline-Fähigkeit — Was funktioniert ohne Netz?', 'Offline Capability — What Works Without Signal?')} icon={<WifiOff size={20} />}>
            <div className="space-y-4 text-xs">
              <p>{t('Die Inventur ist für unterirdische Lager und Transporter ohne Empfang konzipiert.', 'The audit module is built for underground warehouses and vans without signal.')}</p>
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'}`}>
                <div className={`flex items-center gap-2 mb-3 font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}><CheckCircle2 size={16} /> {t('Funktioniert offline', 'Works offline')}</div>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5"><span className={`shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`}><Search size={12} /></span><span><strong>{t('Artikelsuche', 'Item search')}:</strong> {t('Alle ~800 Artikel in IndexedDB gecacht. Sofort verfügbar.', 'All ~800 items cached in IndexedDB. Instantly available.')}</span></div>
                  <div className="flex items-start gap-2.5"><span className={`shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`}><PlusCircle size={12} /></span><span><strong>{t('Neue Inventur starten', 'Start new audit')}:</strong> {t('Session lokal erstellt. Lagerort-Picker, Modus, Blindmodus — alles lokal.', 'Session created locally. Location picker, mode, blind mode — all local.')}</span></div>
                  <div className="flex items-start gap-2.5"><span className={`shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`}><Package size={12} /></span><span><strong>{t('Warenkorb', 'Cart operations')}:</strong> {t('Hinzufügen, entfernen, Mengen, Notizen, Swipe — alles React State.', 'Add, remove, quantities, notes, swipe — all React state.')}</span></div>
                  <div className="flex items-start gap-2.5"><span className={`shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`}><Zap size={12} /></span><span><strong>{t('Schnellzählung abschließen', 'Complete quick count')}:</strong> {t('Bestand lokal aktualisiert. API-Writes automatisch in Offline-Queue.', 'Stock updated locally. API writes auto-queued.')}</span></div>
                  <div className="flex items-start gap-2.5"><span className={`shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`}><Shield size={12} /></span><span><strong>{t('Normal einreichen', 'Submit normal')}:</strong> {t('Session gespeichert, API-Write gequeued. Bei Empfang auto-sync.', 'Session saved, API write queued. Auto-syncs on signal.')}</span></div>
                  <div className="flex items-start gap-2.5"><span className={`shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`}><History size={12} /></span><span><strong>{t('Verlauf', 'History')}:</strong> {t('Alle Inventuren aus IndexedDB Cache. Filter und Suche funktionieren.', 'All audits from IndexedDB cache. Filters and search work.')}</span></div>
                </div>
              </div>
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'}`}>
                <div className={`flex items-center gap-2 mb-3 font-bold text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}><Wifi size={16} /> {t('Benötigt Verbindung', 'Requires connection')}</div>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5"><span className={`shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`}><Users size={12} /></span><span><strong>{t('Anderes Gerät', 'Other device')}:</strong> {t('Erst nach Sync sichtbar (60s Polling). Kein Echtzeit-Push.', 'Only visible after sync (60s polling). No real-time push.')}</span></div>
                  <div className="flex items-start gap-2.5"><span className={`shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`}><Bell size={12} /></span><span><strong>{t('Benachrichtigungen', 'Notifications')}:</strong> {t('Derzeit pro Gerät (localStorage). Push geplant.', 'Currently per-device (localStorage). Push planned.')}</span></div>
                  <div className="flex items-start gap-2.5"><span className={`shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`}><RefreshCw size={12} /></span><span><strong>{t('Aktuelle Bestände', 'Current stock')}:</strong> {t('Erwartete Mengen basieren auf letztem Sync.', 'Expected quantities based on last sync.')}</span></div>
                </div>
              </div>
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`font-bold text-sm mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('Typischer Offline-Ablauf', 'Typical Offline Flow')}</div>
                <div className="space-y-0 relative">
                  <div className={`absolute left-[15px] top-3 bottom-3 w-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                  {[
                    { icon: '\uD83D\uDCF6', de: 'Im Büro — App synchronisiert frische Daten', en: 'In office — app syncs fresh data' },
                    { icon: '\uD83D\uDD3D', de: 'Untergeschoss — Indikator wechselt zu Offline', en: 'Underground — indicator switches to Offline' },
                    { icon: '\uD83D\uDCCB', de: 'Neue Inventur — Session lokal erstellt', en: 'New audit — session created locally' },
                    { icon: '\uD83D\uDD0D', de: 'Artikelsuche — IndexedDB liefert ~800 Produkte', en: 'Item search — IndexedDB delivers ~800 products' },
                    { icon: '\uD83D\uDED2', de: '47 Artikel gezählt — alles im lokalen State', en: '47 items counted — all in local state' },
                    { icon: '\u2705', de: 'Abgeschlossen — Bestand lokal aktualisiert, 3 Writes in Queue', en: 'Done — stock updated locally, 3 writes queued' },
                    { icon: '\uD83D\uDD3C', de: 'Zurück oben — "Synchronisiere…"', en: 'Back upstairs — "Syncing..."' },
                    { icon: '\uD83D\uDD04', de: 'Queue abgearbeitet — 3 Writes gesendet', en: 'Queue flushed — 3 writes sent' },
                    { icon: '\u2601\uFE0F', de: '"Verbunden" — alles synchron', en: '"Connected" — everything synced' },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 relative">
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'}`}>{step.icon}</div>
                      <div className={`pt-1.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t(step.de, step.en)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`font-bold text-sm mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('Sync-Indikator', 'Sync Indicator')}</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3"><Cloud size={13} className="text-emerald-500 shrink-0" /><span className={`text-[11px] px-2 py-0.5 rounded font-bold ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>{t('Verbunden', 'Connected')}</span><span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>— {t('Ideal vor dem Start.', 'Ideal before starting.')}</span></div>
                  <div className="flex items-center gap-3"><span className="shrink-0 flex items-center gap-0.5"><WifiOff size={13} className="text-orange-500" /><Database size={11} className="text-orange-500" /></span><span className={`text-[11px] px-2 py-0.5 rounded font-bold ${isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>{t('Offline', 'Offline')}</span><span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>— {t('Zählung läuft normal weiter.', 'Counting continues normally.')}</span></div>
                  <div className="flex items-center gap-3"><Database size={13} className="text-amber-500 animate-pulse shrink-0" /><span className={`text-[11px] px-2 py-0.5 rounded font-bold ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>{t('Synchronisiere', 'Syncing')}</span><span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>— {t('Queue wird abgearbeitet.', 'Queue flushing.')}</span></div>
                </div>
              </div>
            </div>
          </DocCard>

          <DocCard title={t('Benachrichtigungen', 'Notifications')} icon={<Bell size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('Glocken-Icon im Header mit rotem Badge (max. "9+"). Automatisch bei Audit-Events:', 'Bell icon in header with red badge (max "9+"). Auto-generated from audit events:')}</p>
              <div className="space-y-2 ml-2">
                <div className="flex items-start gap-2"><Info size={12} className="shrink-0 mt-0.5 text-blue-500" /><span><strong>{t('Eingereicht', 'Submitted')}:</strong> {t('"[Name] hat Inventur zur Prüfung eingereicht"', '"[Name] submitted audit for review"')}</span></div>
                <div className="flex items-start gap-2"><CheckCircle2 size={12} className="shrink-0 mt-0.5 text-emerald-500" /><span><strong>{t('Genehmigt', 'Approved')}:</strong> {t('"Inventur genehmigt von [Manager]."', '"Audit approved by [Manager]."')}</span></div>
                <div className="flex items-start gap-2"><XCircle size={12} className="shrink-0 mt-0.5 text-red-500" /><span><strong>{t('Abgelehnt', 'Rejected')}:</strong> {t('"Inventur abgelehnt." + Kommentar', '"Audit rejected." + comment')}</span></div>
              </div>
              <InfoBox variant="warn">{t('Benachrichtigungen sind derzeit pro Gerät (localStorage, max. 50). Geräteübergreifende Push-Benachrichtigungen sind geplant.', 'Notifications are currently per-device (localStorage, max 50). Cross-device push notifications planned.')}</InfoBox>
            </div>
          </DocCard>

          <DocCard title={t('Technische Architektur (Deep Dive)', 'Technical Architecture (Deep Dive)')} icon={<Database size={20} />}>
            <div className="space-y-4 text-xs">
              <div>
                <div className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('Infrastruktur', 'Infrastructure')}</div>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2"><Server size={12} className="shrink-0 mt-0.5 text-[#0077B5]" /><span><strong>Cosmos DB:</strong> <TechBadge label="audits" /> — Partition: <TechBadge label="/id" />. docType: "audit-session".</span></div>
                  <div className="flex items-start gap-2"><Globe size={12} className="shrink-0 mt-0.5 text-[#0077B5]" /><span><strong>API:</strong> <TechBadge label="/api/audits" /> — GET (?status=, ?createdBy=), POST/PUT, DELETE. {t('Server-seitig stripMeta().', 'Server-side stripMeta().')}</span></div>
                  <div className="flex items-start gap-2"><HardDrive size={12} className="shrink-0 mt-0.5 text-[#0077B5]" /><span><strong>IndexedDB v3:</strong> {t('Object Store "audits". Via loadAllData() mit 5 parallelen API-Calls geladen.', 'Object store "audits". Loaded via loadAllData() with 5 parallel API calls.')}</span></div>
                </div>
              </div>
              <div>
                <div className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('Komponenten', 'Components')}</div>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2"><Layout size={12} className="shrink-0 mt-0.5 text-[#0077B5]" /><span><TechBadge label="AuditModule.tsx" /> — {t('5 Sub-Views:', '5 sub-views:')} <span className="font-mono opacity-60">landing | setup | cart | summary | review</span></span></div>
                  <div className="flex items-start gap-2"><Layers size={12} className="shrink-0 mt-0.5 text-[#0077B5]" /><span>AuditSetup, AuditCart, AuditCartItem, AuditSummary, AuditReview, ConfettiBurst</span></div>
                  <div className="flex items-start gap-2"><Shield size={12} className="shrink-0 mt-0.5 text-[#0077B5]" /><span><TechBadge label="activeSession" /> → <TechBadge label="onCompleteAudit" /> → handleAuditComplete() in App.tsx</span></div>
                </div>
              </div>
              <div>
                <div className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>handleAuditComplete()</div>
                <div className={`space-y-1 font-mono text-[10px] p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div className="opacity-60">// 1. {t('Session speichern', 'Save session')}</div>
                  <div>setAuditSessions(prev =&gt; findIndex → update or prepend)</div>
                  <div>auditsApi.upsert(session) <span className="opacity-40">// offline queue fallback</span></div>
                  <div className="opacity-60">// 2. {t('Nur wenn approved:', 'Only if approved:')}</div>
                  <div>markWrite() <span className="opacity-40">// K14: 15s cooldown</span></div>
                  <div>items.forEach → StockLog (add | write-off)</div>
                  <div>setInventory → stockApi.upsert() <span className="opacity-40">// inline write-through</span></div>
                  <div>setStockLogs → localStorage (max 500)</div>
                  <div className="opacity-60">// 3. {t('Benachrichtigung', 'Notification')}</div>
                  <div>addNotification(type, title, message)</div>
                </div>
              </div>
              <div>
                <div className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('Zugriff', 'Access')}</div>
                <p>{t('MODULE_FEATURE_MAP: \'audit\': \'audit\'. Admins sehen alles. Team braucht "audit" in featureAccess. Genehmigung nur für admin.', 'MODULE_FEATURE_MAP: \'audit\': \'audit\'. Admins see all. Team needs "audit" in featureAccess. Approval admin-only.')}</p>
              </div>
            </div>
          </DocCard>

          <DocCard title={t('Datenmodell', 'Data Model')} icon={<Layers size={20} />}>
            <div className="space-y-3 text-xs">
              <div className={`font-mono space-y-1 text-[10px] p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="font-bold text-xs text-[#0077B5]">AuditSession</div>
                <div>id, name, mode: <span className="opacity-60">'quick' | 'normal'</span></div>
                <div>status: <span className="opacity-60">'in-progress' | 'pending-review' | 'approved' | 'rejected' | 'cancelled'</span></div>
                <div>blindMode: <span className="opacity-60">boolean</span>, warehouse: <span className="opacity-60">string</span>, items: <span className="opacity-60">AuditItem[]</span></div>
                <div>createdAt, createdBy, createdByName, completedAt?</div>
                <div>reviewedAt?, reviewedBy?, reviewedByName?, reviewNote?</div>
                <div>docType: <span className="opacity-60">'audit-session'</span></div>
              </div>
              <div className={`font-mono space-y-1 text-[10px] p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="font-bold text-xs text-[#0077B5]">AuditItem</div>
                <div>id, itemId <span className="opacity-40">→ StockItem.id</span>, sku, name, warehouse</div>
                <div>expectedQty <span className="opacity-40">(stockLevel at add time)</span>, countedQty, variance <span className="opacity-40">(counted - expected)</span></div>
                <div>note?: <span className="opacity-60">string</span></div>
              </div>
            </div>
          </DocCard>

          <InfoBox>{t('Feature-Zugriff: Berechtigung "audit" im featureAccess-Array erforderlich. Admins haben automatisch Zugriff. Konfigurierbar über Team-Verwaltung.', 'Feature access: "audit" permission required in featureAccess array. Admins have automatic access. Configurable via Team Management.')}</InfoBox>
        </div>
      )}

      {/* SECTION 1: OVERVIEW */}
      {activeSection === 'intro' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Systemarchitektur', 'System Architecture')}</h2>
            <p className={`text-sm md:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('DOST Lager ist eine Progressive Web App (PWA) für den gesamten Procure-to-Pay-Prozess — von der Bestellanlage über den Wareneingang bis zur Reklamation und Lieferantenbewertung. Die App läuft auf Azure Static Web Apps mit einem Azure Functions v4 API-Backend und Azure Cosmos DB als Datenbank.', 'DOST Lager is a Progressive Web App (PWA) for the entire Procure-to-Pay process — from order creation through goods receipt to complaints management and supplier scoring. The app runs on Azure Static Web Apps with an Azure Functions v4 API backend and Azure Cosmos DB as the database.')}</p>
          </div>
          <DocCard title="Tech Stack" icon={<Zap size={20} />}>
            <div className="space-y-3">
              <div><p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Frontend</p><div className="flex flex-wrap gap-2"><TechBadge label="React 19" /><TechBadge label="TypeScript" /><TechBadge label="Tailwind CSS" /><TechBadge label="Vite" /><TechBadge label="Lucide Icons" /><TechBadge label="jsPDF" /></div></div>
              <div><p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Backend & Infrastructure</p><div className="flex flex-wrap gap-2"><TechBadge label="Azure Static Web Apps" /><TechBadge label="Azure Functions v4" /><TechBadge label="Azure Cosmos DB (NoSQL)" /><TechBadge label="Node.js 20" /></div></div>
              <div><p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Offline & Storage</p><div className="flex flex-wrap gap-2"><TechBadge label="IndexedDB" /><TechBadge label="Service Worker" /><TechBadge label="localStorage" /><TechBadge label="PWA Manifest" /></div></div>
            </div>
            <div className="space-y-3 text-xs mt-4">
              <div className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>App.tsx:</strong> {t('Zentraler State-Container mit ~40 Handlern.', 'Central state container with ~40 handlers.')}</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>api.ts:</strong> {t('REST-Client mit 3-Stufen-Fallback: API → IndexedDB Cache → Mock-Daten.', 'REST client with 3-tier fallback: API → IndexedDB cache → mock data.')}</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>types.ts:</strong> {t('Alle TypeScript-Interfaces.', 'All TypeScript interfaces.')}</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span><strong>data.ts:</strong> {t('Mock-Datenbank (Fallback). ~800 Artikel.', 'Mock database (fallback). ~800 items.')}</span></div>
            </div>
          </DocCard>
          <DocCard title={t('Design Philosophie', 'Design Philosophy')} icon={<Star size={20} />}>
            <div className="space-y-3 text-xs">
              <div><strong>Mobile First:</strong> {t('Touch-Targets ≥ 44px. Bottom Nav mobil, CSS hover-expand Sidebar Desktop.', 'Touch targets ≥ 44px. Bottom nav mobile, CSS hover-expand sidebar desktop.')}</div>
              <div><strong>Optimistic UI:</strong> {t('Sofortige State-Updates. API im Hintergrund. Offline-Queue bei Netzwerkfehler.', 'Instant state updates. API in background. Offline queue on network failure.')}</div>
              <div><strong>3 Themes:</strong> Light, Soft (Frosted Aura), Dark</div>
              <div><strong>Ledger Principle:</strong> {t('Nie löschen, nur archivieren. Audit Trail für jede Änderung.', 'Never delete, only archive. Audit trail for every change.')}</div>
              <div><strong>PWA:</strong> {t('Installierbar. Service Worker. Offline-fähig.', 'Installable. Service Worker. Offline-capable.')}</div>
            </div>
          </DocCard>
        </div>
      )}

      {/* SECTION 2: CLOUD & API */}
      {activeSection === 'cloud' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Cloud-Architektur & API', 'Cloud Architecture & API')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('Multi-User Cloud-Lösung auf Azure.', 'Multi-user cloud solution on Azure.')}</p>
          </div>
          <DocCard title={t('Azure Infrastruktur', 'Azure Infrastructure')} icon={<Server size={20} />}>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2"><Cloud size={14} className="text-[#0077B5] shrink-0 mt-0.5" /><span><strong>Azure Static Web Apps:</strong> {t('React-Frontend, HTTPS, CDN.', 'React frontend, HTTPS, CDN.')}</span></div>
              <div className="flex items-start gap-2"><Server size={14} className="text-[#0077B5] shrink-0 mt-0.5" /><span><strong>Azure Functions v4:</strong> {t('RESTful API, Serverless, TypeScript.', 'RESTful API, serverless, TypeScript.')}</span></div>
              <div className="flex items-start gap-2"><Database size={14} className="text-[#0077B5] shrink-0 mt-0.5" /><span><strong>Azure Cosmos DB:</strong> {t('NoSQL, Free Tier, JSON-Dokumente.', 'NoSQL, free tier, JSON documents.')}</span></div>
            </div>
          </DocCard>
          <DocCard title={t('Cosmos DB Container', 'Cosmos DB Containers')} icon={<Database size={20} />}>
            <div className="space-y-2 text-xs font-mono">
              {[
                { name: 'stock', pk: '/id', desc: t('~800 Artikel', '~800 items') },
                { name: 'purchase-orders', pk: '/id', desc: t('Bestellungen', 'Orders') },
                { name: 'receipts', pk: '/poId', desc: t('Multi-Typ: master, header, item, comment', 'Multi-type: master, header, item, comment') },
                { name: 'tickets', pk: '/poId', desc: t('Reklamationen', 'Complaints') },
                { name: 'delivery-logs', pk: '/receiptId', desc: t('Lieferprotokolle', 'Delivery logs') },
                { name: 'suppliers', pk: '/id', desc: t('Lieferanten', 'Suppliers') },
                { name: 'audits', pk: '/id', desc: t('Inventur-Sitzungen', 'Audit sessions') },
                { name: 'user-profiles', pk: '/id', desc: t('Benutzerprofile', 'User profiles') },
                { name: 'notifications', pk: '/userId', desc: t('Geplant', 'Planned') },
              ].map(c => (
                <div key={c.name} className={`rounded-lg p-2 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <strong>{c.name}</strong> <span className="opacity-60">partition: {c.pk}</span> — <span className="opacity-60 font-sans text-[10px]">{c.desc}</span>
                </div>
              ))}
            </div>
          </DocCard>
          <DocCard title={t('API Endpunkte', 'API Endpoints')} icon={<Globe size={20} />}>
            <div className="space-y-1.5 text-xs font-mono">
              <div>GET/POST /api/stock, /api/orders, /api/receipts, /api/tickets</div>
              <div>GET/POST /api/delivery-logs, /api/suppliers, /api/audits</div>
              <div>GET/POST/PUT/DELETE /api/user-profiles</div>
              <div>POST /api/receipts/bulk — {t('Massen-Upsert', 'Bulk upsert')}</div>
              <div>GET /api/health — {t('Diagnose', 'Diagnostic')}</div>
            </div>
          </DocCard>
        </div>
      )}

      {/* SECTION 3: OFFLINE */}
      {activeSection === 'offline' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('Offline-Betrieb & Synchronisation', 'Offline Operation & Synchronization')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('4 Schichten bilden die Offline-Infrastruktur.', '4 layers form the offline infrastructure.')}</p>
          </div>
          <DocCard title={t('Schicht 1: IndexedDB Cache', 'Layer 1: IndexedDB Cache')} icon={<HardDrive size={20} />}>
            <div className="space-y-2 text-xs">
              <p>{t('procureflow-cache (v3). Stores: stock, orders, receipts, tickets, audits + _meta + _writeQueue.', 'procureflow-cache (v3). Stores: stock, orders, receipts, tickets, audits + _meta + _writeQueue.')}</p>
              <p><TechBadge label="offlineDb.ts" /> — cacheCollection(), getCachedAppData(), cacheAllData()</p>
            </div>
          </DocCard>
          <DocCard title={t('Schicht 2: Offline Write Queue', 'Layer 2: Offline Write Queue')} icon={<RefreshCw size={20} />}>
            <div className="space-y-2 text-xs">
              <p><TechBadge label="offlineQueue.ts" /> — {t('FIFO, max 5 Retries. Cross-Browser: "Failed to fetch", "Load failed" (iOS), "NetworkError".', 'FIFO, max 5 retries. Cross-browser: "Failed to fetch", "Load failed" (iOS), "NetworkError".')}</p>
              <p><strong>{t('4-Stufen Sync-Schutz', '4-layer sync guard')}:</strong> {t('navigator.onLine → pendingWritesRef → K14 15s Cooldown → source === api only', 'navigator.onLine → pendingWritesRef → K14 15s cooldown → source === api only')}</p>
            </div>
          </DocCard>
          <DocCard title={t('Schicht 3: Service Worker', 'Layer 3: Service Worker')} icon={<Globe size={20} />}>
            <div className="space-y-2 text-xs"><p><TechBadge label="public/sw.js" /> — {t('App Shell: stale-while-revalidate. Assets: cache-first. API: network-first. Writes: passthrough.', 'App shell: stale-while-revalidate. Assets: cache-first. API: network-first. Writes: passthrough.')}</p></div>
          </DocCard>
          <DocCard title={t('Schicht 4: Sync-Indikator', 'Layer 4: Sync Indicator')} icon={<Wifi size={20} />}>
            <div className="space-y-2 text-xs">
              <div className="space-y-1.5 ml-2">
                <div className="flex items-center gap-2"><Cloud size={12} className="text-emerald-500" /> <strong className="text-emerald-500">{t('Verbunden', 'Connected')}</strong></div>
                <div className="flex items-center gap-2"><RefreshCw size={12} className="text-amber-500" /> <strong className="text-amber-500">{t('X ausstehend', 'X pending')}</strong></div>
                <div className="flex items-center gap-2"><span className="flex items-center gap-0.5"><WifiOff size={12} className="text-orange-500" /><Database size={10} className="text-orange-500" /></span> <strong className="text-orange-500">{t('Offline', 'Offline')}</strong></div>
                <div className="flex items-center gap-2"><Database size={12} className="text-amber-500 animate-pulse" /> <strong className="text-amber-500">{t('Synchronisiere…', 'Syncing…')}</strong></div>
              </div>
            </div>
          </DocCard>
        </div>
      )}

      {/* SECTION 4: MODULES */}
      {activeSection === 'modules' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('App Module', 'App Modules')}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('Jedes Modul ist eine eigene React-Komponente.', 'Each module is its own React component.')}</p>
          </div>
          <Collapsible id="mod-dashboard" title={t('Dashboard (Lager)', 'Dashboard')} icon={<BarChart3 size={20} />}><div className="space-y-2 text-xs"><p>{t('4 KPI-Karten, Quick-Actions, Activity Feed (letzte 10 Einträge).', '4 KPI cards, quick actions, activity feed (last 10 entries).')}</p><p><TechBadge label="Dashboard.tsx" /> <TechBadge label="InsightsRow.tsx" /></p></div></Collapsible>
          <Collapsible id="mod-inventory" title={t('Artikelverwaltung', 'Inventory')} icon={<Box size={20} />}><div className="space-y-2 text-xs"><p>{t('~800 Artikel. Grid/List. Volltextsuche. Inline +/−. CSV-Export. Lagerort ComboboxSelect.', '~800 items. Grid/list. Full-text search. Inline +/−. CSV export. Location ComboboxSelect.')}</p><p><TechBadge label="InventoryView.tsx" /> <TechBadge label="ItemModal.tsx" /></p></div></Collapsible>
          <Collapsible id="mod-orders" title={t('Bestellverwaltung', 'Orders')} icon={<FileText size={20} />}><div className="space-y-2 text-xs"><p>{t('Filter-Tabs, Status-Badges, Archivierung, Stornierung mit Kaskade. Smart Import. Lager + Projekt.', 'Filter tabs, status badges, archiving, cancellation with cascade. Smart import. Warehouse + project.')}</p><p><TechBadge label="OrderManagement.tsx" /> <TechBadge label="CreateOrderWizard.tsx" /></p></div></Collapsible>
          <Collapsible id="mod-receipt" title={t('Wareneingang', 'Goods Receipt')} icon={<ClipboardList size={20} />}><div className="space-y-2 text-xs"><p>{t('3-Badge-System. Lieferverlauf. Retouren mit Bestandskorrektur + Tickets + Auto-Kommentare.', '3-badge system. Delivery history. Returns with stock correction + tickets + auto-comments.')}</p><p><TechBadge label="ReceiptManagement.tsx" /> <TechBadge label="GoodsReceiptFlow.tsx" /></p></div></Collapsible>
          <Collapsible id="mod-suppliers" title={t('Lieferantenbewertung', 'Supplier Scoring')} icon={<Users size={20} />}><div className="text-xs"><p>{t('Automatische Bewertung 0-100 basierend auf Lieferhistorie.', 'Automatic scoring 0-100 based on delivery history.')}</p><p><TechBadge label="SupplierView.tsx" /></p></div></Collapsible>
          <Collapsible id="mod-stocklog" title={t('Lagerprotokoll', 'Stock Logs')} icon={<History size={20} />}><div className="space-y-2 text-xs"><p>{t('5 Filter-Tabs: Alle, Manuell, PO-Normal, PO-Projekt, Inventur. Audit-Einträge mit SCHNELL/INVENTUR und ABSCHREIBUNG Badges.', '5 filter tabs: All, Manual, PO-Normal, PO-Project, Audit. Audit entries with SCHNELL/INVENTUR and ABSCHREIBUNG badges.')}</p><p><TechBadge label="StockLogView.tsx" /></p></div></Collapsible>
          <Collapsible id="mod-tickets" title={t('Ticket-System', 'Tickets')} icon={<Ticket size={20} />}><div className="text-xs"><p>{t('Auto/manuell bei Abweichungen. Open → Closed. Konfigurierbar über Globale Einstellungen.', 'Auto/manual on deviations. Open → Closed. Configurable via Global Settings.')}</p><p><TechBadge label="TicketSystem.tsx" /></p></div></Collapsible>
        </div>
      )}

      {/* SECTION 5: ORDERS DETAIL */}
      {activeSection === 'orders' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div><h2 className="text-2xl font-bold mb-2">{t('Bestellungen — Detail', 'Orders — Detail')}</h2></div>
          <DocCard title={t('Bestelltypen', 'Order Types')} icon={<FileText size={20} />}><div className="space-y-2 text-xs"><div className="flex items-start gap-2"><Box size={14} className="text-slate-500 shrink-0 mt-0.5" /><span><strong>Lager:</strong> {t('Bestand wird addiert.', 'Stock added.')}</span></div><div className="flex items-start gap-2"><Briefcase size={14} className="text-blue-500 shrink-0 mt-0.5" /><span><strong>Projekt:</strong> {t('Bestand wird NICHT addiert.', 'Stock NOT added.')}</span></div></div></DocCard>
          <DocCard title={t('Kaskadierende Aktionen', 'Cascading Actions')} icon={<GitBranch size={20} />}><div className="space-y-2 text-xs"><p><strong>{t('Archivierung', 'Archive')}:</strong> {t('isArchived + Receipts archiviert + Tickets geschlossen.', 'isArchived + receipts archived + tickets closed.')}</p><p><strong>{t('Stornierung', 'Cancel')}:</strong> {t('Status Storniert + Master/Headers Storniert + Tickets geschlossen.', 'Status Cancelled + master/headers cancelled + tickets closed.')}</p></div></DocCard>
          <DocCard title="Smart Import" icon={<Sparkles size={20} />}><div className="text-xs"><p>{t('Text-Import mit automatischer Artikelerkennung. Fuzzy-Match auf ~800 Artikel.', 'Text import with automatic item recognition. Fuzzy match on ~800 items.')}</p></div></DocCard>
        </div>
      )}

      {/* SECTION 6: RECEIPT DETAIL */}
      {activeSection === 'receipt' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div><h2 className="text-2xl font-bold mb-2">{t('Wareneingang — Detail', 'Goods Receipt — Detail')}</h2></div>
          <DocCard title={t('Prüfungs-Flow', 'Inspection Flow')} icon={<ClipboardList size={20} />}><div className="text-xs"><p>{t('Vollbild-Wizard: Lieferschein → Mengen prüfen → Abweichungen dokumentieren → Buchen.', 'Full-screen wizard: delivery note → check quantities → document deviations → book.')}</p></div></DocCard>
          <DocCard title={t('Retouren', 'Returns')} icon={<Truck size={20} />}><div className="text-xs"><p>{t('Grund + Versandart + Tracking. Auto: Bestandskorrektur, PO-Reset, Ticket, Kommentar, Cross-Post.', 'Reason + carrier + tracking. Auto: stock correction, PO reset, ticket, comment, cross-post.')}</p></div></DocCard>
          <DocCard title={t('API Persistierung', 'API Persistence')} icon={<Database size={20} />}><div className="text-xs font-mono text-[10px]"><p>setPurchaseOrders → ordersApi.upsert()</p><p>setReceiptMasters → receiptsApi.upsert()</p><p>setInventory → stockApi.upsert()</p><p>{t('Alles inline in setState — keine stale Closures.', 'All inline in setState — no stale closures.')}</p></div></DocCard>
        </div>
      )}

      {/* SECTION 7: DATA MODEL */}
      {activeSection === 'datamodel' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div><h2 className="text-2xl font-bold mb-2">{t('Daten-Modell', 'Data Model')}</h2></div>
          <Collapsible id="dm-po" title="PurchaseOrder" icon={<FileText size={20} />}><div className="text-xs font-mono"><div>id, supplier, status, items: PurchaseOrderItem[], isArchived, linkedReceiptId</div><div className="mt-1 opacity-70">{t('Container: purchase-orders (/id)', 'Container: purchase-orders (/id)')}</div></div></Collapsible>
          <Collapsible id="dm-rm" title="ReceiptMaster" icon={<ClipboardList size={20} />}><div className="text-xs font-mono"><div>id, poId, status, deliveries: DeliveryLog[], docType: "master"</div><div className="mt-1 opacity-70">{t('Container: receipts (/poId)', 'Container: receipts (/poId)')}</div></div></Collapsible>
          <Collapsible id="dm-item" title="StockItem" icon={<Box size={20} />}><div className="text-xs font-mono"><div>id, sku, name, system, stockLevel, minStock, warehouseLocation</div><div className="mt-1 opacity-70">{t('Container: stock (/id)', 'Container: stock (/id)')}</div></div></Collapsible>
          <Collapsible id="dm-stocklog" title="StockLog" icon={<History size={20} />}><div className="text-xs font-mono space-y-0.5"><div>id, timestamp, userId, userName, itemId, itemName</div><div>action: 'add' | 'remove' | 'write-off', quantity, warehouse</div><div>context: 'normal' | 'project' | 'manual' | 'po-normal' | 'po-project' | 'audit-quick' | 'audit-normal'</div><div>auditSessionId?, auditSessionName?, countedByName?, approvedByName?</div><div className="mt-1 opacity-70">{t('localStorage (max 500)', 'localStorage (max 500)')}</div></div></Collapsible>
          <Collapsible id="dm-ticket" title="Ticket" icon={<Ticket size={20} />}><div className="text-xs font-mono"><div>id, receiptId, subject, priority, status, type, messages[], poId</div><div className="mt-1 opacity-70">{t('Container: tickets (/poId)', 'Container: tickets (/poId)')}</div></div></Collapsible>
        </div>
      )}

      {/* SECTION 8: LOGIC */}
      {activeSection === 'logic' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div><h2 className="text-2xl font-bold mb-2">{t('Geschäftslogik', 'Business Logic')}</h2></div>
          <DocCard title={t('Bestandsberechnung', 'Stock Calculation')} icon={<Calculator size={20} />}><div className="text-xs font-mono"><div>Lager: newStock = current + quantityAccepted</div><div>Projekt: newStock = current (unchanged)</div><div>Return: newStock = current - returnQty</div><div>Audit: newStock = countedQty (direct set)</div></div></DocCard>
          <DocCard title={t('Write-Through Muster', 'Write-Through Pattern')} icon={<Database size={20} />}><div className="text-xs"><div className={`rounded-lg p-3 font-mono text-[10px] ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}><div>setState(prev =&gt; {'{'}</div><div className="ml-4">// compute + api.upsert(value) inline</div><div className="ml-4">return updatedState;</div><div>{'}'})</div></div><p className="mt-2">{t('Inline in setState = kein stale closure. Bei Netzwerkfehler → Offline-Queue.', 'Inline in setState = no stale closure. Network error → offline queue.')}</p></div></DocCard>
        </div>
      )}

      {/* SECTION 9: STATUSES */}
      {activeSection === 'statuses' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div><h2 className="text-2xl font-bold mb-2">{t('3-Badge Status System', '3-Badge Status System')}</h2></div>
          <DocCard title={t('Badge 1: Identität', 'Badge 1: Identity')} icon={<Briefcase size={20} />}><div className="text-xs"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>PROJEKT</span> / <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>LAGER</span></div></DocCard>
          <DocCard title={t('Badge 2: Prozess-Status', 'Badge 2: Process')} icon={<GitBranch size={20} />}><div className="space-y-1 text-xs"><div>Gebucht → Wartet → Lieferung heute/morgen → Verspätet → Teillieferung → Vollständig → Abgeschlossen</div><div>{t('Qualität:', 'Quality:')} Schaden / Falsch / Übermenge / Abgelehnt / Storniert</div></div></DocCard>
          <DocCard title={t('Badge 3: Tickets', 'Badge 3: Tickets')} icon={<Ticket size={20} />}><div className="text-xs">{t('Anzahl offener Tickets + höchste Priorität. Konfigurierbar via Globale Einstellungen.', 'Count of open tickets + highest priority. Configurable via Global Settings.')}</div></DocCard>
        </div>
      )}

      {/* SECTION 10: SETTINGS */}
      {activeSection === 'settings' && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div><h2 className="text-2xl font-bold mb-2">{t('Einstellungen', 'Settings')}</h2></div>
          <DocCard title={t('Benutzer-Einstellungen', 'User Settings')} icon={<Settings size={20} />}><div className="text-xs"><p>{t('Theme (Light/Soft/Dark), Artikel-Ansicht (Grid/List), Daten-Import/Reset.', 'Theme (Light/Soft/Dark), item view (Grid/List), data import/reset.')}</p></div></DocCard>
          <DocCard title={t('Globale Einstellungen', 'Global Settings')} icon={<Shield size={20} />}><div className="space-y-2 text-xs"><div>{t('Status-Spalte Reihenfolge, Smart Import, Lieferdatum Pflicht, Ticket-Automation, Timeline Auto-Post, Lagerorte, Audit Trail.', 'Status column order, Smart Import, delivery date required, ticket automation, timeline auto-post, warehouse locations, audit trail.')}</div><div>{t('Nur für Admins oder Benutzer mit "global-settings" Berechtigung.', 'Only for admins or users with "global-settings" permission.')}</div></div></DocCard>
          <InfoBox>{t('Authentifizierung via Microsoft Entra ID. Benutzerprofile in Cosmos DB mit rollenbasierter Zugriffskontrolle (admin/team) und Feature-Toggles.', 'Authentication via Microsoft Entra ID. User profiles in Cosmos DB with role-based access control (admin/team) and feature toggles.')}</InfoBox>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-12 pt-6 border-t text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p className="text-xs text-slate-500">DOST Lager v0.4.0 — {t('Letzte Aktualisierung', 'Last updated')}: {t('März', 'March')} 2026</p>
        <p className="text-[10px] text-slate-500 mt-1">{t('Entwickelt von DOST INFOSYS', 'Developed by DOST INFOSYS')}</p>
      </div>
    </div>
  );
};