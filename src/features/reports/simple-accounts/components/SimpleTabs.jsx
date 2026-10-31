import { NavLink } from 'react-router-dom'
import {
  Building2,
  ChartColumnBig,
  ChartLine,
  HandCoins,
  Handshake,
  Home,
  ListTree,
  ReceiptText,
  Tags,
  UserRound,
  Wallet,
} from 'lucide-react'
import { FEATURE_CATEGORIES_ENABLED } from '@/utils/constants'

const TABS = [
  { to: '/accounts', label: 'Home', icon: Home, end: true },
  { to: '/accounts/sales', label: 'Sales', icon: ReceiptText },
  { to: '/accounts/dues', label: 'Client Dues', icon: Wallet },
  { to: '/accounts/receipts', label: 'Money Receipts', icon: HandCoins },
  { to: '/accounts/monthly', label: 'Monthly Report', icon: ChartColumnBig },
  { to: '/accounts/profit', label: 'Profit & Expenses', icon: ChartLine },
  ...(FEATURE_CATEGORIES_ENABLED ? [{ to: '/accounts/categories', label: 'Categories', icon: Tags }] : []),
  { to: '/accounts/price-list', label: 'Price List', icon: ListTree },
  { to: '/accounts/agents', label: 'B2B Agents', icon: Building2 },
  { to: '/accounts/clients', label: 'B2C Clients', icon: UserRound },
  { to: '/accounts/payables', label: 'Vendor Payables', icon: Wallet },
  { to: '/accounts/partners', label: 'Partners', icon: Handshake },
]

export default function SimpleTabs() {
  return (
    <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:flex-wrap lg:overflow-visible">
      {TABS.map((tab) => {
        const Icon = tab.icon
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition ${
                isActive ? 'bg-[#2F80ED] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            <Icon className="size-3.5" />
            {tab.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
