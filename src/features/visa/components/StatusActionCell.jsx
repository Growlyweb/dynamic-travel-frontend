import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { titleCase } from '../../../utils/formatters'
import { APP_ROUTES } from '../../../utils/constants'
import { nextStatuses } from '../statusRules'

const BOX = 'h-8 min-w-[105px] max-w-[185px] px-2.5 rounded-md border border-slate-200 bg-white text-slate-700 text-xs font-medium inline-flex items-center justify-between gap-2 shadow-2xs'
const ITEM = 'w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded text-left text-slate-700 transition-colors cursor-pointer hover:bg-slate-50 hover:text-slate-900'

/**
 * The status of one application, as a box with a list of the statuses it can move to. The list holds only the moves the
 * server accepts. Picking one does not save: the page opens the change dialog, which asks for the words a move needs and
 * confirms it, because a move can send the applicant an email.
 */
export function StatusActionCell({ row, statuses, isAdmin, onChange }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const label = statuses.find((status) => status.key === row.status)?.displayName ?? titleCase(row.status)
  const moves = onChange ? nextStatuses(row.status, statuses, { isAdmin }) : []

  if (moves.length === 0) {
    return (
      <div className="inline-flex items-center py-0.5">
        <span className={`${BOX} cursor-default`} title={onChange ? 'This application is finished. Only an admin can reopen it.' : undefined}>
          <span className="truncate">{label}</span>
        </span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center py-0.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`${BOX} hover:bg-slate-50 hover:text-slate-900 cursor-pointer outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300`}
            aria-label={`Status for ${row.applicant?.fullName ?? row.number}: ${label}. Change it`}
          >
            <span className="truncate">{label}</span>
            <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" sideOffset={4} className="w-56 p-1 rounded-md border border-slate-200 bg-white shadow-lg text-slate-800 z-50 flex flex-col gap-0.5">
          <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Move to</p>
          {moves.map((status) => (
            <button
              key={status.key}
              type="button"
              className={ITEM}
              onClick={() => {
                setOpen(false)
                onChange(row, status.key)
              }}
            >
              <span className="truncate">{status.displayName}</span>
            </button>
          ))}
          {isAdmin ? (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button type="button" className={`${ITEM} justify-start gap-1.5`} onClick={() => navigate(APP_ROUTES.VISA_STATUSES)}>
                <Plus className="size-3.5 text-slate-500 shrink-0" />
                <span>Add or edit statuses</span>
              </button>
            </>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default StatusActionCell
