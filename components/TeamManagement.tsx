import React, { useState, useEffect } from 'react';
import { Theme, ActiveModule, AuthUser, UserProfile, UserRole } from '../types';
import {
    ArrowLeft, Users, Plus, Shield, User, Mail, Check, X, Loader2,
    ToggleLeft, ToggleRight, Pencil, UserX, UserCheck, ChevronDown, ChevronUp,
    Package, ClipboardList, Truck, ShoppingCart, Settings, BarChart3, AlertCircle
} from 'lucide-react';

interface TeamManagementProps {
    theme: Theme;
    currentUser: AuthUser;
    onNavigate: (module: ActiveModule) => void;
    addAudit: (event: string, details: Record<string, any>) => void;
}

const FEATURE_OPTIONS: { key: string; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'stock', label: 'Lagerbestand', icon: <Package size={16} />, description: 'Bestandsansicht und Korrekturen' },
    { key: 'audit', label: 'Inventur', icon: <ClipboardList size={16} />, description: 'Inventurzählung durchführen' },
    { key: 'receipts', label: 'Wareneingang', icon: <Truck size={16} />, description: 'Lieferungen prüfen und buchen' },
    { key: 'orders', label: 'Bestellungen', icon: <ShoppingCart size={16} />, description: 'Bestellungen erstellen und verwalten' },
    { key: 'suppliers', label: 'Lieferanten', icon: <Users size={16} />, description: 'Lieferantendaten und Bewertungen' },
    { key: 'settings', label: 'Einstellungen', icon: <Settings size={16} />, description: 'Persönliche App-Einstellungen' },
    { key: 'global-settings', label: 'Globale Einstellungen', icon: <Shield size={16} />, description: 'System-Konfiguration (nur Admin)' },
];

