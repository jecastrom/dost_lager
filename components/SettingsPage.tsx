import React, { useRef, useState } from 'react';
import { Theme, StockItem, RawGermanItem, ActiveModule, AuthUser } from '../types';
import { Book, ChevronRight, Moon, Sun, Monitor, Shield, Info, Upload, Trash2, Database, AlertCircle, CheckCircle2, Users, List, LayoutGrid, Eye, Smartphone } from 'lucide-react';

export interface TicketConfig {
  missing: boolean;   // Offen
  extra: boolean;     // Zu viel
  damage: boolean;    // Schaden
  wrong: boolean;     // Falsch
  rejected: boolean;  // Abgelehnt
}

export interface TimelineConfig {
  missing: boolean;
  extra: boolean;
  damage: boolean;
  wrong: boolean;
  rejected: boolean;
}

interface SettingsPageProps {
  theme: Theme;
  themePreference?: 'auto' | Theme;
  onSetTheme: (theme: 'auto' | Theme) => void;
  onNavigate: (module: ActiveModule) => void;
  onUploadData: (data: StockItem[]) => void;
  onClearData: () => void;
  hasCustomData: boolean;
  inventoryViewMode: 'grid' | 'list';
  onSetInventoryViewMode: (mode: 'grid' | 'list') => void;
  currentUser: AuthUser | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  theme,
  themePreference = 'auto',
  onSetTheme,
  onNavigate,
  onUploadData,
  onClearData,
  hasCustomData,
  inventoryViewMode,
  onSetInventoryViewMode,
  currentUser,
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to parse ASP.NET AJAX Date format "/Date(1732871995000)/"
  const parseAspDate = (dateStr: string | null): number | undefined => {
    if (!dateStr) return undefined;
    const match = dateStr.match(/\/Date\((\d+)\)\//);
    return match ? parseInt(match[1]) : undefined;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string;
        const rawData: RawGermanItem[] = JSON.parse(jsonContent);

        // Basic Validation
        if (!Array.isArray(rawData) || rawData.length === 0 || !rawData[0]["Artikel Nummer"]) {
          throw new Error("Ungültiges Format: JSON muss ein Array von Artikeln sein.");
        }

        // Map Data
        const mappedItems: StockItem[] = rawData.map((raw, index) => {
          return {
            id: raw["Artikel Nummer"] || `generated-id-${index}`,
            name: raw["Artikel Bezeichnung"] || "Unbekannter Artikel",
            sku: raw["Artikel Nummer"] || "UNKNOWN",
            system: raw["System"] || "Sonstiges",
            category: "Material",
            stockLevel: typeof raw["Anzahl"] === 'number' ? raw["Anzahl"] : 0,
            minStock: typeof raw["Mindestbestand"] === 'number' ? raw["Mindestbestand"] : 0,
            warehouseLocation: raw["Objekt"] || undefined,
            manufacturer: raw["Hersteller/Lieferant"] || undefined,
            isAkku: raw["Kapazität in Ah"] !== null && raw["Kapazität in Ah"] !== undefined && raw["Kapazität in Ah"] > 0,
            capacityAh: raw["Kapazität in Ah"] || undefined,
            notes: raw["Bemerkungen"] || undefined,
            lastUpdated: parseAspDate(raw["Geändert"]) || Date.now(),
            status: "Active"
          };
        });

        onUploadData(mappedItems);
        alert(`${mappedItems.length} Artikel erfolgreich importiert.`);

      } catch (err) {
        console.error(err);
        alert("Fehler beim Import: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  const SettingRow = ({ icon, label, description, action }: {
    icon: React.ReactNode; label: string; description: string; action: React.ReactNode;
  }) => (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-4 border-b last:border-b-0 ${isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={`p-2.5 rounded-xl shrink-0 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{label}</div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#0077B5]' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  // Visual theme preview card — mimics a miniature app screenshot
  const ThemeCard = ({ mode, label, isActive, onClick, colors }: {
    mode: 'auto' | Theme; label: string; isActive: boolean;
    onClick: (m: 'auto' | Theme) => void;
    colors: { bg: string; sidebar: string; header: string; line1: string; line2: string; accent: string; cardBorder: string };
  }) => (
    <button onClick={() => onClick(mode)}
      className={`group flex flex-col items-center gap-2 transition-all duration-200 ${isActive ? 'scale-[1.02]' : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}>
      <div className={`relative w-[100px] h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-200 shadow-sm
        ${isActive ? 'border-[#0077B5] ring-2 ring-[#0077B5]/30 shadow-lg shadow-[#0077B5]/10' : `${colors.cardBorder} hover:border-slate-400`}`}
        style={{ background: colors.bg }}>
        {/* Mini sidebar */}
        <div className="absolute left-0 top-0 bottom-0 w-[18px]" style={{ background: colors.sidebar }}>
          <div className="mt-3 mx-auto w-2 h-2 rounded-sm" style={{ background: colors.header, opacity: 0.6 }} />
          <div className="mt-1.5 mx-auto w-2 h-1 rounded-sm" style={{ background: colors.header, opacity: 0.3 }} />
          <div className="mt-1 mx-auto w-2 h-1 rounded-sm" style={{ background: colors.header, opacity: 0.3 }} />
        </div>
        {/* Mini header bar */}
        <div className="absolute left-[18px] top-0 right-0 h-[14px] flex items-center px-1.5" style={{ background: colors.sidebar }}>
          <div className="flex gap-0.5">
            <div className="w-3 h-1.5 rounded-sm" style={{ background: colors.line1, opacity: 0.5 }} />
            <div className="w-5 h-1.5 rounded-sm" style={{ background: colors.line1, opacity: 0.3 }} />
          </div>
        </div>
        {/* Mini content area */}
        <div className="absolute left-[24px] top-[20px] right-[6px] space-y-[5px]">
          <div className="h-[6px] rounded-sm w-[85%]" style={{ background: colors.line1 }} />
          <div className="h-[6px] rounded-sm w-[65%]" style={{ background: colors.line2 }} />
          <div className="flex items-center gap-1">
            <div className="h-[6px] rounded-sm w-[50%]" style={{ background: colors.line2 }} />
            <div className="w-[6px] h-[6px] rounded-full" style={{ background: colors.accent }} />
          </div>
        </div>
      </div>
      <span className={`text-xs font-semibold transition-colors ${isActive ? 'text-[#0077B5]' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
    </button>
  );

  // Auto card shows a split light/dark preview
  const AutoCard = ({ isActive, onClick }: { isActive: boolean; onClick: () => void }) => (
    <button onClick={onClick}
      className={`group flex flex-col items-center gap-2 transition-all duration-200 ${isActive ? 'scale-[1.02]' : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}>
      <div className={`relative w-[100px] h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-200 shadow-sm
        ${isActive ? 'border-[#0077B5] ring-2 ring-[#0077B5]/30 shadow-lg shadow-[#0077B5]/10' : isDark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-slate-400'}`}>
        {/* Left half — light */}
        <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-white">
          <div className="absolute left-0 top-0 bottom-0 w-[9px] bg-slate-100">
            <div className="mt-3 mx-auto w-1.5 h-1.5 rounded-sm bg-slate-300" />
          </div>
          <div className="absolute left-[12px] top-[18px] right-[3px] space-y-[4px]">
            <div className="h-[5px] rounded-sm w-[80%] bg-slate-200" />
            <div className="h-[5px] rounded-sm w-[60%] bg-slate-100" />
          </div>
        </div>
        {/* Right half — dark */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#0f172a]">
          <div className="absolute right-0 top-0 bottom-0 w-[9px] bg-slate-800" />
          <div className="absolute left-[3px] top-[18px] right-[12px] space-y-[4px]">
            <div className="h-[5px] rounded-sm w-[80%] bg-slate-700" />
            <div className="h-[5px] rounded-sm w-[60%] bg-slate-800" />
          </div>
        </div>
        {/* Center divider */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400/30" />
      </div>
      <span className={`text-xs font-semibold transition-colors ${isActive ? 'text-[#0077B5]' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>Auto</span>
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Einstellungen</h2>
        <p className="text-slate-500">Verwalten Sie Ihre App-Präferenzen und Systeminformationen.</p>
      </div>

      {/* VIEW & GENERAL SETTINGS (LOCAL) */}
      <div className={`rounded-2xl border overflow-hidden mb-8 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`px-6 py-3 border-b text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
          Ansicht & Allgemein
        </div>

        {/* Erscheinungsbild — Visual Theme Picker */}
        <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-1">
            {themePreference === 'auto' ? <Smartphone size={18} className="text-[#0077B5]" />
              : theme === 'dark' ? <Moon size={18} className="text-[#0077B5]" />
              : theme === 'soft' ? <Eye size={18} className="text-[#0077B5]" />
              : <Sun size={18} className="text-[#0077B5]" />}
            <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Erscheinungsbild</span>
          </div>
          <p className={`text-xs mb-5 ml-[30px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Farbmodus wählen</p>

          {/* 3 theme cards */}
          <div className="flex items-center justify-center gap-5 mb-4">
            <ThemeCard mode="light" label="Light" isActive={themePreference === 'light'} onClick={onSetTheme}
              colors={{ bg: '#ffffff', sidebar: '#f1f5f9', header: '#94a3b8', line1: '#e2e8f0', line2: '#f1f5f9', accent: '#ef4444', cardBorder: 'border-slate-200' }} />
            <ThemeCard mode="soft" label="Soft" isActive={themePreference === 'soft'} onClick={onSetTheme}
              colors={{ bg: '#E8EDF0', sidebar: '#D4DDE2', header: '#5C7E8F', line1: '#c8d3da', line2: '#d8e0e5', accent: '#ef4444', cardBorder: isDark ? 'border-slate-700' : 'border-slate-200' }} />
            <ThemeCard mode="dark" label="Dark" isActive={themePreference === 'dark'} onClick={onSetTheme}
              colors={{ bg: '#0f172a', sidebar: '#1e293b', header: '#475569', line1: '#334155', line2: '#1e293b', accent: '#ef4444', cardBorder: isDark ? 'border-slate-700' : 'border-slate-200' }} />
          </div>

          {/* Auto card centered below */}
          <div className="flex justify-center">
            <AutoCard isActive={themePreference === 'auto'} onClick={() => onSetTheme('auto')} />
          </div>
        </div>

        <SettingRow
          icon={<Monitor size={20} />}
          label="Artikel-Ansicht"
          description="Darstellung der Lagerbestandsliste"
          action={
            <div className={`flex p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button
                onClick={() => onSetInventoryViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${inventoryViewMode === 'grid'
                  ? 'bg-[#0077B5] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <LayoutGrid size={14} /> Grid
              </button>
              <button
                onClick={() => onSetInventoryViewMode('list')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${inventoryViewMode === 'list'
                  ? 'bg-[#0077B5] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <List size={14} /> List
              </button>
            </div>
          }
        />
      </div>

      {/* GLOBAL SETTINGS LINK — Admin or users with global-settings access only */}
      {(currentUser?.role === 'admin' || currentUser?.featureAccess?.includes('global-settings')) && (
        <button
          onClick={() => onNavigate('global-settings')}
          className={`w-full rounded-2xl border overflow-hidden mb-8 text-left transition-all group ${isDark
            ? 'bg-[#0077B5]/5 border-[#0077B5]/20 hover:bg-[#0077B5]/10 hover:border-[#0077B5]/30'
            : 'bg-[#0077B5]/5 border-[#0077B5]/15 hover:bg-[#0077B5]/10 shadow-sm'
            }`}
        >
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0077B5]/20' : 'bg-[#0077B5]/10'}`}>
                <Shield size={22} className="text-[#0077B5]" />
              </div>
              <div>
                <div className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Globale Einstellungen</div>
                <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Einkauf, Tickets, Tabellen, Audit Trail — gilt für alle Benutzer
                </div>
              </div>
            </div>
            <ChevronRight size={20} className={`transition-transform group-hover:translate-x-1 text-[#0077B5]`} />
          </div>
        </button>
      )}

      {/* DATA MANAGEMENT SECTION */}
      <div className={`rounded-2xl border overflow-hidden mb-8 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`px-6 py-3 border-b flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Daten-Management</span>
          {hasCustomData ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
              <CheckCircle2 size={12} /> Live Daten
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded">
              <Info size={12} /> Test Daten
            </span>
          )}
        </div>

        <SettingRow
          icon={<Database size={20} />}
          label="Live-Daten Importieren"
          description="Laden Sie Ihre eigene JSON-Datei hoch."
          action={
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDark ? 'bg-[#0077B5] hover:bg-[#00A0DC] text-white' : 'bg-[#0077B5] hover:bg-[#00A0DC] text-white shadow-sm'
                  }`}
              >
                <Upload size={16} /> Importieren
              </button>
            </div>
          }
        />

        {hasCustomData && (
          <div className={`p-4 flex items-center justify-between border-t ${isDark ? 'border-slate-800 bg-red-500/5' : 'border-slate-100 bg-red-50'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-600'}`}>
                <AlertCircle size={20} />
              </div>
              <div>
                <div className={`font-bold text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>Daten zurücksetzen</div>
                <div className={`text-xs ${isDark ? 'text-red-400/60' : 'text-red-600/70'}`}>Löscht Live-Daten und stellt Mock-Daten wieder her.</div>
              </div>
            </div>
            <button
              onClick={onClearData}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-white border border-red-200 hover:bg-red-50 text-red-600'
                }`}
            >
              <Trash2 size={16} /> Löschen
            </button>
          </div>
        )}
      </div>


      {/* System & Hilfe */}
      <div className={`rounded-2xl border overflow-hidden mb-8 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`px-6 py-3 border-b text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
          System & Hilfe
        </div>

        <button
          onClick={() => onNavigate('documentation')}
          className={`w-full text-left transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
        >
          <SettingRow
            icon={<Book size={20} />}
            label="App Dokumentation"
            description="Technische Details, Architektur und Datenstruktur"
            action={<ChevronRight size={18} className="text-slate-500" />}
          />
        </button>

        <SettingRow
          icon={<Info size={20} />}
          label="Version"
          description="Build 2026.02.01-v0.2.2"
          action={<span className="text-xs font-mono text-slate-500">v0.2.2</span>}
        />
      </div>

      {/* CREDITS SECTION */}
      <div className={`rounded-2xl border overflow-hidden mb-8 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`px-6 py-3 border-b flex flex-col justify-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Entwicklung
          </span>
          <span className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
            AI-Assisted Software Developers
          </span>
        </div>

        <SettingRow
          icon={<Users size={20} />}
          label="Marcel Stöwhaas"
          description="Techniker"
          action={<></>}
        />

        <SettingRow
          icon={<Users size={20} />}
          label="Jorge Castro"
          description="Elektrofachhelfer"
          action={<></>}
        />
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500">
          Entwickelt von DOST INFOSYS<br />
          &copy; 2026 Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  );
};