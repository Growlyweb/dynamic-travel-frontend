import StatCard from '../../../components/charts/StatCard'
import { Banknote, Luggage, Stamp, UserRound } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../../utils/formatters'
import { usePermission } from '../../../hooks/usePermission'

export default function OverviewCards({ overview = {} }) {
  const { can } = usePermission()

  const allCards = [
    {
      permission: 'visa.view',
      label: 'Visa applications',
      value: formatNumber(overview.totalVisaApplications ?? 0),
      delta: overview.visaDelta,
      deltaDirection: 'up',
      icon: <Stamp size={20} aria-hidden />,
      hint: 'vs last month',
    },
    {
      permission: 'tours.view',
      label: 'Active tours',
      value: formatNumber(overview.activeTours ?? 0),
      delta: overview.tourDelta,
      deltaDirection: 'up',
      icon: <Luggage size={20} aria-hidden />,
      hint: 'vs last month',
    },
    {
      permission: 'b2c.view',
      label: 'Customers',
      value: formatNumber(overview.totalCustomers ?? 0),
      delta: overview.customerDelta,
      deltaDirection: 'up',
      icon: <UserRound size={20} aria-hidden />,
      hint: 'vs last month',
    },
    {
      permission: 'reports.view',
      label: 'Revenue (MTD)',
      value: formatCurrency(overview.revenueThisMonth ?? 0),
      delta: overview.revenueDelta,
      deltaDirection: 'up',
      icon: <Banknote size={20} aria-hidden />,
      hint: 'vs last month',
    },
  ]

  const visibleCards = allCards.filter((card) => !card.permission || can(card.permission))

  if (!visibleCards.length) return null

  return (
    <div className={`grid grid--${Math.min(visibleCards.length, 4)}`}>
      {visibleCards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}
