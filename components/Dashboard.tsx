
import React, { useMemo } from 'react';
import { Package, Activity, ShoppingCart, ClipboardCheck, AlertOctagon, ArrowRight, Calendar, User, FileText, MousePointer2, Briefcase, Truck, AlertTriangle, Clock } from 'lucide-react';
import { StockItem, StockLog, Theme, ActiveModule, PurchaseOrder, ReceiptMaster, Ticket } from '../types';
import { InsightsRow } from './InsightsRow';

interface DashboardProps {
  inventory: StockItem[];
  logs: StockLog[];
  theme: Theme;
  onAddStock: () => void;
  onNavigate: (module: ActiveModule) => void;
  orders: PurchaseOrder[];
  receipts: ReceiptMaster[];
  tickets: Ticket[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  inventory,
  logs,
  theme,
  onAddStock,
  onNavigate,
  orders = [],
  receipts = [],
  tickets = []
}) => {
  const isDark = theme === 'dark';

  // --- Metrics Calculation (Command Center) ---
  const metrics = useMemo(() => {
    // 1. OPEN ORDERS — Active POs
    const openOrders = orders.filter(o => !['Abgeschlossen', 'Storniert'].includes(o.status) && !o.isArchived).length;

    // 2. EXPECTED DELIVERIES — Pre-delivery states
    const awaitingStatuses = ['Wartet auf Lieferung', 'Lieferung heute', 'Lieferung morgen'];
    const expectedDeliveries = receipts.filter(r => awaitingStatuses.includes(r.status)).length;
    const todayCount = receipts.filter(r => r.status === 'Lieferung heute').length;
    const tomorrowCount = receipts.filter(r => r.status === 'Lieferung morgen').length;

    // 3. OVERDUE — Verspätet
    const overdueCount = receipts.filter(r => r.status === 'Verspätet').length;

    // 4. DEVIATIONS — Quality issues from receipts + open tickets
    const qualityStatuses = ['Schaden', 'Falsch geliefert', 'Schaden + Falsch', 'Abgelehnt', 'Übermenge', 'Teillieferung'];
    const qualityIssueReceipts = receipts.filter(r => qualityStatuses.includes(r.status)).length;
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const deviations = Math.max(qualityIssueReceipts, openTickets); // Avoid double-count: use whichever is higher as floor

    return { openOrders, expectedDeliveries, todayCount, tomorrowCount, overdueCount, deviations, openTickets, qualityIssueReceipts };
  }, [orders, receipts, tickets]);

  // --- Recent Activity (Last 5 Logs) ---
  const recentLogs = useMemo(() => {
    return [...logs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
  }, [logs]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
       {/* Header Actions */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
             <h2 className="text-2xl font-bold mb-1">Lager Übersicht</h2>
             <p className="text-slate-500 text-sm">Prozess-Status & Bestands-Highlights.</p>
          </div>
          <div className="flex items-center justify-center gap-2 w-full md:w-auto">
              <button
                  onClick={() => onNavigate('stock-logs')}
                  className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white border hover:bg-slate-50 text-slate-600'
                  }`}
              >
                  <Activity size={20} /> Protokoll
              </button>
              <button 
                onClick={onAddStock} 
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                    isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                }`}
              >
                <Package size={20} /> Wareneingang
              </button>
          </div>
       </div>

       {/* OPERATIVE ÜBERSICHT (WORKFLOW PULSE) */}
       <div className="space-y-3">
          <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Operative Übersicht
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
             {/* Card 1: Offene Bestellungen */}
             <button 
                onClick={() => onNavigate('order-management')}
                className={`p-4 md:p-5 rounded-2xl border flex flex-col gap-3 transition-all group text-left ${
                    isDark 
                    ? 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' 
                    : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md'
                }`}
             >
                <div className={`p-2.5 md:p-3 rounded-xl self-start ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <ShoppingCart size={22} />
                </div>
                <div>
                    <div className={`text-3xl md:text-4xl font-black leading-none mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.openOrders}</div>
                    <div className={`text-[10px] md:text-xs font-bold uppercase tracking-wide ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Offene Bestellungen</div>
                </div>
             </button>

             {/* Card 2: Erwartete Lieferungen */}
             <button 
                onClick={() => onNavigate('receipt-management')}
                className={`p-4 md:p-5 rounded-2xl border flex flex-col gap-3 transition-all group text-left ${
                    isDark 
                    ? 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20' 
                    : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md'
                }`}
             >
                <div className={`p-2.5 md:p-3 rounded-xl self-start ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Truck size={22} />
                </div>
                <div>
                    <div className={`text-3xl md:text-4xl font-black leading-none mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.expectedDeliveries}</div>
                    <div className={`text-[10px] md:text-xs font-bold uppercase tracking-wide ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Erwartete Lieferungen</div>
                    {(metrics.todayCount > 0 || metrics.tomorrowCount > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {metrics.todayCount > 0 && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                            Heute: {metrics.todayCount}
                          </span>
                        )}
                        {metrics.tomorrowCount > 0 && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-700'}`}>
                            Morgen: {metrics.tomorrowCount}
                          </span>
                        )}
                      </div>
                    )}
                </div>
             </button>

             {/* Card 3: Verspätet */}
             <button 
                onClick={() => onNavigate('receipt-management')}
                className={`p-4 md:p-5 rounded-2xl border flex flex-col gap-3 transition-all group text-left relative overflow-hidden ${
                    isDark 
                    ? 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20' 
                    : 'bg-white border-slate-200 hover:border-amber-500 hover:shadow-md'
                }`}
             >
                {metrics.overdueCount > 0 && (
                  <div className="absolute top-2 right-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                  </div>
                )}
                <div className={`p-2.5 md:p-3 rounded-xl self-start ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                    <Clock size={22} />
                </div>
                <div>
                    <div className={`text-3xl md:text-4xl font-black leading-none mb-1 ${metrics.overdueCount > 0 ? 'text-amber-500' : (isDark ? 'text-white' : 'text-slate-900')}`}>{metrics.overdueCount}</div>
                    <div className={`text-[10px] md:text-xs font-bold uppercase tracking-wide ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Verspätet</div>
                </div>
             </button>

             {/* Card 4: Abweichungen */}
             <button 
                onClick={() => onNavigate('receipt-management')}
                className={`p-4 md:p-5 rounded-2xl border flex flex-col gap-3 transition-all group text-left relative overflow-hidden ${
                    isDark 
                    ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' 
                    : 'bg-white border-slate-200 hover:border-red-500 hover:shadow-md'
                }`}
             >
                {metrics.deviations > 0 && (
                  <div className="absolute top-2 right-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  </div>
                )}
                <div className={`p-2.5 md:p-3 rounded-xl self-start ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                    <AlertOctagon size={22} />
                </div>
                <div>
                    <div className={`text-3xl md:text-4xl font-black leading-none mb-1 ${metrics.deviations > 0 ? 'text-red-500' : (isDark ? 'text-white' : 'text-slate-900')}`}>{metrics.deviations}</div>
                    <div className={`text-[10px] md:text-xs font-bold uppercase tracking-wide ${isDark ? 'text-red-400' : 'text-red-600'}`}>Abweichungen</div>
                    {metrics.deviations > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {metrics.qualityIssueReceipts > 0 && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-700'}`}>
                            Qualität: {metrics.qualityIssueReceipts}
                          </span>
                        )}
                        {metrics.openTickets > 0 && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
                            Tickets: {metrics.openTickets}
                          </span>
                        )}
                      </div>
                    )}
                </div>
             </button>
          </div>
       </div>

       {/* Insights Row (High-Value Analytics) */}
       <div className="space-y-3">
          <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Lager Fokus
          </h3>
          <InsightsRow logs={logs} inventory={inventory} theme={theme} />
       </div>

       {/* Recent Activity Section */}
       <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
             <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
               Letzte Aktivitäten
             </h3>
             <button 
               onClick={() => onNavigate('stock-logs')}
               className="text-xs font-bold text-[#0077B5] hover:underline flex items-center gap-1"
             >
               Alle anzeigen <ArrowRight size={12} />
             </button>
          </div>
          
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
             {/* MOBILE CARD VIEW */}
             <div className="md:hidden divide-y divide-slate-500/10">
               {recentLogs.length === 0 ? (
                 <div className="p-8 text-center text-slate-500 italic">Keine Aktivitäten verzeichnet.</div>
               ) : (
                 recentLogs.map(log => {
                   const isProject = log.context === 'project' || log.context === 'po-project';
                   return (
                     <div key={log.id} className={`p-3.5 ${isDark ? 'active:bg-slate-800/50' : 'active:bg-slate-50'}`}>
                       <div className="flex items-start gap-3">
                         {/* Quantity badge */}
                         <div className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono font-black text-sm leading-none ${
                           isProject
                             ? (isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600')
                             : log.action === 'add'
                               ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                               : (isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600')
                         }`}>
                           {isProject ? log.quantity : (log.action === 'add' ? `+${log.quantity}` : `-${log.quantity}`)}
                         </div>

                         {/* Content */}
                         <div className="flex-1 min-w-0">
                           <div className={`font-bold text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{log.itemName}</div>
                           <div className="flex flex-wrap items-center gap-1.5 mt-1">
                             {isProject ? (
                               <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                                 <Briefcase size={10} /> Projekt
                               </span>
                             ) : log.context === 'manual' ? (
                               <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                 <MousePointer2 size={10} /> Manuell
                               </span>
                             ) : (
                               <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                 <FileText size={10} /> Regulär
                               </span>
                             )}
                             {log.source && (
                               <span className="text-[10px] opacity-40 font-mono">via {log.source}</span>
                             )}
                           </div>
                         </div>

                         {/* Timestamp */}
                         <div className={`shrink-0 text-right font-mono text-[10px] leading-tight opacity-50 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                           {new Date(log.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                           <br />
                           {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>

             {/* DESKTOP TABLE VIEW */}
             <div className="hidden md:block">
               <table className="w-full text-left text-sm">
                 <thead className={`border-b ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                   <tr>
                     <th className="p-4 font-semibold w-40">Zeitpunkt</th>
                     <th className="p-4 font-semibold w-40">Nutzer</th>
                     <th className="p-4 font-semibold">Artikel & Vorgang</th>
                     <th className="p-4 font-semibold text-right w-24">Bestand</th>
                     <th className={`p-4 font-semibold text-right w-24 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Projekt</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-500/10">
                    {recentLogs.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500 italic">Keine Aktivitäten verzeichnet.</td>
                        </tr>
                    ) : (
                        recentLogs.map(log => {
                            const isProject = log.context === 'project' || log.context === 'po-project';
                            
                            return (
                                <tr key={log.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                    <td className="p-4">
                                        <div className={`flex items-center gap-2 font-mono text-xs opacity-70 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            <Calendar size={12} />
                                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                            <User size={12} /> {log.userName}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{log.itemName}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                {log.context === 'project' || log.context === 'po-project' ? (
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                                                        <Briefcase size={10} /> Projekt
                                                    </span>
                                                ) : log.context === 'manual' ? (
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                        <MousePointer2 size={10} /> Manuell
                                                    </span>
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                                        <FileText size={10} /> Regulär
                                                    </span>
                                                )}
                                                {log.source && (
                                                    <span className="text-[10px] opacity-50 font-mono flex items-center gap-1">
                                                        via {log.source}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Bestand Column */}
                                    <td className="p-4 text-right">
                                        {!isProject ? (
                                            log.action === 'add' ? (
                                                <span className={`font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    +{log.quantity}
                                                </span>
                                            ) : (
                                                <span className={`font-bold font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                    -{log.quantity}
                                                </span>
                                            )
                                        ) : (
                                            <span className="opacity-30">-</span>
                                        )}
                                    </td>

                                    {/* Projekt Column */}
                                    <td className="p-4 text-right">
                                        {isProject ? (
                                            <div className="flex items-center justify-end gap-1.5" title="Projekt Verbrauch">
                                                <Briefcase size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                                                <span className={`text-lg font-bold font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                    {log.quantity}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="opacity-30">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                 </tbody>
               </table>
             </div>
          </div>
       </div>
    </div>
  );
};
