import { useState } from "react";
import {
  Briefcase,
  Building2,
  CreditCard,
  Plus,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

const INITIAL_FORM_STATE = {
  // Basic Information
  name: "",
  passportNumber: "",
  phone: "",
  email: "",

  // Service
  clientName: "",
  countryId: "vcn",
  country: "China",
  visaType: "Tourist Visa",
  entries: "Single Entry",
  visaDuration: "30 Days",

  // Vendor Form
  vendorName: "",
  vendorReference: "",
  vendorCost: "",
  vendorNotes: "",

  // Account Form
  totalAmount: "",
  advancePaid: "",
  paymentMethod: "Bank Transfer",
  paymentStatus: "Partial",
};

export function AddApplicationPopover({
  countryOptions = [],
  onCreated,
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function handleChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  }

  function validate() {
    const newErrors = {};
    // Basic Information validation
    if (!formData.name.trim()) newErrors.name = "Applicant name is required";
    if (!formData.passportNumber.trim()) newErrors.passportNumber = "Passport number is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.email.trim()) newErrors.email = "Email address is required";

    // Service validation
    if (!formData.visaType.trim()) newErrors.visaType = "Visa type is required";

    // Vendor validation
    if (!formData.vendorName.trim()) newErrors.vendorName = "Vendor name is required";
    if (!formData.vendorReference.trim()) newErrors.vendorReference = "Vendor reference is required";
    if (!formData.vendorCost) newErrors.vendorCost = "Vendor cost is required";

    // Account validation
    if (!formData.totalAmount) newErrors.totalAmount = "Total amount is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const selectedCountry = countryOptions.find((c) => c.value === formData.countryId);
      const payload = {
        ...formData,
        country: selectedCountry?.label || formData.country || "General",
        vendorCost: Number(formData.vendorCost) || 0,
        totalAmount: Number(formData.totalAmount) || 0,
        advancePaid: Number(formData.advancePaid) || 0,
        dueAmount: Math.max(0, (Number(formData.totalAmount) || 0) - (Number(formData.advancePaid) || 0)),
      };

      await onCreated?.(payload);
      setFormData(INITIAL_FORM_STATE);
      setOpen(false);
    } catch (err) {
      console.error("Failed to add visa application:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setOpen(false);
  }

  const calculatedDue = Math.max(
    0,
    (Number(formData.totalAmount) || 0) - (Number(formData.advancePaid) || 0)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 gap-1.5 px-3.5 font-medium shadow-sm shrink-0 cursor-pointer">
          <Plus className="size-4" />
          <span>Add application</span>
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="!max-w-4xl !w-[96vw] max-h-[92vh] overflow-hidden p-0 rounded-2xl border shadow-2xl bg-card text-card-foreground flex flex-col gap-0"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[92vh]">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Add Visa Application
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Register new application with service, vendor, and account details
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleCancel}
              className="rounded-full cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Form Body - Scrollable */}
          <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
            {/* Section 1: Basic Information */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <User className="size-4" />
                <span>Basic Information</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Mahfuzur Rahman"
                    className="h-9 text-xs rounded-lg"
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && (
                    <span className="text-[11px] text-destructive">{errors.name}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="passportNumber" className="text-xs font-medium text-foreground">
                    Passport Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="passportNumber"
                    value={formData.passportNumber}
                    onChange={(e) => handleChange("passportNumber", e.target.value)}
                    placeholder="e.g. A01234567"
                    className="h-9 text-xs rounded-lg"
                    aria-invalid={Boolean(errors.passportNumber)}
                  />
                  {errors.passportNumber && (
                    <span className="text-[11px] text-destructive">{errors.passportNumber}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="e.g. +880 1711 000 000"
                    className="h-9 text-xs rounded-lg"
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && (
                    <span className="text-[11px] text-destructive">{errors.phone}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="e.g. mahfuz@example.com"
                    className="h-9 text-xs rounded-lg"
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && (
                    <span className="text-[11px] text-destructive">{errors.email}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Service */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Briefcase className="size-4" />
                <span>Service Details</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="clientName" className="text-xs font-medium text-foreground">
                    Client Name / Partner
                  </Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleChange("clientName", e.target.value)}
                    placeholder="e.g. Direct B2C or Partner Agency"
                    className="h-9 text-xs rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="countryId" className="text-xs font-medium text-foreground">
                    Destination Country
                  </Label>
                  <select
                    id="countryId"
                    value={formData.countryId}
                    onChange={(e) => handleChange("countryId", e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring text-foreground"
                  >
                    {countryOptions.length > 0 ? (
                      countryOptions.map((country) => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="vcn">China</option>
                        <option value="vae">United Arab Emirates</option>
                        <option value="vmy">Malaysia</option>
                        <option value="vfr">Schengen (France)</option>
                        <option value="vsg">Singapore</option>
                        <option value="vth">Thailand</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="visaType" className="text-xs font-medium text-foreground">
                    Visa Type <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="visaType"
                    value={formData.visaType}
                    onChange={(e) => handleChange("visaType", e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring text-foreground"
                  >
                    <option value="Tourist Visa">Tourist Visa</option>
                    <option value="Business Visa">Business Visa</option>
                    <option value="Student Visa">Student Visa</option>
                    <option value="Work Visa">Work Visa</option>
                    <option value="eVisa">eVisa</option>
                    <option value="Medical Visa">Medical Visa</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="entries" className="text-xs font-medium text-foreground">
                    Entries
                  </Label>
                  <select
                    id="entries"
                    value={formData.entries}
                    onChange={(e) => handleChange("entries", e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring text-foreground"
                  >
                    <option value="Single Entry">Single Entry</option>
                    <option value="Double Entry">Double Entry</option>
                    <option value="Multiple Entry">Multiple Entry</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
                  <Label htmlFor="visaDuration" className="text-xs font-medium text-foreground">
                    Visa Duration
                  </Label>
                  <Input
                    id="visaDuration"
                    value={formData.visaDuration}
                    onChange={(e) => handleChange("visaDuration", e.target.value)}
                    placeholder="e.g. 30 Days, 60 Days, 6 Months"
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Vendor Form */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Building2 className="size-4" />
                <span>Vendor Form</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="vendorName" className="text-xs font-medium text-foreground">
                    Vendor Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="vendorName"
                    value={formData.vendorName}
                    onChange={(e) => handleChange("vendorName", e.target.value)}
                    placeholder="e.g. VFS Global / Gulf Consular"
                    className="h-9 text-xs rounded-lg"
                    aria-invalid={Boolean(errors.vendorName)}
                  />
                  {errors.vendorName && (
                    <span className="text-[11px] text-destructive">{errors.vendorName}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="vendorReference" className="text-xs font-medium text-foreground">
                    Vendor Reference / Token <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="vendorReference"
                    value={formData.vendorReference}
                    onChange={(e) => handleChange("vendorReference", e.target.value)}
                    placeholder="e.g. VFS-REF-90210"
                    className="h-9 text-xs rounded-lg"
                    aria-invalid={Boolean(errors.vendorReference)}
                  />
                  {errors.vendorReference && (
                    <span className="text-[11px] text-destructive">{errors.vendorReference}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="vendorCost" className="text-xs font-medium text-foreground">
                    Vendor Cost (BDT) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="vendorCost"
                    type="number"
                    min="0"
                    value={formData.vendorCost}
                    onChange={(e) => handleChange("vendorCost", e.target.value)}
                    placeholder="e.g. 6500"
                    className="h-9 text-xs rounded-lg"
                    aria-invalid={Boolean(errors.vendorCost)}
                  />
                  {errors.vendorCost && (
                    <span className="text-[11px] text-destructive">{errors.vendorCost}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="vendorNotes" className="text-xs font-medium text-foreground">
                    Vendor Notes
                  </Label>
                  <Input
                    id="vendorNotes"
                    value={formData.vendorNotes}
                    onChange={(e) => handleChange("vendorNotes", e.target.value)}
                    placeholder="Processing turnaround or special remarks"
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Account Form */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <CreditCard className="size-4" />
                <span>Account & Payment Form</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="totalAmount" className="text-xs font-medium text-foreground">
                    Total Amount (BDT) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) => handleChange("totalAmount", e.target.value)}
                    placeholder="e.g. 12000"
                    className="h-9 text-xs rounded-lg"
                    aria-invalid={Boolean(errors.totalAmount)}
                  />
                  {errors.totalAmount && (
                    <span className="text-[11px] text-destructive">{errors.totalAmount}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="advancePaid" className="text-xs font-medium text-foreground">
                    Advance Paid (BDT)
                  </Label>
                  <Input
                    id="advancePaid"
                    type="number"
                    min="0"
                    value={formData.advancePaid}
                    onChange={(e) => handleChange("advancePaid", e.target.value)}
                    placeholder="e.g. 5000"
                    className="h-9 text-xs rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="paymentMethod" className="text-xs font-medium text-foreground">
                    Payment Method
                  </Label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => handleChange("paymentMethod", e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring text-foreground"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="bKash / Nagad">bKash / Nagad</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="paymentStatus" className="text-xs font-medium text-foreground">
                    Payment Status
                  </Label>
                  <select
                    id="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={(e) => handleChange("paymentStatus", e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring text-foreground"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-background p-3 border border-border sm:col-span-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    Calculated Balance / Due:
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {calculatedDue.toLocaleString()} BDT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-border bg-card px-6 py-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="cursor-pointer"
            >
              {submitting ? "Adding…" : "Add application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddApplicationPopover;
