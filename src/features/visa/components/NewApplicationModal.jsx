import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  User,
  Layers,
  Tag,
  Building2,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Hotel,
  Compass,
  FileText,
  Phone,
  Mail,
  ChevronDown,
  Search,
} from 'lucide-react';
import { CountrySelect } from '../../../components/re-table/CountrySelect';
import { fetchCities } from '../../../services/countries.service';
import { visaApi } from '../visa.api';
import { b2bApi } from '../../b2b/b2b.api';
import { b2cApi } from '../../b2c/b2c.api';
import { vendorApi } from '../../vendors/vendor.api';
import { formatCurrency } from '../../../utils/formatters';

// ── Constants ─────────────────────────────────────────────────────
const SERVICE_OPTIONS = [
  { value: 'visa', label: 'Visa', icon: FileText },
  { value: 'ticket', label: 'Ticket', icon: Plane },
  { value: 'hotel', label: 'Hotel', icon: Hotel },
  { value: 'tour', label: 'Tour Package', icon: Compass },
];

// Vendor services (later this can be filtered by what each vendor actually offers)
const VENDOR_SERVICE_OPTIONS = [
  { value: 'visa', label: 'Visa' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'tour', label: 'Tour Package' },
];

const VISA_TYPES = ['Tourist', 'Business', 'Student'];
const ENTRY_OPTIONS = ['Single', 'Double', 'Triple', 'Multiple'];
const TRIP_TYPES = ['One Way', 'Round Way'];
const TICKET_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First Class'];
const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Credit / Debit Card', 'bKash / Nagad'];

// ── Shared styles ─────────────────────────────────────────────────
const inputBase =
  'w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-2xs';
const inputOk = 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500';
const inputBad = 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500';
const inputClass = (hasError) => `${inputBase} ${hasError ? inputBad : inputOk}`;

// ── Helpers ───────────────────────────────────────────────────────
const norm = (s) => String(s || '').trim().toLowerCase();

// Keeps a typed number string between 0 and max
const capStr = (str, max) => {
  if (str === '' || str === null || str === undefined) return '';
  const n = Number(str);
  if (isNaN(n)) return '';
  if (n < 0) return '0';
  return n > max ? String(Math.max(0, max)) : String(str);
};

/**
 * Looks up a vendor's price for a service (and country, for visa).
 * The vendor list API is still being built, so this accepts a few likely shapes:
 *   vendor.services = [{ service: 'visa', countries: [{ country: 'China', price: 6500 }] }]
 *   vendor.services = [{ service: 'ticket', price: 4000 }]
 * Returns null when nothing is found, so the admin can type the price by hand.
 */
function getVendorPrice(vendor, service, country) {
  if (!vendor) return null;
  const services = vendor.services || vendor.vendorServices || [];
  const svc = services.find((s) => norm(s.service || s.type || s.name) === norm(service));
  if (!svc) return null;

  if (service === 'visa') {
    const list = svc.countries || svc.prices || [];
    const match = list.find((c) => norm(c.country || c.name) === norm(country));
    const price = match?.price ?? match?.cost;
    return price === undefined || price === null ? null : Number(price);
  }

  const price = svc.price ?? svc.cost;
  return price === undefined || price === null ? null : Number(price);
}

// ── Small reusable pieces ─────────────────────────────────────────
function Field({ label, required, optional, error, hint, className = '', children }) {
  return (
    <div className={className}>
      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
        {optional && <span className="text-slate-400 font-normal text-xs">(Optional)</span>}
      </label>
      {children}
      {hint && !error && <span className="text-[11px] text-slate-400 mt-1 block">{hint}</span>}
      {error && <span className="text-xs text-rose-500 mt-1 block font-medium">{error}</span>}
    </div>
  );
}

