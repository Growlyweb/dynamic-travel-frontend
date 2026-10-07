import React, { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, CheckCircle2, ShieldCheck, QrCode, FileText, Phone, Mail, Building2 } from 'lucide-react'
import { formatDateTime, formatDate } from '@/utils/formatters'

export default function AcknowledgementSlipModal({ slip, open, onOpenChange }) {
  const printRef = useRef(null)

  if (!slip) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl bg-white dark:bg-card text-foreground border border-border/80 shadow-2xl">
        {/* Modal Actions Bar (hidden when printing) */}
        <div className="print:hidden flex items-center justify-between p-4 px-6 border-b border-border/70 bg-muted/40">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <h3 className="font-semibold text-sm md:text-base">Document Acknowledgement Slip</h3>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
              {slip.slipNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1.5 shadow-xs cursor-pointer">
              <Printer className="size-4" />
              <span>Print Slip</span>
            </Button>
          </div>
        </div>

        {/* Printable Invoice-style Slip Content */}
        <div ref={printRef} className="p-6 md:p-8 space-y-6 bg-white dark:bg-card text-card-foreground print:p-4 print:text-black">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b-2 border-primary/20">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-xs">
                  ABL
                </div>
                <div>
                  <h1 className="font-bold text-xl md:text-2xl tracking-tight text-foreground">
                    ABL TRAVEL LIMITED
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">
                    IATA Accredited · ATAB Member · Govt. License No: TR-88492
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                VIP Tower, Suite 402, Nayapaltan, Dhaka-1000, Bangladesh<br />
                Hotline: +880 9610-888999 · Email: operations@abltravel.com
              </p>
            </div>

            <div className="text-left md:text-right space-y-1 bg-muted/30 p-3 rounded-xl border border-border/60">
              <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-primary text-primary-foreground mb-1">
                OFFICIAL RECEIPT SLIP
              </div>
              <p className="text-xs font-mono font-bold text-foreground">SLIP NO: {slip.slipNumber}</p>
              <p className="text-xs text-muted-foreground">
                Date: {slip.receivedDate ? formatDateTime(slip.receivedDate) : formatDate(new Date())}
              </p>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center md:justify-end gap-1">
                <CheckCircle2 className="size-3.5" />
                <span>Verified & Recorded</span>
              </p>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border border-border/60 text-xs">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Received From (Vendor / Agency)
              </p>
              <p className="text-sm font-bold text-foreground">{slip.receivedFrom || 'Direct Client'}</p>
              {slip.contactPerson && (
                <p className="text-muted-foreground">Contact: <span className="font-medium text-foreground">{slip.contactPerson}</span></p>
              )}
              {slip.phone && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="size-3 text-primary" /> {slip.phone}
                </p>
              )}
            </div>

            <div className="space-y-1.5 md:border-l md:border-border/60 md:pl-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Service Segment & Intake Desk
              </p>
              <p className="text-sm font-bold text-primary">{slip.serviceType || 'Visa & Passport Processing'}</p>
              <p className="text-muted-foreground">
                Receiving Desk Officer: <span className="font-medium text-foreground">{slip.receivingOfficer || 'Kamrul Hasan (Desk #2)'}</span>
              </p>
              <p className="text-muted-foreground">
                Status: <span className="font-semibold text-emerald-600">{slip.status || 'Active in Custody'}</span>
              </p>
            </div>
          </div>

          {/* Passenger & Passport Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                Itemized Passenger & Passport Records
              </h4>
              <span className="text-xs text-muted-foreground">
                Total Documents: {slip.passengers?.length || 1}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-foreground font-semibold border-b border-border/70">
                  <tr>
                    <th className="p-2.5 pl-3">#</th>
                    <th className="p-2.5">Passenger Name</th>
                    <th className="p-2.5">Passport Number</th>
                    <th className="p-2.5">Relation / Role</th>
                    <th className="p-2.5">Physical Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(slip.passengers || [
                    { name: slip.contactPerson || 'Passenger 1', passportNumber: 'P-PENDING', relation: 'Self' },
                  ]).map((pax, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="p-2.5 pl-3 font-medium text-muted-foreground">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-foreground">{pax.name}</td>
                      <td className="p-2.5 font-mono font-semibold text-primary">{pax.passportNumber}</td>
                      <td className="p-2.5 text-muted-foreground">{pax.relation || 'Self'}</td>
                      <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-medium">Original Verified (Intact)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enclosed Documents Checklist */}
          {slip.documents && slip.documents.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                Enclosed Supporting Documents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {slip.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-semibold">{doc.docType}</span>
                      {doc.identifiers && <span className="text-muted-foreground"> ({doc.identifiers})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remarks & Notes */}
          {slip.remarks && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-300">Remarks / Operational Note: </span>
              <span className="text-amber-800 dark:text-amber-400">{slip.remarks}</span>
            </div>
          )}

          {/* Terms & Safekeeping Notice */}
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/50 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldCheck className="size-4 text-primary" />
              <span>Custody & Safekeeping Terms</span>
            </div>
            <p>
              1. All original passports and certificates received are stored in ABL Travel's biometric fire-rated vaults.
            </p>
            <p>
              2. This original acknowledgement slip must be presented during passport collection/return.
            </p>
            <p>
              3. Visa processing turnaround times are subject to foreign embassies and consulate discretion.
            </p>
          </div>

          {/* Signatures & Seal Box */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-xs border-t border-border/60">
            <div className="space-y-12">
              <div className="h-8 border-b border-dashed border-muted-foreground/60"></div>
              <p className="text-center text-muted-foreground font-medium">
                Authorized Officer Signature & Seal<br />
                <span className="text-[11px] text-foreground font-bold">ABL Travel Operations Desk</span>
              </p>
            </div>

            <div className="space-y-12">
              <div className="h-8 border-b border-dashed border-muted-foreground/60"></div>
              <p className="text-center text-muted-foreground font-medium">
                Vendor / Submitter Handover Signature<br />
                <span className="text-[11px] text-foreground font-bold">{slip.receivedFrom}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden when printing) */}
        <DialogFooter className="print:hidden p-4 px-6 border-t border-border/70 bg-muted/30 flex justify-between sm:justify-between items-center w-full">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Digital Hash: {slip.id}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="size-4" />
              <span>Print Acknowledgement</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
