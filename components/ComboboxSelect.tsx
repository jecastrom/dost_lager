import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Check, ChevronDown, Plus, X, FolderOpen } from 'lucide-react';
import { Theme, LagerortCategory } from '../types';

// ── Types ──

export interface ComboboxGroup {
    id: string;
    name: string;
    items: string[];
}

interface ComboboxSelectProps {
    value: string;
    onChange: (val: string) => void;
    groups: ComboboxGroup[];
    placeholder?: string;
    label?: string;
    theme: Theme;
    onAddNew?: (value: string, groupId: string) => void;
    disabled?: boolean;
}

// ── Component ──

export const ComboboxSelect: React.FC<ComboboxSelectProps> = ({
    value,
    onChange,
    groups,
    placeholder = 'Wählen...',
    label,
    theme,
    onAddNew,
    disabled = false
}) => {
    const isDark = theme === 'dark';
    const isSoft = theme === 'soft';
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const [showAddNew, setShowAddNew] = useState(false);
    const [newVal, setNewVal] = useState('');
    const [addToGroup, setAddToGroup] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Build flat list for keyboard navigation
    const flatItems = useMemo(() => {
        const result: Array<{ value: string; groupId: string; groupName: string }> = [];
        groups.forEach(g => {
            const filtered = search
                ? g.items.filter(item => item.toLowerCase().includes(search.toLowerCase()))
                : g.items;
            filtered.forEach(item => result.push({ value: item, groupId: g.id, groupName: g.name }));
        });
        return result;
    }, [groups, search]);

    // Filtered groups for rendering
    const filteredGroups = useMemo(() => {
        if (!search) return groups;
        return groups
            .map(g => ({
                ...g,
                items: g.items.filter(item => item.toLowerCase().includes(search.toLowerCase()))
            }))
            .filter(g => g.items.length > 0);
    }, [groups, search]);

    const totalResults = filteredGroups.reduce((sum, g) => sum + g.items.length, 0);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
                setHighlightIdx(-1);
                setShowAddNew(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus input when opening
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightIdx >= 0 && listRef.current) {
            const el = listRef.current.querySelector(`[data-idx="${highlightIdx}"]`);
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightIdx]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearch('');
        setHighlightIdx(-1);
        setShowAddNew(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightIdx(prev => Math.min(prev + 1, flatItems.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightIdx(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightIdx >= 0 && highlightIdx < flatItems.length) {
                    handleSelect(flatItems[highlightIdx].value);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearch('');
                setHighlightIdx(-1);
                break;
        }
    };

    const handleAddNew = () => {
        if (newVal.trim() && onAddNew && addToGroup) {
            onAddNew(newVal.trim(), addToGroup);
            handleSelect(newVal.trim());
            setNewVal('');
            setShowAddNew(false);
            setAddToGroup(null);
        }
    };

    // Theme-aware classes
    const bgBase = isDark ? 'bg-slate-900' : isSoft ? 'bg-white' : 'bg-white';
    const borderBase = isDark ? 'border-slate-700' : isSoft ? 'border-[#d0d4e4]' : 'border-slate-300';
    const bgDropdown = isDark ? 'bg-[#1e293b]' : isSoft ? 'bg-white' : 'bg-white';
    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textSecondary = isDark ? 'text-slate-400' : isSoft ? 'text-[#676879]' : 'text-slate-500';
    const bgHover = isDark ? 'hover:bg-slate-800' : isSoft ? 'hover:bg-[#f5f6f8]' : 'hover:bg-slate-50';
    const bgHighlight = isDark ? 'bg-slate-800' : isSoft ? 'bg-[#f0f1f5]' : 'bg-blue-50';
    const bgSelected = isDark ? 'bg-blue-500/10 text-blue-400' : isSoft ? 'bg-[#0077B5]/5 text-[#0077B5]' : 'bg-blue-50 text-blue-600';

    // Compute global flat index for keyboard nav
    let globalIdx = -1;

    return (
        <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
            {label && (
                <label className={`text-sm font-bold block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {label}
                </label>
            )}

            {/* ── Trigger Button ── */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${bgBase} ${borderBase} ${textPrimary} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${isOpen ? 'ring-2 ring-[#0077B5]/30 border-[#0077B5]' : ''}`}
            >
                <span className={value ? '' : textSecondary}>{value || placeholder}</span>
                <ChevronDown size={16} className={`transition-transform ${textSecondary} ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* ── Dropdown ── */}
            {isOpen && (
                <div className={`absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${bgDropdown} ${borderBase}`}
                    style={{ maxHeight: '320px' }}>

                    {/* Search input */}
                    <div className={`p-2 border-b ${isDark ? 'border-slate-700' : isSoft ? 'border-[#d0d4e4]' : 'border-slate-200'}`}>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-slate-800' : isSoft ? 'bg-[#f5f6f8]' : 'bg-slate-50'}`}>
                            <Search size={14} className={textSecondary} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setHighlightIdx(0); }}
                                placeholder="Suchen..."
                                className={`flex-1 bg-transparent outline-none text-sm ${textPrimary}`}
                            />
                            {search && (
                                <button onClick={() => { setSearch(''); setHighlightIdx(-1); }} className={`${textSecondary} hover:opacity-70`}>
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grouped list */}
                    <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: '230px' }}>
                        {filteredGroups.length === 0 ? (
                            <div className={`p-4 text-center text-sm ${textSecondary}`}>
                                Keine Ergebnisse für „{search}"
                            </div>
                        ) : (
                            filteredGroups.map((group, gIdx) => (
                                <div key={group.id}>
                                    {/* Group separator (not on first group) */}
                                    {gIdx > 0 && (
                                        <div className={`mx-3 border-t ${isDark ? 'border-slate-700' : isSoft ? 'border-[#d0d4e4]' : 'border-slate-200'}`} />
                                    )}

                                    {/* Group header */}
                                    <div className={`px-3 pt-2.5 pb-1 flex items-center gap-2 ${textSecondary}`}>
                                        <FolderOpen size={11} className="opacity-60" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{group.name}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-slate-800' : isSoft ? 'bg-[#f0f1f5]' : 'bg-slate-100'}`}>
                                            {group.items.length}
                                        </span>
                                    </div>

                                    {/* Group items */}
                                    {group.items.map(item => {
                                        globalIdx++;
                                        const idx = globalIdx;
                                        const isSelected = item === value;
                                        const isHighlighted = idx === highlightIdx;

                                        return (
                                            <button
                                                key={`${group.id}-${item}`}
                                                data-idx={idx}
                                                type="button"
                                                onClick={() => handleSelect(item)}
                                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${isSelected ? bgSelected
                                                    : isHighlighted ? bgHighlight
                                                        : bgHover
                                                    } ${textPrimary}`}
                                            >
                                                <span className="truncate">{item}</span>
                                                {isSelected && <Check size={14} className="shrink-0 text-[#0077B5]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add new */}
                    {onAddNew && (
                        <div className={`border-t ${isDark ? 'border-slate-700' : isSoft ? 'border-[#d0d4e4]' : 'border-slate-200'}`}>
                            {!showAddNew ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddNew(true);
                                        setAddToGroup(groups[0]?.id || null);
                                    }}
                                    className={`w-full px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${isDark ? 'text-[#0077B5] hover:bg-slate-800' : 'text-[#0077B5] hover:bg-slate-50'
                                        }`}
                                >
                                    <Plus size={14} /> Neuer Lagerort
                                </button>
                            ) : (
                                <div className="p-2 space-y-2">
                                    {/* Category picker for new item */}
                                    <div className="flex gap-1.5">
                                        {groups.map(g => (
                                            <button
                                                key={g.id}
                                                type="button"
                                                onClick={() => setAddToGroup(g.id)}
                                                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border ${addToGroup === g.id
                                                    ? 'bg-[#0077B5] text-white border-[#0077B5]'
                                                    : isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {g.name}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Input + actions */}
                                    <div className="flex gap-1.5">
                                        <input
                                            type="text"
                                            value={newVal}
                                            onChange={(e) => setNewVal(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleAddNew(); }
                                                if (e.key === 'Escape') { setShowAddNew(false); setNewVal(''); }
                                            }}
                                            placeholder="Name..."
                                            className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-slate-800 border-slate-600 text-white focus:border-[#0077B5]'
                                                : 'bg-white border-slate-300 focus:border-[#0077B5]'
                                                }`}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddNew}
                                            disabled={!newVal.trim() || !addToGroup}
                                            className="px-3 py-2 bg-[#0077B5] text-white rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-[#006399] transition-colors"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowAddNew(false); setNewVal(''); }}
                                            className={`px-2 py-2 rounded-lg text-sm ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};