function SelectBox({ value, onChange, options, icon: Icon, error }) {
  return (
    <div className="relative">
      {Icon && <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass(error)} appearance-none pr-9 font-medium cursor-pointer ${Icon ? 'pl-10' : ''}`}
      >
        {options.map((opt) => {
          const v = typeof opt === 'string' ? opt : opt.value;
          const l = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
        <Icon className="w-4 h-4 stroke-[2.5]" />
        <span>{title}</span>
      </div>
      {action}
    </div>
  );
}

// ── Searchable existing-client dropdown (shows names only) ────────
function ClientSearchSelect({ customers, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
    );
  }, [customers, query]);

  const pick = (c) => {
    onSelect(c);
    setQuery(c.name || '');
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
      <input
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
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
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pick(c)}
                className="w-full text-left px-4 py-2 text-sm text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── City datalist input (used for Hotel and Tour) ─────────────────
function CityDatalistInput({ country, value, onChange, placeholder = 'Select or type city...', error }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!country) {
      setCities([]);
      return;
    }
    setLoading(true);
    fetchCities(country)
      .then((list) => {
        if (active) setCities(list || []);
      })
      .catch(() => {
        if (active) setCities([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [country]);

  const listId = `city_list_${country?.replace(/\s+/g, '_') || 'gen'}`;

  return (
    <div className="relative">
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={loading ? 'Loading cities...' : placeholder}
        className={inputClass(error)}
      />
      <datalist id={listId}>
        {cities.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN MODAL
// ══════════════════════════════════════════════════════════════════
export function NewApplicationModal({ open = false, onClose, onCreated }) {
  // ── Master data ─────────────────────────────────────────────────
  const [countries, setCountries] = useState([]);
  const [partners, setPartners] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // ── Section 1: Client ───────────────────────────────────────────
  const [clientInfo, setClientInfo] = useState({
    fullName: '',
    passportNumber: '',
    phone: '',
    email: '',
  });

  // ── Section 2: Service ──────────────────────────────────────────
  const [activeService, setActiveService] = useState('visa');

  const [visaDetails, setVisaDetails] = useState({
    country: 'China',
    countryCode: 'CN',
    countryId: undefined,
    visaType: 'Tourist',
    entries: 'Single',
    visaDuration: '',
  });

  const [ticketDetails, setTicketDetails] = useState({
    tripType: 'One Way',
    departureCity: '',
    destinationCity: '',
    ticketClass: 'Economy',
  });

  const [hotelDetails, setHotelDetails] = useState({
    hotelName: '',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    city: '',
    hotelStay: '',
  });

  const [tourDestinations, setTourDestinations] = useState([
    { id: 'dest_1', country: 'United Arab Emirates', countryCode: 'AE', city: 'Dubai' },
  ]);
  const [tourDetails, setTourDetails] = useState({
    packageName: '',
    duration: '5 Days / 4 Nights',
  });

  // ── Section 3: Client type ──────────────────────────────────────
  const [clientType, setClientType] = useState('b2c');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  // ── Section 4: Vendors ──────────────────────────────────────────
  const [vendorList, setVendorList] = useState([
    {
      id: 'v_row_1',
      vendorId: '',
      vendorName: '',
      service: 'visa',
      country: 'China',
      countryCode: 'CN',
      price: '',
      priceSource: 'manual', // 'vendor' = fetched from vendor list, 'manual' = typed by admin
    },
  ]);

  // ── Section 5: Account ──────────────────────────────────────────
  const [totalAmount, setTotalAmount] = useState('');
  const [discount, setDiscount] = useState('');
  const [advance, setAdvance] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');

  // ── Load master data when the modal opens ───────────────────────
  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    async function loadData() {
      const [cRes, pRes, custRes, vendRes] = await Promise.allSettled([
        visaApi.listCountries(),
        b2bApi.listPartners(),
        b2cApi.list(),
        vendorApi.getVendors(),
      ]);
      if (!isMounted) return;

      if (cRes.status === 'fulfilled' && cRes.value?.items) setCountries(cRes.value.items);

      if (pRes.status === 'fulfilled') {
        const list = pRes.value?.items || (Array.isArray(pRes.value) ? pRes.value : []);
        setPartners(list);
        if (list.length > 0) setSelectedPartnerId((prev) => prev || list[0].id);
      }
      if (custRes.status === 'fulfilled') {
        const list = custRes.value?.items || (Array.isArray(custRes.value) ? custRes.value : []);
        setCustomers(list);
      }
      if (vendRes.status === 'fulfilled' && vendRes.value?.success) {
        const list = vendRes.value.data || [];
        setVendors(list);
        // Point the first row at a real vendor and try to fetch its price
        if (list.length > 0) {
          setVendorList((prev) =>
            prev.map((row, i) => {
              if (i !== 0 || row.vendorId) return row;
              const found = getVendorPrice(list[0], row.service, row.country);
              return {
                ...row,
                vendorId: list[0].id,
                vendorName: list[0].name,
                price: found !== null ? String(found) : row.price,
                priceSource: found !== null ? 'vendor' : 'manual',
              };
            })
          );
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [open]);

  // ── Account formulas ────────────────────────────────────────────
  //   Net Amount = Total − Discount
  //   Due Amount = Net Amount − Advance
  const total = Number(totalAmount) || 0;
  const discountValue = Math.min(Number(discount) || 0, total);
  const netAmount = Math.max(0, total - discountValue);
  const advanceValue = Math.min(Number(advance) || 0, netAmount);
  const dueAmount = Math.max(0, netAmount - advanceValue);

  const derivedPaymentStatus = useMemo(() => {
    if (total > 0 && dueAmount === 0) return 'Paid';
    if (advanceValue > 0 && dueAmount > 0) return 'Partial';
    return 'Unpaid';
  }, [total, advanceValue, dueAmount]);

  const totalVendorCost = useMemo(
    () => vendorList.reduce((sum, v) => sum + (Number(v.price) || 0), 0),
    [vendorList]
  );

  const handleTotalChange = (v) => {
    const t = Number(capStr(v, Number.MAX_SAFE_INTEGER)) || 0;
    const nextDiscount = capStr(discount, t);
    const nextNet = t - (Number(nextDiscount) || 0);
    setTotalAmount(capStr(v, Number.MAX_SAFE_INTEGER));
    setDiscount(nextDiscount);
    setAdvance(capStr(advance, nextNet));
    if (validationErrors.totalAmount) setValidationErrors((prev) => ({ ...prev, totalAmount: null }));
  };

  const handleDiscountChange = (v) => {
    const nextDiscount = capStr(v, total);
    setDiscount(nextDiscount);
    setAdvance(capStr(advance, total - (Number(nextDiscount) || 0)));
  };

  const handleAdvanceChange = (v) => {
    setAdvance(capStr(v, netAmount));
  };

  // Typing a due amount adjusts the advance automatically
  const handleDueChange = (v) => {
    const wantedDue = Math.min(Math.max(Number(v) || 0, 0), netAmount);
    setAdvance(String(netAmount - wantedDue));
  };

  // ── Other handlers ──────────────────────────────────────────────
  const clearError = (key) => {
    if (validationErrors[key]) setValidationErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleSelectExistingClient = (c) => {
    setClientInfo((prev) => ({
      ...prev,
      fullName: c.name || prev.fullName,
      phone: c.phone || prev.phone,
      email: c.email || prev.email,
      passportNumber: c.passportNumber || prev.passportNumber,
    }));
    setValidationErrors((prev) => ({ ...prev, fullName: null, phone: null }));
  };

  const handleAddDestination = () => {
    setTourDestinations((prev) => [
      ...prev,
      { id: `dest_${Date.now()}`, country: 'Malaysia', countryCode: 'MY', city: 'Kuala Lumpur' },
    ]);
  };

  const handleRemoveDestination = (id) => {
    if (tourDestinations.length <= 1) return;
    setTourDestinations((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateDestination = (id, field, value) => {
    setTourDestinations((prev) =>
      prev.map((dest) => {
        if (dest.id !== id) return dest;
        if (field === 'country') {
          return { ...dest, country: value.name, countryCode: value.code, city: '' };
        }
        return { ...dest, [field]: value };
      })
    );
  };

  // ── Vendor handlers ─────────────────────────────────────────────
  const handleAddVendor = () => {
    const first = vendors[0];
    const row = {
      id: `v_row_${Date.now()}`,
      vendorId: first?.id || '',
      vendorName: first?.name || '',
      service: 'visa',
      country: visaDetails.country,
      countryCode: visaDetails.countryCode,
      price: '',
      priceSource: 'manual',
    };
    const found = getVendorPrice(first, row.service, row.country);
    if (found !== null) {
      row.price = String(found);
      row.priceSource = 'vendor';
    }
    setVendorList((prev) => [...prev, row]);
  };

  const handleRemoveVendor = (id) => {
    if (vendorList.length <= 1) return;
    setVendorList((prev) => prev.filter((v) => v.id !== id));
  };

  // patch can hold: vendorId, service, country (+countryCode), price
  const handleUpdateVendor = (id, patch) => {
    setVendorList((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const next = { ...v, ...patch };

        if ('vendorId' in patch) {
          const match = vendors.find((item) => item.id === patch.vendorId);
          next.vendorName = match ? match.name : '';
        }
        if ('price' in patch) next.priceSource = 'manual';

        // Vendor, service or country changed → try to fetch the price again
        if (['vendorId', 'service', 'country'].some((k) => k in patch)) {
          const vendor = vendors.find((item) => item.id === next.vendorId);
          const found = getVendorPrice(vendor, next.service, next.country);
          if (found !== null) {
            next.price = String(found);
            next.priceSource = 'vendor';
          } else {
            next.priceSource = 'manual';
          }
        }
        return next;
      })
    );
  };

  // ── Validation ──────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};

    if (!clientInfo.fullName.trim()) errors.fullName = 'Please enter the client’s full name';
    if (!clientInfo.phone.trim()) errors.phone = 'Please enter a phone number';
    if (activeService === 'visa' && !clientInfo.passportNumber.trim()) {
      errors.passportNumber = 'Passport number is needed for a visa';
    }

    if (activeService === 'visa') {
      if (!visaDetails.country) errors.visaCountry = 'Please choose a country';
      if (!visaDetails.visaDuration.trim()) errors.visaDuration = 'Please write the visa duration';
    } else if (activeService === 'ticket') {
      if (!ticketDetails.departureCity.trim()) errors.ticketFrom = 'Please enter the departure place';
      if (!ticketDetails.destinationCity.trim()) errors.ticketTo = 'Please enter the arrival place';
    } else if (activeService === 'hotel') {
      if (!hotelDetails.hotelName.trim()) errors.hotelName = 'Please enter the hotel name';
      if (!hotelDetails.country) errors.hotelCountry = 'Please choose a country';
      if (!hotelDetails.city.trim()) errors.hotelCity = 'Please enter the city / location';
      if (!hotelDetails.hotelStay.trim()) errors.hotelStay = 'Please enter the stay duration';
    } else if (activeService === 'tour') {
      tourDestinations.forEach((dest, idx) => {
        if (!dest.country) errors[`tour_country_${idx}`] = 'Country is required';
      });
    }

    if (clientType === 'b2b' && !selectedPartnerId) errors.partner = 'Please select a B2B partner';

    vendorList.forEach((v, idx) => {
      if (!v.vendorId) errors[`vendor_${idx}`] = 'Please choose a vendor';
      if (v.service === 'visa' && !v.country) errors[`vendor_country_${idx}`] = 'Please choose a country';
      if (v.price === '' || Number(v.price) < 0) errors[`vendor_price_${idx}`] = 'Please enter the vendor price';
    });

    if (total <= 0) errors.totalAmount = 'Total amount must be greater than 0';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

      const payload = {
        name: clientInfo.fullName.trim(),
        passportNumber: clientInfo.passportNumber.trim(),
        phone: clientInfo.phone.trim(),
        email: clientInfo.email.trim(),
        clientType,
        clientName:
          clientType === 'b2b'
            ? selectedPartner?.name || selectedPartner?.company || 'B2B Partner'
            : 'B2C Direct Client',
        serviceType: activeService,

        // Flat fields kept for backward compatibility
        country:
          activeService === 'visa'
            ? visaDetails.country
            : activeService === 'hotel'
              ? hotelDetails.country
              : 'Multiple',
        countryId: activeService === 'visa' ? visaDetails.countryId : undefined,
        visaType: activeService === 'visa' ? visaDetails.visaType : undefined,
        entries: activeService === 'visa' ? visaDetails.entries : undefined,
        visaDuration: activeService === 'visa' ? visaDetails.visaDuration.trim() : undefined,
        city: activeService === 'hotel' ? hotelDetails.city : undefined,

        // Structured details
        visaDetails: activeService === 'visa' ? { ...visaDetails } : null,
        ticketDetails: activeService === 'ticket' ? { ...ticketDetails } : null,
        hotelDetails: activeService === 'hotel' ? { ...hotelDetails } : null,
        tourDetails:
          activeService === 'tour' ? { ...tourDetails, destinations: tourDestinations } : null,

        // Vendors
        vendorList: vendorList.map((v) => ({
          vendorId: v.vendorId,
          name: v.vendorName,
          service: v.service,
          country: v.service === 'visa' ? v.country : undefined,
          price: Number(v.price) || 0,
          cost: Number(v.price) || 0, // kept for backward compatibility
        })),
        vendorName: vendorList[0]?.vendorName || '',
        vendorCost: totalVendorCost,

        // Account
        totalAmount: total,
        discountAmount: discountValue,
        netAmount,
        advancePaid: advanceValue,
        dueAmount,
        costPrice: totalVendorCost,
        profit: netAmount - totalVendorCost,
        paymentMethod,
        paymentStatus: derivedPaymentStatus,
      };

      if (onCreated) {
        await onCreated(payload);
      } else {
        await visaApi.createApplication(payload);
      }

      onClose?.();
    } catch (err) {
      console.error('Failed to create application:', err);
      setSubmitError(err?.message || 'Could not submit the application. Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Escape closes the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const ServiceIcon = SERVICE_OPTIONS.find((s) => s.value === activeService)?.icon;
  const vendorOptions =
    vendors.length > 0
      ? vendors.map((v) => ({ value: v.id, label: v.name }))
      : [{ value: '', label: 'No vendors available' }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-4xl w-full my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 bg-white shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3.5">

            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Add New Application
              </h2>

            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          {submitError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* ═══ SECTION 1: CLIENT ═══ */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <SectionHeader icon={User} title="Client Information" />

            {customers.length > 0 && (
              <Field
                label="Existing Client"

              >
                <ClientSearchSelect customers={customers} onSelect={handleSelectExistingClient} />
              </Field>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required error={validationErrors.fullName}>
                <input
                  type="text"
                  value={clientInfo.fullName}
                  onChange={(e) => {
                    setClientInfo({ ...clientInfo, fullName: e.target.value });
                    clearError('fullName');
                  }}

                  className={inputClass(validationErrors.fullName)}
                />
              </Field>

              <Field
                label="Passport Number"
                required={activeService === 'visa'}
                optional={activeService !== 'visa'}
                error={validationErrors.passportNumber}
              >
                <input
                  type="text"
                  value={clientInfo.passportNumber}
                  onChange={(e) => {
                    setClientInfo({ ...clientInfo, passportNumber: e.target.value });
                    clearError('passportNumber');
                  }}
                  className={`${inputClass(validationErrors.passportNumber)} font-mono`}
                />
              </Field>

              <Field label="Phone Number" required error={validationErrors.phone}>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => {
                      setClientInfo({ ...clientInfo, phone: e.target.value });
                      clearError('phone');
                    }}
                    className={`${inputClass(validationErrors.phone)} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Email Address" optional>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    className={`${inputClass(false)} pl-10`}
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* ═══ SECTION 2: SERVICE DETAILS ═══ */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <SectionHeader icon={Layers} title="Service Details" />

            <Field label="Service" required>
              <SelectBox
                value={activeService}
                onChange={setActiveService}
                options={SERVICE_OPTIONS}
                icon={ServiceIcon}
              />
            </Field>

            {/* ── VISA ── */}
            {activeService === 'visa' && (
              <div className="space-y-4 pt-1">
                <Field label="Country" required error={validationErrors.visaCountry}>
                  <CountrySelect
                    value={visaDetails.country}
                    countryCode={visaDetails.countryCode}
                    onChange={(selected) => {
                      const matched = countries.find(
                        (c) =>
                          (c.name || '').toLowerCase() === selected.name.toLowerCase() || c.code === selected.code
                      );
                      setVisaDetails({
                        ...visaDetails,
                        country: selected.name,
                        countryCode: selected.code,
                        countryId: matched?.id,
                      });
                      clearError('visaCountry');
                    }}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Visa Type" required>
                    <SelectBox
                      value={visaDetails.visaType}
                      onChange={(v) => setVisaDetails({ ...visaDetails, visaType: v })}
                      options={VISA_TYPES}
                    />
                  </Field>

                  <Field label="Entry" required>
                    <SelectBox
                      value={visaDetails.entries}
                      onChange={(v) => setVisaDetails({ ...visaDetails, entries: v })}
                      options={ENTRY_OPTIONS}
                    />
                  </Field>

                  <Field label="Visa Duration" required error={validationErrors.visaDuration}>
                    <input
                      type="text"
                      value={visaDetails.visaDuration}
                      onChange={(e) => {
                        setVisaDetails({ ...visaDetails, visaDuration: e.target.value });
                        clearError('visaDuration');
                      }}
                      className={inputClass(validationErrors.visaDuration)}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── TICKET ── */}
            {activeService === 'ticket' && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Trip Type" required>
                    <SelectBox
                      value={ticketDetails.tripType}
                      onChange={(v) => setTicketDetails({ ...ticketDetails, tripType: v })}
                      options={TRIP_TYPES}
                    />
                  </Field>

                  <Field label="Travel Class" required>
                    <SelectBox
                      value={ticketDetails.ticketClass}
                      onChange={(v) => setTicketDetails({ ...ticketDetails, ticketClass: v })}
                      options={TICKET_CLASSES}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Departure" required error={validationErrors.ticketFrom}>
                    <input
                      type="text"
                      value={ticketDetails.departureCity}
                      onChange={(e) => {
                        setTicketDetails({ ...ticketDetails, departureCity: e.target.value });
                        clearError('ticketFrom');
                      }}
                      placeholder="e.g. Dhaka (DAC)"
                      className={inputClass(validationErrors.ticketFrom)}
                    />
                  </Field>

                  <Field label="Arrive" required error={validationErrors.ticketTo}>
                    <input
                      type="text"
                      value={ticketDetails.destinationCity}
                      onChange={(e) => {
                        setTicketDetails({ ...ticketDetails, destinationCity: e.target.value });
                        clearError('ticketTo');
                      }}
                      placeholder="e.g. Dubai (DXB)"
                      className={inputClass(validationErrors.ticketTo)}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── HOTEL ── */}
            {activeService === 'hotel' && (
              <div className="space-y-4 pt-1">
                <Field label="Hotel Name" required error={validationErrors.hotelName}>
                  <input
                    type="text"
                    value={hotelDetails.hotelName}
                    onChange={(e) => {
                      setHotelDetails({ ...hotelDetails, hotelName: e.target.value });
                      clearError('hotelName');
                    }}
                    placeholder="e.g. Grand Hyatt Dubai"
                    className={inputClass(validationErrors.hotelName)}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Country" required error={validationErrors.hotelCountry}>
                    <CountrySelect
                      value={hotelDetails.country}
                      countryCode={hotelDetails.countryCode}
                      onChange={(selected) => {
                        setHotelDetails({
                          ...hotelDetails,
                          country: selected.name,
                          countryCode: selected.code,
                          city: '',
                        });
                        clearError('hotelCountry');
                      }}
                    />
                  </Field>

                  <Field label="City / Location" required error={validationErrors.hotelCity}>
                    <CityDatalistInput
                      country={hotelDetails.country}
                      value={hotelDetails.city}
                      error={validationErrors.hotelCity}
                      onChange={(city) => {
                        setHotelDetails({ ...hotelDetails, city });
                        clearError('hotelCity');
                      }}
                      placeholder="e.g. Dubai Marina"
                    />
                  </Field>
                </div>

                <Field label="Stay Duration" required error={validationErrors.hotelStay}>
                  <input
                    type="text"
                    value={hotelDetails.hotelStay}
                    onChange={(e) => {
                      setHotelDetails({ ...hotelDetails, hotelStay: e.target.value });
                      clearError('hotelStay');
                    }}
                    placeholder="e.g. 3 Nights"
                    className={inputClass(validationErrors.hotelStay)}
                  />
                </Field>
              </div>
            )}

            {/* ── TOUR PACKAGE ── */}
            {activeService === 'tour' && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Package Name / Reference" className="sm:col-span-2">
                    <input
                      type="text"
                      value={tourDetails.packageName}
                      onChange={(e) => setTourDetails({ ...tourDetails, packageName: e.target.value })}
                      placeholder="e.g. Dubai + Bali Multi-City Tour"
                      className={inputClass(false)}
                    />
                  </Field>

                  <Field label="Duration" required>
                    <input
                      type="text"
                      value={tourDetails.duration}
                      onChange={(e) => setTourDetails({ ...tourDetails, duration: e.target.value })}
                      placeholder="e.g. 7 Days / 6 Nights"
                      className={inputClass(false)}
                    />
                  </Field>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Tour Destinations ({tourDestinations.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddDestination}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066FF] hover:text-[#0055D6] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Destination</span>
                    </button>
                  </div>

                  {tourDestinations.map((dest, idx) => (
                    <div
                      key={dest.id}
                      className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>

                      <div className="flex-1 w-full">
                        <CountrySelect
                          value={dest.country}
                          countryCode={dest.countryCode}
                          onChange={(selected) => handleUpdateDestination(dest.id, 'country', selected)}
                        />
                      </div>

                      <div className="flex-1 w-full">
                        <CityDatalistInput
                          country={dest.country}
                          value={dest.city}
                          onChange={(val) => handleUpdateDestination(dest.id, 'city', val)}
                          placeholder="Select or type city..."
                        />
                      </div>

                      {tourDestinations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDestination(dest.id)}
                          className="w-8 h-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Remove destination"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ SECTION 3: CLIENT TYPE ═══ */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <SectionHeader icon={Tag} title="Client Type" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Client Type" required>
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white">
                  {[
                    { id: 'b2c', label: 'B2C' },
                    { id: 'b2b', label: 'B2B' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setClientType(opt.id)}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${clientType === opt.id
                        ? 'bg-[#0066FF] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>

              {clientType === 'b2b' && (
                <Field label="B2B Partner Agency" required error={validationErrors.partner}>
                  <SelectBox
                    value={selectedPartnerId}
                    onChange={setSelectedPartnerId}
                    options={partners.map((p) => ({
                      value: p.id,
                      label: `${p.name}${p.company ? ` (${p.company})` : ''} - Tier: ${p.tier || 'standard'}`,
                    }))}
                  />
                </Field>
              )}
            </div>
          </div>

          {/* ═══ SECTION 4: VENDORS ═══ */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <SectionHeader
              icon={Building2}
              title={`Vendor Information (${vendorList.length})`}
              action={
                <button
                  type="button"
                  onClick={handleAddVendor}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066FF] hover:text-[#0055D6] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Vendor</span>
                </button>
              }
            />

            <div className="space-y-3">
              {vendorList.map((item, idx) => {
                const isVisa = item.service === 'visa';
                return (
                  <div key={item.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Vendor #{idx + 1}</span>
                      {vendorList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVendor(item.id)}
                          className="w-7 h-7 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove vendor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${isVisa ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                        }`}
                    >
                      <Field label="Vendor Name" required error={validationErrors[`vendor_${idx}`]}>
                        <SelectBox
                          value={item.vendorId}
                          onChange={(v) => handleUpdateVendor(item.id, { vendorId: v })}
                          options={vendorOptions}
                          error={validationErrors[`vendor_${idx}`]}
                        />
                      </Field>

                      <Field label="Vendor Service" required>
                        <SelectBox
                          value={item.service}
                          onChange={(v) => handleUpdateVendor(item.id, { service: v })}
                          options={VENDOR_SERVICE_OPTIONS}
                        />
                      </Field>

                      {isVisa && (
                        <Field label="Country" required error={validationErrors[`vendor_country_${idx}`]}>
                          <CountrySelect
                            value={item.country}
                            countryCode={item.countryCode}
                            onChange={(selected) =>
                              handleUpdateVendor(item.id, { country: selected.name, countryCode: selected.code })
                            }
                          />
                        </Field>
                      )}

                      <Field
                        label="Vendor Price (BDT)"
                        required
                        error={validationErrors[`vendor_price_${idx}`]}
                        hint={item.priceSource === 'vendor' ? 'Fetched from the vendor price list' : undefined}
                      >
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => {
                            handleUpdateVendor(item.id, { price: e.target.value });
                            clearError(`vendor_price_${idx}`);
                          }}
                          className={`${inputClass(validationErrors[`vendor_price_${idx}`])} font-semibold`}
                        />
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 px-2 pt-1">
              <span>Total vendor price:</span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(totalVendorCost, 'BDT')}</span>
            </div>
          </div>

          {/* ═══ SECTION 5: ACCOUNT ═══ */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <SectionHeader icon={CreditCard} title="Account" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Total Amount (BDT)" required error={validationErrors.totalAmount}>
                <input
                  type="number"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className={`${inputClass(validationErrors.totalAmount)} font-bold text-slate-900`}
                />
              </Field>

              <Field label="Discount (BDT)">
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className={inputClass(false)}
                />
              </Field>

              <Field label="Advance Amount (BDT)">
                <input
                  type="number"
                  min="0"
                  value={advance}
                  onChange={(e) => handleAdvanceChange(e.target.value)}
                  className={inputClass(false)}
                />
              </Field>

              <Field label="Due Amount (BDT)">
                <input
                  type="number"
                  min="0"
                  value={dueAmount}
                  onChange={(e) => handleDueChange(e.target.value)}
                  className={`${inputClass(false)} font-bold ${dueAmount > 0 ? 'text-amber-600' : 'text-slate-900'}`}
                />
              </Field>

              <Field label="Payment Method">
                <SelectBox value={paymentMethod} onChange={setPaymentMethod} options={PAYMENT_METHODS} />
              </Field>
            </div>


          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 font-semibold text-sm transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0066FF] hover:bg-[#0055D6] active:bg-[#0047B3] text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
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
  );
}

export default NewApplicationModal;