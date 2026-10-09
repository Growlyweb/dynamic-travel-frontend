import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Eye, PlusCircle, Download } from 'lucide-react'
import DueBadge from './DueBadge'
import { formatNumber } from '@/utils/formatters'
import { exportToCsv } from '../vendor.api'

export default function DueByVendorTable({
  data = [],
  onAddPayment,
  loading = false,
}) {
  const handleExport = () => {
    const headers = [
      { label: 'SL', key: 'sl' },
      { label: 'Vendor Code', key: 'vendorCode' },
      { label: 'Vendor Name', key: 'vendor' },
      { label: 'Services', key: (r) => (r.services || []).join(', ') },
      { label: 'Opening Balance', key: 'opening' },
      { label: 'Total Billed', key: 'billed' },
      { label: 'Total Paid', key: 'paid' },
      { label: 'Total Due', key: 'due' },
    ]
    exportToCsv('Vendor_Due_Summary', headers, data)
  }

  // Totals calculation
  const totalOpening = data.reduce((sum, r) => sum + (Number(r.opening) || 0), 0)
  const totalBilled = data.reduce((sum, r) => sum + (Number(r.billed) || 0), 0)
  const totalPaid = data.reduce((sum, r) => sum + (Number(r.paid) || 0), 0)
  const totalDue = data.reduce((sum, r) => sum + (Number(r.due) || 0), 0)

  return (
    <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-border/80 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base text-foreground">Due by Vendor</h3>
          {/* <p className="text-xs text-muted-foreground mt-0.5">
            Overview of outstanding dues per vendor (Sorted highest due first)
          </p> */}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="text-xs gap-1.5 h-8"
        >
          <Download className="size-3.5 text-muted-foreground" /> Export Excel
        </Button>
      </div>

      <div className="relative w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12 text-center">SL</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Services</TableHead>
              <TableHead className="text-right">Opening (BDT)</TableHead>
              <TableHead className="text-right">Billed (BDT)</TableHead>
              <TableHead className="text-right">Paid (BDT)</TableHead>
              <TableHead className="text-right">Total Due (BDT)</TableHead>
              <TableHead className="text-right pr-4">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Loading vendors...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No vendor records found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.vendorId} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-center font-medium text-muted-foreground text-xs">
                    {row.sl}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/vendors/${row.vendorId}`}
                      className="font-medium text-foreground hover:text-primary transition-colors hover:underline block"
                    >
                      {row.vendor}
                    </Link>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {row.vendorCode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(row.services || []).map((srv) => (
                        <span
                          key={srv}
                          className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-muted-foreground text-xs">
                    {row.opening !== 0 ? `৳${formatNumber(row.opening)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground text-xs">
                    ৳{formatNumber(row.billed)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                    ৳{formatNumber(row.paid)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DueBadge amount={row.due} />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/vendors/${row.vendorId}`}>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                        >
                          <Eye className="size-3.5 mr-1" /> View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onAddPayment?.(row.vendorId)}
                        className="h-7 px-2 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        <PlusCircle className="size-3.5 mr-1" /> Pay
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {data.length > 0 && (
            <TableFooter className="bg-muted/60 font-semibold border-t-2 border-border">
              <TableRow>
                <TableCell colSpan={3} className="pl-4 text-xs font-bold uppercase tracking-wider text-foreground">
                  Total ({data.length} Vendors)
                </TableCell>
                <TableCell className="text-right text-xs font-bold text-foreground">
                  ৳{formatNumber(totalOpening)}
                </TableCell>
                <TableCell className="text-right text-xs font-bold text-foreground">
                  ৳{formatNumber(totalBilled)}
                </TableCell>
                <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ৳{formatNumber(totalPaid)}
                </TableCell>
                <TableCell className="text-right text-xs font-bold">
                  <DueBadge amount={totalDue} />
                </TableCell>
                <TableCell className="pr-4"></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  )
}
