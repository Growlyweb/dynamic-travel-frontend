import React from 'react'
import { cn } from '@/utils/helpers'

/**
 * ReportMetricCard Component
 * Strictly adheres to ABL Travel project design principle:
 * rounded-xl, border-border, shadow-xs, soft-tinted icon container,
 * text-muted-foreground label, prominent bold value, and subtle border-t footer.
 */
export default function ReportMetricCard({
  label,
  value,
  subtext,
  badge,
  icon: Icon,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  className = '',
  onClick,
}) {
  const variantMap = {
    primary: {
      iconColor: 'text-primary',
      iconBg: 'bg-primary-soft border-primary/20',
      valueColor: 'text-foreground',
      badgeBg: 'bg-primary-soft text-primary',
    },
    success: {
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200/60',
      valueColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-700',
    },
    warning: {
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-200/60',
      valueColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700',
    },
    danger: {
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-200/60',
      valueColor: 'text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700',
    },
    neutral: {
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100 border-slate-200/60',
      valueColor: 'text-foreground',
      badgeBg: 'bg-slate-100 text-slate-700',
    },
  }

  const current = variantMap[variant] || variantMap.primary

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface border border-border rounded-xl p-4.5 shadow-xs transition-all hover:shadow-sm bg-white',
        onClick && 'cursor-pointer select-none',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* {Icon && (
          <div className={cn('p-2.5 rounded-xl border shrink-0', current.iconBg)}>
            <Icon className={cn('size-5', current.iconColor)} />
          </div>
        )} */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
          <h3 className={cn('text-2xl font-bold mt-1 tracking-tight', current.valueColor)}>
            {value}
          </h3>
        </div>
      </div>

      {(subtext || badge) && (
        <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{subtext}</span>
          {badge && (
            <span
              className={cn(
                'font-medium text-[11px] px-2 py-0.5 rounded shrink-0',
                current.badgeBg
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
