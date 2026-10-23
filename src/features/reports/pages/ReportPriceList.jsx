import React, { useState, useEffect, useCallback, useMemo } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  ReceiptText,
  Plus,
  Percent,
  TrendingUp,
  Tag,
  DollarSign,
  Edit2,
  Trash2,
  Download,
  Info,
} from 'lucide-react'

import { reportsApi, formatMoney } from '../reports.api'
import ReportTabs from '../components/ReportTabs'
import ReportMetricCard from '../components/ReportMetricCard'
import AddServiceModal from '../components/AddServiceModal'
import {
  Table,
  TableCard,
  TableHeader,
  TableToolbar,
  TablePagination,
} from '@/components/re-table'

export default function ReportPriceList() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [serviceToEdit, setServiceToEdit] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportsApi.getPriceList()
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load price list:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveService = async (serviceData) => {
    if (serviceToEdit !== null) {
      await reportsApi.updateService(serviceToEdit.index, serviceData)
    } else {
      await reportsApi.addService(serviceData)
    }
    setServiceToEdit(null)
    loadData()
  }

  const handleDeleteService = async (index, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the price list?`)) {
      await reportsApi.deleteService(index)
      loadData()
    }
  }

  const handleExport = (format) => {
    reportsApi.exportPriceList(format)
  }

  const filteredServices = useMemo(() => {
    if (!data?.services) return []
    let list = [...data.services]
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter((s) => s.name?.toLowerCase().includes(q))
    }
    return list
  }, [data?.services, search])

  const paginatedServices = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredServices.slice(start, start + pageSize)
  }, [filteredServices, page, pageSize])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Price List"
          description="Vendor cost, B2B wholesale rates, and B2C retail rates per service."
          breadcrumbs={[{ label: 'Reports', to: '/reports/overview' }, { label: 'Price List' }]}
        />
        <ReportTabs />
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading service price list...</p>
        </div>
      </div>
    )
  }

  const { summary } = data || {}

  const columns = [
    {
      key: 'name',
      header: 'Service / Package',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary-soft text-primary shrink-0">
            <Tag className="size-4" />
          </div>
          <div>
            <span className="font-semibold text-foreground text-sm block">{row.name}</span>
            <span className="text-xs text-muted-foreground">ID: #{row.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'cost',
      header: 'Vendor Direct Cost',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-slate-800">{formatMoney(row.cost)}</span>
      ),
    },
    {
      key: 'b2b',
      header: 'B2B Wholesale Price',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-primary">{formatMoney(row.b2b)}</span>
      ),
    },
    {
      key: 'b2bMargin',
      header: 'B2B Margin & Profit',
      render: (row) => {
        const marginPct = Math.max(0, Math.min(100, Math.round(row.b2bMargin)))
        return (
          <div className="space-y-1 min-w-36">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-primary">{formatMoney(row.b2bProfit)}</span>
              <span className="font-medium text-muted-foreground">{row.b2bMargin.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${marginPct}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: 'b2c',
      header: 'B2C Retail Price',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-emerald-700">{formatMoney(row.b2c)}</span>
      ),
    },
    {
      key: 'b2cMargin',
      header: 'B2C Margin & Profit',
      render: (row) => {
        const marginPct = Math.max(0, Math.min(100, Math.round(row.b2cMargin)))
        return (
          <div className="space-y-1 min-w-36">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-emerald-700">{formatMoney(row.b2cProfit)}</span>
              <span className="font-medium text-muted-foreground">{row.b2cMargin.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${marginPct}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setServiceToEdit(row)
              setModalOpen(true)
            }}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary-soft/50"
            title="Edit rates"
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteService(row.index, row.name)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
            title="Delete service"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Price List"
        // description="Vendor direct costs, B2B wholesale rates, and B2C retail rates per service catalog."
        breadcrumbs={[
          { label: 'Reports', to: '/reports/overview' },
          { label: 'Price List' },
        ]}
      />

      {/* Info notice banner */}
      {/* <div className="flex items-center gap-3 p-3.5 bg-primary-soft/40 border border-primary/20 rounded-xl text-xs text-primary">
        <Info className="size-4 shrink-0 text-primary" />
        <span>
          These standard service rates automatically populate default invoice figures when creating sales orders for B2B Agents or B2C Clients.
        </span>
      </div> */}

      {/* Table Card */}
      <TableCard>
        <TableHeader
          title="Service Pricing Catalog"
          description={`Showing ${filteredServices.length} registered service rates`}
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="gap-1.5 text-xs h-9 bg-white"
              >
                <Download className="size-3.5" />
                <span>Export CSV</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
                className="gap-1.5 text-xs h-9 bg-white"
              >
                <Download className="size-3.5" />
                <span>Export Excel</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setServiceToEdit(null)
                  setModalOpen(true)
                }}
                className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary-strong text-white"
              >
                <Plus className="size-3.5" />
                <span>Add Service</span>
              </Button>
            </div>
          }
        />

        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search services..."
        />

        <Table
          columns={columns}
          data={paginatedServices}
          emptyMessage="No services found matching your query."
        />

        {filteredServices.length > pageSize && (
          <TablePagination
            page={page}
            totalItems={filteredServices.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </TableCard>

      {/* Add / Edit Service Modal */}
      <AddServiceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        serviceToEdit={serviceToEdit}
        onSave={handleSaveService}
      />
    </div>
  )
}
