import { useState, useEffect, useCallback, useMemo } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Search, Layers } from 'lucide-react'

import { vendorApi } from '../vendor.api'
import ServiceModal from '../components/ServiceModal'
import { cn } from '@/utils/helpers'

export default function VendorServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [deletingService, setDeletingService] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)

  const loadServices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await vendorApi.getServices()
      if (res.success) setServices(res.data)
    } catch (err) {
      console.error('Failed to load services:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  const filteredServices = useMemo(() => {
    if (!search.trim()) return services
    const q = search.trim().toLowerCase()
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q))
    )
  }, [services, search])

  const handleSaveService = async (data) => {
    if (editingService) {
      await vendorApi.updateService(editingService.id, data)
    } else {
      await vendorApi.createService(data)
    }
    loadServices()
  }

  const handleToggleStatus = async (service) => {
    try {
      await vendorApi.toggleServiceStatus(service.id)
      loadServices()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    if (!deletingService) return
    setDeleting(true)
    setActionError(null)
    try {
      await vendorApi.deleteService(deletingService.id)
      setDeletingService(null)
      loadServices()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Services"
        description="Configure product categories (Air Ticket, Visa, Tour, Umrah, Hotel) dynamically."
        breadcrumbs={[
          { label: 'Vendors', to: '/vendors' },
          { label: 'Services & Segments' },
        ]}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingService(null)
              setModalOpen(true)
            }}
            className="bg-primary text-white hover:bg-primary-strong text-xs gap-1.5 h-9"
          >
            <Plus className="size-3.5" /> Add New Service
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search service name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{services.length}</span> services
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12 text-center">SL</TableHead>
                <TableHead>Service Name</TableHead>
                <TableHead className="w-24">Short Code</TableHead>
                <TableHead className="text-center w-28">Vendors Linked</TableHead>
                <TableHead className="text-center w-24">Status</TableHead>
                <TableHead className="text-right pr-4 w-36">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Loading services...
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No services found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((row, idx) => (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                        <Layers className="size-4 text-primary shrink-0" />
                        <span>{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.code ? (
                        <span className="font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                          {row.code}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-muted text-foreground">
                        {row.vendorsCount || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(row)}
                        title="Click to toggle status"
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors cursor-pointer',
                          row.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                        )}
                      >
                        {row.isActive ? (
                          <>
                            <CheckCircle2 className="size-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3" /> Inactive
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditingService(row)
                            setModalOpen(true)
                          }}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="size-3.5 mr-1" /> Edit
                        </Button>

                        {/* Deletion Rule (Section 4.3): Cannot delete if used in bills/payments */}
                        {row.isUsed ? (
                          <span
                            className="text-[11px] text-muted-foreground/60 px-2 cursor-help"
                            title="This service is used in bills or payments and cannot be deleted. Deactivate it instead."
                          >
                            In use
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setActionError(null)
                              setDeletingService(row)
                            }}
                            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="size-3.5 mr-1" /> Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      <ServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveService}
        service={editingService}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deletingService)}
        title={`Delete Service "${deletingService?.name}"?`}
        message={
          actionError ? (
            <span className="text-rose-600 font-medium">{actionError}</span>
          ) : (
            'Are you sure you want to delete this segment? This action is permanent.'
          )
        }
        confirmLabel={deleting ? 'Deleting...' : 'Delete Service'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeletingService(null)
          setActionError(null)
        }}
      />
    </div>
  )
}
