import React, { useState } from 'react';
import { Theme, ActiveModule, AuditEntry } from '../types';
import { 
  ArrowLeft, Shield, Sparkles, Calendar, Ticket, List,
  AlertTriangle, PlusCircle, AlertCircle, Ban, ChevronDown, ChevronUp,
  Info, Clock, FileText, Eye, Lock, MapPin, GripVertical, 
  Pencil, Trash2, Plus, Check, X, ArrowUp, ArrowDown
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
  // Lagerorte
  lagerortOptions: string[];
  onSetLagerortOptions: (opts: string[]) => void;
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
  lagerortOptions,
  onSetLagerortOptions
}) => {
  const isDark = theme === 'dark';
  const [isTicketConfigOpen, setIsTicketConfigOpen] = useState(false);
  const [isTimelineConfigOpen, setIsTimelineConfigOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isLagerorteOpen, setIsLagerorteOpen] = useState(false);
  const [editingLagerortIdx, setEditingLagerortIdx] = useState<number | null>(null);
  const [editingLagerortVal, setEditingLagerortVal] = useState('');
  const [newLagerortVal, setNewLagerortVal] = useState('');
  const [showAddLagerort, setShowAddLagerort] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // ── Reusable Sub-Components ──

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-[#0077B5]' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );

  const SettingRow = ({ icon, label, description, action }: {
    icon: React.ReactNode; label: string; description: string; action: React.ReactNode;
  }) => (
    <div className={`flex items-center justify-between p-4 border-b last:border-b-0 ${
      isDark ? 'border-slate-800' : 'border-slate-100'
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
    <div className={`px-6 py-3 border-b flex items-center gap-3 ${
      isDark ? 'bg-[#0077B5]/5 border-[#0077B5]/20' : 'bg-[#0077B5]/5 border-[#0077B5]/10'
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
          className={`flex items-center gap-2 text-sm font-bold mb-4 transition-colors ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
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

        <div className={`mt-4 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs ${
          isDark
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
      <div className={`rounded-2xl border overflow-hidden mb-6 ${
        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
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
      <div className={`rounded-2xl border overflow-hidden mb-6 ${
        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
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
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  requireDeliveryDate
                    ? 'bg-[#0077B5] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Pflicht
              </button>
              <button
                onClick={() => onSetRequireDeliveryDate(false)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  !requireDeliveryDate
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
      <div className={`rounded-2xl border overflow-hidden mb-6 ${
        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button
          onClick={() => setIsTicketConfigOpen(!isTicketConfigOpen)}
          className={`w-full transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <div className={`px-6 py-3 flex items-center justify-between ${
            isDark ? 'bg-[#0077B5]/5' : 'bg-[#0077B5]/5'
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isDark ? 'bg-[#0077B5]/20 text-[#0077B5]' : 'bg-[#0077B5]/10 text-[#0077B5]'
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
            <div className={`mx-4 mt-4 mb-3 p-3 rounded-xl border text-xs ${
              isDark ? 'border-slate-700 text-slate-400 bg-slate-800/50' : 'border-slate-200 text-slate-600 bg-slate-50'
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
      <div className={`rounded-2xl border overflow-hidden mb-6 ${
        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button
          onClick={() => setIsTimelineConfigOpen(!isTimelineConfigOpen)}
          className={`w-full transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <div className={`px-6 py-3 flex items-center justify-between ${
            isDark ? 'bg-emerald-500/5' : 'bg-emerald-500/5'
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
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
            <div className={`mx-4 mt-4 mb-3 p-3 rounded-xl border text-xs ${
              isDark ? 'border-slate-700 text-slate-400 bg-slate-800/50' : 'border-slate-200 text-slate-600 bg-slate-50'
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
          CATEGORY 4: LAGERORTE VERWALTUNG
          ═══════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border overflow-hidden mb-6 ${
        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button
          onClick={() => setIsLagerorteOpen(!isLagerorteOpen)}
          className={`w-full transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <div className={`px-6 py-3 flex items-center justify-between ${
            isDark ? 'bg-purple-500/5' : 'bg-purple-500/5'
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
                  Hinzufügen, bearbeiten, löschen und Reihenfolge anpassen
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-500/10 text-purple-600'
              }`}>
                {lagerortOptions.length} Orte
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
            <div className={`mx-4 mt-4 mb-3 p-3 rounded-xl border text-xs ${
              isDark ? 'border-slate-700 text-slate-400 bg-slate-800/50' : 'border-slate-200 text-slate-600 bg-slate-50'
            }`}>
              <div className="flex gap-3">
                <Info size={16} className="shrink-0 mt-0.5 text-purple-500" />
                <p>
                  Ordnen Sie die am häufigsten genutzten Lagerorte nach oben. Auf Desktop können Sie per Drag & Drop sortieren, auf Mobil mit den Pfeiltasten.
                </p>
              </div>
            </div>

            {/* Lagerort List */}
            <div className="max-h-[50vh] overflow-y-auto">
              {lagerortOptions.map((opt, idx) => (
                <div
                  key={`${opt}-${idx}`}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={() => {
                    if (dragIdx !== null && dragIdx !== idx) {
                      const updated = [...lagerortOptions];
                      const [moved] = updated.splice(dragIdx, 1);
                      updated.splice(idx, 0, moved);
                      onSetLagerortOptions(updated);
                    }
                    setDragIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  className={`flex items-center gap-2 px-4 py-2.5 border-b transition-all ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  } ${dragOverIdx === idx ? (isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200') : ''
                  } ${dragIdx === idx ? 'opacity-40' : ''}`}
                >
                  {/* Drag Handle */}
                  <div className={`cursor-grab active:cursor-grabbing p-1 rounded ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-300 hover:text-slate-500'}`}>
                    <GripVertical size={16} />
                  </div>

                  {/* Position Number */}
                  <span className={`text-[10px] font-mono font-bold w-5 text-center shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>{idx + 1}</span>

                  {/* Name (editable) */}
                  {editingLagerortIdx === idx ? (
                    <div className="flex-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingLagerortVal}
                        onChange={(e) => setEditingLagerortVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingLagerortVal.trim()) {
                            const updated = [...lagerortOptions];
                            updated[idx] = editingLagerortVal.trim();
                            onSetLagerortOptions(updated);
                            setEditingLagerortIdx(null);
                          }
                          if (e.key === 'Escape') setEditingLagerortIdx(null);
                        }}
                        className={`flex-1 px-2 py-1 rounded-lg border text-sm outline-none ${
                          isDark ? 'bg-slate-800 border-slate-600 text-white focus:border-purple-500' : 'bg-white border-slate-300 focus:border-purple-500'
                        }`}
                        autoFocus
                      />
                      <button onClick={() => {
                        if (editingLagerortVal.trim()) {
                          const updated = [...lagerortOptions];
                          updated[idx] = editingLagerortVal.trim();
                          onSetLagerortOptions(updated);
                        }
                        setEditingLagerortIdx(null);
                      }} className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10"><Check size={14} /></button>
                      <button onClick={() => setEditingLagerortIdx(null)} className={`p-1 rounded ${isDark ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}><X size={14} /></button>
                    </div>
                  ) : (
                    <span className={`flex-1 text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{opt}</span>
                  )}

                  {/* Action Buttons */}
                  {editingLagerortIdx !== idx && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Mobile Up/Down */}
                      <button
                        onClick={() => {
                          if (idx > 0) {
                            const updated = [...lagerortOptions];
                            [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                            onSetLagerortOptions(updated);
                          }
                        }}
                        disabled={idx === 0}
                        className={`md:hidden p-1.5 rounded transition-colors ${idx === 0 ? 'opacity-20' : isDark ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      ><ArrowUp size={14} /></button>
                      <button
                        onClick={() => {
                          if (idx < lagerortOptions.length - 1) {
                            const updated = [...lagerortOptions];
                            [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                            onSetLagerortOptions(updated);
                          }
                        }}
                        disabled={idx === lagerortOptions.length - 1}
                        className={`md:hidden p-1.5 rounded transition-colors ${idx === lagerortOptions.length - 1 ? 'opacity-20' : isDark ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      ><ArrowDown size={14} /></button>

                      {/* Edit */}
                      <button
                        onClick={() => { setEditingLagerortIdx(idx); setEditingLagerortVal(opt); }}
                        className={`p-1.5 rounded transition-colors ${isDark ? 'text-slate-500 hover:bg-slate-800 hover:text-blue-400' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-600'}`}
                      ><Pencil size={14} /></button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          const updated = lagerortOptions.filter((_, i) => i !== idx);
                          onSetLagerortOptions(updated);
                        }}
                        className={`p-1.5 rounded transition-colors ${isDark ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                      ><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add New */}
            <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              {!showAddLagerort ? (
                <button
                  onClick={() => setShowAddLagerort(true)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-colors ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-purple-400' : 'border-slate-200 hover:bg-slate-50 text-purple-600'
                  }`}
                >
                  <Plus size={16} /> Neuer Lagerort
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLagerortVal}
                    onChange={(e) => setNewLagerortVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLagerortVal.trim()) {
                        onSetLagerortOptions([...lagerortOptions, newLagerortVal.trim()]);
                        setNewLagerortVal('');
                        setShowAddLagerort(false);
                      }
                      if (e.key === 'Escape') { setShowAddLagerort(false); setNewLagerortVal(''); }
                    }}
                    placeholder="Name des Lagerorts..."
                    className={`flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-white border-slate-300 focus:border-purple-500'
                    }`}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (newLagerortVal.trim()) {
                        onSetLagerortOptions([...lagerortOptions, newLagerortVal.trim()]);
                        setNewLagerortVal('');
                        setShowAddLagerort(false);
                      }
                    }}
                    disabled={!newLagerortVal.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-purple-500"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => { setShowAddLagerort(false); setNewLagerortVal(''); }}
                    className={`px-3 py-2 rounded-xl text-sm ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          CATEGORY 5: AUDIT TRAIL
          ═══════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border overflow-hidden mb-6 ${
        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button
          onClick={() => setIsAuditOpen(!isAuditOpen)}
          className={`w-full transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <div className={`px-6 py-3 flex items-center justify-between ${
            isDark ? 'bg-[#0077B5]/5' : 'bg-[#0077B5]/5'
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
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
