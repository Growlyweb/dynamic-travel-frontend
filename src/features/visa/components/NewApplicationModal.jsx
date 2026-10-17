import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  FilePlus2,
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
  DollarSign,
  Calendar,
  Phone,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { CountrySelect } from '../../../components/re-table/CountrySelect';
import { fetchCities } from '../../../services/countries.service';
import { visaApi } from '../visa.api';
import { b2bApi } from '../../b2b/b2b.api';
import { b2cApi } from '../../b2c/b2c.api';
import { vendorApi } from '../../vendors/vendor.api';
import { formatCurrency } from '../../../utils/formatters';

const DEFAULT_ENTRY_OPTIONS = [
  { value: 'Single Entry', label: 'Single Entry' },
  { value: 'Double Entry', label: 'Double Entry' },
  { value: 'Multiple Entry', label: 'Multiple Entry' },
];

const DEFAULT_VISA_DURATION_OPTIONS = [
  '30 Days',
  '60 Days',
  '90 Days',
  '6 Months',
  '1 Year',
  '5 Years',
];

const TICKET_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First Class'];
const HOTEL_ROOM_TYPES = ['Standard Room', 'Deluxe Room', 'Executive Suite', 'Family Suite', 'Resort Villa'];
const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Credit / Debit Card', 'bKash / Nagad'];

