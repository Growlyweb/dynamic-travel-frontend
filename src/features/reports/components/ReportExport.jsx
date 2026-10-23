import { FileText, FileSpreadsheet, Download } from 'lucide-react'
import Button from '../../../components/common/Button'

export default function ReportExport({ onExport }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium mr-1">Export Report:</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onExport?.('pdf')}
        className="text-xs h-8 gap-1.5 hover:text-primary"
      >
        <FileText className="size-3.5 text-rose-500" />
        Print / PDF
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onExport?.('excel')}
        className="text-xs h-8 gap-1.5 hover:text-primary"
      >
        <FileSpreadsheet className="size-3.5 text-emerald-600" />
        Excel Sheet (.xls)
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onExport?.('csv')}
        className="text-xs h-8 gap-1.5 hover:text-primary"
      >
        <Download className="size-3.5 text-blue-500" />
        CSV Data (.csv)
      </Button>
    </div>
  )
}
