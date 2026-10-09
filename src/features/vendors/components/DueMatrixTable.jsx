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
import { Download } from 'lucide-react'
import DueBadge from './DueBadge'
import { formatNumber } from '@/utils/formatters'
import { exportToCsv } from '../vendor.api'

export default function DueMatrixTable({
  matrix = { segments: [], rows: [], columnTotals: {}, grandTotal: 0 },
  loading = false,
}) {
  const { segments = [], rows = [], columnTotals = {}, grandTotal = 0 } = matrix

  const handleExport = () => {
    const headers = [
      { label: 'Vendor Code', key: 'vendorCode' },
      { label: 'Vendor', key: 'vendor' },
      ...segments.map((s) => ({
        label: s.name,
        key: (r) => {
          const val = r.dues?.[s.id]
          return val ? val : 0
        },
      })),
      { label: 'Total Due (BDT)', key: 'totalDue' },
    ]
    exportToCsv('Vendor_Segment_Matrix', headers, rows)
  }

  return (
    <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-border/80 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base text-foreground">Vendor × Segment Matrix</h3>
          {/* <p className="text-xs text-muted-foreground mt-0.5">
            Cross-tabulation showing exact outstanding dues for every vendor and segment pair
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
              <TableHead className="font-semibold text-foreground min-w-[180px]">
                Vendor
              </TableHead>
              {segments.map((seg) => (
                <TableHead key={seg.id} className="text-right min-w-[120px] font-semibold text-foreground">
                  {seg.name}
                </TableHead>
              ))}
              <TableHead className="text-right pr-4 min-w-[140px] font-bold text-foreground bg-muted/20">
                Total Due (BDT)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={segments.length + 2}
                  className="h-32 text-center text-muted-foreground"
                >
                  Calculating matrix...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={segments.length + 2}
                  className="h-32 text-center text-muted-foreground"
                >
                  No matrix data found matching current filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.vendorId} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <Link
                      to={`/vendors/${row.vendorId}`}
                      className="text-foreground hover:text-primary transition-colors hover:underline block"
                    >
                      {row.vendor}
                    </Link>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {row.vendorCode}
                    </span>
                  </TableCell>
                  {segments.map((seg) => {
                    const dueVal = row.dues?.[seg.id] || 0
                    return (
                      <TableCell key={seg.id} className="text-right font-medium text-xs">
                        {dueVal > 0 ? (
                          <span className="font-semibold text-rose-600">
                            {formatNumber(dueVal)}
                          </span>
                        ) : dueVal < 0 ? (
                          <span className="font-semibold text-blue-600">
                            {formatNumber(Math.abs(dueVal))} (Adv)
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right pr-4 font-bold bg-muted/10">
                    <DueBadge amount={row.totalDue} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter className="bg-muted/60 font-semibold border-t-2 border-border">
              <TableRow>
                <TableCell className="pl-4 text-xs font-bold uppercase tracking-wider text-foreground">
                  Total
                </TableCell>
                {segments.map((seg) => {
                  const colTotal = columnTotals[seg.id] || 0
                  return (
                    <TableCell key={seg.id} className="text-right text-xs font-bold">
                      {colTotal > 0 ? (
                        <span className="text-rose-600">৳{formatNumber(colTotal)}</span>
                      ) : colTotal < 0 ? (
                        <span className="text-blue-600">৳{formatNumber(Math.abs(colTotal))}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  )
                })}
                <TableCell className="text-right pr-4 text-xs font-bold bg-muted/30">
                  <DueBadge amount={grandTotal} />
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  )
}
