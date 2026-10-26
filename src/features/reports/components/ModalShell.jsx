import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

const WIDTHS = {
  'max-w-lg': 520,
  'max-w-xl': 600,
  'max-w-2xl': 680,
  'max-w-3xl': 780,
  'max-w-4xl': 900,
  'max-w-5xl': 1040,
  'max-w-6xl': 1160,
}

export default function ModalShell({
  open,
  onOpenChange,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
  footer,
  maxWidth = 'max-w-2xl',
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ maxWidth: `min(${WIDTHS[maxWidth] || 680}px, calc(100% - 2rem))` }}
        className={`${maxWidth} max-h-[92vh] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl`}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 py-4 pl-6 pr-14">
          {Icon ? (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#E6F2FD] text-primary">
              <Icon className="size-4.5" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-[15px] font-bold tracking-tight text-slate-900">
              {title}
            </DialogTitle>
            {subtitle ? <p className="mt-0.5 text-[11.5px] text-slate-500">{subtitle}</p> : null}
          </div>
          {badge}
        </div>

        <div className="max-h-[calc(92vh-10.5rem)] overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-3.5">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function Field({ label, required, hint, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[10.5px] text-slate-400">{hint}</p> : null}
    </div>
  )
}

export const inputClass =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15'

export const selectClass =
  'h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] font-medium text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15'
