import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Save,
  Building2,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plane,
  Hotel,
  Compass,
  FileText,
  DollarSign,
} from 'lucide-react'

import { vendorApi } from '../vendor.api'
import ServiceCheckboxGroup from '../components/ServiceCheckboxGroup'

const POPULAR_COUNTRIES = [
  'China',
  'Thailand',
  'Malaysia',
  'Singapore',
  'India',
  'UAE',
  'Saudi Arabia',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Japan',
  'Turkey',
  'Qatar',
  'Indonesia',
  'Vietnam',
]

const VISA_TYPES = [
  'Single Entry',
  'Multiple Entry',
  'Tourist (Sticker)',
  'Tourist (eVisa)',
  'Business',
  'Transit',
  'Work / Employment',
]

export default function VendorForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [copyToast, setCopyToast] = useState(false)

  // 1. Vendor Information
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    address: '',
    services: ['srv_visa'], // Visa is selected by default
    openingBalance: '',
    openingBalanceType: 'due',
    creditLimit: '',
    fixedAdvance: '',
  })

  // 3. Dynamic Pricing per Service (persisted even if toggled off & on during session)
  const [visaPricing, setVisaPricing] = useState([
    { id: 'vp_1', country: 'China', visaType: 'Single Entry', vendorPrice: '5000' },
  ])

  const [airPricing, setAirPricing] = useState([
    { id: 'ap_1', route: '', airline: '', ticketType: 'Economy', vendorPrice: '' },
  ])

  const [hotelPricing, setHotelPricing] = useState([
    { id: 'hp_1', destination: '', roomType: 'Standard Room', vendorPrice: '' },
  ])

  const [tourPricing, setTourPricing] = useState([
    { id: 'tp_1', destination: '', packageName: '', duration: '3D/2N', vendorPrice: '' },
  ])

  const [customPricing, setCustomPricing] = useState({}) // { [serviceId]: [{ id, description, vendorPrice }] }

  useEffect(() => {
    async function init() {
      try {
        const sRes = await vendorApi.getServices()
        let fetchedServices = []
        if (sRes.success) {
          fetchedServices = sRes.data
          setServices(fetchedServices)
        }

        if (isEditing) {
          const vRes = await vendorApi.getVendor(id)
          if (vRes.success) {
            const v = vRes.data
            setFormData({
              name: v.name || v.vendorName || '',
              mobileNumber: v.mobile?.number || v.mobileNumber || '',
              email: v.email || v.emailAddress || '',
              address: v.address || v.vendorAddress || '',
              services: v.services && v.services.length > 0 ? v.services : ['srv_visa'],
              openingBalance: v.openingBalance || '',
              openingBalanceType: v.openingBalanceType || 'due',
              creditLimit: v.creditLimit || '',
              fixedAdvance: v.fixedAdvance || '',
            })

            // Populate pricing if present
            if (v.pricing?.visa && Array.isArray(v.pricing.visa)) {
              setVisaPricing(v.pricing.visa.map((p, idx) => ({ ...p, id: p.id || `vp_${idx}` })))
            }
            if (v.pricing?.['srv_air'] && Array.isArray(v.pricing['srv_air'])) {
              setAirPricing(v.pricing['srv_air'].map((p, idx) => ({ ...p, id: p.id || `ap_${idx}` })))
            }
            if (v.pricing?.['srv_hotel'] && Array.isArray(v.pricing['srv_hotel'])) {
              setHotelPricing(v.pricing['srv_hotel'].map((p, idx) => ({ ...p, id: p.id || `hp_${idx}` })))
            }
            if (v.pricing?.['srv_tour'] && Array.isArray(v.pricing['srv_tour'])) {
              setTourPricing(v.pricing['srv_tour'].map((p, idx) => ({ ...p, id: p.id || `tp_${idx}` })))
            }
            if (v.pricing?.custom) {
              setCustomPricing(v.pricing.custom)
            }
          }
        } else {
          // New vendor: ensure Visa is checked by default
          const visaService = fetchedServices.find(
            (s) => s.id === 'srv_visa' || s.name.toLowerCase() === 'visa'
          )
          if (visaService) {
            setFormData((prev) => ({
              ...prev,
              services: [visaService.id],
            }))
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

  const handleInfoChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }))
    }
  }

  // Adding new service dynamically
  const handleAddNewService = async (serviceName) => {
    const res = await vendorApi.createService({ name: serviceName })
    if (res.success && res.data) {
      setServices((prev) => [...prev, res.data])
      // Automatically check this new service
      setFormData((prev) => ({
        ...prev,
        services: [...prev.services, res.data.id],
      }))
    }
  }

  // --- Visa Pricing Handlers ---
  const handleAddVisaRow = () => {
    setVisaPricing((prev) => [
      ...prev,
      { id: `vp_${Date.now()}`, country: 'China', visaType: 'Single Entry', vendorPrice: '' },
    ])
  }

  const handleUpdateVisaRow = (rowId, key, value) => {
    setVisaPricing((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r))
    )
  }

  const handleRemoveVisaRow = (rowId) => {
    if (visaPricing.length <= 1) {
      setVisaPricing([{ id: `vp_${Date.now()}`, country: '', visaType: 'Single Entry', vendorPrice: '' }])
      return
    }
    setVisaPricing((prev) => prev.filter((r) => r.id !== rowId))
  }

  // --- Air Ticket Pricing Handlers ---
  const handleAddAirRow = () => {
    setAirPricing((prev) => [
      ...prev,
      { id: `ap_${Date.now()}`, route: '', airline: '', ticketType: 'Economy', vendorPrice: '' },
    ])
  }

  const handleUpdateAirRow = (rowId, key, value) => {
    setAirPricing((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r))
    )
  }

  const handleRemoveAirRow = (rowId) => {
    setAirPricing((prev) => prev.filter((r) => r.id !== rowId))
  }

  // --- Hotel Pricing Handlers ---
  const handleAddHotelRow = () => {
    setHotelPricing((prev) => [
      ...prev,
      { id: `hp_${Date.now()}`, destination: '', roomType: 'Standard Room', vendorPrice: '' },
    ])
  }

  const handleUpdateHotelRow = (rowId, key, value) => {
    setHotelPricing((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r))
    )
  }

  const handleRemoveHotelRow = (rowId) => {
    setHotelPricing((prev) => prev.filter((r) => r.id !== rowId))
  }

  // --- Custom Service Pricing Handlers ---
  const handleAddCustomRow = (serviceId) => {
    setCustomPricing((prev) => {
      const current = prev[serviceId] || []
      return {
        ...prev,
        [serviceId]: [
          ...current,
          { id: `cp_${Date.now()}`, description: '', vendorPrice: '' },
        ],
      }
    })
  }

  const handleUpdateCustomRow = (serviceId, rowId, key, value) => {
    setCustomPricing((prev) => {
      const current = prev[serviceId] || []
      return {
        ...prev,
        [serviceId]: current.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)),
      }
    })
  }

  const handleRemoveCustomRow = (serviceId, rowId) => {
    setCustomPricing((prev) => {
      const current = prev[serviceId] || []
      return {
        ...prev,
        [serviceId]: current.filter((r) => r.id !== rowId),
      }
    })
  }

  // Generate standardized API Payload matching Section 6
  const generatePayload = () => {
    const servicesPayload = formData.services.map((sId) => {
      const sObj = services.find((s) => s.id === sId)
      const sName = sObj?.name || sId
      const isVisa = sId === 'srv_visa' || sName.toLowerCase() === 'visa'
      const isAir = sName.toLowerCase().includes('air')
      const isHotel = sName.toLowerCase().includes('hotel')

      let pricingList = []
      if (isVisa) {
        pricingList = visaPricing
          .filter((v) => v.country && v.vendorPrice)
          .map((v) => ({
            country: v.country,
            visaType: v.visaType,
            vendorPrice: Number(v.vendorPrice) || 0,
            currency: 'BDT',
          }))
      } else if (isAir) {
        pricingList = airPricing
          .filter((a) => a.vendorPrice)
          .map((a) => ({
            route: a.route,
            airline: a.airline,
            ticketType: a.ticketType,
            vendorPrice: Number(a.vendorPrice) || 0,
            currency: 'BDT',
          }))
      } else if (isHotel) {
        pricingList = hotelPricing
          .filter((h) => h.vendorPrice)
          .map((h) => ({
            destination: h.destination,
            roomType: h.roomType,
            vendorPrice: Number(h.vendorPrice) || 0,
            currency: 'BDT',
          }))
      } else {
        const cList = customPricing[sId] || []
        pricingList = cList
          .filter((c) => c.vendorPrice)
          .map((c) => ({
            description: c.description,
            vendorPrice: Number(c.vendorPrice) || 0,
            currency: 'BDT',
          }))
      }

      return {
        serviceId: sId,
        serviceName: sName,
        pricing: pricingList,
      }
    })

    return {
      vendorName: formData.name.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      emailAddress: formData.email.trim(),
      vendorAddress: formData.address.trim(),
      services: servicesPayload,
    }
  }

  const handleCopyVendorData = () => {
    const payload = generatePayload()
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 3000)
  }

  const handleReset = () => {
    setFormData({
      name: '',
      mobileNumber: '',
      email: '',
      address: '',
      services: ['srv_visa'],
      openingBalance: '',
      openingBalanceType: 'due',
      creditLimit: '',
      fixedAdvance: '',
    })
    setVisaPricing([
      { id: 'vp_1', country: 'China', visaType: 'Single Entry', vendorPrice: '5000' },
    ])
    setAirPricing([])
    setHotelPricing([])
    setCustomPricing({})
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      newErrors.name = 'Vendor Name is required.'
    }

    const trimmedMobile = formData.mobileNumber.trim()
    if (!trimmedMobile) {
      newErrors.mobileNumber = 'Mobile Number is required.'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (!formData.services || formData.services.length === 0) {
      newErrors.services = 'Please select at least one service.'
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
      vendorName: trimmedName,
      ...(isEditing ? {} : { vendorCode: `VND-${Math.floor(1000 + Math.random() * 9000)}` }),
      email: formData.email.trim(),
      emailAddress: formData.email.trim(),
      mobile: {
        countryCode: '+88',
        number: trimmedMobile,
      },
      mobileNumber: trimmedMobile,
      address: formData.address.trim(),
      vendorAddress: formData.address.trim(),
      services: formData.services,
      openingBalance: Number(formData.openingBalance) || 0,
      openingBalanceType: formData.openingBalanceType,
      creditLimit: Number(formData.creditLimit) || 0,
      fixedAdvance: Number(formData.fixedAdvance) || 0,
      pricing: {
        visa: visaPricing.filter((v) => v.country && v.vendorPrice),
        'srv_air': airPricing.filter((a) => a.vendorPrice),
        'srv_hotel': hotelPricing.filter((h) => h.vendorPrice),
        'srv_tour': tourPricing.filter((t) => t.vendorPrice),
        custom: customPricing,
      },
      isActive: true,
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

  // Active selected service objects
  const selectedServiceObjects = services.filter((s) => formData.services.includes(s.id))
  const isVisaSelected = selectedServiceObjects.some(
    (s) => s.id === 'srv_visa' || s.name.toLowerCase() === 'visa'
  )
  const isAirSelected = selectedServiceObjects.some((s) => s.name.toLowerCase().includes('air'))
  const isHotelSelected = selectedServiceObjects.some((s) => s.name.toLowerCase().includes('hotel'))
  const otherSelectedServices = selectedServiceObjects.filter(
    (s) =>
      s.id !== 'srv_visa' &&
      !s.name.toLowerCase().includes('visa') &&
      !s.name.toLowerCase().includes('air') &&
      !s.name.toLowerCase().includes('hotel')
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Vendor JSON data copied to clipboard!</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title={isEditing ? `Edit Vendor: ${formData.name}` : 'Add Vendor'}
        description="Enter vendor details, services and pricing in one simple interface."
        breadcrumbs={[
          { label: 'Vendors', to: '/vendors' },
          { label: isEditing ? 'Edit Vendor' : 'Add Vendor' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/vendors">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-9 bg-white shadow-2xs">
                <ArrowLeft className="size-3.5" /> Return to Vendor List
              </Button>
            </Link>
          </div>
        }
      />

      {errors.form && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ======================================================== */}
        {/* SECTION 1: VENDOR INFORMATION                            */}
        {/* ======================================================== */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/80 pb-3">
            <Building2 className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Vendor Information</h3>
          </div>

          <div className="space-y-4">
            {/* Vendor Name (Mandatory) */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Vendor Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MR X, Flight Expert, Trip Lover"
                value={formData.name}
                onChange={(e) => handleInfoChange('name', e.target.value)}
                className="w-full h-10 px-3.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Mobile Number (Mandatory) & Email Address (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="017XXXXXXXX"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInfoChange('mobileNumber', e.target.value)}
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                />
                {errors.mobileNumber && (
                  <p className="text-xs text-rose-500 mt-1">{errors.mobileNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="vendor@example.com"
                  value={formData.email}
                  onChange={(e) => handleInfoChange('email', e.target.value)}
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                />
                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Vendor Address (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Vendor Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dhaka, Bangladesh"
                value={formData.address}
                onChange={(e) => handleInfoChange('address', e.target.value)}
                className="w-full h-10 px-3.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Opening Balance (৳) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.openingBalance}
                  onChange={(e) => handleInfoChange('openingBalance', e.target.value)}
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Opening Type</label>
                <select
                  value={formData.openingBalanceType}
                  onChange={(e) => handleInfoChange('openingBalanceType', e.target.value)}
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                >
                  <option value="due">We owe the vendor</option>
                  <option value="advance">Vendor holds our advance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Credit Limit (৳) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.creditLimit}
                  onChange={(e) => handleInfoChange('creditLimit', e.target.value)}
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Fixed Advance (৳) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.fixedAdvance}
                  onChange={(e) => handleInfoChange('fixedAdvance', e.target.value)}
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <p className="sm:col-span-2 lg:col-span-4 text-[11px] text-slate-500">
                Opening due and opening advance are posted to Accounts automatically when you save the vendor.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: DYNAMIC SERVICES                              */}
        {/* ======================================================== */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-xs">
          <ServiceCheckboxGroup
            services={services}
            selected={formData.services}
            onChange={(selectedIds) => handleInfoChange('services', selectedIds)}
            onAddNewService={handleAddNewService}
            error={errors.services}
          />
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: DYNAMIC VENDOR PRICING                        */}
        {/* ======================================================== */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-emerald-600" />
              <div>
                <h3 className="font-semibold text-sm text-foreground">Vendor Pricing</h3>
                <p className="text-[11px] text-muted-foreground">
                  Pricing fields appear automatically based on selected services.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {formData.services.length} Service{formData.services.length === 1 ? '' : 's'} Selected
            </span>
          </div>

          {formData.services.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
              Select one or more services above to configure vendor pricing.
            </div>
          ) : (
            <div className="space-y-6">
              {/* ──────────────────────────────────────────────────────── */}
              {/* VISA SERVICE PRICING (Detailed Dynamic Country Rows)      */}
              {/* ──────────────────────────────────────────────────────── */}
              {isVisaSelected && (
                <div className="rounded-xl border border-blue-200/90 bg-blue-50/20 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        V
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900">
                        Visa Service Pricing
                      </h4>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVisaRow}
                      className="text-xs gap-1 h-7 px-2.5 bg-white border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold shadow-2xs"
                    >
                      <Plus className="size-3" /> Add Visa Price
                    </Button>
                  </div>

                  {/* Visa Price Entries Table / Rows */}
                  <div className="space-y-2.5">
                    <div className="hidden sm:grid grid-cols-12 gap-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <div className="col-span-4">Country</div>
                      <div className="col-span-4">Visa Type</div>
                      <div className="col-span-3">Vendor Price (BDT)</div>
                      <div className="col-span-1 text-center">Action</div>
                    </div>

                    {visaPricing.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 sm:p-2 bg-white rounded-lg border border-slate-200 shadow-2xs items-center"
                      >
                        {/* Country */}
                        <div className="sm:col-span-4">
                          <label className="block sm:hidden text-[11px] font-semibold text-slate-600 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            list="country-suggestions"
                            placeholder="Select or enter country"
                            value={item.country}
                            onChange={(e) =>
                              handleUpdateVisaRow(item.id, 'country', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Visa Type */}
                        <div className="sm:col-span-4">
                          <label className="block sm:hidden text-[11px] font-semibold text-slate-600 mb-1">
                            Visa Type
                          </label>
                          <input
                            type="text"
                            list="visa-type-suggestions"
                            placeholder="e.g. Single Entry, Multiple Entry"
                            value={item.visaType}
                            onChange={(e) =>
                              handleUpdateVisaRow(item.id, 'visaType', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Vendor Price (BDT) */}
                        <div className="sm:col-span-3">
                          <label className="block sm:hidden text-[11px] font-semibold text-slate-600 mb-1">
                            Vendor Price (BDT)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                              ৳
                            </span>
                            <input
                              type="number"
                              min="0"
                              placeholder="5000"
                              value={item.vendorPrice}
                              onChange={(e) =>
                                handleUpdateVisaRow(item.id, 'vendorPrice', e.target.value)
                              }
                              className="w-full h-8 pl-6 pr-2.5 text-xs rounded-md border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Remove Action */}
                        <div className="sm:col-span-1 flex justify-end sm:justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveVisaRow(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove price entry"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <datalist id="country-suggestions">
                    {POPULAR_COUNTRIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>

                  <datalist id="visa-type-suggestions">
                    {VISA_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* AIR TICKET PRICING                                      */}
              {/* ──────────────────────────────────────────────────────── */}
              {isAirSelected && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Plane className="size-4 text-sky-600" />
                      <h4 className="font-semibold text-sm text-slate-900">
                        Air Ticket Pricing
                      </h4>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAirRow}
                      className="text-xs gap-1 h-7 px-2.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold shadow-2xs"
                    >
                      <Plus className="size-3" /> Add Air Ticket Price
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {airPricing.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs items-center"
                      >
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Route (e.g. DAC - DXB)"
                            value={item.route}
                            onChange={(e) =>
                              handleUpdateAirRow(item.id, 'route', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Airline (e.g. Emirates)"
                            value={item.airline}
                            onChange={(e) =>
                              handleUpdateAirRow(item.id, 'airline', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Ticket Type (e.g. Economy Return)"
                            value={item.ticketType}
                            onChange={(e) =>
                              handleUpdateAirRow(item.id, 'ticketType', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Price (BDT)"
                            value={item.vendorPrice}
                            onChange={(e) =>
                              handleUpdateAirRow(item.id, 'vendorPrice', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white font-medium"
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveAirRow(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* HOTEL BOOKING PRICING                                    */}
              {/* ──────────────────────────────────────────────────────── */}
              {isHotelSelected && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Hotel className="size-4 text-amber-600" />
                      <h4 className="font-semibold text-sm text-slate-900">
                        Hotel Booking Pricing
                      </h4>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddHotelRow}
                      className="text-xs gap-1 h-7 px-2.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold shadow-2xs"
                    >
                      <Plus className="size-3" /> Add Hotel Price
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {hotelPricing.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs items-center"
                      >
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            placeholder="Destination (e.g. Dubai, Bangkok)"
                            value={item.destination}
                            onChange={(e) =>
                              handleUpdateHotelRow(item.id, 'destination', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Hotel / Room Type"
                            value={item.roomType}
                            onChange={(e) =>
                              handleUpdateHotelRow(item.id, 'roomType', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Price (BDT)"
                            value={item.vendorPrice}
                            onChange={(e) =>
                              handleUpdateHotelRow(item.id, 'vendorPrice', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white font-medium"
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveHotelRow(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* OTHER / CUSTOM SERVICES PRICING                          */}
              {/* ──────────────────────────────────────────────────────── */}
              {otherSelectedServices.map((service) => {
                const rows = customPricing[service.id] || [
                  { id: `cp_${service.id}_1`, description: '', vendorPrice: '' },
                ]
                return (
                  <div
                    key={service.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-primary" />
                        <h4 className="font-semibold text-sm text-slate-900">
                          {service.name} Pricing
                        </h4>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddCustomRow(service.id)}
                        className="text-xs gap-1 h-7 px-2.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold shadow-2xs"
                      >
                        <Plus className="size-3" /> Add Price
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {rows.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs items-center"
                        >
                          <div className="sm:col-span-7">
                            <input
                              type="text"
                              placeholder={`Service / Package details for ${service.name}`}
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateCustomRow(
                                  service.id,
                                  item.id,
                                  'description',
                                  e.target.value
                                )
                              }
                              className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <input
                              type="number"
                              min="0"
                              placeholder="Vendor Price (BDT)"
                              value={item.vendorPrice}
                              onChange={(e) =>
                                handleUpdateCustomRow(
                                  service.id,
                                  item.id,
                                  'vendorPrice',
                                  e.target.value
                                )
                              }
                              className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-200 bg-white font-medium"
                            />
                          </div>
                          <div className="sm:col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomRow(service.id, item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* FORM FOOTER ACTIONS (Save, Reset, Copy Vendor Data)      */}
        {/* ======================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs gap-1.5 h-9 bg-white text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="size-3.5" /> Reset
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyVendorData}
              className="text-xs gap-1.5 h-9 bg-white text-slate-700 hover:bg-slate-50"
              title="Copy JSON Payload to clipboard"
            >
              <Copy className="size-3.5" /> Copy Vendor Data
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/vendors">
              <Button type="button" variant="ghost" size="sm" disabled={saving} className="text-xs h-9">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={saving}
              className="bg-primary text-white hover:bg-primary/90 gap-2 h-9 px-6 text-xs font-semibold shadow-sm"
            >
              <Save className="size-3.5" />
              {saving ? 'Saving...' : isEditing ? 'Update Vendor' : 'Save Vendor'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
