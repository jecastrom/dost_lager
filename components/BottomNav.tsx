import React from 'react';
import { LayoutDashboard, Box, FileText, ClipboardList, ClipboardCheck } from 'lucide-react';
import { ActiveModule, Theme } from '../types';

interface BottomNavProps {
    theme: Theme;
    activeModule: ActiveModule;
    onNavigate: (module: ActiveModule) => void;
    hidden?: boolean;
}

const NAV_ITEMS: { id: ActiveModule; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Lager', icon: LayoutDashboard },
    { id: 'inventory', label: 'Artikel', icon: Box },
    { id: 'order-management', label: 'Bestell.', icon: FileText },
    { id: 'receipt-management', label: 'Eingang', icon: ClipboardList },
    // Audit placeholder — navigates nowhere yet, visually ready
    { id: 'dashboard' as ActiveModule, label: 'Audit', icon: ClipboardCheck },
];

export const BottomNav: React.FC<BottomNavProps> = ({ theme, activeModule, onNavigate, hidden }) => {
    const isDark = theme === 'dark';
    const isSoft = theme === 'soft';

    const bg = isDark ? 'bg-[#1e293b]/95' : isSoft ? 'bg-[#F5F5F6]/95' : 'bg-white/95';
    const border = isDark ? 'border-slate-800' : isSoft ? 'border-[#E6E7EB]' : 'border-slate-200';
    const inactiveColor = isDark ? 'text-slate-500' : 'text-slate-400';
    const activeColor = 'text-[#0077B5]';

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t backdrop-blur-xl ${bg} ${border}`}
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
                transform: hidden ? 'translateY(100%)' : 'translateY(0)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <div className="flex items-stretch justify-around h-[4.75rem] max-w-lg mx-auto">
                {NAV_ITEMS.map((item, idx) => {
                    const Icon = item.icon;
                    const isAuditPlaceholder = idx === 4;
                    // Active = exact match, except audit placeholder is never "active"
                    const isActive = !isAuditPlaceholder && activeModule === item.id;

                    return (
                        <button
                            key={`${item.id}-${idx}`}
                            onClick={() => {
                                if (isAuditPlaceholder) return; // No-op for now
                                onNavigate(item.id);
                            }}
                            className={`relative flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors duration-150
                ${isAuditPlaceholder ? 'opacity-35 cursor-default' : ''}
                ${isActive ? activeColor : inactiveColor}
              `}
                            // Native tap feel: prevent highlight delay
                            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                        >
                            {/* Active indicator bar */}
                            {isActive && (
                                <span
                                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-b-full bg-[#0077B5]"
                                    style={{ width: 32, transition: 'width 0.2s ease' }}
                                />
                            )}

                            <Icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 1.8}
                                className={`transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}
                            />
                            <span
                                className={`text-[10px] leading-none font-semibold transition-colors duration-150
                  ${isActive ? 'text-[#0077B5]' : ''}`}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};