import React from 'react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/helpers'
import { AlertCircle, CheckCircle2, ArrowDownCircle } from 'lucide-react'

/**
 * Color-coded Dynamic Due Badge:
 * - Red (Positive Due > 0): Vendor has unpaid balance
 * - Green (Settled === 0): Fully balanced/zero dues
 * - Blue (Advance < 0): Vendor has paid in advance / credit balance
 */
export default function VendorDueBadge({ amount = 0, currency = 'BDT', showIcon = true, className }) {
  const numericAmount = Number(amount || 0)

  if (numericAmount > 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
          'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
          className
        )}
        title="Pending Due Balance"
      >
        {showIcon && <AlertCircle className="size-3.5 text-rose-600 shrink-0" />}
        <span>Due: {formatCurrency(numericAmount, currency)}</span>
      </span>
    )
  }

  if (numericAmount < 0) {
    const positiveAdvance = Math.abs(numericAmount)
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
          'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
          className
        )}
        title="Advance Paid / Credit Balance"
      >
        {showIcon && <ArrowDownCircle className="size-3.5 text-sky-600 shrink-0" />}
        <span>Advance: {formatCurrency(positiveAdvance, currency)}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
        className
      )}
      title="Settled / Nil Balance"
    >
      {showIcon && <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />}
      <span>Settled (0)</span>
    </span>
  )
}
