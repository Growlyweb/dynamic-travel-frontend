import { useState, useEffect } from 'react'
import Modal from '@/components/common/Modal'
import { Button } from '@/components/ui/button'

export default function ServiceModal({
  open,
  onClose,
  onSave,
  service, // If editing
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isActive: true,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        code: service.code || '',
        isActive: service.isActive !== false,
      })
    } else {
      setFormData({
        name: '',
        code: '',
        isActive: true,
      })
    }
    setErrors({})
  }, [service, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      setErrors({ name: 'Service name is required.' })
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: trimmedName,
        code: formData.code.trim().toUpperCase(),
        isActive: formData.isActive,
      })
      onClose()
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save service' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={service ? `Edit Service (${service.name})` : 'Add New Service / Segment'}
      description="Create or edit product categories (Air Ticket, Tour, Visa, Umrah, etc.)"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="service-form"
            disabled={saving}
            className="bg-primary text-white hover:bg-primary-strong"
          >
            {saving ? 'Saving...' : service ? 'Update Service' : 'Add Service'}
          </Button>
        </div>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {errors.form}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Service / Segment Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Air Ticket, Umrah, Visa"
            value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, name: e.target.value }))
              if (errors.name) setErrors((prev) => ({ ...prev, name: null }))
            }}
            className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Short Code (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. AIR, UMR, VISA"
            value={formData.code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground uppercase font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="service-is-active"
            checked={formData.isActive}
            onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
            className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
          />
          <label
            htmlFor="service-is-active"
            className="text-xs font-medium text-foreground cursor-pointer select-none"
          >
            Active (Available in dropdowns)
          </label>
        </div>
      </form>
    </Modal>
  )
}
