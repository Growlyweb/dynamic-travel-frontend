import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { X, User, Layers, Tag, Building2, CreditCard, Plus, Trash2, CheckCircle2, AlertTriangle, FileText, Plane, Hotel, Compass, Phone, Mail, ChevronDown, Search } from 'lucide-react'
import { apiClient } from '../../../services/apiClient'
import { fetchCities } from '../../../services/countries.service'
import { CountrySelect } from '../../../components/re-table'
import { b2cApi } from '../../b2c/b2c.api'
import { visaApi, ENTRY_TYPES, PAYMENT_METHODS, SERVICE_OPTIONS, TRIP_TYPES, TICKET_CLASSES } from '../visa.api'
import { errorMessage, fieldErrors } from '../../../utils/errors'
import { formatCurrency } from '../../../utils/formatters'

const SERVICE_ICONS = { visa: FileText, ticket: Plane, hotel: Hotel, tour: Compass }
const BASE_CURRENCY = 'BDT'
const FIRST_COUNTRY = { country: 'China', countryCode: 'CN' }

const EMPTY = {
  serviceType: 'visa',
  clientType: 'b2c',
  partnerId: '',
  name: '',
  phone: '',
  email: '',
  passportNumber: '',
  passportExpiry: '',
  countryId: '',
  visaTypeId: '',
  entries: 'single',
  visaDuration: '',
  totalAmount: '',
  totalOverrideReason: '',
  discountAmount: '',
  advancePaid: '',
  paymentMethod: PAYMENT_METHODS[0],
  assignedStaff: '',
  confirmDuplicate: '',
}

const newKey = () => Math.random().toString(36).slice(2)
const emptyLeg = (departure = '', arrival = '') => ({ key: newKey(), departure, arrival })
const emptyTicket = () => ({
  tripType: TRIP_TYPES[0],
  departure: '',
  arrival: '',
  travelClass: TICKET_CLASSES[0],
  legs: [emptyLeg('', ''), emptyLeg('', '')],
})
const EMPTY_TICKET = emptyTicket()
const EMPTY_HOTEL = { name: '', country: 'United Arab Emirates', countryCode: 'AE', city: '', stay: '' }

const emptyStop = (country = 'United Arab Emirates', countryCode = 'AE', city = 'Dubai') => ({ key: newKey(), country, countryCode, city })
const emptyTour = () => ({ packageName: '', duration: '5 Days / 4 Nights', destinations: [emptyStop()] })
const emptyLine = (service = 'visa', { country, countryCode } = FIRST_COUNTRY) => ({ key: newKey(), vendorId: '', name: '', service, country, countryCode, price: '', fromList: false })

const number = (value) => (value === '' || value == null ? 0 : Number(value) || 0)

// The price a vendor lists for a service. A visa price is per country; a visa price with no country is the vendor's
// price for any other country.
function listedPrice(vendor, service, country) {
  const list = vendor?.priceList ?? []
  if (service !== 'visa') return list.find((entry) => entry.service === service)?.price
  const name = (country || '').trim().toLowerCase()
  const own = list.find((entry) => entry.service === 'visa' && entry.country && entry.country.toLowerCase() === name)
  return (own ?? list.find((entry) => entry.service === 'visa' && !entry.country))?.price
}

// Keeps a typed number between 0 and max, as a string.
const capStr = (value, max) => {
  if (value === '' || value == null) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  if (n < 0) return '0'
  return n > max ? String(Math.max(0, max)) : String(value)
}

const inputBase = 'w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-2xs'
const inputOk = 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
const inputBad = 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
const inputClass = (hasError) => `${inputBase} ${hasError ? inputBad : inputOk}`

function Field({ label, htmlFor, required, optional, error, hint, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
        {optional && <span className="text-slate-400 font-normal text-xs">(Optional)</span>}
      </label>
      {children}
      {hint && !error && <span className="text-[11px] text-slate-400 mt-1 block">{hint}</span>}
      {error && <span className="text-xs text-rose-500 mt-1 block font-medium">{error}</span>}
    </div>
  )
}

