import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Plus, X, Layers } from 'lucide-react'
import { cn } from '@/utils/helpers'

export default function ServiceCheckboxGroup({
  services = [],
  selected = [],
  onChange,
  onAddNewService,
  error,
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [addError, setAddError] = useState('')

  const activeServices = useMemo(() => {
    return services.filter((s) => s.isActive !== false)
  }, [services])

  const handleToggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const handleAddSubmit = async (e) => {
    e?.preventDefault()
    const name = newServiceName.trim()
    if (!name) {
      setAddError('Please enter service name')
      return
    }

    const exists = activeServices.some(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    )
    if (exists) {
      setAddError('Service already exists')
      return
    }

    try {
      if (onAddNewService) {
        await onAddNewService(name)
      }
      setNewServiceName('')
      setIsAdding(false)
      setAddError('')
    } catch (err) {
      setAddError(err.message || 'Failed to add service')
    }
  }

  return (
    <div className="space-y-3">
      {/* Header with Title and Add Services Button */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Services <span className="text-rose-500">*</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Select one or multiple services provided by this vendor.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsAdding(!isAdding)
            setAddError('')
          }}
          className="text-xs gap-1.5 h-8 font-semibold bg-white border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
        >
          {isAdding ? (
            <>
              <X className="size-3.5" /> Cancel
            </>
          ) : (
            <>
              <Plus className="size-3.5" /> Add Service
            </>
          )}
        </Button>
      </div>

      {/* Inline Input Box when clicking "Add Service" */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-3 bg-muted/40 rounded-xl border border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              autoFocus
              value={newServiceName}
              onChange={(e) => {
                setNewServiceName(e.target.value)
                if (addError) setAddError('')
              }}
              placeholder="e.g. Air ticket, Hotel, Tour package..."
              className="w-full h-8 px-3 text-xs rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              className="h-8 px-3 text-xs font-semibold bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="size-3.5 mr-1" /> Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                setNewServiceName('')
                setAddError('')
              }}
              className="h-8 px-2 text-xs text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
          {addError && <p className="text-xs text-rose-500 w-full">{addError}</p>}
        </form>
      )}

      {/* Existing Design Services Grid with Tick Marks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {activeServices.map((service) => {
          const isChecked = selected.includes(service.id)
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => handleToggle(service.id)}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border text-left transition-all text-xs cursor-pointer select-none',
                isChecked
                  ? 'bg-blue-50/70 border-primary text-primary font-semibold shadow-2xs'
                  : 'bg-white border-border text-foreground hover:bg-slate-50 hover:border-slate-300'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    'size-4 rounded flex items-center justify-center border transition-colors shrink-0',
                    isChecked
                      ? 'bg-primary border-primary text-white'
                      : 'border-slate-300 bg-white'
                  )}
                >
                  {isChecked && <Check className="size-3 stroke-[3]" />}
                </div>
                <span className="truncate text-xs font-medium text-slate-800">
                  {service.name}
                </span>
              </div>

              {isChecked && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                  Selected
                </span>
              )}
            </button>
          )
        })}
      </div>

      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  )
}
