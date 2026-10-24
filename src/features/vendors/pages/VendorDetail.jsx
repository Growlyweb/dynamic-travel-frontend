import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Edit,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Layers,
  DollarSign,
  Plane,
  Hotel,
  Compass,
  FileText,
} from 'lucide-react'

import { vendorApi } from '../vendor.api'
import { formatNumber } from '@/utils/formatters'

export default function VendorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [vendor, setVendor] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [vRes, sRes] = await Promise.all([
        vendorApi.getVendor(id),
        vendorApi.getServices(),
      ])

      if (vRes.success) setVendor(vRes.data)
      if (sRes.success) setServices(sRes.data)
    } catch (err) {
      console.error('Failed to load vendor details:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="py-24 text-center text-muted-foreground text-sm">
        Loading vendor details...
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Vendor not found.</p>
        <Link to="/vendors">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Vendor List
          </Button>
        </Link>
      </div>
    )
  }

  const mobileStr = vendor.mobile?.number || vendor.mobileNumber
  const visaPrices = vendor.pricing?.visa || []
  const airPrices = vendor.pricing?.['srv_air'] || []
  const hotelPrices = vendor.pricing?.['srv_hotel'] || []
  const customPrices = vendor.pricing?.custom || {}

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <PageHeader
        title={vendor.name || vendor.vendorName}
        description="Vendor profile, assigned services and service pricing rates."
        breadcrumbs={[
          { label: 'Vendors', to: '/vendors' },
          { label: vendor.name || vendor.vendorName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/vendors">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-9 bg-white shadow-2xs">
                <ArrowLeft className="size-3.5" /> Return to Vendor List
              </Button>
            </Link>
            <Link to={`/vendors/${vendor.id}/edit`}>
              <Button size="sm" className="bg-primary text-white hover:bg-primary-strong text-xs gap-1.5 h-9 font-semibold shadow-xs">
                <Edit className="size-3.5" /> Edit Vendor
              </Button>
            </Link>
          </div>
        }
      />

      {/* 1. Vendor Information Card */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Vendor Information</h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="size-3" /> Active Vendor
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Vendor Name</span>
            <span className="font-semibold text-slate-900 text-base">
              {vendor.name || vendor.vendorName}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Mobile Number</span>
            {mobileStr ? (
              <a
                href={`tel:${mobileStr}`}
                className="font-medium text-slate-800 hover:text-primary flex items-center gap-1.5"
              >
                <Phone className="size-3.5 text-slate-400" />
                <span>{vendor.mobile?.countryCode ? `${vendor.mobile.countryCode} ` : ''}{mobileStr}</span>
              </a>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Email Address</span>
            {vendor.email || vendor.emailAddress ? (
              <a
                href={`mailto:${vendor.email || vendor.emailAddress}`}
                className="font-medium text-slate-800 hover:text-primary flex items-center gap-1.5"
              >
                <Mail className="size-3.5 text-slate-400" />
                <span>{vendor.email || vendor.emailAddress}</span>
              </a>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Vendor Address</span>
            {vendor.address || vendor.vendorAddress ? (
              <span className="text-slate-700 flex items-start gap-1.5">
                <MapPin className="size-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{vendor.address || vendor.vendorAddress}</span>
              </span>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Services Card */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <Layers className="size-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Services Provided</h3>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(vendor.serviceNames || []).length > 0 ? (
            vendor.serviceNames.map((srv) => (
              <span
                key={srv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100"
              >
                <CheckCircle2 className="size-3 text-blue-600" />
                <span>{srv}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No services selected.</span>
          )}
        </div>
      </div>

      {/* 3. Vendor Pricing Breakdown */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <DollarSign className="size-4 text-emerald-600" />
          <h3 className="font-semibold text-sm text-foreground">Service Pricing</h3>
        </div>

        {/* Visa Service Pricing */}
        {visaPrices.length > 0 && (
          <div className="rounded-xl border border-blue-200/90 bg-blue-50/20 p-5 space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-blue-700">
              Visa Pricing Rates
            </h4>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-xs font-semibold text-slate-600">Country</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Visa Type</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">Vendor Price (BDT)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visaPrices.map((vp, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {vp.country}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {vp.visaType}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-emerald-700">
                        ৳{formatNumber(vp.vendorPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Air Ticket Pricing */}
        {airPrices.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
              <Plane className="size-3.5" /> Air Ticket Pricing Rates
            </h4>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-xs font-semibold text-slate-600">Route</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Airline</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Ticket Type</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">Vendor Price (BDT)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {airPrices.map((ap, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-xs text-slate-900">{ap.route || '—'}</TableCell>
                      <TableCell className="text-xs text-slate-700">{ap.airline || '—'}</TableCell>
                      <TableCell className="text-xs text-slate-700">{ap.ticketType || '—'}</TableCell>
                      <TableCell className="text-right font-bold text-xs text-emerald-700">
                        ৳{formatNumber(ap.vendorPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Hotel Booking Pricing */}
        {hotelPrices.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Hotel className="size-3.5" /> Hotel Booking Pricing Rates
            </h4>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-xs font-semibold text-slate-600">Destination</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Room Type</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">Vendor Price (BDT)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotelPrices.map((hp, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-xs text-slate-900">{hp.destination || '—'}</TableCell>
                      <TableCell className="text-xs text-slate-700">{hp.roomType || '—'}</TableCell>
                      <TableCell className="text-right font-bold text-xs text-emerald-700">
                        ৳{formatNumber(hp.vendorPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {visaPrices.length === 0 && airPrices.length === 0 && hotelPrices.length === 0 && (
          <p className="text-xs text-slate-400 italic py-2">
            No specific service pricing entered for this vendor. Click "Edit Vendor" to configure pricing.
          </p>
        )}
      </div>
    </div>
  )
}