function SelectBox({ id, value, onChange, options, icon: Icon, error, placeholder, disabled }) {
  return (
    <div className="relative">
      {Icon && <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />}
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass(error)} appearance-none pr-9 font-medium ${disabled ? 'cursor-not-allowed bg-slate-50 text-slate-500' : 'cursor-pointer'} ${Icon ? 'pl-10' : ''}`}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value
          const optionLabel = typeof option === 'string' ? option : option.label
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
    </div>
  )
}

function SectionHeader({ icon, title, action }) {
  const Glyph = icon
  return (
    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
        <Glyph className="w-4 h-4 stroke-[2.5]" />
        <span>{title}</span>
      </div>
      {action}
    </div>
  )
}

const Section = ({ children }) => <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">{children}</div>

// A city is typed freely; the list only suggests the cities of the chosen country.
function CityInput({ id, country, value, onChange, placeholder = 'Select or type city...', error }) {
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const listId = useId()

  useEffect(() => {
    let active = true
    if (!country) {
      setCities([])
      return undefined
    }
    setLoading(true)
    fetchCities(country)
      .then((list) => active && setCities(list || []))
      .catch(() => active && setCities([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [country])

  return (
    <>
      <input id={id} type="text" list={listId} value={value} onChange={(event) => onChange(event.target.value)} placeholder={loading ? 'Loading cities...' : placeholder} className={inputClass(error)} />
      <datalist id={listId}>
        {cities.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </>
  )
}

// Searchable list of the website's customers. Picking one only fills in the details below.
function ClientSearchSelect({ customers, onSelect }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const boxRef = useRef(null)

  useEffect(() => {
    const onClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((customer) => [customer.name, customer.phone, customer.email].some((value) => (value || '').toLowerCase().includes(q)))
  }, [customers, query])

  const pick = (customer) => {
    onSelect(customer)
    setQuery(customer.name || '')
    setOpen(false)
  }

  return (
    <div className="relative" ref={boxRef}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
      <input
        id="application-existing-client"
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        placeholder="Search existing client by name..."
        className={`${inputClass(false)} pl-10 pr-9`}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="absolute right-3 top-2.5 w-5 h-5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute z-20 mt-1.5 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">No client found. Fill in the details below instead.</div>
          ) : (
            filtered.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => pick(customer)}
                className="w-full text-left px-4 py-2 text-sm text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {customer.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// A new file for a client: a visa, a ticket, a hotel booking or a tour package. The server numbers it and works out the net,
// the due amount and the payment status itself. A visa takes its price from the visa type (the total starts there, and a
// different total needs a reason); the other services have no price list, so the total is what was agreed with the client.
export function NewApplicationModal({ open, onClose, onCreated }) {
  const [values, setValues] = useState(EMPTY)
  const [ticket, setTicket] = useState(EMPTY_TICKET)
  const [hotel, setHotel] = useState(EMPTY_HOTEL)
  const [tour, setTour] = useState(emptyTour)
  const [lines, setLines] = useState(() => [emptyLine()])
  const [countries, setCountries] = useState([])
  const [types, setTypes] = useState([])
  const [partners, setPartners] = useState([])
  const [staff, setStaff] = useState([])
  const [vendors, setVendors] = useState([])
  const [customers, setCustomers] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [needsDuplicateNote, setNeedsDuplicateNote] = useState(false)
  const [totalEdited, setTotalEdited] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(EMPTY)
    setTicket(emptyTicket())
    setHotel(EMPTY_HOTEL)
    setTour(emptyTour())
    setLines([emptyLine()])
    setErrors({})
    setFormError(null)
    setNeedsDuplicateNote(false)
    setTotalEdited(false)
    Promise.allSettled([
      visaApi.listCountries({ status: 'active' }),
      visaApi.listVisaTypes({ status: 'active' }),
      visaApi.listPartners(),
      visaApi.listStaff(),
      apiClient.get('/vendors', { params: { pageSize: 500 } }),
      b2cApi.list({ pageSize: 500 }),
    ]).then(([countryResult, typeResult, partnerResult, staffResult, vendorResult, customerResult]) => {
      if (countryResult.status === 'fulfilled') setCountries(countryResult.value.items)
      if (typeResult.status === 'fulfilled') setTypes(typeResult.value.items)
      if (partnerResult.status === 'fulfilled') setPartners(partnerResult.value)
      if (staffResult.status === 'fulfilled') setStaff(staffResult.value)
      // A person without access to vendors or customers still fills the form by hand: the search box and the vendor list are simply empty.
      setVendors(vendorResult.status === 'fulfilled' ? vendorResult.value.items : [])
      setCustomers(customerResult.status === 'fulfilled' ? customerResult.value.items : [])
    })
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, saving, onClose])

  const visa = values.serviceType === 'visa'
  const countryTypes = useMemo(() => types.filter((item) => item.countryId === values.countryId), [types, values.countryId])
  const type = types.find((item) => item.id === values.visaTypeId)
  const typeId = type?.id
  const listPrice = visa && type ? (values.clientType === 'b2b' ? type.b2bNetPrice : type.b2cPrice) : 0
  const currency = visa ? (type?.currency ?? BASE_CURRENCY) : BASE_CURRENCY
  const visaCountry = countries.find((country) => country.id === values.countryId)

  // The total of a visa starts at the price list and follows it until a person types another amount.
  useEffect(() => {
    if (visa && !totalEdited) setValues((current) => ({ ...current, totalAmount: typeId ? String(listPrice) : '' }))
  }, [visa, typeId, listPrice, totalEdited])

  const clearErrors = (...keys) => setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !keys.includes(key))))

  function set(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    clearErrors(name)
  }

  function patchTicket(patch, key) {
    setTicket((current) => {
      const next = { ...current, ...patch }
      if (patch.tripType === 'Multi City') {
        if (!Array.isArray(next.legs) || next.legs.length < 2) {
          next.legs = [
            emptyLeg(current.departure || '', current.arrival || ''),
            emptyLeg(current.arrival || '', ''),
          ]
        }
      }
      return next
    })
    if (key) clearErrors(`ticket.${key}`)
  }

  function addLeg() {
    setTicket((current) => {
      const lastArrival = current.legs?.[current.legs.length - 1]?.arrival || ''
      return {
        ...current,
        legs: [...(current.legs || []), emptyLeg(lastArrival, '')],
      }
    })
  }

  function removeLeg(key) {
    setTicket((current) => {
      if ((current.legs || []).length <= 2) return current
      return {
        ...current,
        legs: current.legs.filter((leg) => leg.key !== key),
      }
    })
  }

  function changeLeg(key, field, value) {
    setTicket((current) => ({
      ...current,
      legs: (current.legs || []).map((leg) => (leg.key === key ? { ...leg, [field]: value } : leg)),
    }))
    setErrors((current) => {
      const next = { ...current }
      Object.keys(next).forEach((k) => {
        if (k.startsWith('ticket.legs.')) delete next[k]
      })
      delete next['ticket.legs']
      return next
    })
  }

  function patchHotel(patch, key) {
    setHotel((current) => ({ ...current, ...patch }))
    clearErrors(`hotel.${key}`)
  }

  // Starts a vendor line from the vendor's own price when it lists one. The lists are in taka, so a file in another currency
  // keeps what was typed. A price that is not listed is never cleared: the person types it.
  function withListedPrice(line, lineCurrency = currency) {
    const listed = lineCurrency === BASE_CURRENCY && line.vendorId ? listedPrice(vendors.find((vendor) => vendor.id === line.vendorId), line.service, line.country) : undefined
    return listed === undefined ? { ...line, fromList: false } : { ...line, price: String(listed), fromList: true }
  }

  // Changing the service starts the account again: the total of a visa is the price list, the others are typed.
  function chooseService(serviceType) {
    setTotalEdited(false)
    setValues((current) => ({ ...current, serviceType, totalAmount: '', totalOverrideReason: '', discountAmount: '', advancePaid: '' }))
    setLines((list) => list.map((line) => (line.service === values.serviceType ? withListedPrice({ ...line, service: serviceType }, BASE_CURRENCY) : line)))
    setNeedsDuplicateNote(false)
    setErrors({})
    setFormError(null)
  }

  function chooseCountry(countryId) {
    const first = types.find((item) => item.countryId === countryId)
    const country = countries.find((item) => item.id === countryId)
    setTotalEdited(false)
    setValues((current) => ({ ...current, countryId, visaTypeId: first?.id ?? '', entries: first?.entries ?? 'single' }))
    if (country) {
      setLines((list) => list.map((line) => (line.service === 'visa' ? withListedPrice({ ...line, country: country.name, countryCode: country.code ?? line.countryCode }, first?.currency ?? BASE_CURRENCY) : line)))
    }
    clearErrors('countryId', 'visaTypeId')
  }

  function chooseType(visaTypeId) {
    const next = types.find((item) => item.id === visaTypeId)
    setTotalEdited(false)
    setValues((current) => ({ ...current, visaTypeId, entries: next?.entries ?? current.entries }))
    setLines((list) => list.map((line) => (line.service === 'visa' ? withListedPrice(line, next?.currency ?? BASE_CURRENCY) : line)))
    clearErrors('visaTypeId')
  }

  function pickCustomer(customer) {
    setValues((current) => ({
      ...current,
      name: customer.name || current.name,
      phone: customer.phone || current.phone,
      email: customer.email || current.email,
      passportNumber: customer.passportNumber || current.passportNumber,
    }))
    clearErrors('name', 'phone')
  }

  function changeStop(key, patch) {
    setTour((current) => ({ ...current, destinations: current.destinations.map((stop) => (stop.key === key ? { ...stop, ...patch } : stop)) }))
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([name]) => !name.startsWith('tour.destinations'))))
  }

  const addStop = () => setTour((current) => ({ ...current, destinations: [...current.destinations, emptyStop('Malaysia', 'MY', 'Kuala Lumpur')] }))
  const removeStop = (key) => setTour((current) => (current.destinations.length <= 1 ? current : { ...current, destinations: current.destinations.filter((stop) => stop.key !== key) }))

  const total = number(values.totalAmount)
  const discount = Math.min(number(values.discountAmount), total)
  const net = Math.max(0, total - discount)
  const advance = Math.min(number(values.advancePaid), net)
  const due = Math.max(0, net - advance)
  const overridden = visa && Boolean(type) && total !== listPrice
  const vendorCost = lines.reduce((sum, line) => sum + number(line.price), 0)

  function changeTotal(value) {
    const nextTotal = number(capStr(value, Number.MAX_SAFE_INTEGER))
    const nextDiscount = capStr(values.discountAmount, nextTotal)
    setTotalEdited(true)
    setValues((current) => ({
      ...current,
      totalAmount: capStr(value, Number.MAX_SAFE_INTEGER),
      discountAmount: nextDiscount,
      advancePaid: capStr(current.advancePaid, nextTotal - number(nextDiscount)),
    }))
    clearErrors('totalAmount', 'totalOverrideReason')
  }

  function changeDiscount(value) {
    const nextDiscount = capStr(value, total)
    setValues((current) => ({ ...current, discountAmount: nextDiscount, advancePaid: capStr(current.advancePaid, total - number(nextDiscount)) }))
    clearErrors('discountAmount')
  }

  function changeAdvance(value) {
    set('advancePaid', capStr(value, net))
  }

  // Typing a due amount sets the advance to match.
  function changeDue(value) {
    const wanted = Math.min(Math.max(number(value), 0), net)
    set('advancePaid', String(net - wanted))
  }

  function changeLine(key, patch) {
    setLines((list) =>
      list.map((line) => {
        if (line.key !== key) return line
        let next = { ...line, ...patch }
        if ('vendorId' in patch) next.name = vendors.find((vendor) => vendor.id === patch.vendorId)?.name ?? ''
        if ('price' in patch) next.fromList = false
        // A typed price stays; picking another vendor, service or country looks the price up again.
        if (['vendorId', 'service', 'country'].some((name) => name in patch)) next = withListedPrice(next)
        return next
      }),
    )
  }

  function addLine() {
    const country = visa && visaCountry ? { country: visaCountry.name, countryCode: visaCountry.code ?? FIRST_COUNTRY.countryCode } : FIRST_COUNTRY
    setLines((list) => [...list, emptyLine(values.serviceType, country)])
  }

  function validate() {
    const found = {}
    if (values.name.trim().length < 2) found.name = 'Please enter the client’s full name'
    if (!values.phone.trim()) found.phone = 'Please enter a phone number'

    if (visa) {
      if (!values.passportNumber.trim()) found.passportNumber = 'Passport number is needed for a visa'
      if (!values.countryId) found.countryId = 'Please choose a country'
      if (!values.visaTypeId) found.visaTypeId = 'Please choose a visa type'
    } else if (values.serviceType === 'ticket') {
      if (ticket.tripType === 'Multi City') {
        if (!ticket.legs || ticket.legs.length < 2) {
          found['ticket.legs'] = 'Multi City requires at least 2 flight segments'
        } else {
          ticket.legs.forEach((leg, index) => {
            if (!leg.departure?.trim()) found[`ticket.legs.${index}.departure`] = 'Departure is required'
            if (!leg.arrival?.trim()) found[`ticket.legs.${index}.arrival`] = 'Arrival is required'
          })
        }
      } else {
        if (!ticket.departure.trim()) found['ticket.departure'] = 'Please enter the departure place'
        if (!ticket.arrival.trim()) found['ticket.arrival'] = 'Please enter the arrival place'
      }
    } else if (values.serviceType === 'hotel') {
      if (!hotel.name.trim()) found['hotel.name'] = 'Please enter the hotel name'
      if (!hotel.country) found['hotel.country'] = 'Please choose a country'
      if (!hotel.city.trim()) found['hotel.city'] = 'Please enter the city / location'
      if (!hotel.stay.trim()) found['hotel.stay'] = 'Please enter the stay duration'
    } else {
      if (!tour.duration.trim()) found['tour.duration'] = 'Please enter the duration'
      tour.destinations.forEach((stop, index) => {
        if (!stop.country) found[`tour.destinations.${index}.country`] = 'Country is required'
      })
    }

    if (values.clientType === 'b2b' && !values.partnerId) found.partnerId = 'Please select a B2B partner'
    if (total <= 0) found.totalAmount = 'Total amount must be greater than 0'
    if (overridden && !values.totalOverrideReason.trim()) found.totalOverrideReason = 'Write why the total differs from the price list.'
    setErrors(found)
    return Object.keys(found).length === 0
  }

  const detailsOf = () => {
    if (values.serviceType === 'ticket') {
      if (ticket.tripType === 'Multi City') {
        const cleanLegs = (ticket.legs || []).map(({ departure, arrival }) => ({
          departure: departure.trim(),
          arrival: arrival.trim(),
        }))
        const departure = cleanLegs[0]?.departure || ''
        const arrival = cleanLegs[cleanLegs.length - 1]?.arrival || ''
        return {
          ticket: {
            tripType: ticket.tripType,
            travelClass: ticket.travelClass,
            departure,
            arrival,
            legs: cleanLegs,
          },
        }
      }
      return { ticket: { ...ticket, departure: ticket.departure.trim(), arrival: ticket.arrival.trim() } }
    }
    if (values.serviceType === 'hotel') return { hotel: { ...hotel, name: hotel.name.trim(), city: hotel.city.trim(), stay: hotel.stay.trim() } }
    if (values.serviceType === 'tour') {
      return {
        tour: {
          packageName: tour.packageName.trim(),
          duration: tour.duration.trim(),
          destinations: tour.destinations.map(({ country, countryCode, city }) => ({ country, countryCode, city: city.trim() })),
        },
      }
    }
    return {}
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    setFormError(null)
    try {
      await onCreated({
        ...values,
        ...detailsOf(),
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        passportNumber: values.passportNumber.trim(),
        currency,
        totalAmount: total,
        discountAmount: discount,
        advancePaid: advance,
        vendorList: lines
          .filter((line) => line.name.trim() || line.vendorId)
          .map((line) => ({
            vendorId: line.vendorId || undefined,
            name: line.name.trim() || undefined,
            service: line.service,
            country: line.service === 'visa' ? line.country : undefined,
            price: number(line.price),
          })),
      })
      onClose?.()
    } catch (error) {
      setErrors(fieldErrors(error))
      setFormError(errorMessage(error))
      if (error?.code === 'DUPLICATE_RECENT_APPLICATION') setNeedsDuplicateNote(true)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const b2b = values.clientType === 'b2b'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-labelledby="new-application-title" className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-4xl w-full my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 bg-white shrink-0 rounded-t-2xl">
          <h2 id="new-application-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Add New Application
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          {formError && (
            <div role="alert" className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {needsDuplicateNote && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
              <Field label="Why create another application for this passport?" htmlFor="application-duplicate" required error={errors.confirmDuplicate}>
                <input id="application-duplicate" type="text" value={values.confirmDuplicate} onChange={(event) => set('confirmDuplicate', event.target.value)} className={inputClass(errors.confirmDuplicate)} />
              </Field>
            </div>
          )}

          <Section>
            <SectionHeader icon={User} title="Client Information" />

            {customers.length > 0 && (
              <Field label="Existing Client" htmlFor="application-existing-client">
                <ClientSearchSelect customers={customers} onSelect={pickCustomer} />
              </Field>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" htmlFor="application-name" required error={errors.name}>
                <input id="application-name" type="text" value={values.name} onChange={(event) => set('name', event.target.value)} className={inputClass(errors.name)} />
              </Field>

              <Field label="Passport Number" htmlFor="application-passport" required={visa} optional={!visa} error={errors.passportNumber}>
                <input id="application-passport" type="text" value={values.passportNumber} onChange={(event) => set('passportNumber', event.target.value)} className={`${inputClass(errors.passportNumber)} font-mono`} />
              </Field>

              <Field label="Phone Number" htmlFor="application-phone" required error={errors.phone}>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input id="application-phone" type="tel" value={values.phone} onChange={(event) => set('phone', event.target.value)} placeholder="+8801712345678" className={`${inputClass(errors.phone)} pl-10`} />
                </div>
              </Field>

              <Field
                label="Email Address"
                htmlFor="application-email"
                optional
                error={errors.email}
                hint={values.email || !visa ? undefined : 'Without an email the applicant cannot use the status check on the website, and gets no automatic emails.'}
              >
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input id="application-email" type="email" value={values.email} onChange={(event) => set('email', event.target.value)} className={`${inputClass(errors.email)} pl-10`} />
                </div>
              </Field>

              {visa && (
                <Field label="Passport Expiry" htmlFor="application-expiry" optional error={errors.passportExpiry}>
                  <input id="application-expiry" type="date" value={values.passportExpiry} onChange={(event) => set('passportExpiry', event.target.value)} className={inputClass(errors.passportExpiry)} />
                </Field>
              )}
            </div>
          </Section>

          <Section>
            <SectionHeader icon={Layers} title="Service Details" />

            <Field label="Service" htmlFor="application-service" required>
              <SelectBox id="application-service" value={values.serviceType} onChange={chooseService} options={SERVICE_OPTIONS} icon={SERVICE_ICONS[values.serviceType]} />
            </Field>

            {visa && (
              <div className="space-y-4 pt-1">
                <Field label="Country" htmlFor="application-country" required error={errors.countryId}>
                  <SelectBox
                    id="application-country"
                    value={values.countryId}
                    onChange={chooseCountry}
                    error={errors.countryId}
                    placeholder="Choose a country"
                    options={countries.map((country) => ({ value: country.id, label: country.name }))}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Visa Type" htmlFor="application-type" required error={errors.visaTypeId}>
                    <SelectBox
                      id="application-type"
                      value={values.visaTypeId}
                      onChange={chooseType}
                      error={errors.visaTypeId}
                      disabled={!values.countryId}
                      placeholder={values.countryId ? 'Choose a visa type' : 'Choose a country first'}
                      options={countryTypes.map((item) => ({ value: item.id, label: item.name }))}
                    />
                  </Field>

                  <Field label="Entry" htmlFor="application-entries" required>
                    <SelectBox id="application-entries" value={values.entries} onChange={(value) => set('entries', value)} options={ENTRY_TYPES} />
                  </Field>

                  <Field label="Visa Duration" htmlFor="application-duration" optional error={errors.visaDuration}>
                    <input id="application-duration" type="text" value={values.visaDuration} onChange={(event) => set('visaDuration', event.target.value)} placeholder="30 days" className={inputClass(errors.visaDuration)} />
                  </Field>
                </div>
              </div>
            )}

            {values.serviceType === 'ticket' && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Trip Type" htmlFor="ticket-trip" required>
                    <SelectBox id="ticket-trip" value={ticket.tripType} onChange={(value) => patchTicket({ tripType: value }, 'tripType')} options={TRIP_TYPES} />
                  </Field>

                  <Field label="Travel Class" htmlFor="ticket-class" required>
                    <SelectBox id="ticket-class" value={ticket.travelClass} onChange={(value) => patchTicket({ travelClass: value }, 'travelClass')} options={TICKET_CLASSES} />
                  </Field>
                </div>

                {ticket.tripType !== 'Multi City' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Departure" htmlFor="ticket-from" required error={errors['ticket.departure']}>
                      <input id="ticket-from" type="text" value={ticket.departure} onChange={(event) => patchTicket({ departure: event.target.value }, 'departure')} placeholder="e.g. Dhaka (DAC)" className={inputClass(errors['ticket.departure'])} />
                    </Field>

                    <Field label="Arrive" htmlFor="ticket-to" required error={errors['ticket.arrival']}>
                      <input id="ticket-to" type="text" value={ticket.arrival} onChange={(event) => patchTicket({ arrival: event.target.value }, 'arrival')} placeholder="e.g. Dubai (DXB)" className={inputClass(errors['ticket.arrival'])} />
                    </Field>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Flight Routes / Destinations ({ticket.legs?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={addLeg}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066FF] hover:text-[#0055D6] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add Flight</span>
                      </button>
                    </div>

                    {(ticket.legs || []).map((leg, index) => (
                      <div key={leg.key} className="space-y-1">
                        <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                          <span className="text-xs font-bold text-slate-400 w-5">#{index + 1}</span>

                          <div className="flex-1 w-full">
                            <input
                              type="text"
                              value={leg.departure}
                              onChange={(e) => changeLeg(leg.key, 'departure', e.target.value)}
                              placeholder={`Flight ${index + 1} Depart (e.g. Dhaka (DAC))`}
                              className={inputClass(errors[`ticket.legs.${index}.departure`])}
                            />
                            {errors[`ticket.legs.${index}.departure`] && (
                              <span className="text-xs text-rose-500 mt-1 block font-medium">
                                {errors[`ticket.legs.${index}.departure`]}
                              </span>
                            )}
                          </div>

                          <span className="text-slate-400 font-bold hidden sm:inline">→</span>

                          <div className="flex-1 w-full">
                            <input
                              type="text"
                              value={leg.arrival}
                              onChange={(e) => changeLeg(leg.key, 'arrival', e.target.value)}
                              placeholder={`Flight ${index + 1} Arrive (e.g. Dubai (DXB))`}
                              className={inputClass(errors[`ticket.legs.${index}.arrival`])}
                            />
                            {errors[`ticket.legs.${index}.arrival`] && (
                              <span className="text-xs text-rose-500 mt-1 block font-medium">
                                {errors[`ticket.legs.${index}.arrival`]}
                              </span>
                            )}
                          </div>

                          {(ticket.legs || []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeLeg(leg.key)}
                              className="w-8 h-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                              title="Remove flight segment"
                              aria-label={`Remove flight segment ${index + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {errors['ticket.legs'] && (
                      <span className="text-xs text-rose-500 block font-medium">{errors['ticket.legs']}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {values.serviceType === 'hotel' && (
              <div className="space-y-4 pt-1">
                <Field label="Hotel Name" htmlFor="hotel-name" required error={errors['hotel.name']}>
                  <input id="hotel-name" type="text" value={hotel.name} onChange={(event) => patchHotel({ name: event.target.value }, 'name')} placeholder="e.g. Grand Hyatt Dubai" className={inputClass(errors['hotel.name'])} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Country" required error={errors['hotel.country']}>
                    <CountrySelect value={hotel.country} countryCode={hotel.countryCode} onChange={(selected) => patchHotel({ country: selected.name, countryCode: selected.code, city: '' }, 'country')} />
                  </Field>

                  <Field label="City / Location" htmlFor="hotel-city" required error={errors['hotel.city']}>
                    <CityInput id="hotel-city" country={hotel.country} value={hotel.city} error={errors['hotel.city']} onChange={(city) => patchHotel({ city }, 'city')} placeholder="e.g. Dubai Marina" />
                  </Field>
                </div>

                <Field label="Stay Duration" htmlFor="hotel-stay" required error={errors['hotel.stay']}>
                  <input id="hotel-stay" type="text" value={hotel.stay} onChange={(event) => patchHotel({ stay: event.target.value }, 'stay')} placeholder="e.g. 3 Nights" className={inputClass(errors['hotel.stay'])} />
                </Field>
              </div>
            )}

            {values.serviceType === 'tour' && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Package Name / Reference" htmlFor="tour-name" optional className="sm:col-span-2">
                    <input id="tour-name" type="text" value={tour.packageName} onChange={(event) => setTour((current) => ({ ...current, packageName: event.target.value }))} placeholder="e.g. Dubai + Bali Multi-City Tour" className={inputClass(false)} />
                  </Field>

                  <Field label="Duration" htmlFor="tour-duration" required error={errors['tour.duration']}>
                    <input
                      id="tour-duration"
                      type="text"
                      value={tour.duration}
                      onChange={(event) => {
                        setTour((current) => ({ ...current, duration: event.target.value }))
                        clearErrors('tour.duration')
                      }}
                      placeholder="e.g. 7 Days / 6 Nights"
                      className={inputClass(errors['tour.duration'])}
                    />
                  </Field>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tour Destinations ({tour.destinations.length})</span>
                    <button type="button" onClick={addStop} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066FF] hover:text-[#0055D6] cursor-pointer">
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Destination</span>
                    </button>
                  </div>

                  {tour.destinations.map((stop, index) => (
                    <div key={stop.key}>
                      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <span className="text-xs font-bold text-slate-400 w-5">#{index + 1}</span>

                        <div className="flex-1 w-full">
                          <CountrySelect value={stop.country} countryCode={stop.countryCode} onChange={(selected) => changeStop(stop.key, { country: selected.name, countryCode: selected.code, city: '' })} />
                        </div>

                        <div className="flex-1 w-full">
                          <CityInput country={stop.country} value={stop.city} onChange={(city) => changeStop(stop.key, { city })} />
                        </div>

                        {tour.destinations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStop(stop.key)}
                            className="w-8 h-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Remove destination"
                            aria-label={`Remove destination ${index + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {errors[`tour.destinations.${index}.country`] && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors[`tour.destinations.${index}.country`]}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Field label="Assign to Staff" htmlFor="application-staff" optional>
              <SelectBox
                id="application-staff"
                value={values.assignedStaff}
                onChange={(value) => set('assignedStaff', value)}
                placeholder="Unassigned"
                options={staff.map((person) => ({ value: person.id ?? person._id, label: person.name }))}
              />
            </Field>
          </Section>

          <Section>
            <SectionHeader icon={Tag} title="Client Type" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Client Type" required>
                <div role="group" aria-label="Client type" className="flex rounded-lg border border-slate-200 p-0.5 bg-white">
                  {[
                    { id: 'b2c', label: 'B2C' },
                    { id: 'b2b', label: 'B2B' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={values.clientType === option.id}
                      onClick={() => set('clientType', option.id)}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${values.clientType === option.id ? 'bg-[#0066FF] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Field>

              {b2b && (
                <Field label="B2B Partner Agency" htmlFor="application-partner" required error={errors.partnerId}>
                  <SelectBox
                    id="application-partner"
                    value={values.partnerId}
                    onChange={(value) => set('partnerId', value)}
                    error={errors.partnerId}
                    placeholder="Choose the partner"
                    options={partners.map((partner) => ({ value: partner.id ?? partner._id, label: partner.companyName ?? partner.name }))}
                  />
                </Field>
              )}
            </div>
          </Section>

          <Section>
            <SectionHeader
              icon={Building2}
              title={`Vendor Information (${lines.length})`}
              action={
                <button type="button" onClick={addLine} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066FF] hover:text-[#0055D6] cursor-pointer">
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Vendor</span>
                </button>
              }
            />
            <p className="text-[11px] text-slate-400 -mt-2">Optional. Leave a row empty when there is no vendor cost yet.</p>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={line.key} className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Vendor #{index + 1}</span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines((list) => list.filter((item) => item.key !== line.key))}
                        className="w-7 h-7 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove vendor"
                        aria-label={`Remove vendor ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${line.service === 'visa' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                    <Field label="Vendor Name" htmlFor={`vendor-${line.key}`}>
                      <SelectBox
                        id={`vendor-${line.key}`}
                        value={line.vendorId}
                        onChange={(value) => changeLine(line.key, { vendorId: value })}
                        placeholder={vendors.length ? 'Not in the list' : 'Type a name below'}
                        options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))}
                      />
                      {!line.vendorId && (
                        <input
                          type="text"
                          aria-label={`Vendor ${index + 1} name`}
                          value={line.name}
                          onChange={(event) => changeLine(line.key, { name: event.target.value })}
                          placeholder="Or type a vendor name"
                          className={`${inputClass(false)} mt-2`}
                        />
                      )}
                    </Field>

                    <Field label="Vendor Service" htmlFor={`vendor-service-${line.key}`}>
                      <SelectBox id={`vendor-service-${line.key}`} value={line.service} onChange={(value) => changeLine(line.key, { service: value })} options={SERVICE_OPTIONS} />
                    </Field>

                    {line.service === 'visa' && (
                      <Field label="Country">
                        <CountrySelect value={line.country} countryCode={line.countryCode} onChange={(selected) => changeLine(line.key, { country: selected.name, countryCode: selected.code })} />
                      </Field>
                    )}

                    <Field label={`Vendor Price (${currency})`} htmlFor={`vendor-price-${line.key}`} hint={line.fromList ? 'Fetched from the vendor price list' : undefined}>
                      <input id={`vendor-price-${line.key}`} type="number" min="0" value={line.price} onChange={(event) => changeLine(line.key, { price: event.target.value })} className={`${inputClass(false)} font-semibold`} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 px-2 pt-1">
              <span>Total vendor price:</span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(vendorCost, currency)}</span>
            </div>
          </Section>

          <Section>
            <SectionHeader icon={CreditCard} title="Account" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={`Total Amount (${currency})`}
                htmlFor="application-total"
                required
                error={errors.totalAmount}
                hint={visa ? (type ? `Price list: ${formatCurrency(listPrice, currency)}` : 'Choose a visa type to fill the price list amount.') : 'The total agreed with the client.'}
              >
                <input id="application-total" type="number" min="0" value={values.totalAmount} onChange={(event) => changeTotal(event.target.value)} className={`${inputClass(errors.totalAmount)} font-bold text-slate-900`} />
              </Field>

              <Field label={`Discount (${currency})`} htmlFor="application-discount" error={errors.discountAmount}>
                <input id="application-discount" type="number" min="0" value={values.discountAmount} onChange={(event) => changeDiscount(event.target.value)} className={inputClass(errors.discountAmount)} />
              </Field>

              <Field label={`Advance Amount (${currency})`} htmlFor="application-advance" error={errors.advancePaid}>
                <input id="application-advance" type="number" min="0" value={values.advancePaid} onChange={(event) => changeAdvance(event.target.value)} className={inputClass(errors.advancePaid)} />
              </Field>

              <Field label={`Due Amount (${currency})`} htmlFor="application-due" hint="The server works this out again when it saves.">
                <input id="application-due" type="number" min="0" value={due} onChange={(event) => changeDue(event.target.value)} className={`${inputClass(false)} font-bold ${due > 0 ? 'text-amber-600' : 'text-slate-900'}`} />
              </Field>

              <Field label="Payment Method" htmlFor="application-method">
                <SelectBox id="application-method" value={values.paymentMethod} onChange={(value) => set('paymentMethod', value)} options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))} />
              </Field>

              {overridden && (
                <Field label="Why is the total different from the price list?" htmlFor="application-override" required error={errors.totalOverrideReason}>
                  <input id="application-override" type="text" value={values.totalOverrideReason} onChange={(event) => set('totalOverrideReason', event.target.value)} className={inputClass(errors.totalOverrideReason)} />
                </Field>
              )}
            </div>
          </Section>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 font-semibold text-sm transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0066FF] hover:bg-[#0055D6] active:bg-[#0047B3] text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewApplicationModal
