import { 
  CheckCircle2, AlertTriangle, Clock, PackagePlus, 
  AlertCircle, Ban, XCircle, Info, Truck, Lock, CheckCircle
} from 'lucide-react';
import { ReceiptMasterStatus } from '../types';

export interface StatusConfig {
  key: string;
  displayName: string;
  description: string;
  actionText?: string;
  icon: any;
  colorClass: {
    light: {
      bg: string;
      text: string;
      border: string;
      badge: string;
    };
    dark: {
      bg: string;
      text: string;
      border: string;
      badge: string;
    };
  };
}

export const RECEIPT_STATUS_CONFIG: Record<ReceiptMasterStatus, StatusConfig> = {
  'Offen': {
    key: 'offen',
    displayName: 'Offen',
    description: 'Der Wareneingang wurde erstellt und wartet auf die erste Lieferung.',
    actionText: 'Erste Lieferung erfassen',
    icon: Clock,
    colorClass: {
      light: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-50 text-amber-600 border-amber-200'
      },
      dark: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }
    }
  },
  
  'Wartet auf Lieferung': {
    key: 'wartet-lieferung',
    displayName: 'Wartet auf Lieferung',
    description: 'Bestellung noch offen. Es wurden noch nicht alle Artikel geliefert.',
    actionText: 'Weitere Lieferung erfassen',
    icon: Truck,
    colorClass: {
      light: {
        bg: 'bg-[#6264A7]/10',
        text: 'text-[#6264A7]',
        border: 'border-[#6264A7]/20',
        badge: 'bg-[#6264A7]/10 text-[#6264A7] border-[#6264A7]/20'
      },
      dark: {
        bg: 'bg-[#6264A7]/20',
        text: 'text-[#9ea0e6]',
        border: 'border-[#6264A7]/40',
        badge: 'bg-[#6264A7]/20 text-[#9ea0e6] border-[#6264A7]/40'
      }
    }
  },

  'Teillieferung': {
    key: 'teillieferung',
    displayName: 'Teillieferung',
    description: 'Teilweise geliefert. Es fehlen noch Artikel aus der ursprünglichen Bestellung.',
    actionText: 'Restlieferung erfassen',
    icon: AlertTriangle,
    colorClass: {
      light: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-50 text-amber-600 border-amber-200'
      },
      dark: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }
    }
  },

  'Gebucht': {
    key: 'gebucht',
    displayName: 'Gebucht',
    description: 'Wareneingang erfolgreich abgeschlossen. Alle Artikel wurden korrekt geliefert und gebucht.',
    icon: CheckCircle2,
    colorClass: {
      light: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-50 text-emerald-600 border-emerald-200'
      },
      dark: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      }
    }
  },

  'Abgeschlossen': {
    key: 'abgeschlossen',
    displayName: 'Abgeschlossen',
    description: 'Wareneingang manuell abgeschlossen. Restmenge wurde storniert oder akzeptiert.',
    icon: Lock,
    colorClass: {
      light: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-600 border-slate-200'
      },
      dark: {
        bg: 'bg-slate-800',
        text: 'text-slate-400',
        border: 'border-slate-700',
        badge: 'bg-slate-800 text-slate-400 border-slate-700'
      }
    }
  },

  'Schaden': {
    key: 'schaden',
    displayName: 'Schaden',
    description: 'Beschädigte Ware gemeldet. Es wurde ein Qualitätsfall erstellt und eine Reklamation ist offen.',
    actionText: 'Reklamation bearbeiten',
    icon: AlertTriangle,
    colorClass: {
      light: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        badge: 'bg-red-50 text-red-600 border-red-200'
      },
      dark: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        badge: 'bg-red-500/10 text-red-400 border-red-500/20'
      }
    }
  },

  'Abgelehnt': {
    key: 'abgelehnt',
    displayName: 'Abgelehnt',
    description: 'Lieferung vollständig abgelehnt. Alle Artikel wurden zurückgewiesen und eine Reklamation wurde erstellt.',
    actionText: 'Reklamation prüfen',
    icon: Ban,
    colorClass: {
      light: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        badge: 'bg-red-50 text-red-600 border-red-200'
      },
      dark: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        badge: 'bg-red-500/10 text-red-400 border-red-500/20'
      }
    }
  },

  'Falsch geliefert': {
    key: 'falsch',
    displayName: 'Falsch geliefert',
    description: 'Falsche Artikel geliefert. Die erhaltenen Artikel entsprechen nicht der Bestellung.',
    actionText: 'Reklamation bearbeiten',
    icon: XCircle,
    colorClass: {
      light: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        badge: 'bg-orange-50 text-orange-600 border-orange-200'
      },
      dark: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/20',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      }
    }
  },

  'Schaden + Falsch': {
    key: 'schaden-falsch',
    displayName: 'Schaden + Falsch',
    description: 'Mehrere Probleme erkannt: Beschädigte UND falsche Artikel geliefert. Komplexe Reklamation offen.',
    actionText: 'Reklamationen prüfen',
    icon: AlertCircle,
    colorClass: {
      light: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        badge: 'bg-red-50 text-red-600 border-red-200'
      },
      dark: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        badge: 'bg-red-500/10 text-red-400 border-red-500/20'
      }
    }
  },

  'Übermenge': {
    key: 'übermenge',
    displayName: 'Übermenge',
    description: 'Mehr Artikel geliefert als bestellt. Überzählige Artikel wurden erfasst und ggf. retourniert.',
    actionText: 'Rücksendung prüfen',
    icon: Info,
    colorClass: {
      light: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        badge: 'bg-orange-50 text-orange-600 border-orange-200'
      },
      dark: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/20',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      }
    }
  },

  'Lieferung morgen': {
    key: 'lieferung-morgen',
    displayName: 'Lieferung morgen',
    description: 'Die Lieferung wird für morgen erwartet.',
    icon: Truck,
    colorClass: {
      light: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-50 text-emerald-600 border-emerald-200'
      },
      dark: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      }
    }
  },

  'Lieferung heute': {
    key: 'lieferung-heute',
    displayName: 'Lieferung heute',
    description: 'Die Lieferung wird heute erwartet.',
    icon: Truck,
    colorClass: {
      light: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-50 text-amber-600 border-amber-200'
      },
      dark: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }
    }
  },

  'Verspätet': {
    key: 'verspätet',
    displayName: 'Verspätet',
    description: 'Die erwartete Lieferung ist überfällig.',
    icon: AlertCircle,
    colorClass: {
      light: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        badge: 'bg-red-50 text-red-600 border-red-200'
      },
      dark: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        badge: 'bg-red-500/10 text-red-400 border-red-500/20'
      }
    }
  },

  'Storniert': {
    key: 'storniert',
    displayName: 'Storniert',
    description: 'Bestellung wurde storniert. Keine weiteren Aktionen möglich.',
    icon: Ban,
    colorClass: {
      light: {
        bg: 'bg-slate-100',
        text: 'text-slate-500',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-500 border-slate-200'
      },
      dark: {
        bg: 'bg-slate-800',
        text: 'text-slate-500',
        border: 'border-slate-700',
        badge: 'bg-slate-800 text-slate-500 border-slate-700'
      }
    }
  }
};

