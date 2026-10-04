import StatCard from '../../../components/charts/StatCard'
import { formatCurrency } from '../../../utils/formatters'

export default function CommissionSummary({ summary = {} }) {
  return (
    <div className="grid grid--4">
      <StatCard label="Total earned" value={formatCurrency(summary.totalEarned ?? 0)} icon="💰" />
      <StatCard label="Outstanding" value={formatCurrency(summary.outstanding ?? 0)} icon="⏳" />
      <StatCard label="Paid out" value={formatCurrency(summary.paidOut ?? 0)} icon="✅" />
      <StatCard label="Avg. commission rate" value={summary.averageRate ?? '—'} icon="📈" />
    </div>
  )
}