export function NewApplicationModal({
  open = false,
  onClose,
  onCreated,
  countryOptions = [],
}) {
  // ── Global & API State ──────────────────────────────────────────
  const [countries, setCountries] = useState([]);
  const [visaTypes, setVisaTypes] = useState([]);
  const [partners, setPartners] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // ── Section 1: Client Information ─────────────────────────────
  const [clientInfo, setClientInfo] = useState({
    fullName: '',
    passportNumber: '',
    phone: '',
    email: '',
  });

  // ── Section 2: Service Type & Details ──────────────────────────
  const [activeService, setActiveService] = useState('visa'); // 'visa' | 'ticket' | 'hotel' | 'tour'

  // Visa Draft State
  const [visaDetails, setVisaDetails] = useState({
    country: 'China',
    countryCode: 'CN',
    countryId: 'vcn',
    city: 'Beijing',
    visaType: 'Tourist Visa',
    visaTypeId: 'vt_cn_tourist',
    entries: 'Single Entry',
    visaDuration: '30 Days',
  });

  // Ticket Draft State
  const [ticketDetails, setTicketDetails] = useState({
    tripType: 'Round Trip', // 'One Way' | 'Round Trip'
    ticketClass: 'Economy',
    departureCountry: 'Bangladesh',
    departureCity: 'Dhaka (DAC)',
    destinationCountry: 'United Arab Emirates',
    destinationCity: 'Dubai (DXB)',
    departureDate: new Date().toISOString().split('T')[0],
    returnDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    airline: '',
  });

  // Hotel Draft State
  const [hotelDetails, setHotelDetails] = useState({
    hotelName: '',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    city: 'Dubai',
    hotelStay: '3 Nights',
    roomType: 'Deluxe Room',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    guests: '2 Adults, 1 Room',
  });

  // Tour Package Draft State (Multiple Destinations)
  const [tourDestinations, setTourDestinations] = useState([
    { id: 'dest_1', country: 'United Arab Emirates', countryCode: 'AE', city: 'Dubai' },
  ]);
  const [tourDetails, setTourDetails] = useState({
    packageName: '',
    duration: '5 Days / 4 Nights',
    travelers: 2,
    tier: 'Standard',
  });

  // ── Section 3: Client Type & Pricing ───────────────────────────
  const [clientType, setClientType] = useState('b2c'); // 'b2b' | 'b2c'
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [manualPrice, setManualPrice] = useState('');

  // ── Section 4: Vendor Information (Multiple Vendors) ───────────
  const [vendorList, setVendorList] = useState([
    {
      id: 'v_row_1',
      vendorId: 'vnd_1',
      vendorName: 'Flight Expert',
      cost: 6500,
      reference: '',
      notes: '',
    },
  ]);

  // ── Section 5: Financial Summary Inputs ─────────────────────────
  const [discountAmount, setDiscountAmount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentStatusOverride, setPaymentStatusOverride] = useState('');

  // ── Load Initial Master Data ───────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [cRes, vTypesRes, pRes, custRes, vendRes] = await Promise.allSettled([
          visaApi.listCountries(),
          visaApi.listVisaTypes(),
          b2bApi.listPartners(),
          b2cApi.list(),
          vendorApi.getVendors(),
        ]);

        if (isMounted) {
          if (cRes.status === 'fulfilled' && cRes.value?.items) {
            setCountries(cRes.value.items);
          }
          if (vTypesRes.status === 'fulfilled' && vTypesRes.value?.items) {
            setVisaTypes(vTypesRes.value.items);
          }
          if (pRes.status === 'fulfilled') {
            const list = pRes.value?.items || (Array.isArray(pRes.value) ? pRes.value : []);
            setPartners(list);
            if (list.length > 0 && !selectedPartnerId) {
              setSelectedPartnerId(list[0].id);
            }
          }
          if (custRes.status === 'fulfilled') {
            const list = custRes.value?.items || (Array.isArray(custRes.value) ? custRes.value : []);
            setCustomers(list);
          }
          if (vendRes.status === 'fulfilled' && vendRes.value?.success) {
            setVendors(vendRes.value.data || []);
          }
        }
      } catch (err) {
        console.warn('Could not load some application master data:', err);
      }
    }

    if (open) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [open]);

  // ── Dynamic Visa Types on Country Change ────────────────────────
  useEffect(() => {
    if (!visaDetails.countryId) return;
    let isMounted = true;
    visaApi.listVisaTypes({ countryId: visaDetails.countryId }).then((res) => {
      if (isMounted && res.items?.length > 0) {
        setVisaTypes(res.items);
        const match = res.items.find((vt) => vt.name === visaDetails.visaType) || res.items[0];
        setVisaDetails((prev) => ({
          ...prev,
          visaType: match.name,
          visaTypeId: match.id,
        }));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [visaDetails.countryId]);

  // ── Dynamic Pricing Calculation ────────────────────────────────
  const activeVisaType = useMemo(() => {
    return (
      visaTypes.find((vt) => vt.id === visaDetails.visaTypeId || vt.name === visaDetails.visaType) ||
      visaTypes[0]
    );
  }, [visaTypes, visaDetails]);

  // Calculated standard rate based on service and client type
  const autoRetrievedPrice = useMemo(() => {
    if (activeService === 'visa') {
      if (clientType === 'b2b') {
        return activeVisaType?.b2bNetPrice || 10000;
      }
      return activeVisaType?.b2cPrice || 12000;
    }
    if (activeService === 'ticket') {
      return clientType === 'b2b' ? 42000 : 48000;
    }
    if (activeService === 'hotel') {
      return clientType === 'b2b' ? 18000 : 22000;
    }
    if (activeService === 'tour') {
      return clientType === 'b2b' ? 35000 : 42000;
    }
    return 10000;
  }, [activeService, clientType, activeVisaType]);

  // Set total amount from retrieved price or manual input
  const totalAmount = useMemo(() => {
    if (manualPrice !== '' && !isNaN(Number(manualPrice))) {
      return Number(manualPrice);
    }
    return autoRetrievedPrice;
  }, [manualPrice, autoRetrievedPrice]);

  // Total applicable vendor costs
  const totalVendorCost = useMemo(() => {
    return vendorList.reduce((sum, v) => sum + (Number(v.cost) || 0), 0);
  }, [vendorList]);

  // Financial figures
  const netAmount = Math.max(0, totalAmount - (Number(discountAmount) || 0));
  const dueAmount = Math.max(0, netAmount - (Number(advancePaid) || 0));
  const estimatedProfit = netAmount - totalVendorCost;

  // Derive status
  const derivedPaymentStatus = useMemo(() => {
    if (paymentStatusOverride) return paymentStatusOverride;
    if (advancePaid > 0 && dueAmount === 0) return 'Paid';
    if (advancePaid > 0 && dueAmount > 0) return 'Partial';
    return 'Unpaid';
  }, [paymentStatusOverride, advancePaid, dueAmount]);

  // ── Client Quick Select Handler ─────────────────────────────────
  const handleSelectExistingClient = (e) => {
    const custId = e.target.value;
    if (!custId) return;
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setClientInfo((prev) => ({
        ...prev,
        fullName: found.name || prev.fullName,
        phone: found.phone || prev.phone,
        email: found.email || prev.email,
      }));
    }
  };

  // ── Multi-Destination Tour Handlers ────────────────────────────
  const handleAddDestination = () => {
    setTourDestinations((prev) => [
      ...prev,
      {
        id: `dest_${Date.now()}`,
        country: 'Malaysia',
        countryCode: 'MY',
        city: 'Kuala Lumpur',
      },
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
          return {
            ...dest,
            country: value.name,
            countryCode: value.code,
            city: '', // Reset city on country change
          };
        }
        return { ...dest, [field]: value };
      })
    );
  };

  // ── Multi-Vendor Handlers ──────────────────────────────────────
  const handleAddVendor = () => {
    const defaultVendor = vendors[0] || { id: `vnd_${Date.now()}`, name: 'Custom Vendor' };
    setVendorList((prev) => [
      ...prev,
      {
        id: `v_row_${Date.now()}`,
        vendorId: defaultVendor.id,
        vendorName: defaultVendor.name,
        cost: 0,
        reference: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveVendor = (id) => {
    if (vendorList.length <= 1) return;
    setVendorList((prev) => prev.filter((v) => v.id !== id));
  };

  const handleUpdateVendor = (id, field, value) => {
    setVendorList((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        if (field === 'vendorId') {
          const match = vendors.find((item) => item.id === value);
          return {
            ...v,
            vendorId: value,
            vendorName: match ? match.name : value,
          };
        }
        return { ...v, [field]: value };
      })
    );
  };

  // ── Form Validation ────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};

    if (!clientInfo.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!clientInfo.phone.trim()) {
      errors.phone = 'Phone Number is required';
    }
    if (activeService === 'visa' && !clientInfo.passportNumber.trim()) {
      errors.passportNumber = 'Passport number is required for visa applications';
    }

    if (activeService === 'visa') {
      if (!visaDetails.country) errors.visaCountry = 'Destination Country is required';
      if (!visaDetails.visaType) errors.visaType = 'Visa Type is required';
    } else if (activeService === 'ticket') {
      if (!ticketDetails.departureCity.trim()) errors.ticketFrom = 'Departure location is required';
      if (!ticketDetails.destinationCity.trim()) errors.ticketTo = 'Destination location is required';
      if (!ticketDetails.departureDate) errors.ticketDate = 'Departure date is required';
    } else if (activeService === 'hotel') {
      if (!hotelDetails.hotelName.trim()) errors.hotelName = 'Hotel Name is required';
      if (!hotelDetails.city.trim()) errors.hotelCity = 'City / Location is required';
    } else if (activeService === 'tour') {
      tourDestinations.forEach((dest, idx) => {
        if (!dest.country) errors[`tour_country_${idx}`] = 'Country is required';
      });
    }

    if (clientType === 'b2b' && !selectedPartnerId) {
      errors.partner = 'Please select a B2B Partner';
    }

    if (totalAmount <= 0) {
      errors.totalAmount = 'Total Amount must be greater than 0';
    }

    vendorList.forEach((v, idx) => {
      if (Number(v.cost) < 0) {
        errors[`vendor_cost_${idx}`] = 'Vendor cost cannot be negative';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Form Submit Handler ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

      // Construct unified, comprehensive payload
      const payload = {
        name: clientInfo.fullName.trim(),
        passportNumber: clientInfo.passportNumber.trim(),
        phone: clientInfo.phone.trim(),
        email: clientInfo.email.trim(),
        clientType,
        clientName: clientType === 'b2b' ? selectedPartner?.name || selectedPartner?.company || 'B2B Partner' : 'B2C Direct Client',
        serviceType: activeService,

        // Service payload
        country: activeService === 'visa' ? visaDetails.country : activeService === 'hotel' ? hotelDetails.country : 'Multiple',
        countryId: activeService === 'visa' ? visaDetails.countryId : undefined,
        visaType: activeService === 'visa' ? visaDetails.visaType : undefined,
        entries: activeService === 'visa' ? visaDetails.entries : undefined,
        visaDuration: activeService === 'visa' ? visaDetails.visaDuration : undefined,
        city: activeService === 'visa' ? visaDetails.city : activeService === 'hotel' ? hotelDetails.city : undefined,

        // Structured Service Details
        visaDetails: activeService === 'visa' ? { ...visaDetails } : null,
        ticketDetails: activeService === 'ticket' ? { ...ticketDetails } : null,
        hotelDetails: activeService === 'hotel' ? { ...hotelDetails } : null,
        tourDetails: activeService === 'tour' ? { ...tourDetails, destinations: tourDestinations } : null,

        // Vendors
        vendorList: vendorList.map((v) => ({
          vendorId: v.vendorId,
          name: v.vendorName,
          cost: Number(v.cost) || 0,
          reference: v.reference || '',
          notes: v.notes || '',
        })),
        vendorName: vendorList[0]?.vendorName || '',
        vendorReference: vendorList[0]?.reference || '',
        vendorCost: totalVendorCost,

        // Account & Pricing Summary
        totalAmount,
        discountAmount: Number(discountAmount) || 0,
        netAmount,
        costPrice: totalVendorCost,
        advancePaid: Number(advancePaid) || 0,
        dueAmount,
        profit: estimatedProfit,
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
      setSubmitError(err?.message || 'Failed to submit application. Please check your data and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-4xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* ── Modal Header (matching AddVisaChecklistModal style) ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs shrink-0">
              <FilePlus2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Add New Application
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Create a new visa / ticket / hotel / tour package application
              </p>
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

        {/* ── Modal Scrollable Body ── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          
          {submitError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SECTION 1: CLIENT INFORMATION
             ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                <User className="w-4 h-4 stroke-[2.5]" />
                <span>Client Information</span>
              </div>

              {customers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 hidden sm:inline">Existing Client:</span>
                  <select
                    onChange={handleSelectExistingClient}
                    defaultValue=""
                    className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="" disabled>Quick auto-fill...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientInfo.fullName}
                  onChange={(e) => {
                    setClientInfo({ ...clientInfo, fullName: e.target.value });
                    if (validationErrors.fullName) setValidationErrors((prev) => ({ ...prev, fullName: null }));
                  }}
                  placeholder="e.g. Mahfuzur Rahman"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                    validationErrors.fullName
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                />
                {validationErrors.fullName && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{validationErrors.fullName}</span>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Passport Number {activeService === 'visa' ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal text-xs">(Optional)</span>}
                </label>
                <input
                  type="text"
                  value={clientInfo.passportNumber}
                  onChange={(e) => {
                    setClientInfo({ ...clientInfo, passportNumber: e.target.value });
                    if (validationErrors.passportNumber) setValidationErrors((prev) => ({ ...prev, passportNumber: null }));
                  }}
                  placeholder="e.g. A01234567"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                    validationErrors.passportNumber
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                />
                {validationErrors.passportNumber && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{validationErrors.passportNumber}</span>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => {
                      setClientInfo({ ...clientInfo, phone: e.target.value });
                      if (validationErrors.phone) setValidationErrors((prev) => ({ ...prev, phone: null }));
                    }}
                    placeholder="e.g. +880 1711 000 000"
                    className={`w-full px-3.5 py-2.5 pl-9 text-sm bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                      validationErrors.phone
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                {validationErrors.phone && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{validationErrors.phone}</span>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    placeholder="e.g. client@example.com"
                    className="w-full px-3.5 py-2.5 pl-9 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 2: SERVICE DETAILS & SELECTOR
             ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                <Layers className="w-4 h-4 stroke-[2.5]" />
                <span>Service Details</span>
              </div>
            </div>

            {/* Service Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'visa', label: 'Visa', icon: FileText },
                { id: 'ticket', label: 'Ticket', icon: Plane },
                { id: 'hotel', label: 'Hotel', icon: Hotel },
                { id: 'tour', label: 'Tour Package', icon: Compass },
              ].map((srv) => {
                const Icon = srv.icon;
                const isActive = activeService === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setActiveService(srv.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0066FF] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{srv.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── Sub-Form: VISA DETAILS ── */}
            {activeService === 'visa' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Country <span className="text-rose-500">*</span>
                    </label>
                    <CountrySelect
                      value={visaDetails.country}
                      countryCode={visaDetails.countryCode}
                      onChange={(selected) => {
                        const matchedCountry = countries.find(
                          (c) => c.name.toLowerCase() === selected.name.toLowerCase() || c.code === selected.code
                        );
                        setVisaDetails({
                          ...visaDetails,
                          country: selected.name,
                          countryCode: selected.code,
                          countryId: matchedCountry?.id || 'vcn',
                          city: '', // Reset city
                        });
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      City <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <CityDatalistInput
                      country={visaDetails.country}
                      value={visaDetails.city}
                      onChange={(city) => setVisaDetails({ ...visaDetails, city })}
                      placeholder="e.g. Beijing, Shanghai, Dubai..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Visa Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={visaDetails.visaType}
                        onChange={(e) => {
                          const chosen = visaTypes.find((vt) => vt.name === e.target.value);
                          setVisaDetails({
                            ...visaDetails,
                            visaType: e.target.value,
                            visaTypeId: chosen?.id || visaDetails.visaTypeId,
                          });
                        }}
                        className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs pr-9 cursor-pointer"
                      >
                        {visaTypes.length > 0 ? (
                          visaTypes.map((vt) => (
                            <option key={vt.id} value={vt.name}>
                              {vt.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Tourist Visa">Tourist Visa</option>
                            <option value="Business Visa">Business Visa</option>
                            <option value="Student Visa">Student Visa</option>
                            <option value="Work Visa">Work Visa</option>
                            <option value="eVisa">eVisa</option>
                            <option value="Medical Visa">Medical Visa</option>
                          </>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Entry <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={visaDetails.entries}
                        onChange={(e) => setVisaDetails({ ...visaDetails, entries: e.target.value })}
                        className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs pr-9 cursor-pointer"
                      >
                        {DEFAULT_ENTRY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Visa Duration <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="visa-duration-list"
                        value={visaDetails.visaDuration}
                        onChange={(e) => setVisaDetails({ ...visaDetails, visaDuration: e.target.value })}
                        placeholder="e.g. 30 Days"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                      />
                      <datalist id="visa-duration-list">
                        {DEFAULT_VISA_DURATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Sub-Form: TICKET DETAILS ── */}
            {activeService === 'ticket' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Trip Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white">
                      {['One Way', 'Round Trip'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setTicketDetails({ ...ticketDetails, tripType: type })}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                            ticketDetails.tripType === type
                              ? 'bg-[#0066FF] text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Travel Class <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={ticketDetails.ticketClass}
                        onChange={(e) => setTicketDetails({ ...ticketDetails, ticketClass: e.target.value })}
                        className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs pr-9 cursor-pointer"
                      >
                        {TICKET_CLASSES.map((cls) => (
                          <option key={cls} value={cls}>
                            {cls}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      From (Origin) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ticketDetails.departureCity}
                      onChange={(e) => setTicketDetails({ ...ticketDetails, departureCity: e.target.value })}
                      placeholder="e.g. Dhaka (DAC)"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      To (Destination) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ticketDetails.destinationCity}
                      onChange={(e) => setTicketDetails({ ...ticketDetails, destinationCity: e.target.value })}
                      placeholder="e.g. Dubai (DXB)"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Departure Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={ticketDetails.departureDate}
                      onChange={(e) => setTicketDetails({ ...ticketDetails, departureDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>

                  {ticketDetails.tripType === 'Round Trip' && (
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Return Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={ticketDetails.returnDate}
                        onChange={(e) => setTicketDetails({ ...ticketDetails, returnDate: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Preferred Airline
                    </label>
                    <input
                      type="text"
                      value={ticketDetails.airline}
                      onChange={(e) => setTicketDetails({ ...ticketDetails, airline: e.target.value })}
                      placeholder="e.g. Emirates, Biman, Qatar"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Sub-Form: HOTEL DETAILS ── */}
            {activeService === 'hotel' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Hotel Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={hotelDetails.hotelName}
                      onChange={(e) => setHotelDetails({ ...hotelDetails, hotelName: e.target.value })}
                      placeholder="e.g. Grand Hyatt Dubai"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Country <span className="text-rose-500">*</span>
                    </label>
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
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      City / Location <span className="text-rose-500">*</span>
                    </label>
                    <CityDatalistInput
                      country={hotelDetails.country}
                      value={hotelDetails.city}
                      onChange={(city) => setHotelDetails({ ...hotelDetails, city })}
                      placeholder="e.g. Dubai Marina"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Room Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={hotelDetails.roomType}
                        onChange={(e) => setHotelDetails({ ...hotelDetails, roomType: e.target.value })}
                        className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs pr-9 cursor-pointer"
                      >
                        {HOTEL_ROOM_TYPES.map((rt) => (
                          <option key={rt} value={rt}>
                            {rt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Stay Duration <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={hotelDetails.hotelStay}
                      onChange={(e) => setHotelDetails({ ...hotelDetails, hotelStay: e.target.value })}
                      placeholder="e.g. 3 Nights"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      value={hotelDetails.checkInDate}
                      onChange={(e) => setHotelDetails({ ...hotelDetails, checkInDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      value={hotelDetails.checkOutDate}
                      onChange={(e) => setHotelDetails({ ...hotelDetails, checkOutDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Guests & Rooms
                    </label>
                    <input
                      type="text"
                      value={hotelDetails.guests}
                      onChange={(e) => setHotelDetails({ ...hotelDetails, guests: e.target.value })}
                      placeholder="e.g. 2 Adults, 1 Room"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Sub-Form: TOUR PACKAGE DETAILS (Multi-Destinations) ── */}
            {activeService === 'tour' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Package Name / Reference
                    </label>
                    <input
                      type="text"
                      value={tourDetails.packageName}
                      onChange={(e) => setTourDetails({ ...tourDetails, packageName: e.target.value })}
                      placeholder="e.g. Custom Multi-City Tour (Dubai + Bali)"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Duration <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tourDetails.duration}
                      onChange={(e) => setTourDetails({ ...tourDetails, duration: e.target.value })}
                      placeholder="e.g. 7 Days / 6 Nights"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Multiple Destinations List */}
                <div className="space-y-3 pt-1">
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

          {/* ══════════════════════════════════════════════════════════════
              SECTION 3: CLIENT TYPE & PRICING
             ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                <Tag className="w-4 h-4 stroke-[2.5]" />
                <span>Client Type & Pricing</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Client Type <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setClientType('b2c');
                      setManualPrice('');
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      clientType === 'b2c'
                        ? 'bg-[#0066FF] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    B2C (Direct Retail)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClientType('b2b');
                      setManualPrice('');
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      clientType === 'b2b'
                        ? 'bg-[#0066FF] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    B2B (Agency Partner)
                  </button>
                </div>
              </div>

              {clientType === 'b2b' && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    B2B Partner Agency <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => setSelectedPartnerId(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs pr-9 cursor-pointer"
                    >
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.company ? `(${p.company})` : ''} - Tier: {p.tier || 'standard'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Pricing info badge & manual override */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Applicable System Rate:</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {formatCurrency(autoRetrievedPrice, 'BDT')} ({clientType.toUpperCase()})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 shrink-0">Custom Base Price:</label>
                <input
                  type="number"
                  min="0"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder={String(autoRetrievedPrice)}
                  className="w-28 px-2.5 py-1 text-xs border border-slate-200 rounded-md font-semibold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 4: VENDOR INFORMATION (Multiple Vendors)
             ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                <Building2 className="w-4 h-4 stroke-[2.5]" />
                <span>Vendor Information ({vendorList.length})</span>
              </div>

              <button
                type="button"
                onClick={handleAddVendor}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066FF] hover:text-[#0055D6] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Vendor</span>
              </button>
            </div>

            <div className="space-y-3">
              {vendorList.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs items-center"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Vendor Name <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={item.vendorId}
                      onChange={(e) => handleUpdateVendor(item.id, 'vendorId', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.vendorCode || 'VND'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Vendor Cost (BDT) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.cost}
                      onChange={(e) => handleUpdateVendor(item.id, 'cost', Number(e.target.value) || 0)}
                      placeholder="6500"
                      className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 font-semibold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Vendor Token / Ref
                    </label>
                    <input
                      type="text"
                      value={item.reference}
                      onChange={(e) => handleUpdateVendor(item.id, 'reference', e.target.value)}
                      placeholder="e.g. VFS-REF-90210"
                      className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
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
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 px-2 pt-1">
              <span>Total Vendor Cost (Cost Price):</span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(totalVendorCost, 'BDT')}</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 5: FINANCIAL & ACCOUNT SUMMARY
             ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                <CreditCard className="w-4 h-4 stroke-[2.5]" />
                <span>Financial & Account Summary</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Account Inputs */}
              <div className="lg:col-span-7 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total Amount (BDT) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={totalAmount}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discount Amount (BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Advance / Paid Amount (BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <div className="relative">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8 cursor-pointer"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Financial Summary Card */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Financial Summary
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Status: {derivedPaymentStatus}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Gross Amount:</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totalAmount, 'BDT')}</span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Discount:</span>
                    <span className="font-medium text-rose-600">- {formatCurrency(discountAmount, 'BDT')}</span>
                  </div>

                  <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-50">
                    <span>Net Amount:</span>
                    <span>{formatCurrency(netAmount, 'BDT')}</span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Cost Price (Vendors):</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totalVendorCost, 'BDT')}</span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Amount Paid:</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(advancePaid, 'BDT')}</span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-100">
                    <span>Balance / Due:</span>
                    <span className={dueAmount > 0 ? 'text-amber-600' : 'text-slate-800'}>
                      {formatCurrency(dueAmount, 'BDT')}
                    </span>
                  </div>

                  {/* Estimated Profit Pill */}
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Estimated Profit:</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                        estimatedProfit > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : estimatedProfit < 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {estimatedProfit > 0 ? `+${formatCurrency(estimatedProfit, 'BDT')}` : formatCurrency(estimatedProfit, 'BDT')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Modal Sticky Footer (matching AddVisaChecklistModal style) ── */}
          <div className="shrink-0 flex items-center justify-between pt-4 border-t border-slate-100">
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

// ── Reusable City Datalist Input ──────────────────────────────────
function CityDatalistInput({ country, value, onChange, placeholder = 'Select or type city...' }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!country) {
      setCities([]);
      return;
    }
    setLoading(true);
    fetchCities(country).then((list) => {
      if (active) {
        setCities(list);
        setLoading(false);
      }
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
        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
      />
      <datalist id={listId}>
        {cities.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </div>
  );
}

export default NewApplicationModal;
