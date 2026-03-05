import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    ClipboardCheck, Plus, Zap, ShieldCheck, MapPin,
    Clock, CheckCircle2, XCircle, AlertTriangle, ChevronRight,
    ArrowLeft, Search, X, Minus, StickyNote, ShoppingCart,
    Hash, Package, Eye, RotateCcw
} from 'lucide-react';
import { Theme, ActiveModule, AuditSession, AuditItem, AuditMode, StockItem, AuthUser } from '../types';

// ═══════════════════════════════════════════════════════════
// SUB-VIEW TYPE — controls which screen is displayed
// ═══════════════════════════════════════════════════════════
type AuditView = 'landing' | 'setup' | 'cart' | 'summary' | 'review';

// ═══════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════
interface AuditModuleProps {
    theme: Theme;
    currentUser: AuthUser | null;
    inventory: StockItem[];
    auditSessions: AuditSession[];
    onNavigate: (module: ActiveModule) => void;
    onCompleteAudit: (session: AuditSession, action: 'quick-approve' | 'submit-review') => void;
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
    onCompleteAudit,
}) => {
    const isDark = theme === 'dark';
    const isSoft = theme === 'soft';

    const [view, setView] = useState<AuditView>('landing');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSession, setActiveSession] = useState<AuditSession | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending-review' | 'approved' | 'rejected'>('all');

    // ── Derived data ──
    const activeCount = auditSessions.filter(s => s.status === 'in-progress').length;
    const pendingCount = auditSessions.filter(s => s.status === 'pending-review').length;

    const filteredSessions = auditSessions.filter(s => {
        // Status filter
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        // Search filter
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return s.name.toLowerCase().includes(term) ||
            s.warehouse.toLowerCase().includes(term) ||
            s.createdByName.toLowerCase().includes(term);
    });

    // Counts for filter tabs
    const statusCounts = {
        all: auditSessions.length,
        'pending-review': auditSessions.filter(s => s.status === 'pending-review').length,
        approved: auditSessions.filter(s => s.status === 'approved').length,
        rejected: auditSessions.filter(s => s.status === 'rejected').length,
    };

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

                {/* STATUS FILTER TABS */}
                {auditSessions.length > 0 && (
                    <div className={`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar`}>
                        {([
                            { key: 'all', label: 'Alle', count: statusCounts.all },
                            { key: 'pending-review', label: 'Prüfung', count: statusCounts['pending-review'] },
                            { key: 'approved', label: 'Genehmigt', count: statusCounts.approved },
                            { key: 'rejected', label: 'Abgelehnt', count: statusCounts.rejected },
                        ] as const).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === tab.key
                                    ? 'bg-[#0077B5] text-white shadow-md shadow-blue-500/20'
                                    : isDark
                                        ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold ${statusFilter === tab.key
                                        ? 'bg-white/20 text-white'
                                        : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* AUDIT HISTORY LIST */}
                {sortedSessions.length > 0 ? (
                    <div className="space-y-3">
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {statusFilter === 'all' ? 'Verlauf' : statusFilter === 'pending-review' ? 'Zur Prüfung' : statusFilter === 'approved' ? 'Genehmigt' : 'Abgelehnt'}
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
                                        setActiveSession(session);
                                        if (session.status === 'in-progress') {
                                            setView('cart');
                                        } else {
                                            setView('review');
                                        }
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
                    const session: AuditSession = {
                        id: crypto.randomUUID(),
                        name,
                        mode,
                        status: 'in-progress',
                        warehouse,
                        items: [],
                        createdAt: Date.now(),
                        createdBy: currentUser?.userId || 'unknown',
                        createdByName: currentUser?.displayName || 'Unbekannt',
                        docType: 'audit-session',
                    };
                    setActiveSession(session);
                    setView('cart');
                }}
            />
        );
    }

    // ═══════════════════════════════════════════════════════
    // CART VIEW — The shopping cart counting experience
    // ═══════════════════════════════════════════════════════
    if (view === 'cart' && activeSession) {
        return (
            <AuditCart
                theme={theme}
                session={activeSession}
                inventory={inventory}
                onUpdateSession={setActiveSession}
                onFinish={() => {
                    setView('summary');
                }}
                onCancel={() => {
                    setActiveSession(null);
                    setView('landing');
                }}
            />
        );
    }

    // ═══════════════════════════════════════════════════════
    // REVIEW VIEW — Read-only detail for completed/pending sessions
    // ═══════════════════════════════════════════════════════
    if (view === 'review' && activeSession) {
        return (
            <AuditReview
                theme={theme}
                session={activeSession}
                currentUser={currentUser}
                onBack={() => {
                    setActiveSession(null);
                    setView('landing');
                }}
                onApprove={(session, reviewNote) => {
                    const approvedSession: AuditSession = {
                        ...session,
                        status: 'approved',
                        reviewedAt: Date.now(),
                        reviewedBy: currentUser?.userId || 'unknown',
                        reviewedByName: currentUser?.displayName || 'Unbekannt',
                        reviewNote: reviewNote || undefined,
                    };
                    onCompleteAudit(approvedSession, 'quick-approve');
                    setActiveSession(null);
                    setView('landing');
                }}
                onReject={(session, reviewNote) => {
                    const rejectedSession: AuditSession = {
                        ...session,
                        status: 'rejected',
                        reviewedAt: Date.now(),
                        reviewedBy: currentUser?.userId || 'unknown',
                        reviewedByName: currentUser?.displayName || 'Unbekannt',
                        reviewNote: reviewNote || undefined,
                    };
                    onCompleteAudit(rejectedSession, 'submit-review');
                    setActiveSession(null);
                    setView('landing');
                }}
            />
        );
    }

    // ═══════════════════════════════════════════════════════
    // SUMMARY VIEW — The Reveal
    // ═══════════════════════════════════════════════════════
    if (view === 'summary' && activeSession) {
        return (
            <AuditSummary
                theme={theme}
                session={activeSession}
                onBack={() => setView('cart')}
                onSubmit={(action) => {
                    const completedSession: AuditSession = {
                        ...activeSession,
                        status: action === 'quick-approve' ? 'approved' : 'pending-review',
                        completedAt: Date.now(),
                    };
                    onCompleteAudit(completedSession, action);
                    setActiveSession(null);
                    setView('landing');
                }}
            />
        );
    }

    return null;
};