export const TeamManagement: React.FC<TeamManagementProps> = ({
    theme,
    currentUser,
    onNavigate,
    addAudit,
}) => {
    const isDark = theme === 'dark';
    const isSoft = theme === 'soft';

    // State
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'team' as UserRole,
        featureAccess: ['stock', 'audit'] as string[],
    });

    // Fetch all users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/user-profiles');
            if (!res.ok) throw new Error('Fehler beim Laden der Benutzer');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'Unbekannter Fehler');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            firstName: '',
            lastName: '',
            role: 'team',
            featureAccess: ['stock', 'audit'],
        });
        setShowAddForm(false);
        setEditingUser(null);
    };

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    const handleRoleChange = (role: UserRole) => {
        if (role === 'admin') {
            setFormData(prev => ({
                ...prev,
                role,
                featureAccess: FEATURE_OPTIONS.map(f => f.key),
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                role,
                featureAccess: ['stock', 'audit'],
            }));
        }
    };

    const toggleFeature = (key: string) => {
        setFormData(prev => ({
            ...prev,
            featureAccess: prev.featureAccess.includes(key)
                ? prev.featureAccess.filter(f => f !== key)
                : [...prev.featureAccess, key],
        }));
    };

    const handleSaveUser = async () => {
        if (!formData.email || !formData.firstName || !formData.lastName) {
            setError('Bitte füllen Sie alle Pflichtfelder aus.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const isEdit = !!editingUser;
            const userId = isEdit ? editingUser!.id : crypto.randomUUID();

            const body: UserProfile = {
                id: userId,
                email: formData.email.toLowerCase().trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                role: formData.role,
                featureAccess: formData.role === 'admin'
                    ? FEATURE_OPTIONS.map(f => f.key)
                    : formData.featureAccess,
                isActive: isEdit ? editingUser!.isActive : true,
                createdAt: isEdit ? editingUser!.createdAt : Date.now(),
                createdBy: isEdit ? editingUser!.createdBy : currentUser.userId,
            };

            const res = await fetch('/api/user-profiles', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Fehler beim Speichern');

            addAudit(isEdit ? 'User Updated' : 'User Created', {
                targetUser: `${body.firstName} ${body.lastName}`,
                email: body.email,
                role: body.role,
            });

            showSuccess(isEdit ? 'Benutzer aktualisiert' : 'Benutzer hinzugefügt');
            resetForm();
            await fetchUsers();
        } catch (err: any) {
            setError(err.message || 'Speichern fehlgeschlagen');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (user: UserProfile) => {
        if (user.id === currentUser.userId) return; // Can't deactivate yourself

        try {
            const updated = { ...user, isActive: !user.isActive };
            const res = await fetch('/api/user-profiles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            if (!res.ok) throw new Error('Fehler beim Aktualisieren');

            addAudit(updated.isActive ? 'User Activated' : 'User Deactivated', {
                targetUser: `${user.firstName} ${user.lastName}`,
                email: user.email,
            });

            showSuccess(updated.isActive ? 'Benutzer aktiviert' : 'Benutzer deaktiviert');
            await fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEditUser = (user: UserProfile) => {
        setFormData({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            featureAccess: user.featureAccess || [],
        });
        setEditingUser(user);
        setShowAddForm(true);
    };

    // Card styling
    const cardBg = isDark ? 'bg-slate-900/50 border-slate-800' : isSoft ? 'bg-white/80 border-[#D4DDE2]' : 'bg-white border-slate-200 shadow-sm';
    const headerBg = isDark ? 'bg-slate-900 border-slate-800' : isSoft ? 'bg-[#E8EDF0] border-[#D4DDE2]' : 'bg-slate-50 border-slate-200';
    const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0077B5]/30 focus:border-[#0077B5] ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
            : isSoft ? 'bg-[#E8EDF0] border-[#D4DDE2] text-[#2C3E47] placeholder-[#5C7E8F]'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
        }`;

    return (
        <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">

            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => onNavigate('global-settings')}
                    className={`flex items-center gap-2 text-sm font-bold mb-4 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <ArrowLeft size={16} /> Zurück zu Globale Einstellungen
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#0077B5]/10' : 'bg-[#0077B5]/10'}`}>
                            <Users size={24} className="text-[#0077B5]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Team-Verwaltung</h1>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Benutzer hinzufügen, Rollen und Zugriffsrechte verwalten
                            </p>
                        </div>
                    </div>

                    {!showAddForm && (
                        <button
                            onClick={() => { resetForm(); setShowAddForm(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0077B5] hover:bg-[#006399] text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
                        >
                            <Plus size={16} /> Hinzufügen
                        </button>
                    )}
                </div>
            </div>

            {/* Success Message */}
            {successMsg && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                    <Check size={16} /> {successMsg}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                    <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
                </div>
            )}

            {/* ═══ ADD / EDIT FORM ═══ */}
            {showAddForm && (
                <div className={`rounded-2xl border overflow-hidden mb-6 ${cardBg}`}>
                    <div className={`px-6 py-3 border-b flex items-center justify-between ${headerBg}`}>
                        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {editingUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
                        </span>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Vorname *</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    placeholder="Max"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nachname *</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    placeholder="Mustermann"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>E-Mail-Adresse *</label>
                            <div className="relative">
                                <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="m.mustermann@dost-infosys.de"
                                    className={`${inputClass} pl-9`}
                                    disabled={!!editingUser}
                                />
                            </div>
                            {editingUser && (
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>E-Mail kann nach Erstellung nicht geändert werden</p>
                            )}
                        </div>

                        {/* Role Selector */}
                        <div>
                            <label className={`text-xs font-bold mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Rolle *</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleRoleChange('admin')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${formData.role === 'admin'
                                            ? 'border-[#0077B5] bg-[#0077B5]/10 text-[#0077B5]'
                                            : isDark ? 'border-slate-700 text-slate-400 hover:border-slate-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    <Shield size={16} /> Administrator
                                </button>
                                <button
                                    onClick={() => handleRoleChange('team')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${formData.role === 'team'
                                            ? 'border-[#0077B5] bg-[#0077B5]/10 text-[#0077B5]'
                                            : isDark ? 'border-slate-700 text-slate-400 hover:border-slate-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    <User size={16} /> Team-Mitglied
                                </button>
                            </div>
                        </div>

                        {/* Feature Toggles (only for team members) */}
                        {formData.role === 'team' && (
                            <div>
                                <label className={`text-xs font-bold mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Zugriff auf Module
                                </label>
                                <div className="space-y-1.5">
                                    {FEATURE_OPTIONS.filter(f => f.key !== 'global-settings').map(feature => {
                                        const isOn = formData.featureAccess.includes(feature.key);
                                        return (
                                            <button
                                                key={feature.key}
                                                onClick={() => toggleFeature(feature.key)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isOn
                                                        ? isDark ? 'bg-[#0077B5]/10 border border-[#0077B5]/30' : 'bg-[#0077B5]/5 border border-[#0077B5]/20'
                                                        : isDark ? 'bg-slate-800/50 border border-slate-700/50 opacity-50' : 'bg-slate-50 border border-slate-200 opacity-50'
                                                    } hover:opacity-100`}
                                            >
                                                <div className={`${isOn ? 'text-[#0077B5]' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {feature.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-semibold ${isOn ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-500'}`}>
                                                        {feature.label}
                                                    </div>
                                                    <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        {feature.description}
                                                    </div>
                                                </div>
                                                {isOn ? (
                                                    <ToggleRight size={22} className="text-[#0077B5] shrink-0" />
                                                ) : (
                                                    <ToggleLeft size={22} className={`shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {formData.role === 'admin' && (
                            <div className={`px-4 py-3 rounded-xl text-xs ${isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                <strong>Hinweis:</strong> Administratoren haben automatisch Zugriff auf alle Module inkl. Globale Einstellungen und Team-Verwaltung.
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={resetForm}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={saving || !formData.email || !formData.firstName || !formData.lastName}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#0077B5] hover:bg-[#006399] text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 size={16} className="animate-spin" /> Speichern…</> : <><Check size={16} /> {editingUser ? 'Aktualisieren' : 'Erstellen'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ USER LIST ═══ */}
            <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                <div className={`px-6 py-3 border-b flex items-center justify-between ${headerBg}`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Benutzer ({users.length})
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12 gap-3">
                        <Loader2 size={20} className="animate-spin text-[#0077B5]" />
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Laden…</span>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <Users size={32} className={`mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Noch keine Benutzer angelegt</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map(user => {
                            const isExpanded = expandedUserId === user.id;
                            const isYou = user.id === currentUser.userId;

                            return (
                                <div key={user.id} className={`transition-colors ${!user.isActive ? 'opacity-50' : ''}`}>
                                    {/* User Row */}
                                    <div
                                        onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                                        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${user.role === 'admin'
                                                ? 'bg-[#0077B5]/10 text-[#0077B5]'
                                                : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {user.firstName[0]}{user.lastName[0]}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {user.firstName} {user.lastName}
                                                </span>
                                                {isYou && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0077B5]/10 text-[#0077B5]">DU</span>
                                                )}
                                                {!user.isActive && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-500">INAKTIV</span>
                                                )}
                                            </div>
                                            <div className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {user.email}
                                            </div>
                                        </div>

                                        {/* Role Badge */}
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ${user.role === 'admin'
                                                ? 'bg-[#0077B5]/10 text-[#0077B5]'
                                                : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {user.role === 'admin' ? 'Admin' : 'Team'}
                                        </span>

                                        {/* Expand Arrow */}
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                                    </div>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <div className={`px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-slate-800/30' : isSoft ? 'bg-[#E8EDF0]/50' : 'bg-slate-50/50'}`}>
                                            {/* Feature Access Tags */}
                                            <div>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Modul-Zugriff</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(user.featureAccess || []).map(key => {
                                                        const feature = FEATURE_OPTIONS.find(f => f.key === key);
                                                        return (
                                                            <span key={key} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border border-slate-200'
                                                                }`}>
                                                                {feature?.icon} {feature?.label || key}
                                                            </span>
                                                        );
                                                    })}
                                                    {(!user.featureAccess || user.featureAccess.length === 0) && (
                                                        <span className="text-[10px] text-slate-500 italic">Kein Zugriff</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Meta Info */}
                                            <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                Erstellt: {new Date(user.createdAt).toLocaleDateString('de-DE')}
                                                {user.lastLogin && <> · Letzter Login: {new Date(user.lastLogin).toLocaleDateString('de-DE')}</>}
                                            </p>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditUser(user); }}
                                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                        }`}
                                                >
                                                    <Pencil size={13} /> Bearbeiten
                                                </button>

                                                {!isYou && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleToggleActive(user); }}
                                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${user.isActive
                                                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                                            }`}
                                                    >
                                                        {user.isActive ? <><UserX size={13} /> Deaktivieren</> : <><UserCheck size={13} /> Aktivieren</>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};