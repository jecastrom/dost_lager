import React, { useState } from 'react';
import { Theme, ActiveModule, AuditEntry, LagerortCategory } from '../types';
import {
  ArrowLeft, Shield, Sparkles, Calendar, Ticket, List,
  AlertTriangle, PlusCircle, AlertCircle, Ban, ChevronDown, ChevronUp,
  Info, Clock, FileText, Eye, EyeOff, Lock, MapPin, GripVertical,
  Pencil, Trash2, Plus, Check, X, ArrowUp, ArrowDown, FolderOpen, Layers,
  Users, ChevronRight, ClipboardCheck
} from 'lucide-react';
import { TicketConfig, TimelineConfig } from './SettingsPage';
import { MessageSquare } from 'lucide-react';

interface GlobalSettingsPageProps {
  theme: Theme;
  onNavigate: (module: ActiveModule) => void;
  // Tabellen & Anzeige
  statusColumnFirst: boolean;
  onSetStatusColumnFirst: (val: boolean) => void;
  // Einkauf & Bestellungen
  enableSmartImport: boolean;
  onSetEnableSmartImport: (enabled: boolean) => void;
  requireDeliveryDate: boolean;
  onSetRequireDeliveryDate: (required: boolean) => void;
  // Ticket-Automatisierung
  ticketConfig: TicketConfig;
  onSetTicketConfig: (config: TicketConfig) => void;
  // Timeline Auto-Posts (Historie & Notizen)
  timelineConfig: TimelineConfig;
  onSetTimelineConfig: (config: TimelineConfig) => void;
  // Audit Trail
  auditTrail?: AuditEntry[];
  // Lagerorte (categorized)
  lagerortCategories: LagerortCategory[];
  onSetLagerortCategories: (cats: LagerortCategory[]) => void;
  // Inventur — Global Blind Mode
  globalBlindMode: boolean;
  onSetGlobalBlindMode: (val: boolean) => void;
}

