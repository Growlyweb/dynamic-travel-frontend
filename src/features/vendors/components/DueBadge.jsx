import { formatNumber } from '@/utils/formatters'
import { cn } from '@/utils/helpers'

/**
 * DueBadge component
 * Red when > 0 (Due)
 * Green when 0 (Settled)
 * Blue when < 0 (Advance)
 */
export default function DueBadge({ amount = 0, showCurrency = true, className }) {
  const num = Number(amount) || 0

  if (num === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
          className
        )}
      >
        Settled
      </span>
    )
  }

  if (num < 0) {
    const adv = Math.abs(num)
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
          className
        )}
      >
        {showCurrency ? `৳${formatNumber(adv)} ` : `${formatNumber(adv)} `}
        <span className="ml-1 text-[11px] font-medium opacity-90">Advance</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
        className
      )}
    >
      {showCurrency ? `৳${formatNumber(num)} ` : `${formatNumber(num)} `}
      <span className="ml-1 text-[11px] font-medium opacity-90">Due</span>
    </span>
  )
}
