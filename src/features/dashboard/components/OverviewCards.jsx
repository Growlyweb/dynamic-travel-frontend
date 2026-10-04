import StatCard from '../../../components/charts/StatCard'
import { formatCurrency, formatNumber } from '../../../utils/formatters'

export default function OverviewCards({ overview = {} }) {
  const cards = [
    {
      label: 'Visa applications',
      value: formatNumber(overview.totalVisaApplications ?? 0),
      delta: overview.visaDelta,
      deltaDirection: 'up',
      icon: '🛂',
      hint: 'vs last month',
    },
    {
      label: 'Active tours',
      value: formatNumber(overview.activeTours ?? 0),
      delta: overview.tourDelta,
      deltaDirection: 'up',
      icon: '🧳',
      hint: 'vs last month',
    },
    {
      label: 'Customers',
      value: formatNumber(overview.totalCustomers ?? 0),
      delta: overview.customerDelta,
      deltaDirection: 'up',
      icon: '🧍',
      hint: 'vs last month',
    },
    {
      label: 'Revenue (MTD)',
      value: formatCurrency(overview.revenueThisMonth ?? 0),
      delta: overview.revenueDelta,
      deltaDirection: 'up',
      icon: '💰',
      hint: 'vs last month',
    },
  ]

  return (
    <div className="grid grid--4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}