export const GlobalSettingsPage: React.FC<GlobalSettingsPageProps> = ({
  theme,
  onNavigate,
  statusColumnFirst,
  onSetStatusColumnFirst,
  enableSmartImport,
  onSetEnableSmartImport,
  requireDeliveryDate,
  onSetRequireDeliveryDate,
  ticketConfig,
  onSetTicketConfig,
  timelineConfig,
  onSetTimelineConfig,
  auditTrail = [],
  lagerortCategories,
  onSetLagerortCategories,
  globalBlindMode,
  onSetGlobalBlindMode,
}) => {
  const isDark = theme === 'dark';
  const [isTicketConfigOpen, setIsTicketConfigOpen] = useState(false);
  const [isTimelineConfigOpen, setIsTimelineConfigOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isLagerorteOpen, setIsLagerorteOpen] = useState(false);
  const [isInventurOpen, setIsInventurOpen] = useState(false);
  // Category-level editing
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  // Item-level editing (within a category)
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null); // "catId:idx"
  const [editingItemVal, setEditingItemVal] = useState('');
  const [addingItemCatId, setAddingItemCatId] = useState<string | null>(null);
  const [newItemVal, setNewItemVal] = useState('');
  // Drag state for items within a category
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragCatId, setDragCatId] = useState<string | null>(null);
  // Collapsed categories
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const toggleCatCollapse = (catId: string) => setCollapsedCats(prev => {
    const next = new Set(prev);
    next.has(catId) ? next.delete(catId) : next.add(catId);
    return next;
  });

  // Helpers for category mutations
  const totalLagerortCount = lagerortCategories.reduce((sum, c) => sum + c.items.length, 0);

  const updateCategoryItems = (catId: string, newItems: string[]) => {
    onSetLagerortCategories(lagerortCategories.map(c => c.id === catId ? { ...c, items: newItems } : c));
  };

  // ── Reusable Sub-Components ──

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#0077B5]' : 'bg-slate-300 dark:bg-slate-700'
        }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
    </button>
  );

  const SettingRow = ({ icon, label, description, action }: {
    icon: React.ReactNode; label: string; description: string; action: React.ReactNode;
  }) => (
    <div className={`flex items-center justify-between p-4 border-b last:border-b-0 ${isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
          {icon}
        </div>
        <div>
          <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{label}</div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>
      </div>
      <div>{action}</div>
    </div>
  );

  const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) => (
    <div className={`px-6 py-3 border-b flex items-center gap-3 ${isDark ? 'bg-[#0077B5]/5 border-[#0077B5]/20' : 'bg-[#0077B5]/5 border-[#0077B5]/10'
      }`}>
      <div className={`p-1.5 rounded-lg ${isDark ? 'bg-[#0077B5]/20 text-[#0077B5]' : 'bg-[#0077B5]/10 text-[#0077B5]'}`}>
        {icon}
      </div>
      <div>
        <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {title}
        </span>
        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {subtitle}
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* ── PAGE HEADER ── */}
      <div className="mb-8">
        <button
          onClick={() => onNavigate('settings')}
          className={`flex items-center gap-2 text-sm font-bold mb-4 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          <ArrowLeft size={16} /> Zurück zu Einstellungen
        </button>

        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#0077B5]/20' : 'bg-[#0077B5]/10'}`}>
            <Shield size={28} className="text-[#0077B5]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Globale Einstellungen</h2>
            <p className="text-slate-500 text-sm">
              Diese Einstellungen gelten für alle Benutzer und beeinflussen das Systemverhalten.
            </p>
          </div>
        </div>
        {/* ═══ TEAM MANAGEMENT LINK ═══ */}
        <button
          onClick={() => onNavigate('team-management')}
          className={`w-full rounded-2xl border overflow-hidden mb-6 text-left transition-all group ${isDark ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
            : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm hover:shadow-md'
            }`}
        >
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0077B5]/20' : 'bg-[#0077B5]/10'}`}>
                <Users size={22} className="text-[#0077B5]" />
              </div>
              <div>
                <div className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Team-Verwaltung</div>
                <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Benutzer hinzufügen, Rollen & Zugriffsrechte verwalten
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="transition-transform group-hover:translate-x-1 text-[#0077B5]" />
          </div>
        </button>
        <div className={`mt-4 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs ${isDark
          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
          : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
          <Lock size={14} className="shrink-0" />
          <span>In Zukunft nur für Administratoren sichtbar. Änderungen wirken sich sofort auf alle Benutzer aus.</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CATEGORY 1: TABELLEN & ANZEIGE
          ═══════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border overflow-hidden mb-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
        <SectionHeader
          title="Tabellen & Anzeige"
          subtitle="Spaltenreihenfolge und Darstellung in Listen"
          icon={<List size={16} />}
        />
        <SettingRow
          icon={<Eye size={20} className="text-[#0077B5]" />}
          label="Status-Spalte zuerst in Tabellen"
          description="Zeigt die Status-Spalte als erste Spalte in den Bestell- und Wareneingangstabellen."
          action={<Toggle checked={statusColumnFirst} onChange={onSetStatusColumnFirst} />}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          CATEGORY 2: EINKAUF & BESTELLUNGEN
          ═══════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border overflow-hidden mb-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
        <SectionHeader
          title="Einkauf & Bestellungen"
          subtitle="Import-Funktionen und Pflichtfelder für neue Bestellungen"
          icon={<FileText size={16} />}
        />
        <SettingRow
          icon={<Sparkles size={20} className="text-[#0077B5]" />}
          label="Smart Import (PDF/Text)"
          description="Ermöglicht das automatische Auslesen von Bestellungen aus Texten oder Dokumenten."
          action={<Toggle checked={enableSmartImport} onChange={onSetEnableSmartImport} />}
        />
        <SettingRow
          icon={<Calendar size={20} className="text-[#0077B5]" />}
          label="Liefertermin als Pflichtfeld"
          description="Muss bei neuen Bestellungen angegeben werden."
          action={
            <div className={`flex p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button
                onClick={() => onSetRequireDeliveryDate(true)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${requireDeliveryDate
                  ? 'bg-[#0077B5] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                Pflicht
              </button>
              <button
                onClick={() => onSetRequireDeliveryDate(false)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!requireDeliveryDate
                  ? 'bg-[#0077B5] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                Optional
              </button>
            </div>
          }
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          CATEGORY 3: TICKET-AUTOMATISIERUNG
          ═══════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border overflow-hidden mb-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
        <button
          onClick={() => setIsTicketConfigOpen(!isTicketConfigOpen)}
          className={`w-full transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <div className={`px-6 py-3 flex items-center justify-between ${isDark ? 'bg-[#0077B5]/5' : 'bg-[#0077B5]/5'
            } ${isTicketConfigOpen ? 'border-b ' + (isDark ? 'border-slate-800' : 'border-slate-200') : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-[#0077B5]/20 text-[#0077B5]' : 'bg-[#0077B5]/10 text-[#0077B5]'}`}>
                <Ticket size={16} />
              </div>
              <div className="text-left">
                <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Ticket-Automatisierung
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Automatische Erstellung von Support-Fällen bei Abweichungen
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-[#0077B5]/20 text-[#0077B5]' : 'bg-[#0077B5]/10 text-[#0077B5]'
                }`}>
                {Object.values(ticketConfig).filter(Boolean).length}/5 aktiv
              </span>
              {isTicketConfigOpen
                ? <ChevronUp size={16} className="text-slate-400" />
                : <ChevronDown size={16} className="text-slate-400" />
              }
            </div>
          </div>
        </button>

        {isTicketConfigOpen && (
          <div>
            <div className={`mx-4 mt-4 mb-3 p-3 rounded-xl border text-xs ${isDark ? 'border-slate-700 text-slate-400 bg-slate-800/50' : 'border-slate-200 text-slate-600 bg-slate-50'
              }`}>
              <div className="flex gap-3">
                <Info size={16} className="shrink-0 mt-0.5 text-[#0077B5]" />
                <p>
                  Wählen Sie aus, bei welchen Abweichungen im Wareneingang automatisch ein
                  Support-Fall (Ticket) erstellt werden soll. Dies erleichtert die Nachverfolgung
                  von Reklamationen.
                </p>
              </div>
            </div>

            <SettingRow
              icon={<AlertTriangle size={20} className="text-amber-500" />}
              label="Bei Fehlmengen (Offen)"
              description="Erstellt Ticket wenn weniger geliefert als bestellt wurde."
              action={<Toggle checked={ticketConfig.missing} onChange={(v) => onSetTicketConfig({ ...ticketConfig, missing: v })} />}
            />
            <SettingRow
              icon={<PlusCircle size={20} className="text-orange-500" />}
              label="Bei Überlieferung (Zu viel)"
              description="Erstellt Ticket wenn mehr geliefert als bestellt wurde."
              action={<Toggle checked={ticketConfig.extra} onChange={(v) => onSetTicketConfig({ ...ticketConfig, extra: v })} />}
            />
            <SettingRow
              icon={<AlertCircle size={20} className="text-red-500" />}
              label="Bei Beschädigung"
              description="Erstellt Ticket bei gemeldetem Schaden."
              action={<Toggle checked={ticketConfig.damage} onChange={(v) => onSetTicketConfig({ ...ticketConfig, damage: v })} />}
            />
            <SettingRow
              icon={<Ban size={20} className="text-red-500" />}
              label="Bei Falschlieferung"
              description="Erstellt Ticket wenn falscher Artikel geliefert wurde."
              action={<Toggle checked={ticketConfig.wrong} onChange={(v) => onSetTicketConfig({ ...ticketConfig, wrong: v })} />}
            />
            <SettingRow
              icon={<Ban size={20} className="text-slate-500" />}
              label="Bei Ablehnung"
              description="Erstellt Ticket wenn Positionen komplett abgelehnt wurden."
              action={<Toggle checked={ticketConfig.rejected} onChange={(v) => onSetTicketConfig({ ...ticketConfig, rejected: v })} />}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          CATEGORY 3b: TIMELINE AUTO-POSTS (HISTORIE & NOTIZEN)
          ═══════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border overflow-hidden mb-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
        <button
          onClick={() => setIsTimelineConfigOpen(!isTimelineConfigOpen)}
          className={`w-full transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <div className={`px-6 py-3 flex items-center justify-between ${isDark ? 'bg-emerald-500/5' : 'bg-emerald-500/5'
            } ${isTimelineConfigOpen ? 'border-b ' + (isDark ? 'border-slate-800' : 'border-slate-200') : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}>
                <MessageSquare size={16} />
              </div>
              <div className="text-left">
                <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Historie & Notizen — Auto-Meldungen
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Automatische Einträge in der Nachverfolgungsleiste bei Abweichungen
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
                }`}>
                {Object.values(timelineConfig).filter(Boolean).length}/5 aktiv
              </span>
              {isTimelineConfigOpen
                ? <ChevronUp size={16} className="text-slate-400" />
                : <ChevronDown size={16} className="text-slate-400" />
              }
            </div>
          </div>
        </button>

        {isTimelineConfigOpen && (
          <div>
            <div className={`mx-4 mt-4 mb-3 p-3 rounded-xl border text-xs ${isDark ? 'border-slate-700 text-slate-400 bg-slate-800/50' : 'border-slate-200 text-slate-600 bg-slate-50'
              }`}>
              <div className="flex gap-3">
                <Info size={16} className="shrink-0 mt-0.5 text-emerald-500" />
                <p>
                  Wenn aktiviert, wird bei Abweichungen im Wareneingang automatisch ein Eintrag in der
                  „Historie & Notizen"-Leiste erstellt. Dies dient der lückenlosen Nachverfolgung ohne
                  ein separates Ticket zu eröffnen.
                </p>
              </div>
            </div>

            <SettingRow
              icon={<AlertTriangle size={20} className="text-amber-500" />}
              label="Bei Fehlmengen (Offen)"
              description="Erstellt Eintrag wenn weniger geliefert als bestellt wurde."
              action={<Toggle checked={timelineConfig.missing} onChange={(v) => onSetTimelineConfig({ ...timelineConfig, missing: v })} />}
            />
            <SettingRow
              icon={<PlusCircle size={20} className="text-orange-500" />}
              label="Bei Überlieferung (Zu viel)"
              description="Erstellt Eintrag wenn mehr geliefert als bestellt wurde."
              action={<Toggle checked={timelineConfig.extra} onChange={(v) => onSetTimelineConfig({ ...timelineConfig, extra: v })} />}
            />
            <SettingRow
              icon={<AlertCircle size={20} className="text-red-500" />}
              label="Bei Beschädigung"
              description="Erstellt Eintrag bei gemeldetem Schaden."
              action={<Toggle checked={timelineConfig.damage} onChange={(v) => onSetTimelineConfig({ ...timelineConfig, damage: v })} />}
            />
            <SettingRow
              icon={<Ban size={20} className="text-red-500" />}
              label="Bei Falschlieferung"
              description="Erstellt Eintrag wenn falscher Artikel geliefert wurde."
              action={<Toggle checked={timelineConfig.wrong} onChange={(v) => onSetTimelineConfig({ ...timelineConfig, wrong: v })} />}
            />
            <SettingRow
              icon={<Ban size={20} className="text-slate-500" />}
              label="Bei Ablehnung"
              description="Erstellt Eintrag wenn Positionen komplett abgelehnt wurden."
              action={<Toggle checked={timelineConfig.rejected} onChange={(v) => onSetTimelineConfig({ ...timelineConfig, rejected: v })} />}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          CATEGORY 3c: INVENTUR-EINSTELLUNGEN
          ═══════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border overflow-hidden mb-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <button
          onClick={() => setIsInventurOpen(!isInventurOpen)}
          className={`w-full transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <div className={`px-6 py-3 flex items-center justify-between ${isDark ? 'bg-amber-500/5' : 'bg-amber-500/5'
            } ${isInventurOpen ? 'border-b ' + (isDark ? 'border-slate-800' : 'border-slate-200') : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/10 text-amber-600'}`}>
                <ClipboardCheck size={16} />
              </div>
              <div className="text-left">
                <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Inventur
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Globale Einstellungen für Zählungen und Audits
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {globalBlindMode && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/10 text-amber-600'}`}>
                  Blind aktiv
                </span>
              )}
              {isInventurOpen
                ? <ChevronUp size={16} className="text-slate-400" />
                : <ChevronDown size={16} className="text-slate-400" />
              }
            </div>
          </div>
        </button>

        {isInventurOpen && (
          <div>
            <SettingRow
              icon={<EyeOff size={20} className={globalBlindMode ? 'text-amber-500' : isDark ? 'text-slate-400' : 'text-slate-500'} />}
              label="Blind Mode Permanent"
              description="Erwartete Bestände in allen Inventuren ausblenden — überschreibt die Einzelwahl pro Zählung."
              action={<Toggle checked={globalBlindMode} onChange={onSetGlobalBlindMode} />}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          CATEGORY 4: LAGERORTE VERWALTUNG (GROUPED)
          ═══════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border overflow-hidden mb-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
        <button
          onClick={() => setIsLagerorteOpen(!isLagerorteOpen)}
          className={`w-full transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <div className={`px-6 py-3 flex items-center justify-between ${isDark ? 'bg-purple-500/5' : 'bg-purple-500/5'
            } ${isLagerorteOpen ? 'border-b ' + (isDark ? 'border-slate-800' : 'border-slate-200') : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-500/10 text-purple-600'}`}>
                <MapPin size={16} />
              </div>
              <div className="text-left">
                <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Lagerorte verwalten
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Kategorien, Lagerorte und Reihenfolge verwalten
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-500/10 text-purple-600'
                }`}>
                {lagerortCategories.length} Kategorien · {totalLagerortCount} Orte
              </span>
              {isLagerorteOpen
                ? <ChevronUp size={16} className="text-slate-400" />
                : <ChevronDown size={16} className="text-slate-400" />
              }
            </div>
          </div>
        </button>

        {isLagerorteOpen && (
          <div>
            <div className={`mx-4 mt-4 mb-3 p-3 rounded-xl border text-xs ${isDark ? 'border-slate-700 text-slate-400 bg-slate-800/50' : 'border-slate-200 text-slate-600 bg-slate-50'
              }`}>
              <div className="flex gap-3">
                <Info size={16} className="shrink-0 mt-0.5 text-purple-500" />
                <p>
                  Lagerorte sind in Kategorien gruppiert. Innerhalb jeder Kategorie können Sie per Drag & Drop (Desktop) oder Pfeiltasten (Mobil) sortieren.
                </p>
              </div>
            </div>

            {/* Categories */}
            <div className="max-h-[60vh] overflow-y-auto">
              {lagerortCategories.map((cat, catIdx) => {
                const isCollapsed = collapsedCats.has(cat.id);

                return (
                  <div key={cat.id} className={catIdx > 0 ? `border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}` : ''}>
                    {/* Category Header */}
                    <div className={`flex items-center gap-2 px-4 py-2.5 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                      <button
                        onClick={() => toggleCatCollapse(cat.id)}
                        className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                      >
                        {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>

                      <FolderOpen size={14} className="text-purple-500" />

                      {editingCatId === cat.id ? (
                        <div className="flex-1 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editingCatName.trim()) {
                                onSetLagerortCategories(lagerortCategories.map(c => c.id === cat.id ? { ...c, name: editingCatName.trim() } : c));
                                setEditingCatId(null);
                              }
                              if (e.key === 'Escape') setEditingCatId(null);
                            }}
                            className={`flex-1 px-2 py-0.5 rounded-lg border text-xs font-bold outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white focus:border-purple-500' : 'bg-white border-slate-300 focus:border-purple-500'
                              }`}
                            autoFocus
                          />
                          <button onClick={() => {
                            if (editingCatName.trim()) onSetLagerortCategories(lagerortCategories.map(c => c.id === cat.id ? { ...c, name: editingCatName.trim() } : c));
                            setEditingCatId(null);
                          }} className="p-0.5 rounded text-emerald-500 hover:bg-emerald-500/10"><Check size={12} /></button>
                          <button onClick={() => setEditingCatId(null)} className={`p-0.5 rounded ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><X size={12} /></button>
                        </div>
                      ) : (
                        <span className={`flex-1 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {cat.name}
                        </span>
                      )}

                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                        {cat.items.length}
                      </span>

                      {editingCatId !== cat.id && (
                        <div className="flex items-center gap-0.5">
                          {/* Move category up/down */}
                          <button
                            onClick={() => {
                              if (catIdx > 0) {
                                const updated = [...lagerortCategories];
                                [updated[catIdx - 1], updated[catIdx]] = [updated[catIdx], updated[catIdx - 1]];
                                onSetLagerortCategories(updated);
                              }
                            }}
                            disabled={catIdx === 0}
                            className={`p-1 rounded transition-colors ${catIdx === 0 ? 'opacity-20' : isDark ? 'text-slate-500 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-200'}`}
                          ><ArrowUp size={12} /></button>
                          <button
                            onClick={() => {
                              if (catIdx < lagerortCategories.length - 1) {
                                const updated = [...lagerortCategories];
                                [updated[catIdx], updated[catIdx + 1]] = [updated[catIdx + 1], updated[catIdx]];
                                onSetLagerortCategories(updated);
                              }
                            }}
                            disabled={catIdx === lagerortCategories.length - 1}
                            className={`p-1 rounded transition-colors ${catIdx === lagerortCategories.length - 1 ? 'opacity-20' : isDark ? 'text-slate-500 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-200'}`}
                          ><ArrowDown size={12} /></button>

                          <button
                            onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                            className={`p-1 rounded transition-colors ${isDark ? 'text-slate-500 hover:bg-slate-700 hover:text-blue-400' : 'text-slate-400 hover:bg-slate-200 hover:text-blue-600'}`}
                          ><Pencil size={12} /></button>

                          {lagerortCategories.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Kategorie "${cat.name}" und alle ${cat.items.length} Lagerorte darin löschen?`)) {
                                  onSetLagerortCategories(lagerortCategories.filter(c => c.id !== cat.id));
                                }
                              }}
                              className={`p-1 rounded transition-colors ${isDark ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                            ><Trash2 size={12} /></button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Category Items */}
                    {!isCollapsed && (
                      <div>
                        {cat.items.map((item, idx) => {
                          const itemKey = `${cat.id}:${idx}`;
                          const isEditing = editingItemKey === itemKey;

                          return (
                            <div
                              key={itemKey}
                              draggable={!isEditing}
                              onDragStart={() => { setDragIdx(idx); setDragCatId(cat.id); }}
                              onDragOver={(e) => { e.preventDefault(); if (dragCatId === cat.id) setDragOverIdx(idx); }}
                              onDragLeave={() => setDragOverIdx(null)}
                              onDrop={() => {
                                if (dragCatId === cat.id && dragIdx !== null && dragIdx !== idx) {
                                  const updated = [...cat.items];
                                  const [moved] = updated.splice(dragIdx, 1);
                                  updated.splice(idx, 0, moved);
                                  updateCategoryItems(cat.id, updated);
                                }
                                setDragIdx(null); setDragOverIdx(null); setDragCatId(null);
                              }}
                              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); setDragCatId(null); }}
                              className={`flex items-center gap-2 px-4 pl-10 py-2 border-b transition-all ${isDark ? 'border-slate-800/50' : 'border-slate-100'
                                } ${dragCatId === cat.id && dragOverIdx === idx ? (isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200') : ''
                                } ${dragCatId === cat.id && dragIdx === idx ? 'opacity-40' : ''}`}
                            >
                              <div className={`cursor-grab active:cursor-grabbing p-0.5 rounded ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-300 hover:text-slate-500'}`}>
                                <GripVertical size={14} />
                              </div>

                              <span className={`text-[10px] font-mono font-bold w-4 text-center shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>{idx + 1}</span>

                              {isEditing ? (
                                <div className="flex-1 flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingItemVal}
                                    onChange={(e) => setEditingItemVal(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && editingItemVal.trim()) {
                                        const updated = [...cat.items]; updated[idx] = editingItemVal.trim();
                                        updateCategoryItems(cat.id, updated);
                                        setEditingItemKey(null);
                                      }
                                      if (e.key === 'Escape') setEditingItemKey(null);
                                    }}
                                    className={`flex-1 px-2 py-0.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-slate-800 border-slate-600 text-white focus:border-purple-500' : 'bg-white border-slate-300 focus:border-purple-500'
                                      }`}
                                    autoFocus
                                  />
                                  <button onClick={() => {
                                    if (editingItemVal.trim()) { const u = [...cat.items]; u[idx] = editingItemVal.trim(); updateCategoryItems(cat.id, u); }
                                    setEditingItemKey(null);
                                  }} className="p-0.5 rounded text-emerald-500 hover:bg-emerald-500/10"><Check size={12} /></button>
                                  <button onClick={() => setEditingItemKey(null)} className={`p-0.5 rounded ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><X size={12} /></button>
                                </div>
                              ) : (
                                <span className={`flex-1 text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item}</span>
                              )}

                              {!isEditing && (
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    onClick={() => { if (idx > 0) { const u = [...cat.items];[u[idx - 1], u[idx]] = [u[idx], u[idx - 1]]; updateCategoryItems(cat.id, u); } }}
                                    disabled={idx === 0}
                                    className={`md:hidden p-1 rounded transition-colors ${idx === 0 ? 'opacity-20' : isDark ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}
                                  ><ArrowUp size={12} /></button>
                                  <button
                                    onClick={() => { if (idx < cat.items.length - 1) { const u = [...cat.items];[u[idx], u[idx + 1]] = [u[idx + 1], u[idx]]; updateCategoryItems(cat.id, u); } }}
                                    disabled={idx === cat.items.length - 1}
                                    className={`md:hidden p-1 rounded transition-colors ${idx === cat.items.length - 1 ? 'opacity-20' : isDark ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}
                                  ><ArrowDown size={12} /></button>
                                  <button
                                    onClick={() => { setEditingItemKey(itemKey); setEditingItemVal(item); }}
                                    className={`p-1 rounded transition-colors ${isDark ? 'text-slate-500 hover:bg-slate-800 hover:text-blue-400' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-600'}`}
                                  ><Pencil size={12} /></button>
                                  <button
                                    onClick={() => updateCategoryItems(cat.id, cat.items.filter((_, i) => i !== idx))}
                                    className={`p-1 rounded transition-colors ${isDark ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                                  ><Trash2 size={12} /></button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add item to this category */}
                        <div className={`px-4 pl-10 py-2 ${isDark ? '' : ''}`}>
                          {addingItemCatId === cat.id ? (
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={newItemVal}
                                onChange={(e) => setNewItemVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newItemVal.trim()) {
                                    updateCategoryItems(cat.id, [...cat.items, newItemVal.trim()]);
                                    setNewItemVal('');
                                    // Keep open for rapid adding
                                  }
                                  if (e.key === 'Escape') { setAddingItemCatId(null); setNewItemVal(''); }
                                }}
                                placeholder="Neuer Lagerort..."
                                className={`flex-1 px-2 py-1.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-slate-800 border-slate-600 text-white focus:border-purple-500' : 'bg-white border-slate-300 focus:border-purple-500'
                                  }`}
                                autoFocus
                              />
                              <button onClick={() => {
                                if (newItemVal.trim()) { updateCategoryItems(cat.id, [...cat.items, newItemVal.trim()]); setNewItemVal(''); }
                              }} disabled={!newItemVal.trim()} className="px-2 py-1 bg-purple-600 text-white rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-purple-500"><Check size={12} /></button>
                              <button onClick={() => { setAddingItemCatId(null); setNewItemVal(''); }} className={`px-2 py-1 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}><X size={12} /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAddingItemCatId(cat.id); setNewItemVal(''); }}
                              className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}
                            >
                              <Plus size={12} /> Lagerort hinzufügen
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add New Category */}
            <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              {!showAddCategory ? (
                <button
                  onClick={() => setShowAddCategory(true)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-800 text-purple-400' : 'border-slate-200 hover:bg-slate-50 text-purple-600'
                    }`}
                >
                  <Layers size={16} /> Neue Kategorie
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCategoryName.trim()) {
                        onSetLagerortCategories([...lagerortCategories, {
                          id: `cat-${Date.now()}`,
                          name: newCategoryName.trim(),
                          items: []
                        }]);
                        setNewCategoryName('');
                        setShowAddCategory(false);
                      }
                      if (e.key === 'Escape') { setShowAddCategory(false); setNewCategoryName(''); }
                    }}
                    placeholder="Kategoriename..."
                    className={`flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-white border-slate-300 focus:border-purple-500'
                      }`}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (newCategoryName.trim()) {
                        onSetLagerortCategories([...lagerortCategories, { id: `cat-${Date.now()}`, name: newCategoryName.trim(), items: [] }]);
                        setNewCategoryName(''); setShowAddCategory(false);
                      }
                    }}
                    disabled={!newCategoryName.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-purple-500"
                  ><Check size={16} /></button>
                  <button
                    onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                    className={`px-3 py-2 rounded-xl text-sm ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                  ><X size={16} /></button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          CATEGORY 5: AUDIT TRAIL
          ═══════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border overflow-hidden mb-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
        <button
          onClick={() => setIsAuditOpen(!isAuditOpen)}
          className={`w-full transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <div className={`px-6 py-3 flex items-center justify-between ${isDark ? 'bg-[#0077B5]/5' : 'bg-[#0077B5]/5'
            } ${isAuditOpen ? 'border-b ' + (isDark ? 'border-slate-800' : 'border-slate-200') : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-[#0077B5]/20 text-[#0077B5]' : 'bg-[#0077B5]/10 text-[#0077B5]'}`}>
                <Clock size={16} />
              </div>
              <div className="text-left">
                <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Audit Trail
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Protokoll aller System- und Benutzeraktionen
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                {auditTrail.length} Einträge
              </span>
              {isAuditOpen
                ? <ChevronUp size={16} className="text-slate-400" />
                : <ChevronDown size={16} className="text-slate-400" />
              }
            </div>
          </div>
        </button>

        {isAuditOpen && (
          <div className="max-h-80 overflow-y-auto">
            {auditTrail.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Keine Audit-Einträge vorhanden.
              </div>
            ) : (
              <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {auditTrail.slice(0, 50).map(entry => (
                  <div key={entry.id} className={`px-4 py-3 text-xs ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {entry.event}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(entry.timestamp).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}{' '}
                        {new Date(entry.timestamp).toLocaleTimeString('de-DE', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>{entry.user}</span>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <span className="truncate max-w-[300px]">
                          — {Object.entries(entry.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500">
          Änderungen werden sofort gespeichert und gelten für alle Benutzer.
        </p>
      </div>
    </div>
  );
};
