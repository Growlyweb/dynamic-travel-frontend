import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Building2 } from 'lucide-react'

import { vendorApi } from '../vendor.api'
import ServiceCheckboxGroup from '../components/ServiceCheckboxGroup'

export default function VendorForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    vendorCode: '',
    email: '',
    mobileCountryCode: '+88',
    mobileNumber: '',
    address: '',
    openingBalance: '',
    openingBalanceType: 'due',
    creditLimit: '',
    fixedAdvance: '',
    services: [],
    isActive: true,
  })

  useEffect(() => {
    async function init() {
      try {
        const sRes = await vendorApi.getServices()
        if (sRes.success) setServices(sRes.data)

        if (isEditing) {
          const vRes = await vendorApi.getVendor(id)
          if (vRes.success) {
            const v = vRes.data
            setFormData({
              name: v.name || '',
              vendorCode: v.vendorCode || '',
              email: v.email || '',
              mobileCountryCode: v.mobile?.countryCode || '+88',
              mobileNumber: v.mobile?.number || '',
              address: v.address || '',
              openingBalance: v.openingBalance || '',
              openingBalanceType: v.openingBalanceType || 'due',
              creditLimit: v.creditLimit || '',
              fixedAdvance: v.fixedAdvance || '',
              services: v.services || [],
              isActive: v.isActive !== false,
            })
          }
        }
      } catch (err) {
        console.error('Failed to load vendor form data:', err)
        setErrors({ form: err.message })
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id, isEditing])

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      newErrors.name = 'Vendor name is required.'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (!formData.services || formData.services.length === 0) {
      newErrors.services = 'Please select at least one service/segment.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)
    setErrors({})

    const payload = {
      name: trimmedName,
      vendorCode: formData.vendorCode.trim().toUpperCase(),
      email: formData.email.trim(),
      mobile: {
        countryCode: formData.mobileCountryCode,
        number: formData.mobileNumber.trim(),
      },
      address: formData.address.trim(),
      openingBalance: Number(formData.openingBalance) || 0,
      openingBalanceType: formData.openingBalanceType,
      creditLimit: Number(formData.creditLimit) || 0,
      fixedAdvance: Number(formData.fixedAdvance) || 0,
      services: formData.services,
      isActive: formData.isActive,
    }

    try {
      if (isEditing) {
        await vendorApi.updateVendor(id, payload)
      } else {
        await vendorApi.createVendor(payload)
      }
      navigate('/vendors')
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save vendor.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Loading vendor details...
      </div>
    )
  }

  return (
    <div className="mx-auto space-y-6">
      <PageHeader
        title={isEditing ? `Edit Vendor: ${formData.name}` : 'Add New Vendor'}
        description={
          isEditing
            ? 'Update supplier information, services, and credit limits.'
            : 'Register a new supplier for air tickets, visas, hotels, or packages.'
        }
        breadcrumbs={[
          { label: 'Vendors', to: '/vendors' },
          { label: isEditing ? 'Edit Vendor' : 'New Vendor' },
        ]}
        actions={
          <Link to="/vendors">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-9">
              <ArrowLeft className="size-3.5" /> Return to Vendor List
            </Button>
          </Link>
        }
      />

      {errors.form && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/80 pb-3">
            <Building2 className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor Name */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Vendor Name <span className="text-rose-500">* (Unique)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Flight Expert, Trip Lover"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Vendor Code */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Vendor Code <span className="text-muted-foreground text-[11px]">(Auto-generated if empty)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. VND-0001"
                value={formData.vendorCode}
                onChange={(e) => handleChange('vendorCode', e.target.value.toUpperCase())}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground uppercase font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mobile with Country Code */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.mobileCountryCode}
                  onChange={(e) => handleChange('mobileCountryCode', e.target.value)}
                  className="w-20 h-9 px-2.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono"
                />
                <input
                  type="text"
                  placeholder="01700000000"
                  value={formData.mobileNumber}
                  onChange={(e) => handleChange('mobileNumber', e.target.value)}
                  className="flex-1 h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="vendor@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Office Address
            </label>
            <input
              type="text"
              placeholder="e.g. House 14, Road 3, Banani, Dhaka"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Services & Segments Selection (Section 4.2) */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
          <ServiceCheckboxGroup
            services={services}
            selected={formData.services}
            onChange={(selectedIds) => handleChange('services', selectedIds)}
            error={errors.services}
          />
        </div>

        {/* Financial & Account Configuration Card */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border/80 pb-3">
            Accounting & Limits
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {/* Opening Balance */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Opening Balance Amount (BDT)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={formData.openingBalance}
                onChange={(e) => handleChange('openingBalance', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Opening Balance Type */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Opening Balance Type
              </label>
              <select
                value={formData.openingBalanceType}
                onChange={(e) => handleChange('openingBalanceType', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="due">Due (We owe vendor)</option>
                <option value="advance">Advance (Vendor owes us)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Credit Limit */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Credit Limit (BDT) <span className="text-muted-foreground text-[11px]">(Warn when due exceeds this)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 500,000"
                value={formData.creditLimit}
                onChange={(e) => handleChange('creditLimit', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Fixed Advance */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Fixed Advance (BDT) <span className="text-muted-foreground text-[11px]">(Security deposit kept with vendor)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={formData.fixedAdvance}
                onChange={(e) => handleChange('fixedAdvance', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="vendor-status"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
            />
            <label
              htmlFor="vendor-status"
              className="text-xs font-medium text-foreground cursor-pointer select-none"
            >
              Active Vendor (Enabled for bill and payment selection)
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/vendors">
            <Button type="button" variant="ghost" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-primary text-white hover:bg-primary-strong gap-2 h-10 px-5 text-sm font-semibold"
          >
            <Save className="size-4" />
            {saving ? 'Saving...' : isEditing ? 'Update Vendor' : 'Save Vendor'}
          </Button>
        </div>
      </form>
    </div>
  )
}
