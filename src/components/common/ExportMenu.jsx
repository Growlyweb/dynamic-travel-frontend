import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Download, ChevronDown, FileText, Sheet, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/utils/helpers'

/**
 * Reusable Export Menu supporting PDF, Excel (.xls), and CSV
 */
export default function ExportMenu({
  onExportPdf,
  onExportExcel,
  onExportCsv,
  label = 'Export',
  size = 'sm',
  variant = 'outline',
  className,
  disabled = false,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={disabled}
          className={cn('text-xs gap-1.5 h-8 bg-white border-border hover:bg-muted font-medium', className)}
        >
          <Download className="size-3.5 text-muted-foreground" />
          <span>{label}</span>
          <ChevronDown className="size-3 text-muted-foreground opacity-70 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1">
        {onExportPdf && (
          <DropdownMenuItem
            onClick={onExportPdf}
            className="flex items-center gap-2.5 py-2 text-xs cursor-pointer hover:bg-accent rounded-lg"
          >
            <FileText className="size-4 text-rose-600" />
            <div>
              <div className="font-semibold text-foreground">Print / PDF Document</div>
              <div className="text-[10px] text-muted-foreground">Official formatted PDF</div>
            </div>
          </DropdownMenuItem>
        )}

        {onExportExcel && (
          <DropdownMenuItem
            onClick={onExportExcel}
            className="flex items-center gap-2.5 py-2 text-xs cursor-pointer hover:bg-accent rounded-lg"
          >
            <Sheet className="size-4 text-emerald-600" />
            <div>
              <div className="font-semibold text-foreground">Excel Sheet (.xls)</div>
              <div className="text-[10px] text-muted-foreground">Styled spreadsheet</div>
            </div>
          </DropdownMenuItem>
        )}

        {onExportCsv && (
          <DropdownMenuItem
            onClick={onExportCsv}
            className="flex items-center gap-2.5 py-2 text-xs cursor-pointer hover:bg-accent rounded-lg"
          >
            <FileSpreadsheet className="size-4 text-blue-600" />
            <div>
              <div className="font-semibold text-foreground">CSV Data (.csv)</div>
              <div className="text-[10px] text-muted-foreground">Raw tabular data</div>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
