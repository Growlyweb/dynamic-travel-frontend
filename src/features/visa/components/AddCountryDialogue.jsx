import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { visaApi } from '../visa.api'
import { VISA_TYPE_OPTIONS } from '../../../utils/constants'

const EMPTY_VALUES = { name: '', visaType: 'Tourist Visa', description: '', status: 'active', displayOrder: '1' }

function ordinal(position) {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const remainder = position % 100
  const suffix = suffixes[(remainder - 20) % 10] ?? suffixes[remainder] ?? suffixes[0]
  return `${position}${suffix}`
}

function valuesFromCountry(country, positionMax) {
  if (!country) return { ...EMPTY_VALUES, displayOrder: '1' }
  return {
    name: country.name ?? '',
    visaType: 'Tourist Visa',
    description: country.description ?? '',
    status: country.status ?? 'active',
    displayOrder: String(country.displayOrder ?? positionMax),
  }
}

/**
 * Add/edit dialog for visa countries. Pass `country={null}` to create;
 * pass the record to edit it. Calls `onSaved` after a successful save.
 * The visa type dropdown only offers Tourist Visa and Business Visa, and the
 * chosen type is ensured to exist for the country when saving.
 */
export function CountryDialog({ open, onOpenChange, country, positionMax = 1, onSaved }) {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setValues(valuesFromCountry(country, positionMax))
      setErrors({})
      setError(null)
    }
  }, [open, country, positionMax])

  function setValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!values.name.trim()) next.name = 'Country name is required.'
    if (!values.visaType) next.visaType = 'Choose a visa type.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    setError(null)
    try {
      const saved = await visaApi.saveCountry({
        ...(country ?? {}),
        name: values.name.trim(),
        description: values.description.trim(),
        status: values.status,
        displayOrder: Number(values.displayOrder) || positionMax,
      })
      // Make sure the selected visa type actually exists for this country so
      // the table never shows "None" right after adding one.
      const existingTypes = await visaApi.listVisaTypes({ countryId: saved.id })
      if (!existingTypes.items.some((type) => type.name === values.visaType)) {
        await visaApi.saveVisaType({
          countryId: saved.id,
          name: values.visaType,
          description: '',
          processingTime: '',
          entries: 'single',
          currency: 'BDT',
          b2cPrice: 0,
          b2bNetPrice: 0,
          fees: { embassy: 0, service: 0, vat: 0 },
          terms: '',
          status: 'active',
          validFrom: null,
        })
      }
      onSaved?.(saved)
      onOpenChange(false)
    } catch (saveError) {
      setError(saveError?.message ?? 'Could not save the country.')
    } finally {
      setSaving(false)
    }
  }

  const positionOptions = Array.from({ length: Math.max(1, positionMax) }, (_, index) => {
    const position = index + 1
    return { value: String(position), label: position === 1 ? '1st — show on top' : ordinal(position) }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-labelledby="country-dialog-title">
        <DialogHeader>
          <DialogTitle>{country ? 'Edit country' : 'Add country'}</DialogTitle>
          <DialogDescription>
            {country
              ? 'Update the visa service for this destination.'
              : 'Configure a new destination so it appears in the visa service list.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name) || undefined}>
              <Label htmlFor="country-name">Country name</Label>
              <Input
                id="country-name"
                name="name"
                value={values.name}
                onChange={(event) => setValue('name', event.target.value)}
                placeholder="China"
                autoComplete="off"
              />
              {errors.name ? <p className="text-xs text-rose-600">{errors.name}</p> : null}
            </Field>
            <Field data-invalid={Boolean(errors.visaType) || undefined}>
              <Label htmlFor="country-visa-type">Visa type</Label>
              <select
                id="country-visa-type"
                name="visaType"
                value={values.visaType}
                onChange={(event) => setValue('visaType', event.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {VISA_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.visaType ? <p className="text-xs text-rose-600">{errors.visaType}</p> : null}
            </Field>
            <Field>
              <Label htmlFor="country-description">Description</Label>
              <textarea
                id="country-description"
                name="description"
                value={values.description}
                onChange={(event) => setValue('description', event.target.value)}
                placeholder="Short description shown to applicants."
                className="flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label htmlFor="country-status">Status</Label>
                <select
                  id="country-status"
                  name="status"
                  value={values.status}
                  onChange={(event) => setValue('status', event.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </Field>
              <Field>
                <Label htmlFor="country-order">Display position</Label>
                <select
                  id="country-order"
                  name="displayOrder"
                  value={values.displayOrder}
                  onChange={(event) => setValue('displayOrder', event.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {positionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </FieldGroup>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          <DialogFooter className="mt-4">
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : country ? 'Save changes' : 'Add country'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CountryDialog
