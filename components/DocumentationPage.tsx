import React, { useState } from 'react';
import { Theme } from '../types';
import { ArrowLeft, Book, Code, Database, Layout, Palette, Layers, Network, Shield, Cpu, Smartphone, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface DocumentationPageProps {
  theme: Theme;
  onBack: () => void;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ theme, onBack }) => {
  const isDark = theme === 'dark';
  const [lang, setLang] = useState<'de' | 'en'>('de');

  const Section = ({ title, icon, children }: { title: string, icon: React.ReactNode, children?: React.ReactNode }) => (
    <div className={`p-6 rounded-2xl border mb-6 animate-in slide-in-from-bottom-2 duration-500 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-500/10">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-[#0077B5]'}`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>
        {children}
      </div>
    </div>
  );

  const ColorSwatch = ({ name, hex }: { name: string, hex: string }) => (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-500/10">
      <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-500/10 shrink-0" style={{ backgroundColor: hex }}></div>
      <div className="min-w-0">
        <div className="font-bold text-xs truncate">{name}</div>
        <div className="font-mono text-[10px] opacity-60 uppercase">{hex}</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-[#0077B5] mb-4 text-sm font-bold transition-colors"
            >
            <ArrowLeft size={16} /> {lang === 'de' ? 'Zurück zu Einstellungen' : 'Back to Settings'}
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
            <Book className="text-[#0077B5]" /> {lang === 'de' ? 'App Dokumentation' : 'App Documentation'}
            </h1>
            <p className="mt-2 text-slate-500">{lang === 'de' ? 'Technische Referenz und Architektur-Details (v2.2)' : 'Technical Reference and Architecture Details (v2.2)'}</p>
        </div>
        
        {/* Language Toggle */}
        <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button 
                onClick={() => setLang('de')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'de' ? 'bg-[#0077B5] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                DE
            </button>
            <button 
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'en' ? 'bg-[#0077B5] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                EN
            </button>
        </div>
      </div>

      {lang === 'de' ? (
        <>
            <Section title="Kernphilosophie & Workflow (P2P)" icon={<Layout size={24} />}>
                <div className="space-y-6">
                    <div className={`p-4 rounded-xl border-l-4 border-blue-500 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <h4 className="font-bold text-blue-500 mb-2">1. Prozess-gesteuerter Ansatz</h4>
                        <p className="text-sm leading-relaxed">
                        Das System folgt nun einem strengen Workflow (inspiriert von Zoho Inventory). 
                        Der Prozess erzwingt eine klare Kette: <br/>
                        <span className="font-mono font-bold">Bestellung (PO) &rarr; Wareneingang (GR) &rarr; Bestandsführung</span>.
                        Dies minimiert manuelle Fehler und stellt sicher, dass jeder Wareneingang einer Quelle zugeordnet ist.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <strong className="block mb-2 text-[#0077B5]">Modul 1: Einkauf</strong>
                        <p className="text-sm opacity-80 mb-2">
                            Der Nutzer erstellt eine Bestellung (PO) durch Auswahl von Artikeln aus den Stammdaten.
                        </p>
                        <ul className="list-disc pl-4 text-xs opacity-70 space-y-1">
                            <li><strong>Ergebnis:</strong> Datensatz im Status "Offen".</li>
                            <li><strong>Bestätigung:</strong> Generierung eines PDF-Belegs.</li>
                        </ul>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <strong className="block mb-2 text-[#0077B5]">Modul 2: Wareneingang</strong>
                        <p className="text-sm opacity-80 mb-2">
                            <strong>Smart Link:</strong> Auswahl einer offenen PO sperrt Kopfdaten (Lieferant) und füllt die Artikelliste automatisch.
                        </p>
                        <ul className="list-disc pl-4 text-xs opacity-70 space-y-1">
                            <li><strong>Status-Automatik:</strong> Berechnung basierend auf Menge (Soll/Ist) und Schadensmeldung.</li>
                            <li><strong>Status-Typen:</strong> Teillieferung, Übermenge, Falsch geliefert, Gebucht.</li>
                        </ul>
                        </div>
                        <div className={`p-4 rounded-xl border md:col-span-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <strong className="block mb-2 text-[#0077B5]">Modul 3: Verwaltung & Probleme</strong>
                        <p className="text-sm opacity-80">
                            Überwachung via Dashboard und Behandlung von Abweichungen durch das neue <strong>Case Management (Ticketing)</strong> System.
                            Fehlmengen oder Beschädigungen generieren automatisch Tickets zur Nachverfolgung.
                        </p>
                        </div>
                    </div>
                </div>
            </Section>

            <Section title="Design System & UI Patterns" icon={<Palette size={24} />}>
                <div className="space-y-6">
                    {/* 1. Traffic Light Logic */}
                    <div>
                        <h4 className="font-bold mb-3 flex items-center gap-2">1. Status Farb-Logik (Traffic Light)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                    <CheckCircle2 size={16} className="text-emerald-500"/> Success (Grün)
                                </div>
                                <p className="text-xs opacity-80">Genutzt für: <b>Gebucht</b>, <b>Offene POs</b>, <b>Bestand OK</b>.</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                    <Info size={16} className="text-amber-500"/> Warning (Gelb)
                                </div>
                                <p className="text-xs opacity-80">Genutzt für: <b>Übermenge</b>, <b>Projekt</b>, <b>Warnung</b>.</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                    <AlertCircle size={16} className="text-red-500"/> Critical (Rot)
                                </div>
                                <p className="text-xs opacity-80">Genutzt für: <b>Teillieferung</b>, <b>Fehlmenge</b>, <b>Beschädigt</b>.</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. UI Patterns */}
                    <div>
                        <h4 className="font-bold mb-3">2. Core UI Patterns</h4>
                        <div className="space-y-3">
                            <div className={`p-3 rounded-xl border flex gap-3 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className="p-2 rounded bg-slate-500/10 h-fit text-slate-500"><Layers size={16} /></div>
                                <div>
                                    <strong className="text-sm block">Blur Overlay (Abschluss)</strong>
                                    <p className="text-xs opacity-70">
                                        Ein Full-Screen Modal (`fixed inset-0`) mit <code>backdrop-blur-md</code> und extrem hohem Z-Index. 
                                        Wird am Ende von Workflows (z.B. Wareneingang buchen) genutzt, um Erfolg oder Fehler unmissverständlich anzuzeigen.
                                    </p>
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl border flex gap-3 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className="p-2 rounded bg-slate-500/10 h-fit text-slate-500"><Layout size={16} /></div>
                                <div>
                                    <strong className="text-sm block">Portal Dropdowns</strong>
                                    <p className="text-xs opacity-70">
                                        Visuelle Komponenten für "Select"-Inputs. Sie werden direkt in den `body` gerendert, um Clipping in Tabellen oder Modalen zu verhindern.
                                    </p>
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl border flex gap-3 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className="p-2 rounded bg-slate-500/10 h-fit text-slate-500"><Code size={16} /></div>
                                <div>
                                    <strong className="text-sm block">Wizard Stepper</strong>
                                    <p className="text-xs opacity-70">
                                        Eine 3-stufige Progress-Bar, die den Nutzer durch komplexe Dateneingaben führt (1. Kopfdaten &rarr; 2. Positionen &rarr; 3. Abschluss).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Global Palette */}
                     <div>
                        <h4 className="font-bold mb-3">3. Globale Palette</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <ColorSwatch name="Dark BG" hex="#0f172a" />
                            <ColorSwatch name="Card BG" hex="#1e293b" />
                            <ColorSwatch name="Accent" hex="#0077B5" />
                            <ColorSwatch name="Error" hex="#E2001A" />
                        </div>
                    </div>
                </div>
            </Section>

            {/* ... Rest of components ... */}
        </>
      ) : (
        <>
            {/* ... English Section ... */}
            <Section title="Design System & UI Patterns" icon={<Palette size={24} />}>
                <div className="space-y-6">
                    {/* 1. Traffic Light Logic */}
                    <div>
                        <h4 className="font-bold mb-3 flex items-center gap-2">1. Status Color Logic (Traffic Light)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                    <CheckCircle2 size={16} className="text-emerald-500"/> Success (Green)
                                </div>
                                <p className="text-xs opacity-80">Used for: <b>Booked</b>, <b>Open POs</b>, <b>Stock Healthy</b>.</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                    <Info size={16} className="text-amber-500"/> Warning (Amber)
                                </div>
                                <p className="text-xs opacity-80">Used for: <b>Over-delivery</b>, <b>Project</b>, <b>Alert</b>.</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                    <AlertCircle size={16} className="text-red-500"/> Critical (Red)
                                </div>
                                <p className="text-xs opacity-80">Used for: <b>Short Delivery</b>, <b>Stock Empty</b>, <b>Errors</b>.</p>
                            </div>
                        </div>
                    </div>
                    {/* ... Rest of UI patterns ... */}
                </div>
            </Section>
            {/* ... Rest of English documentation ... */}
        </>
      )}
    </div>
  );
};