/**
 * Get status configuration for a given status string
 * Handles case-insensitive matching and common variations
 */
export function getStatusConfig(status: string | undefined): StatusConfig | null {
  if (!status) return null;
  
  const normalized = status.trim().toLowerCase();
  
  // Direct match
  for (const [key, config] of Object.entries(RECEIPT_STATUS_CONFIG)) {
    if (key.toLowerCase() === normalized) {
      return config;
    }
  }
  
  // Fuzzy match for common variations
  if (normalized.includes('wartet') && normalized.includes('lieferung')) {
    return RECEIPT_STATUS_CONFIG['Wartet auf Lieferung'];
  }
  if (normalized.includes('prüf') || normalized.includes('prüfung')) {
    return RECEIPT_STATUS_CONFIG['Wartet auf Lieferung'];
  }
  if (normalized.includes('teil')) return RECEIPT_STATUS_CONFIG['Teillieferung'];
  if (normalized.includes('schaden') && normalized.includes('falsch')) return RECEIPT_STATUS_CONFIG['Schaden + Falsch'];
  if (normalized.includes('schaden') || normalized.includes('beschädigt')) return RECEIPT_STATUS_CONFIG['Schaden'];
  if (normalized.includes('falsch')) return RECEIPT_STATUS_CONFIG['Falsch geliefert'];
  if (normalized.includes('abgelehnt')) return RECEIPT_STATUS_CONFIG['Abgelehnt'];
  if (normalized.includes('übermenge') || normalized === 'zu viel') return RECEIPT_STATUS_CONFIG['Übermenge'];
  if (normalized.includes('gebucht') || normalized === 'abgeschlossen' || normalized === 'in bearbeitung') return RECEIPT_STATUS_CONFIG['Gebucht'];
  if (normalized === 'offen') return RECEIPT_STATUS_CONFIG['Offen'];
  if (normalized === 'storniert') return RECEIPT_STATUS_CONFIG['Storniert'];
  if (normalized.includes('morgen')) return RECEIPT_STATUS_CONFIG['Lieferung morgen'];
  if (normalized.includes('heute')) return RECEIPT_STATUS_CONFIG['Lieferung heute'];
  if (normalized.includes('verspätet') || normalized.includes('überfällig')) return RECEIPT_STATUS_CONFIG['Verspätet'];
  
  return null;
}

/**
 * Compute delivery-date-based status from expectedDeliveryDate.
 * Returns 'Lieferung morgen' | 'Lieferung heute' | 'Verspätet' | null.
 * Pure display helper — call on every render, no storage needed.
 */
export function getDeliveryDateBadge(
  expectedDeliveryDate?: string,
  currentStatus?: string
): 'Lieferung morgen' | 'Lieferung heute' | 'Verspätet' | null {
  if (!expectedDeliveryDate) return null;

  // Suppress for completed/closed/cancelled statuses
  const suppressStatuses = ['Abgeschlossen', 'Gebucht', 'Storniert'];
  if (currentStatus && suppressStatuses.includes(currentStatus)) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const expected = new Date(expectedDeliveryDate);
  expected.setHours(0, 0, 0, 0);

  const lower = (currentStatus || '').toLowerCase();

  // Pre-receipt = no actual goods received yet
  const isPreReceipt = !currentStatus || lower === 'offen' || lower.includes('wartet') || lower.includes('lieferung morgen') || lower.includes('lieferung heute') || lower.includes('verspätet');

  // Lieferung heute/morgen: ONLY for pre-receipt (suppress after partial/full delivery)
  if (expected.getTime() === today.getTime() && isPreReceipt) return 'Lieferung heute';
  if (expected.getTime() === tomorrow.getTime() && isPreReceipt) return 'Lieferung morgen';

  if (expected.getTime() < today.getTime()) {
    // Verspätet: show for pre-receipt AND partial delivery
    const isOpenish = isPreReceipt || lower.includes('teil');
    if (isOpenish) return 'Verspätet';
  }

  return null;
}