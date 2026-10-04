import Button from '../../../components/common/Button'

export default function ReportExport({ onExport }) {
  return (
    <div className="row">
      <Button variant="ghost" size="sm" onClick={() => onExport?.('csv')}>
        Export CSV
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onExport?.('excel')} disabled>
        Export Excel
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onExport?.('pdf')} disabled>
        Export PDF
      </Button>
    </div>
  )
}
