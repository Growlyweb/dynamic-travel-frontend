import { NavLink } from 'react-router-dom'
import {
  BookOpenCheck,
  CalendarRange,
  ChartColumnBig,
  CircleDollarSign,
  FileStack,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  ListTree,
  PieChart,
  ReceiptText,
  Scale,
  TrendingUp,
  UserRound,
  Wallet,
} from 'lucide-react'

const GROUPS = [
  {
    label: 'Books',
    tabs: [
      { to: '/reports/overview', label: 'Overview', icon: LayoutDashboard },
      { to: '/reports/journal', label: 'Journal', icon: BookOpenCheck },
      { to: '/reports/ledger', label: 'Ledger', icon: ReceiptText },
      { to: '/reports/accounts', label: 'Accounts', icon: ListTree },
    ],
  },
  {
    label: 'Statements',
    tabs: [
      { to: '/reports/trial-balance', label: 'Trial Balance', icon: Scale },
      { to: '/reports/profit-loss', label: 'P&L', icon: TrendingUp },
      { to: '/reports/balance-sheet', label: 'Balance Sheet', icon: CircleDollarSign },
    ],
  },
  {
    label: 'Parties',
    tabs: [
      { to: '/reports/b2c-clients', label: 'Customers', icon: UserRound },
      { to: '/reports/b2b-agents', label: 'Agents', icon: Handshake },
      { to: '/reports/payables', label: 'Payables', icon: Wallet },
    ],
  },
  {
    label: 'Operations',
    tabs: [
      { to: '/reports/visa-files', label: 'Visa & Tour Files', icon: FolderKanban },
      { to: '/reports/categories', label: 'Segments', icon: PieChart },
      { to: '/reports/monthly', label: 'Monthly', icon: ChartColumnBig },
    ],
  },
]

export default function AccountingTabs() {
  return (
    <div className="-mx-1 pb-1">
      <nav
        aria-label="Accounting sections"
        className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_4px_24px_rgba(15,23,42,0.03)]"
      >
        {GROUPS.map((group, groupIndex) => (
          <div key={group.label} className="flex items-center gap-1">
            {groupIndex > 0 && <span className="mx-1 hidden h-6 w-px bg-slate-200 lg:block" aria-hidden="true" />}
            {group.tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  title={`${group.label} · ${tab.label}`}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}

export function AccountingFooterNote() {
  return (
    <p className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400">
      <FileStack className="size-3" />
      Double-entry ledger · every figure is derived from posted vouchers
      <CalendarRange className="size-3" />
    </p>
  )
}
