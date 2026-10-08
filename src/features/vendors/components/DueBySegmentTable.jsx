import { useNavigate } from 'react-router-dom'
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
import { ArrowUpRight, Download } from 'lucide-react'
import DueBadge from './DueBadge'
import { formatNumber } from '@/utils/formatters'
import { exportToCsv } from '../vendor.api'

export default function DueBySegmentTable({
  data = [],
  loading = false,
}) {
  const navigate = useNavigate()

  const handleExport = () => {
    const headers = [
      { label: 'SL', key: 'sl' },
      { label: 'Segment', key: 'segment' },
      { label: 'Vendors Count', key: 'vendorsCount' },
      { label: 'Total Billed', key: 'billed' },
      { label: 'Total Paid', key: 'paid' },
      { label: 'Total Due', key: 'due' },
    ]
    exportToCsv('Segment_Due_Summary', headers, data)
  }

  const handleSegmentClick = (segmentId) => {
    navigate(`/vendors?serviceId=${segmentId}`)
  }

  const totalBilled = data.reduce((sum, r) => sum + (Number(r.billed) || 0), 0)
  const totalPaid = data.reduce((sum, r) => sum + (Number(r.paid) || 0), 0)
  const totalDue = data.reduce((sum, r) => sum + (Number(r.due) || 0), 0)

  return (
    <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-border/80 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base text-foreground">Table B: Due by Segment</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any segment row to view vendors providing that service
          </p>
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
              <TableHead>Service / Segment</TableHead>
              <TableHead className="text-center">Vendors</TableHead>
              <TableHead className="text-right">Billed (BDT)</TableHead>
              <TableHead className="text-right">Paid (BDT)</TableHead>
              <TableHead className="text-right pr-4">Due (BDT)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Loading segment data...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No segment data found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.segmentId}
                  onClick={() => handleSegmentClick(row.segmentId)}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  title="Click to view vendors for this service"
                >
                  <TableCell className="text-center font-medium text-muted-foreground text-xs">
                    {row.sl}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium text-foreground group-hover:text-primary transition-colors">
                      <span>{row.segment}</span>
                      <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
                      {row.vendorsCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground text-xs">
                    ৳{formatNumber(row.billed)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                    ৳{formatNumber(row.paid)}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <DueBadge amount={row.due} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {data.length > 0 && (
            <TableFooter className="bg-muted/60 font-semibold border-t-2 border-border">
              <TableRow>
                <TableCell colSpan={3} className="pl-4 text-xs font-bold uppercase tracking-wider text-foreground">
                  Total ({data.length} Segments)
                </TableCell>
                <TableCell className="text-right text-xs font-bold text-foreground">
                  ৳{formatNumber(totalBilled)}
                </TableCell>
                <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ৳{formatNumber(totalPaid)}
                </TableCell>
                <TableCell className="text-right pr-4 text-xs font-bold">
                  <DueBadge amount={totalDue} />
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  )
}
