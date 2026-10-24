import { Download, FileSpreadsheet, Printer } from 'lucide-react'

const base =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'

export default function ExportButtons({ onCsv, onExcel, onPrint, csvLabel = 'CSV', excelLabel = 'Excel', disabled = false }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {onCsv ? (
        <button type="button" onClick={onCsv} disabled={disabled} className={base} title="Download CSV">
          <Download className="size-3.5 text-primary" />
          {csvLabel}
        </button>
      ) : null}
      {onExcel ? (
        <button type="button" onClick={onExcel} disabled={disabled} className={base} title="Download Excel">
          <FileSpreadsheet className="size-3.5 text-emerald-600" />
          {excelLabel}
        </button>
      ) : null}
      {onPrint ? (
        <button type="button" onClick={onPrint} disabled={disabled} className={base} title="Print / save as PDF">
          <Printer className="size-3.5 text-slate-600" />
          Print
        </button>
      ) : null}
    </div>
  )
}
