import React, { useState } from 'react';
import {
    ClipboardCheck, Plus, Zap, ShieldCheck, MapPin,
    Clock, CheckCircle2, XCircle, AlertTriangle, ChevronRight,
    ArrowLeft, Search
} from 'lucide-react';
import { Theme, ActiveModule, AuditSession, AuditMode, StockItem, AuthUser } from '../types';

// ═══════════════════════════════════════════════════════════
// SUB-VIEW TYPE — controls which screen is displayed
// ═══════════════════════════════════════════════════════════
type AuditView = 'landing' | 'setup';

// ═══════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════
interface AuditModuleProps {
    theme: Theme;
    currentUser: AuthUser | null;
    inventory: StockItem[];
    auditSessions: AuditSession[];
    onNavigate: (module: ActiveModule) => void;
}

// ═══════════════════════════════════════════════════════════
// STATUS HELPERS
// ═══════════════════════════════════════════════════════════
const STATUS_CONFIG: Record<string, { label: string; color: string; darkColor: string; icon: React.ElementType }> = {
    'in-progress': { label: 'In Arbeit', color: 'text-amber-600 bg-amber-50 border-amber-200', darkColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock },
    'pending-review': { label: 'Prüfung', color: 'text-blue-600 bg-blue-50 border-blue-200', darkColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: ShieldCheck },
    'approved': { label: 'Genehmigt', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', darkColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
    'rejected': { label: 'Abgelehnt', color: 'text-red-600 bg-red-50 border-red-200', darkColor: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle },
    'cancelled': { label: 'Abgebrochen', color: 'text-slate-500 bg-slate-50 border-slate-200', darkColor: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: XCircle },
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════
export const AuditModule: React.FC<AuditModuleProps> = ({
    theme,
    currentUser,
    inventory,
    auditSessions,
    onNavigate,
}) => {
    const isDark = theme === 'dark';
    const isSoft = theme === 'soft';

    const [view, setView] = useState<AuditView>('landing');
    const [searchTerm, setSearchTerm] = useState('');

    // ── Derived data ──
    const activeCount = auditSessions.filter(s => s.status === 'in-progress').length;
    const pendingCount = auditSessions.filter(s => s.status === 'pending-review').length;

    const filteredSessions = auditSessions.filter(s => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return s.name.toLowerCase().includes(term) ||
            s.warehouse.toLowerCase().includes(term) ||
            s.createdByName.toLowerCase().includes(term);
    });

    // Sort: in-progress first, then pending-review, then by date descending
    const sortedSessions = [...filteredSessions].sort((a, b) => {
        const statusOrder: Record<string, number> = { 'in-progress': 0, 'pending-review': 1, 'approved': 2, 'rejected': 3, 'cancelled': 4 };
        const aDiff = statusOrder[a.status] ?? 5;
        const bDiff = statusOrder[b.status] ?? 5;
        if (aDiff !== bDiff) return aDiff - bDiff;
        return b.createdAt - a.createdAt;
    });

    // ── Helpers ──
    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    };

    const cardBg = isDark ? 'bg-slate-900/50 border-slate-800' : isSoft ? 'bg-white/80 border-[#D4DDE2]' : 'bg-white border-slate-200';
    const cardHover = isDark ? 'hover:bg-slate-800/80 hover:border-slate-700' : isSoft ? 'hover:bg-white hover:shadow-md' : 'hover:bg-slate-50 hover:shadow-md';

    // ═══════════════════════════════════════════════════════
    // LANDING VIEW
    // ═══════════════════════════════════════════════════════
    if (view === 'landing') {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#0077B5]/20' : 'bg-[#0077B5]/10'}`}>
                            <ClipboardCheck size={28} className="text-[#0077B5]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Inventur</h2>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Bestände zählen, prüfen und abgleichen.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Bar */}
                {(activeCount > 0 || pendingCount > 0) && (
                    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${cardBg}`}>
                        {activeCount > 0 && (
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full bg-amber-500 animate-pulse`} />
                                <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                    {activeCount} aktiv
                                </span>
                            </div>
                        )}
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                                <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {pendingCount} zur Prüfung
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* NEW AUDIT BUTTON */}
                <button
                    onClick={() => setView('setup')}
                    className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white p-5 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98]"
                >
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Plus size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-lg">Neue Inventur</div>
                            <div className="text-sm text-white/80">
                                Schnellzählung oder vollständige Prüfung starten
                            </div>
                        </div>
                        <ChevronRight size={20} className="ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
                    </div>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>

                {/* Search */}
                {auditSessions.length > 0 && (
                    <div className="relative">
                        <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Inventur suchen…"
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors ${isDark
                                    ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-slate-700'
                                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0077B5]/30'
                                } focus:outline-none focus:ring-2 focus:ring-[#0077B5]/20`}
                        />
                    </div>
                )}

                {/* AUDIT HISTORY LIST */}
                {sortedSessions.length > 0 ? (
                    <div className="space-y-3">
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Verlauf
                        </h3>
                        {sortedSessions.map(session => {
                            const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG['cancelled'];
                            const StatusIcon = cfg.icon;
                            const itemCount = session.items.length;
                            const varianceCount = session.items.filter(i => i.variance !== 0).length;

                            return (
                                <button
                                    key={session.id}
                                    onClick={() => {
                                        // TODO: Open session detail/resume — wired in later steps
                                    }}
                                    className={`w-full text-left rounded-2xl border p-4 transition-all ${cardBg} ${cardHover} group`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Status icon */}
                                        <div className={`p-2.5 rounded-xl border ${isDark ? cfg.darkColor : cfg.color}`}>
                                            <StatusIcon size={18} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm truncate">{session.name}</span>
                                                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${isDark ? cfg.darkColor : cfg.color}`}>
                                                    {session.mode === 'quick' ? 'Schnell' : 'Normal'}
                                                </span>
                                            </div>
                                            <div className={`flex items-center gap-3 mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                <span className="flex items-center gap-1"><MapPin size={12} /> {session.warehouse}</span>
                                                <span>{formatDate(session.createdAt)}</span>
                                            </div>
                                        </div>

                                        {/* Right: counts */}
                                        <div className="text-right shrink-0">
                                            <div className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {itemCount} Artikel
                                            </div>
                                            {varianceCount > 0 && session.status !== 'in-progress' && (
                                                <div className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                    {varianceCount} Abweichung{varianceCount > 1 ? 'en' : ''}
                                                </div>
                                            )}
                                        </div>

                                        <ChevronRight size={16} className={`shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty state */
                    <div className={`text-center py-16 rounded-2xl border border-dashed ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <ClipboardCheck size={48} className={`mx-auto mb-4 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                        <p className={`font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Noch keine Inventuren
                        </p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            Starte deine erste Zählung mit dem Button oben.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════
    // SETUP VIEW — Location + Mode selection
    // ═══════════════════════════════════════════════════════
    if (view === 'setup') {
        return (
            <AuditSetup
                theme={theme}
                inventory={inventory}
                currentUser={currentUser}
                onBack={() => setView('landing')}
                onStart={(name, warehouse, mode) => {
                    // TODO: Create session and enter cart view — wired in Step 7
                    console.log('[Audit] Start:', { name, warehouse, mode });
                    setView('landing'); // Temporary: return to landing
                }}
            />
        );
    }

    return null;
};

// ═══════════════════════════════════════════════════════════
// AUDIT SETUP SUB-COMPONENT — Step 6 placeholder
// ═══════════════════════════════════════════════════════════
interface AuditSetupProps {
    theme: Theme;
    inventory: StockItem[];
    currentUser: AuthUser | null;
    onBack: () => void;
    onStart: (name: string, warehouse: string, mode: AuditMode) => void;
}

const AuditSetup: React.FC<AuditSetupProps> = ({ theme, inventory, currentUser, onBack, onStart }) => {
    const isDark = theme === 'dark';
    const isSoft = theme === 'soft';

    const [name, setName] = useState('');
    const [warehouse, setWarehouse] = useState('');
    const [mode, setMode] = useState<AuditMode>('quick');

    // Derive unique warehouse locations from inventory
    const warehouseOptions = [...new Set(
        inventory.map(i => i.warehouseLocation).filter(Boolean) as string[]
    )].sort();

    const canStart = name.trim().length > 0 && warehouse.trim().length > 0;

    const cardBg = isDark ? 'bg-slate-900/50 border-slate-800' : isSoft ? 'bg-white/80 border-[#D4DDE2]' : 'bg-white border-slate-200';

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            {/* Back */}
            <button
                onClick={onBack}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
            >
                <ArrowLeft size={16} /> Zurück
            </button>

            {/* Title */}
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#0077B5]/20' : 'bg-[#0077B5]/10'}`}>
                    <ClipboardCheck size={28} className="text-[#0077B5]" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Neue Inventur</h2>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Name, Lager und Modus wählen.
                    </p>
                </div>
            </div>

            {/* Name Input */}
            <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Bezeichnung
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="z.B. Akku Service März 2026"
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${isDark
                            ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-slate-700'
                            : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0077B5]/30'
                        } focus:outline-none focus:ring-2 focus:ring-[#0077B5]/20`}
                    autoFocus
                />
            </div>

            {/* Warehouse Selection */}
            <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Lager / Standort
                </label>
                {warehouseOptions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {warehouseOptions.map(wh => (
                            <button
                                key={wh}
                                onClick={() => setWarehouse(wh)}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${warehouse === wh
                                        ? 'bg-[#0077B5] text-white border-[#0077B5] shadow-md shadow-blue-500/20'
                                        : `${cardBg} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className={warehouse === wh ? 'text-white/80' : 'text-[#0077B5]'} />
                                    <span className="truncate">{wh}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <input
                        type="text"
                        value={warehouse}
                        onChange={e => setWarehouse(e.target.value)}
                        placeholder="Lagerort eingeben…"
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${isDark
                                ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-slate-700'
                                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0077B5]/30'
                            } focus:outline-none focus:ring-2 focus:ring-[#0077B5]/20`}
                    />
                )}
            </div>

            {/* Mode Selection — The glossy cards */}
            <div>
                <label className={`block text-sm font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Modus
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Quick Count */}
                    <button
                        onClick={() => setMode('quick')}
                        className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 ${mode === 'quick'
                                ? 'bg-gradient-to-br from-[#0077B5]/10 to-[#00A0DC]/10 border-[#0077B5] shadow-lg shadow-blue-500/10 ring-2 ring-[#0077B5]/30'
                                : `${cardBg} ${isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'}`
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl ${mode === 'quick' ? 'bg-[#0077B5]/20' : isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <Zap size={20} className={mode === 'quick' ? 'text-[#0077B5]' : isDark ? 'text-slate-400' : 'text-slate-500'} />
                            </div>
                            <div>
                                <div className="font-bold text-sm">Schnellzählung</div>
                                <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Zählen → sofort buchen. Bestand wird direkt aktualisiert.
                                </div>
                            </div>
                        </div>
                        {mode === 'quick' && (
                            <div className="absolute top-3 right-3">
                                <CheckCircle2 size={18} className="text-[#0077B5]" />
                            </div>
                        )}
                    </button>

                    {/* Normal Audit */}
                    <button
                        onClick={() => setMode('normal')}
                        className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 ${mode === 'normal'
                                ? 'bg-gradient-to-br from-[#0077B5]/10 to-[#00A0DC]/10 border-[#0077B5] shadow-lg shadow-blue-500/10 ring-2 ring-[#0077B5]/30'
                                : `${cardBg} ${isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'}`
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl ${mode === 'normal' ? 'bg-[#0077B5]/20' : isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <ShieldCheck size={20} className={mode === 'normal' ? 'text-[#0077B5]' : isDark ? 'text-slate-400' : 'text-slate-500'} />
                            </div>
                            <div>
                                <div className="font-bold text-sm">Normale Inventur</div>
                                <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Zählen → Prüfung → Genehmigung. Manager gibt frei, dann wird gebucht.
                                </div>
                            </div>
                        </div>
                        {mode === 'normal' && (
                            <div className="absolute top-3 right-3">
                                <CheckCircle2 size={18} className="text-[#0077B5]" />
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Start Button */}
            <button
                onClick={() => canStart && onStart(name.trim(), warehouse.trim(), mode)}
                disabled={!canStart}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 ${canStart
                        ? 'bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]'
                        : isDark
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
            >
                {mode === 'quick' ? 'Schnellzählung starten' : 'Inventur starten'}
            </button>
        </div>
    );
};