// ═══════════════════════════════════════════════════════════
// AUDIT SUMMARY — The Reveal screen
// ═══════════════════════════════════════════════════════════
interface AuditSummaryProps {
    theme: Theme;
    session: AuditSession;
    onBack: () => void;
    onSubmit: (action: 'quick-approve' | 'submit-review') => void;
}

const AuditSummary: React.FC<AuditSummaryProps> = ({ theme, session, onBack, onSubmit }) => {
    const isDark = theme === 'dark';
    const isSoft = theme === 'soft';
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [confirmOpen, setConfirmOpen] = useState(false);

    // ── Categorize items ──
    const matches = session.items.filter(i => i.variance === 0);
    const overages = session.items.filter(i => i.variance > 0);
    const shortages = session.items.filter(i => i.variance < 0);

    const totalExpected = session.items.reduce((s, i) => s + i.expectedQty, 0);
    const totalCounted = session.items.reduce((s, i) => s + i.countedQty, 0);
    const totalVariance = totalCounted - totalExpected;

    const isPerfect = session.items.length > 0 && matches.length === session.items.length;

    const cardBg = isDark ? 'bg-slate-900/50 border-slate-800' : isSoft ? 'bg-white/80 border-[#D4DDE2]' : 'bg-white border-slate-200';

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id); else n.add(id);
            return n;
        });
    };

    // ── Variance item row ──
    const VarianceRow: React.FC<{ item: AuditItem; type: 'match' | 'over' | 'short' }> = ({ item, type }) => {
        const isExpanded = expandedItems.has(item.id);
        const colors = {
            match: isDark ? 'border-emerald-500/20' : 'border-emerald-200',
            over: isDark ? 'border-amber-500/20' : 'border-amber-200',
            short: isDark ? 'border-red-500/20' : 'border-red-200',
        };
        const varianceColor = {
            match: isDark ? 'text-emerald-400' : 'text-emerald-600',
            over: isDark ? 'text-amber-400' : 'text-amber-600',
            short: isDark ? 'text-red-400' : 'text-red-600',
        };
        const bgHighlight = {
            match: isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50',
            over: isDark ? 'bg-amber-500/5' : 'bg-amber-50/50',
            short: isDark ? 'bg-red-500/5' : 'bg-red-50/50',
        };

        return (
            <button
                onClick={() => toggleExpand(item.id)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all ${colors[type]} ${bgHighlight[type]}`}
            >
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{item.name}</div>
                        <div className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.sku}</div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className={`font-bold font-mono text-sm ${varianceColor[type]}`}>
                            {item.variance > 0 ? '+' : ''}{item.variance}
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            {item.expectedQty} → {item.countedQty}
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className={`mt-3 pt-3 border-t border-dashed space-y-1.5 text-xs ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <div className="flex justify-between">
                            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Erwartet</span>
                            <span className="font-mono font-bold">{item.expectedQty}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Gezählt</span>
                            <span className="font-mono font-bold">{item.countedQty}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Abweichung</span>
                            <span className={`font-mono font-bold ${varianceColor[type]}`}>
                                {item.variance > 0 ? '+' : ''}{item.variance}
                            </span>
                        </div>
                        {item.warehouse && (
                            <div className="flex justify-between">
                                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Lager</span>
                                <span className="flex items-center gap-1"><MapPin size={10} />{item.warehouse}</span>
                            </div>
                        )}
                        {item.note && (
                            <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                <span className="font-bold">Notiz:</span> {item.note}
                            </div>
                        )}
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-xl font-bold">Zusammenfassung</h2>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {session.name} · {session.warehouse}
                    </p>
                </div>
            </div>

            {/* Overall Stats Card */}
            <div className={`rounded-2xl border p-5 ${cardBg}`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{session.items.length}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Artikel</div>
                    </div>
                    <div>
                        <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCounted}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gezählt</div>
                    </div>
                    <div>
                        <div className={`text-2xl font-bold font-mono ${totalVariance === 0
                            ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                            : totalVariance > 0
                                ? isDark ? 'text-amber-400' : 'text-amber-600'
                                : isDark ? 'text-red-400' : 'text-red-600'
                            }`}>
                            {totalVariance > 0 ? '+' : ''}{totalVariance}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Differenz</div>
                    </div>
                </div>

                {/* Category breakdown chips */}
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-dashed" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
                    {matches.length > 0 && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                            <CheckCircle2 size={12} /> {matches.length} OK
                        </span>
                    )}
                    {overages.length > 0 && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
                            <Plus size={12} /> {overages.length} Mehr
                        </span>
                    )}
                    {shortages.length > 0 && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                            <Minus size={12} /> {shortages.length} Weniger
                        </span>
                    )}
                </div>
            </div>

            {/* Perfect match celebration */}
            {isPerfect && (
                <div className={`rounded-2xl border p-6 text-center ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="text-4xl mb-2">🎉</div>
                    <p className={`font-bold text-lg ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        Perfekte Übereinstimmung!
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-emerald-400/60' : 'text-emerald-600/60'}`}>
                        Alle Bestände stimmen exakt überein.
                    </p>
                </div>
            )}

            {/* Shortages (red) — show first, most important */}
            {shortages.length > 0 && (
                <div className="space-y-2">
                    <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        <AlertTriangle size={14} /> Fehlmengen ({shortages.length})
                    </h3>
                    {shortages.map(item => <VarianceRow key={item.id} item={item} type="short" />)}
                </div>
            )}

            {/* Overages (amber) */}
            {overages.length > 0 && (
                <div className="space-y-2">
                    <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        <Plus size={14} /> Übermengen ({overages.length})
                    </h3>
                    {overages.map(item => <VarianceRow key={item.id} item={item} type="over" />)}
                </div>
            )}

            {/* Matches (green) */}
            {matches.length > 0 && !isPerfect && (
                <div className="space-y-2">
                    <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        <CheckCircle2 size={14} /> Übereinstimmung ({matches.length})
                    </h3>
                    {matches.map(item => <VarianceRow key={item.id} item={item} type="match" />)}
                </div>
            )}

            {/* Action buttons */}
            <div className={`rounded-2xl border p-5 space-y-3 ${cardBg}`}>
                {session.mode === 'quick' ? (
                    <>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Schnellzählung: Bestand wird sofort auf die gezählten Mengen aktualisiert.
                            {shortages.length > 0 && ' Fehlmengen werden als Abschreibung im Lagerprotokoll verbucht.'}
                            {overages.length > 0 && ' Übermengen werden als Zugang gebucht.'}
                        </p>
                        {!confirmOpen ? (
                            <button
                                onClick={() => shortages.length > 0 ? setConfirmOpen(true) : onSubmit('quick-approve')}
                                className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg shadow-blue-500/20 hover:shadow-xl active:scale-[0.98] transition-all"
                            >
                                Bestand aktualisieren
                            </button>
                        ) : (
                            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                                <p className={`text-sm font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                    {shortages.length} Artikel mit Fehlmengen — sicher buchen?
                                </p>
                                <p className={`text-xs ${isDark ? 'text-red-400/60' : 'text-red-600/60'}`}>
                                    Fehlmengen werden als Abschreibung (write-off) im Lagerprotokoll erfasst. Diese Aktion kann nicht rückgängig gemacht werden.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setConfirmOpen(false)}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                                            }`}
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        onClick={() => onSubmit('quick-approve')}
                                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                                    >
                                        Ja, buchen
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Normale Inventur: Ergebnisse werden zur Prüfung eingereicht. Ein Manager muss die Abweichungen genehmigen, bevor der Bestand aktualisiert wird.
                        </p>
                        <button
                            onClick={() => onSubmit('submit-review')}
                            className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg shadow-blue-500/20 hover:shadow-xl active:scale-[0.98] transition-all"
                        >
                            Zur Prüfung einreichen
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// AUDIT CART ITEM — Extracted component (no hooks in .map)
// ═══════════════════════════════════════════════════════════
interface AuditCartItemProps {
    item: AuditItem;
    theme: Theme;
    onUpdateQty: (id: string, qty: number) => void;
    onRemove: (id: string) => void;
    onToggleNote: (id: string) => void;
    showNote: boolean;
    onUpdateNote: (id: string, note: string) => void;
}

const AuditCartItem: React.FC<AuditCartItemProps> = ({
    item, theme, onUpdateQty, onRemove, onToggleNote, showNote, onUpdateNote
}) => {
    const isDark = theme === 'dark';
    const isSoft = theme === 'soft';
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(String(item.countedQty));
    const inputRef = useRef<HTMLInputElement>(null);

    // Swipe gesture state
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const swipeThreshold = 40; // px before action triggers
    const maxSwipe = 100; // px max drag distance

    const cardBg = isDark ? 'bg-slate-900/50 border-slate-800' : isSoft ? 'bg-white/80 border-[#D4DDE2]' : 'bg-white border-slate-200';

    const handleCommitEdit = () => {
        const val = parseInt(editValue);
        if (!isNaN(val) && val >= 0) {
            onUpdateQty(item.id, val);
        } else {
            setEditValue(String(item.countedQty));
        }
        setIsEditing(false);
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
        setIsSwiping(false);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;

        // If vertical scroll dominates, bail out
        if (!isSwiping && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
            touchStartRef.current = null;
            return;
        }

        // Horizontal swipe detected
        if (Math.abs(dx) > 10) {
            setIsSwiping(true);
            // Clamp to maxSwipe with rubber-band feel
            const clamped = Math.sign(dx) * Math.min(Math.abs(dx), maxSwipe);
            setSwipeX(clamped);
        }
    };

    const handleTouchEnd = () => {
        if (Math.abs(swipeX) > swipeThreshold) {
            if (swipeX < -swipeThreshold) {
                // Swiped LEFT → Remove
                onRemove(item.id);
            } else if (swipeX > swipeThreshold) {
                // Swiped RIGHT → Toggle note
                onToggleNote(item.id);
            }
        }
        // Spring back
        setSwipeX(0);
        setIsSwiping(false);
        touchStartRef.current = null;
    };

    return (
        <div className="relative overflow-hidden rounded-2xl">
            {/* Swipe action backgrounds */}
            <div className="absolute inset-0 flex">
                {/* Right action (revealed on swipe right → note) */}
                <div className={`flex items-center justify-start pl-5 flex-1 rounded-2xl transition-opacity ${swipeX > 20 ? 'opacity-100' : 'opacity-0'
                    } ${isDark ? 'bg-[#0077B5]/20' : 'bg-[#0077B5]/10'}`}>
                    <div className="flex items-center gap-2 text-[#0077B5]">
                        <StickyNote size={18} />
                        <span className="text-xs font-bold">Notiz</span>
                    </div>
                </div>
                {/* Left action (revealed on swipe left → delete) */}
                <div className={`flex items-center justify-end pr-5 flex-1 rounded-2xl transition-opacity ${swipeX < -20 ? 'opacity-100' : 'opacity-0'
                    } ${isDark ? 'bg-red-500/15' : 'bg-red-50'}`}>
                    <div className={`flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                        <span className="text-xs font-bold">Entfernen</span>
                        <X size={18} />
                    </div>
                </div>
            </div>

            {/* Main card (slides on swipe) */}
            <div
                className={`relative rounded-2xl border p-4 ${cardBg}`}
                style={{
                    transform: `translateX(${swipeX}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex items-center gap-3">
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{item.name}</div>
                        <div className={`flex items-center gap-2 mt-0.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            <span className="font-mono">{item.sku}</span>
                            {item.warehouse && (
                                <>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5"><MapPin size={10} />{item.warehouse}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quantity stepper */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => onUpdateQty(item.id, Math.max(0, item.countedQty - 1))}
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-all active:scale-90 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                        >
                            <Minus size={18} />
                        </button>

                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="number"
                                inputMode="numeric"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={handleCommitEdit}
                                onKeyDown={e => { if (e.key === 'Enter') handleCommitEdit(); }}
                                className={`w-16 h-11 rounded-xl text-center font-bold text-lg border-2 border-[#0077B5] outline-none ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
                                    }`}
                                min={0}
                            />
                        ) : (
                            <button
                                onClick={() => { setEditValue(String(item.countedQty)); setIsEditing(true); }}
                                className={`w-16 h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${isDark ? 'bg-slate-800/50 text-white hover:bg-slate-800' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                                    }`}
                                title="Menge direkt eingeben"
                            >
                                {item.countedQty}
                            </button>
                        )}

                        <button
                            onClick={() => onUpdateQty(item.id, item.countedQty + 1)}
                            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg bg-[#0077B5] text-white hover:bg-[#006399] transition-all active:scale-90"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Actions: note + remove */}
                    <div className="flex flex-col gap-1 shrink-0">
                        <button
                            onClick={() => onToggleNote(item.id)}
                            className={`p-2 rounded-lg transition-colors ${item.note
                                ? 'text-[#0077B5] bg-[#0077B5]/10'
                                : isDark ? 'text-slate-600 hover:text-slate-400 hover:bg-slate-800' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                                }`}
                            title="Notiz"
                        >
                            <StickyNote size={14} />
                        </button>
                        <button
                            onClick={() => onRemove(item.id)}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-600 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                                }`}
                            title="Entfernen"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div> {/* end flex items-center gap-3 */}

                {/* Note field (expandable) */}
                {showNote && (
                    <div className="mt-3 pt-3 border-t border-dashed" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
                        <input
                            type="text"
                            value={item.note || ''}
                            onChange={e => onUpdateNote(item.id, e.target.value)}
                            placeholder="Notiz hinzufügen…"
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark
                                ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600'
                                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                                } focus:outline-none focus:ring-2 focus:ring-[#0077B5]/20`}
                        />
                    </div>
                )}
            </div> {/* end sliding card */}
        {/* end overflow wrapper */}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// AUDIT CART — Search, add items, count quantities
// ═══════════════════════════════════════════════════════════
interface AuditCartProps {
    theme: Theme;
    session: AuditSession;
    inventory: StockItem[];
    onUpdateSession: (session: AuditSession) => void;
    onFinish: () => void;
    onCancel: () => void;
}

const AuditCart: React.FC<AuditCartProps> = ({
    theme, session, inventory, onUpdateSession, onFinish, onCancel
}) => {
    const isDark = theme === 'dark';
    const isSoft = theme === 'soft';

    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
    const searchRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // IDs already in cart — for filtering search results
    const cartItemIds = useMemo(() => new Set(session.items.map(i => i.itemId)), [session.items]);

    // Search results — filtered by term, exclude already-in-cart
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return inventory
            .filter(i => !cartItemIds.has(i.id))
            .filter(i =>
                i.name.toLowerCase().includes(term) ||
                i.sku.toLowerCase().includes(term) ||
                (i.system && i.system.toLowerCase().includes(term)) ||
                (i.manufacturer && i.manufacturer.toLowerCase().includes(term))
            )
            .slice(0, 8);
    }, [searchTerm, inventory, cartItemIds]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const totalItems = session.items.reduce((sum, i) => sum + i.countedQty, 0);

    const cardBg = isDark ? 'bg-slate-900/50 border-slate-800' : isSoft ? 'bg-white/80 border-[#D4DDE2]' : 'bg-white border-slate-200';

    // ── Handlers ──
    const addItem = (stockItem: StockItem) => {
        const newItem: AuditItem = {
            id: crypto.randomUUID(),
            itemId: stockItem.id,
            sku: stockItem.sku,
            name: stockItem.name,
            warehouse: stockItem.warehouseLocation || session.warehouse,
            expectedQty: stockItem.stockLevel,
            countedQty: 0,
            variance: 0 - stockItem.stockLevel,
        };
        onUpdateSession({
            ...session,
            items: [...session.items, newItem],
        });
        setSearchTerm('');
        setShowDropdown(false);
        // Re-focus search for rapid entry
        setTimeout(() => searchRef.current?.focus(), 100);
    };

    const updateQty = (id: string, qty: number) => {
        onUpdateSession({
            ...session,
            items: session.items.map(i =>
                i.id === id ? { ...i, countedQty: qty, variance: qty - i.expectedQty } : i
            ),
        });
    };

    const removeItem = (id: string) => {
        onUpdateSession({
            ...session,
            items: session.items.filter(i => i.id !== id),
        });
        setExpandedNotes(prev => { const n = new Set(prev); n.delete(id); return n; });
    };

    const toggleNote = (id: string) => {
        setExpandedNotes(prev => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id); else n.add(id);
            return n;
        });
    };

    const updateNote = (id: string, note: string) => {
        onUpdateSession({
            ...session,
            items: session.items.map(i => i.id === id ? { ...i, note } : i),
        });
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-10rem)]">
            {/* ── Header bar ── */}
            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={onCancel}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                        }`}
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold truncate">{session.name}</h2>
                    <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <MapPin size={12} /> {session.warehouse}
                        <span>·</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${session.mode === 'quick'
                            ? isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                            : isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                            }`}>
                            {session.mode === 'quick' ? 'Schnell' : 'Normal'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Search bar + autocomplete ── */}
            <div className="relative mb-4">
                <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                    ref={searchRef}
                    type="text"
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                    onFocus={() => searchTerm.trim() && setShowDropdown(true)}
                    placeholder="Artikel suchen (Name, SKU, System)…"
                    className={`w-full pl-10 pr-10 py-3.5 rounded-2xl border text-sm transition-colors ${isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-slate-700'
                        : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0077B5]/30'
                        } focus:outline-none focus:ring-2 focus:ring-[#0077B5]/20`}
                    inputMode="search"
                    autoComplete="off"
                />
                {searchTerm && (
                    <button
                        onClick={() => { setSearchTerm(''); setShowDropdown(false); }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                        <X size={16} />
                    </button>
                )}

                {/* Autocomplete dropdown */}
                {showDropdown && searchTerm.trim() && (
                    <div
                        ref={dropdownRef}
                        className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                            }`}
                    >
                        {searchResults.length > 0 ? (
                            searchResults.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => addItem(item)}
                                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 active:bg-slate-700' : 'border-slate-100 hover:bg-slate-50 active:bg-slate-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                            <Package size={16} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">{item.name}</div>
                                            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                <span className="font-mono">{item.sku}</span>
                                                {item.warehouseLocation && (
                                                    <><span>·</span><span>{item.warehouseLocation}</span></>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`text-right shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            <div className="text-xs font-bold">Bestand</div>
                                            <div className="font-mono font-bold text-sm">{item.stockLevel}</div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className={`px-4 py-6 text-center text-sm ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                Kein Artikel gefunden für „{searchTerm}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Cart items ── */}
            <div className="flex-1 space-y-3 pb-28">
                {session.items.length > 0 ? (
                    session.items.map(item => (
                        <AuditCartItem
                            key={item.id}
                            item={item}
                            theme={theme}
                            onUpdateQty={updateQty}
                            onRemove={removeItem}
                            onToggleNote={toggleNote}
                            showNote={expandedNotes.has(item.id)}
                            onUpdateNote={updateNote}
                        />
                    ))
                ) : (
                    <div className={`text-center py-20 rounded-2xl border border-dashed ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <ShoppingCart size={48} className={`mx-auto mb-4 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                        <p className={`font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Noch keine Artikel
                        </p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            Suche oben nach Artikeln und füge sie hinzu.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Sticky bottom bar ── */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl lg:left-[68px] ${isDark ? 'bg-[#1e293b]/95 border-slate-800' : isSoft ? 'bg-[#E2E7EB]/95 border-[#D4DDE2]' : 'bg-white/95 border-slate-200'
                }`} style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-4">
                    {/* Stats */}
                    <div className="flex-1">
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {session.items.length} Artikel · {totalItems} Stück gezählt
                        </div>
                        {session.items.length > 0 && (
                            <div className={`w-full h-1 rounded-full mt-1.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                <div className="h-full rounded-full bg-[#0077B5] transition-all duration-500" style={{ width: `${Math.min(100, (session.items.length / Math.max(1, inventory.length)) * 100)}%` }} />
                            </div>
                        )}
                    </div>

                    {/* Finish button */}
                    <button
                        onClick={onFinish}
                        disabled={session.items.length === 0}
                        className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${session.items.length > 0
                            ? 'bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg shadow-blue-500/20 hover:shadow-xl active:scale-[0.98]'
                            : isDark
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Fertig →
                    </button>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// AUDIT REVIEW — Manager view for pending/completed audits
// ═══════════════════════════════════════════════════════════
interface AuditReviewProps {
    theme: Theme;
    session: AuditSession;
    currentUser: AuthUser | null;
    onBack: () => void;
    onApprove: (session: AuditSession, reviewNote: string) => void;
    onReject: (session: AuditSession, reviewNote: string) => void;
}

const AuditReview: React.FC<AuditReviewProps> = ({ theme, session, currentUser, onBack, onApprove, onReject }) => {
    const isDark = theme === 'dark';
    const isSoft = theme === 'soft';
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [reviewNote, setReviewNote] = useState('');
    const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);

    const isAdmin = currentUser?.role === 'admin';
    const isPending = session.status === 'pending-review';
    const canReview = isAdmin && isPending;

    const matches = session.items.filter(i => i.variance === 0);
    const overages = session.items.filter(i => i.variance > 0);
    const shortages = session.items.filter(i => i.variance < 0);
    const totalExpected = session.items.reduce((s, i) => s + i.expectedQty, 0);
    const totalCounted = session.items.reduce((s, i) => s + i.countedQty, 0);
    const totalVariance = totalCounted - totalExpected;
    const isPerfect = session.items.length > 0 && matches.length === session.items.length;

    const cardBg = isDark ? 'bg-slate-900/50 border-slate-800' : isSoft ? 'bg-white/80 border-[#D4DDE2]' : 'bg-white border-slate-200';

    const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG['cancelled'];
    const StatusIcon = cfg.icon;

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    };

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    };

    // Reusable variance row (same visual pattern as AuditSummary)
    const ReviewRow: React.FC<{ item: AuditItem; type: 'match' | 'over' | 'short' }> = ({ item, type }) => {
        const isExpanded = expandedItems.has(item.id);
        const colors = { match: isDark ? 'border-emerald-500/20' : 'border-emerald-200', over: isDark ? 'border-amber-500/20' : 'border-amber-200', short: isDark ? 'border-red-500/20' : 'border-red-200' };
        const varColor = { match: isDark ? 'text-emerald-400' : 'text-emerald-600', over: isDark ? 'text-amber-400' : 'text-amber-600', short: isDark ? 'text-red-400' : 'text-red-600' };
        const bgH = { match: isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50', over: isDark ? 'bg-amber-500/5' : 'bg-amber-50/50', short: isDark ? 'bg-red-500/5' : 'bg-red-50/50' };

        return (
            <button onClick={() => toggleExpand(item.id)} className={`w-full text-left rounded-xl border p-3.5 transition-all ${colors[type]} ${bgH[type]}`}>
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{item.name}</div>
                        <div className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.sku}</div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className={`font-bold font-mono text-sm ${varColor[type]}`}>{item.variance > 0 ? '+' : ''}{item.variance}</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{item.expectedQty} → {item.countedQty}</div>
                    </div>
                </div>
                {isExpanded && (
                    <div className={`mt-3 pt-3 border-t border-dashed space-y-1.5 text-xs ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <div className="flex justify-between"><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Erwartet</span><span className="font-mono font-bold">{item.expectedQty}</span></div>
                        <div className="flex justify-between"><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Gezählt</span><span className="font-mono font-bold">{item.countedQty}</span></div>
                        <div className="flex justify-between"><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Abweichung</span><span className={`font-mono font-bold ${varColor[type]}`}>{item.variance > 0 ? '+' : ''}{item.variance}</span></div>
                        {item.warehouse && <div className="flex justify-between"><span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Lager</span><span className="flex items-center gap-1"><MapPin size={10} />{item.warehouse}</span></div>}
                        {item.note && <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}><span className="font-bold">Notiz:</span> {item.note}</div>}
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold">{session.name}</h2>
                    <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <MapPin size={12} /> {session.warehouse}
                        <span>·</span>
                        <span>{formatDate(session.createdAt)}</span>
                    </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${isDark ? cfg.darkColor : cfg.color}`}>
                    <StatusIcon size={14} /> {cfg.label}
                </div>
            </div>

            {/* Meta info card */}
            <div className={`rounded-2xl border p-4 space-y-2 ${cardBg}`}>
                <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Modus</span>
                    <span className="font-bold">{session.mode === 'quick' ? 'Schnellzählung' : 'Normale Inventur'}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Gezählt von</span>
                    <span className="font-bold">{session.createdByName}</span>
                </div>
                {session.reviewedByName && (
                    <div className="flex justify-between text-xs">
                        <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{session.status === 'approved' ? 'Genehmigt von' : 'Geprüft von'}</span>
                        <span className="font-bold">{session.reviewedByName}</span>
                    </div>
                )}
                {session.reviewedAt && (
                    <div className="flex justify-between text-xs">
                        <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Geprüft am</span>
                        <span className="font-bold">{formatDate(session.reviewedAt)}</span>
                    </div>
                )}
                {session.reviewNote && (
                    <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        <span className="font-bold">Kommentar:</span> {session.reviewNote}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className={`rounded-2xl border p-5 ${cardBg}`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{session.items.length}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Artikel</div>
                    </div>
                    <div>
                        <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCounted}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gezählt</div>
                    </div>
                    <div>
                        <div className={`text-2xl font-bold font-mono ${totalVariance === 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : totalVariance > 0 ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                            {totalVariance > 0 ? '+' : ''}{totalVariance}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Differenz</div>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-dashed" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
                    {matches.length > 0 && <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}><CheckCircle2 size={12} /> {matches.length} OK</span>}
                    {overages.length > 0 && <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'}`}><Plus size={12} /> {overages.length} Mehr</span>}
                    {shortages.length > 0 && <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}><Minus size={12} /> {shortages.length} Weniger</span>}
                </div>
            </div>

            {isPerfect && (
                <div className={`rounded-2xl border p-6 text-center ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="text-4xl mb-2">🎉</div>
                    <p className={`font-bold text-lg ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Perfekte Übereinstimmung!</p>
                </div>
            )}

            {/* Variance sections */}
            {shortages.length > 0 && (
                <div className="space-y-2">
                    <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}><AlertTriangle size={14} /> Fehlmengen ({shortages.length})</h3>
                    {shortages.map(item => <ReviewRow key={item.id} item={item} type="short" />)}
                </div>
            )}
            {overages.length > 0 && (
                <div className="space-y-2">
                    <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}><Plus size={14} /> Übermengen ({overages.length})</h3>
                    {overages.map(item => <ReviewRow key={item.id} item={item} type="over" />)}
                </div>
            )}
            {matches.length > 0 && !isPerfect && (
                <div className="space-y-2">
                    <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}><CheckCircle2 size={14} /> Übereinstimmung ({matches.length})</h3>
                    {matches.map(item => <ReviewRow key={item.id} item={item} type="match" />)}
                </div>
            )}

            {/* Manager approval actions */}
            {canReview && (
                <div className={`rounded-2xl border p-5 space-y-4 ${cardBg}`}>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Prüfung & Freigabe</h3>

                    {/* Review note */}
                    <div>
                        <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Kommentar (optional)</label>
                        <input
                            type="text"
                            value={reviewNote}
                            onChange={e => setReviewNote(e.target.value)}
                            placeholder="Anmerkung zur Prüfung…"
                            className={`w-full px-3 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'} focus:outline-none focus:ring-2 focus:ring-[#0077B5]/20`}
                        />
                    </div>

                    {!confirmAction ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction('reject')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-colors ${isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                            >
                                <XCircle size={16} /> Ablehnen
                            </button>
                            <button
                                onClick={() => setConfirmAction('approve')}
                                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg shadow-blue-500/20 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} /> Genehmigen
                            </button>
                        </div>
                    ) : (
                        <div className={`p-4 rounded-xl border space-y-3 ${confirmAction === 'approve' ? (isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200') : (isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200')}`}>
                            <p className={`text-sm font-bold ${confirmAction === 'approve' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                                {confirmAction === 'approve'
                                    ? `Inventur genehmigen? Bestand wird auf gezählte Mengen aktualisiert.${shortages.length > 0 ? ` ${shortages.length} Fehlmengen werden als Abschreibung gebucht.` : ''}`
                                    : 'Inventur ablehnen? Der Zähler wird benachrichtigt und kann die Zählung wiederholen.'
                                }
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => setConfirmAction(null)} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}>
                                    Abbrechen
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirmAction === 'approve') onApprove(session, reviewNote);
                                        else onReject(session, reviewNote);
                                    }}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-colors ${confirmAction === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
                                >
                                    {confirmAction === 'approve' ? 'Ja, genehmigen' : 'Ja, ablehnen'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Read-only state indicator for non-admins or already-reviewed */}
            {!canReview && (
                <div className={`rounded-2xl border p-4 flex items-center gap-3 ${cardBg}`}>
                    <Eye size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {session.status === 'approved' ? 'Diese Inventur wurde genehmigt und der Bestand aktualisiert.'
                            : session.status === 'rejected' ? 'Diese Inventur wurde abgelehnt.'
                                : session.status === 'pending-review' ? 'Diese Inventur wartet auf Genehmigung durch einen Administrator.'
                                    : 'Schreibgeschützte Ansicht.'}
                    </span>
                </div>
            )}
        </div>
    );
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