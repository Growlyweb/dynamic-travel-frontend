import { useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import LineChart from '../../../components/charts/LineChart'
import BarChart from '../../../components/charts/BarChart'
import DonutChart from '../../../components/charts/DonutChart'
import ReportFilters from '../components/ReportFilters'
import ReportExport from '../components/ReportExport'
import { toCsv, downloadBlob } from '../../../utils/helpers'
import { formatCurrency, formatNumber } from '../../../utils/formatters'
import { exportToExcel, printReportDocument } from '../../../utils/exportEngine'

// Replace with your reports API. Kept inline because this feature intentionally
// has no api.js in the project structure.
const MONTHLY_BOOKINGS = [
  { label: 'Jan', value: 42 }, { label: 'Feb', value: 58 }, { label: 'Mar', value: 71 },
  { label: 'Apr', value: 66 }, { label: 'May', value: 89 }, { label: 'Jun', value: 104 },
  { label: 'Jul', value: 132 }, { label: 'Aug', value: 148 }, { label: 'Sep', value: 121 },
]
const TOP_DESTINATIONS = [
  { label: 'Dubai', value: 214 }, { label: 'Bali', value: 186 }, { label: 'Paris', value: 142 },
  { label: 'Istanbul', value: 121 }, { label: 'Tokyo', value: 97 }, { label: 'Cape Town', value: 76 },
]
const REVENUE_BY_CHANNEL = [
  { label: 'Direct (B2C)', value: 48200 },
  { label: 'Partners (B2B)', value: 31600 },
  { label: 'Custom tours', value: 12400 },
]
const CHANNEL_TONES = ['#4f46e5', '#0ea5e9', '#16a34a']

export default function Reports() {
  const [range, setRange] = useState({ from: '2026-01-01', to: '2026-09-30', type: 'bookings' })

  function handleExport(format) {
    if (format === 'csv') {
      const csv = toCsv(MONTHLY_BOOKINGS, [
        { key: 'label', label: 'Month' },
        { key: 'value', label: 'Bookings' },
      ])
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `travel-report-${range.from}_${range.to}.csv`)
    } else if (format === 'excel') {
      const totalBookings = MONTHLY_BOOKINGS.reduce((acc, m) => acc + m.value, 0)
      const totalRevenue = REVENUE_BY_CHANNEL.reduce((acc, c) => acc + c.value, 0)
      exportToExcel(`Operational_Report_${range.from}_${range.to}`, {
        title: 'Executive Operational & Revenue Report',
        subtitle: `Period: ${range.from} to ${range.to} | Generated: ${new Date().toLocaleDateString('en-GB')}`,
        headers: ['Month', 'Monthly Bookings', 'Top Destinations', 'Visits', 'Revenue Channel', 'Revenue (USD)'],
        rows: MONTHLY_BOOKINGS.map((m, idx) => {
          const dest = TOP_DESTINATIONS[idx]
          const ch = REVENUE_BY_CHANNEL[idx]
          return [
            m.label,
            m.value,
            dest ? dest.label : '',
            dest ? dest.value : '',
            ch ? ch.label : '',
            ch ? ch.value : '',
          ]
        }),
        summaryTotals: [
          { label: 'Total Period Bookings', value: totalBookings },
          { label: 'Total Channel Revenue', value: `$${formatNumber(totalRevenue)}` },
        ],
        metadata: {
          'Report Range': `${range.from} to ${range.to}`,
          'Report Category': range.type,
        },
      })
    } else if (format === 'pdf') {
      const totalBookings = MONTHLY_BOOKINGS.reduce((acc, m) => acc + m.value, 0)
      const totalRevenue = REVENUE_BY_CHANNEL.reduce((acc, c) => acc + c.value, 0)
      printReportDocument({
        title: 'Executive Operations & Revenue Report',
        subtitle: `Reporting Period: ${range.from} to ${range.to} | ABL Travel Operations`,
        headers: ['Month', 'Confirmed Bookings', 'Top Destination', 'Visits', 'Revenue Channel', 'Revenue (USD)'],
        rows: MONTHLY_BOOKINGS.map((m, idx) => {
          const dest = TOP_DESTINATIONS[idx]
          const ch = REVENUE_BY_CHANNEL[idx]
          return [
            m.label,
            m.value,
            dest ? dest.label : '—',
            dest ? dest.value : '—',
            ch ? ch.label : '—',
            ch ? `$${formatNumber(ch.value)}` : '—',
          ]
        }),
        summaryTotals: [
          { label: 'Total Confirmed Bookings', value: totalBookings },
          { label: 'Total Gross Revenue', value: `$${formatNumber(totalRevenue)}` },
        ],
      })
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Reports"
        description="Operational and revenue reporting across the business."
        breadcrumbs={[{ label: 'Reports' }]}
      />

      <div className="card stack">
        <ReportFilters value={range} onChange={setRange} />
        <ReportExport onExport={handleExport} />
      </div>

      <div className="grid grid--2">
        <div className="card">
          <p className="card__title">Bookings per month</p>
          <LineChart data={MONTHLY_BOOKINGS} />
        </div>
        <div className="card">
          <p className="card__title">Top destinations</p>
          <BarChart data={TOP_DESTINATIONS} formatValue={(value) => String(value)} />
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <p className="card__title">Revenue by channel</p>
          <DonutChart
            data={REVENUE_BY_CHANNEL.map((segment, index) => ({ ...segment, color: CHANNEL_TONES[index] }))}
            centerLabel="Revenue"
          />
        </div>
        <div className="card">
          <p className="card__title">Revenue summary</p>
          <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {REVENUE_BY_CHANNEL.map((segment) => (
              <li key={segment.label} className="row between">
                <span>{segment.label}</span>
                <span className="strong">{formatCurrency(segment.value)}</span>
              </li>
            ))}
            <li className="row between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
              <span className="strong">Total</span>
              <span className="strong">
                {formatCurrency(REVENUE_BY_CHANNEL.reduce((sum, segment) => sum + segment.value, 0))}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
