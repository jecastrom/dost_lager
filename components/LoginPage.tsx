import React, { useState } from 'react';
import { Package, LogIn, Shield, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface LoginPageProps {
    isLoading?: boolean;
    error?: string | null;
    isOffline?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
    isLoading = false,
    error = null,
    isOffline = false,
}) => {
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleLogin = () => {
        setIsRedirecting(true);
        // Azure SWA built-in auth endpoint
        window.location.href = '/.auth/login/aad?post_login_redirect_uri=/';
    };

    return (
        <div className="login-page min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">

            {/* ═══ Animated Background ═══ */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0,119,181,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(0,160,220,0.1) 0%, transparent 50%),
                            radial-gradient(circle at 50% 80%, rgba(226,0,26,0.08) 0%, transparent 50%)`,
                }}
            />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* ═══ Main Card ═══ */}
            <div className="relative z-10 w-full max-w-sm">

                {/* Logo + Branding */}
                <div className="flex flex-col items-center mb-10">
                    {/* Animated Package Icon */}
                    <div className="relative mb-6">
                        {/* Glow ring */}
                        <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#0077B5]/20 to-[#00A0DC]/20 blur-xl animate-pulse" />
                        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0077B5] to-[#00A0DC] flex items-center justify-center shadow-2xl shadow-blue-500/30">
                            <Package className="text-white" size={40} strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* App Name */}
                    <div className="flex flex-col items-center leading-none select-none">
                        <div className="flex items-baseline gap-2">
                            <span className="font-black italic text-[#0077B5] text-4xl tracking-tighter">DOST</span>
                            <span className="font-black italic text-white/90 text-4xl tracking-tighter">LAGER</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 tracking-[0.3em] uppercase mt-2">
                            Warehouse Management
                        </span>
                    </div>
                </div>

                {/* Login Card */}
                <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 shadow-2xl">

                    {/* Welcome Text */}
                    <div className="text-center mb-8">
                        <h1 className="text-lg font-bold text-white/90 mb-1">Willkommen</h1>
                        <p className="text-sm text-slate-400">
                            Melden Sie sich an, um fortzufahren
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                            {error}
                        </div>
                    )}

                    {/* Offline Banner */}
                    {isOffline && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-center flex items-center justify-center gap-2">
                            <WifiOff size={14} />
                            <span>Keine Internetverbindung — Anmeldung nicht möglich</span>
                        </div>
                    )}

                    {/* Microsoft Login Button */}
                    <button
                        onClick={handleLogin}
                        disabled={isLoading || isRedirecting || isOffline}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl
              bg-[#0077B5] hover:bg-[#006399] active:bg-[#005580]
              disabled:opacity-40 disabled:cursor-not-allowed
              text-white font-semibold text-sm
              shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30
              transition-all duration-200 ease-out
              hover:translate-y-[-1px] active:translate-y-0"
                    >
                        {(isLoading || isRedirecting) ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Wird weitergeleitet…</span>
                            </>
                        ) : (
                            <>
                                {/* Microsoft Logo SVG */}
                                <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                                    <rect width="10" height="10" fill="#F25022" />
                                    <rect x="11" width="10" height="10" fill="#7FBA00" />
                                    <rect y="11" width="10" height="10" fill="#00A4EF" />
                                    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
                                </svg>
                                <span>Anmelden mit Microsoft</span>
                            </>
                        )}
                    </button>

                    {/* Different Account */}
                    <button
                        onClick={() => {
                            const azureAdLogout = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
                            window.location.href = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(azureAdLogout)}`;
                        }}
                        disabled={isOffline}
                        className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl
                          bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12]
                          disabled:opacity-30 disabled:cursor-not-allowed
                          text-slate-400 hover:text-slate-300 text-xs font-medium
                          transition-all duration-200"
                    >
                        <LogIn size={14} />
                        <span>Mit anderem Konto anmelden</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[10px] text-slate-600 uppercase tracking-wider">Gesichert durch</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    {/* Security Info */}
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Shield size={14} />
                        <span className="text-[11px]">Microsoft Entra ID</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                        <span className="font-black italic text-[#0077B5] text-xs tracking-tighter">DOST</span>
                        <span className="font-black italic text-[#E2001A] text-xs tracking-tighter">INFOSYS</span>
                    </div>
                    <p className="text-[10px] text-slate-600">
                        ProcureFlow v0.3.0
                    </p>
                </div>
            </div>

            {/* ═══ CSS Animations ═══ */}
            <style>{`
        .login-page {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
        </div>
    );
};