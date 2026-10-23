import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Tags,
  Handshake,
  Users,
  ReceiptText,
  AlertCircle,
  Building2,
  Landmark,
  Megaphone,
  ScrollText,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../reports.api'

const TABS = [
  {
    to: '/reports/overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    to: '/reports/monthly',
    label: 'Monthly Report',
    icon: Calendar,
  },
  {
    to: '/reports/categories',
    label: 'Categories',
    icon: Tags,
  },
  {
    to: '/reports/b2b-agents',
    label: 'B2B Agents',
    icon: Handshake,
  },
  {
    to: '/reports/b2c-clients',
    label: 'B2C Clients',
    icon: Users,
  },
  {
    to: '/reports/price-list',
    label: 'Price List',
    icon: ReceiptText,
  },
  {
    to: '/reports/dues',
    label: 'Dues',
    icon: AlertCircle,
  },
  {
    to: '/reports/vendor-payables',
    label: 'Vendor Payables',
    icon: Building2,
  },
  {
    to: '/reports/partners-capital',
    label: 'Partners & Capital',
    icon: Landmark,
  },
  {
    to: '/reports/marketing',
    label: 'Marketing',
    icon: Megaphone,
  },
  {
    to: '/reports/profit-loss',
    label: 'P&L and Expenses',
    icon: ScrollText,
  },
]

export default function ReportTabs({ onReset }) {
  const handleResetData = async () => {
    if (window.confirm('Reset report records back to the default sample dataset?')) {
      await reportsApi.resetToDefaultData()
      if (onReset) onReset()
      else window.location.reload()
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border rounded-xl p-1.5 shadow-xs mb-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap select-none ${
                  isActive
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-50'
                }`
              }
            >
              <Icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
      </div>

      {/* Reset Action */}
      <div className="flex items-center px-2 py-1 sm:p-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetData}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8.5 bg-surface border-border ml-auto"
          title="Reset data back to sample seed dataset"
        >
          <RotateCcw className="size-3.5" />
          <span>Reset Sample Data</span>
        </Button>
      </div>
    </div>
  )
}
