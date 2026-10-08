import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Check, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/utils/helpers'

export default function ServiceCheckboxGroup({
  services = [],
  selected = [],
  onChange,
  error,
}) {
  const activeServices = useMemo(() => {
    return services.filter((s) => s.isActive)
  }, [services])

  const allSelected =
    activeServices.length > 0 &&
    activeServices.every((s) => selected.includes(s.id))

  const handleToggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const handleSelectAll = () => {
    if (allSelected) {
      onChange([])
    } else {
      onChange(activeServices.map((s) => s.id))
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Services / Segments <span className="text-rose-500">* (min 1)</span>
        </label>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleSelectAll}
          className="text-xs text-primary hover:text-primary-strong h-7 px-2 font-medium"
        >
          {allSelected ? (
            <>
              <Square className="size-3.5 mr-1" /> Uncheck All
            </>
          ) : (
            <>
              <CheckSquare className="size-3.5 mr-1" /> Check All
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-xl">
        {activeServices.map((service) => {
          const isChecked = selected.includes(service.id)
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => handleToggle(service.id)}
              className={cn(
                'flex items-center justify-between p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer',
                isChecked
                  ? 'bg-primary-soft/80 border-primary/50 text-primary-strong font-medium shadow-xs'
                  : 'bg-surface border-border text-foreground hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    'size-4 rounded flex items-center justify-center border transition-colors shrink-0',
                    isChecked
                      ? 'bg-primary border-primary text-white'
                      : 'border-border bg-surface'
                  )}
                >
                  {isChecked && <Check className="size-3" />}
                </div>
                <span className="truncate">{service.name}</span>
              </div>
              {service.code && (
                <span className="text-[10px] font-mono uppercase bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded ml-1 shrink-0">
                  {service.code}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}
