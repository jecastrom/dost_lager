import React, { useRef } from 'react';
import { Theme, StockItem, RawGermanItem } from '../types';
import { Book, ChevronRight, Moon, Sun, Monitor, Shield, Info, Upload, Trash2, Database, AlertCircle, CheckCircle2, Users } from 'lucide-react';

interface SettingsPageProps {
  theme: Theme;
  toggleTheme: () => void;
  onNavigate: (module: 'documentation') => void;
  onUploadData: (data: StockItem[]) => void;
  onClearData: () => void;
  hasCustomData: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  theme, 
  toggleTheme, 
  onNavigate,
  onUploadData,
  onClearData,
  hasCustomData
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

        // Basic Validation: Check if it's an array and has at least one valid item with "Artikel Nummer"
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
             category: "Material", // Default
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
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const SettingRow = ({ icon, label, description, action }: { icon: React.ReactNode, label: string, description: string, action: React.ReactNode }) => (
    <div className={`p-4 flex items-center justify-between border-b last:border-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
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

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Einstellungen</h2>
        <p className="text-slate-500">Verwalten Sie Ihre App-Präferenzen und Systeminformationen.</p>
      </div>

      <div className={`rounded-2xl border overflow-hidden mb-8 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`px-6 py-3 border-b text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
          Allgemein
        </div>
        
        <SettingRow 
          icon={isDark ? <Moon size={20} /> : <Sun size={20} />}
          label="Erscheinungsbild"
          description={isDark ? "Dunkler Modus aktiviert" : "Heller Modus aktiviert"}
          action={
            <button 
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-[#0077B5]' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          }
        />

        <SettingRow 
          icon={<Monitor size={20} />}
          label="Ansicht"
          description="Standardansicht für Lagerbestand"
          action={
            <div className={`text-xs font-bold px-3 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
              Automatisch
            </div>
          }
        />
      </div>

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
          description="Laden Sie Ihre eigene JSON-Datei hoch, um die Testdaten zu ersetzen."
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
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                   isDark ? 'bg-[#0077B5] hover:bg-[#00A0DC] text-white' : 'bg-[#0077B5] hover:bg-[#00A0DC] text-white shadow-sm'
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                isDark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-white border border-red-200 hover:bg-red-50 text-red-600'
              }`}
            >
              <Trash2 size={16} /> Löschen
            </button>
          </div>
        )}
      </div>

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
          description="Build 2026.01.31-v2.0"
          action={<span className="text-xs font-mono text-slate-500">v2.0.0</span>}
        />
      </div>

      {/* CREDITS SECTION (NEW) */}
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
          Entwickelt von DOST INFOSYS<br/>
          &copy; 2026 Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  );
};