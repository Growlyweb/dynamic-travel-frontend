import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import {
  TableCard,
  TableHeader,
  TableToolbar,
  Table,
  TablePagination,
  TableActions,
} from '../../../components/re-table';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  vendorApi,
  calculateVendorSegmentDue,
} from '../vendor.api';
import { formatNumber } from '@/utils/formatters';

export default function VendorList() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [services, setServices] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, sRes, bRes, pRes] = await Promise.all([
        vendorApi.getVendors(),
        vendorApi.getServices(),
        vendorApi.getBills(),
        vendorApi.getPayments(),
      ]);

      if (vRes.success) setVendors(vRes.data);
      if (sRes.success) setServices(sRes.data);
      if (bRes.success) setBills(bRes.data);
      if (pRes.success) setPayments(pRes.data);
    } catch (err) {
      console.error('Failed to load vendor list data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered dataset
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      // Search matching across vendor name, mobile, email, services
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullPhone = `${v.mobile?.countryCode || ''} ${v.mobile?.number || v.mobileNumber || ''}`.toLowerCase();
        const srvNames = (v.serviceNames || []).join(' ').toLowerCase();
        const matches =
          (v.name && v.name.toLowerCase().includes(q)) ||
          (v.vendorName && v.vendorName.toLowerCase().includes(q)) ||
          fullPhone.includes(q) ||
          (v.email && v.email.toLowerCase().includes(q)) ||
          (v.emailAddress && v.emailAddress.toLowerCase().includes(q)) ||
          srvNames.includes(q);

        if (!matches) return false;
      }

      // Service filter
      if (serviceFilter && !v.services?.includes(serviceFilter)) {
        return false;
      }

      return true;
    });
  }, [vendors, searchQuery, serviceFilter]);

  // Paginated dataset
  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVendors.slice(start, start + pageSize);
  }, [filteredVendors, currentPage, pageSize]);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      await vendorApi.deleteVendor(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to delete vendor.');
    } finally {
      setDeleting(false);
    }
  };

  // Helper: resolve due for a specific service category
  const getServiceDue = useCallback(
    (vendor, serviceMatchFn) => {
      const srvId = (vendor.services || []).find((sid) => {
        const srvObj = services.find((s) => s.id === sid);
        return serviceMatchFn(sid, srvObj);
      });
      if (!srvId) return null; // vendor does not offer this service
      const { due } = calculateVendorSegmentDue(vendor.id, srvId, bills, payments);
      return due ?? 0;
    },
    [services, bills, payments]
  );

  // Service matchers
  const isVisa = (sid, s) =>
    sid === 'srv_visa' || s?.name?.toLowerCase().includes('visa');
  const isAir = (sid, s) =>
    sid === 'srv_air' ||
    s?.name?.toLowerCase().includes('air') ||
    s?.name?.toLowerCase().includes('ticket');
  const isTour = (sid, s) =>
    sid === 'srv_tour' ||
    s?.name?.toLowerCase().includes('tour') ||
    s?.name?.toLowerCase().includes('package');
  const isHotel = (sid, s) =>
    sid === 'srv_hotel' || s?.name?.toLowerCase().includes('hotel');
  const isTransport = (sid, s) =>
    sid === 'srv_transport' ||
    s?.name?.toLowerCase().includes('transport') ||
    s?.name?.toLowerCase().includes('transfer');

  // Due cell renderer
  const renderDueCell = (amount) => {
    if (amount === null) {
      return <span className="text-slate-300 text-sm select-none">—</span>;
    }
    if (amount > 0) {
      return (
        <span className="inline-flex items-baseline gap-0.5 font-bold text-rose-600 text-sm">
          <span className="text-xs">৳</span>
          {formatNumber(amount)}
        </span>
      );
    }
    if (amount < 0) {
      return (
        <span className="inline-flex items-baseline gap-0.5 font-bold text-amber-600 text-sm">
          <span className="text-xs">৳</span>
          {formatNumber(Math.abs(amount))}
        </span>
      );
    }
    return (
      <span className="inline-flex items-baseline gap-0.5 font-semibold text-emerald-600 text-sm">
        <span className="text-xs">৳</span>0
      </span>
    );
  };

  // Table Column Definitions matching Visa segment table design
  const columns = useMemo(
    () => [
      {
        key: 'sl',
        header: '#',
        width: '56px',
        align: 'center',
        render: (row, idx) => (
          <span className="text-slate-600 font-normal">
            {(currentPage - 1) * pageSize + idx + 1}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Vendor Name',
        minWidth: '180px',
        render: (row) => {
          const num = row.mobile?.number || row.mobileNumber;
          const code = row.mobile?.countryCode || '+88';
          return (
            <div>
              <p className="font-semibold text-slate-900 text-sm">{row.name || row.vendorName}</p>
              <p className="text-[11px] text-slate-500">{num ? `${code} ${num}` : row.email || '—'}</p>
            </div>
          );
        },
      },
      // ── Service Due Amount Columns ──────────────────────────────
      {
        key: 'visaDue',
        header: 'Visa Due',
        minWidth: '105px',
        align: 'right',
        render: (row) => renderDueCell(getServiceDue(row, isVisa)),
      },
      {
        key: 'airDue',
        header: 'Air Ticket Due',
        minWidth: '110px',
        align: 'right',
        render: (row) => renderDueCell(getServiceDue(row, isAir)),
      },
      {
        key: 'tourDue',
        header: 'Tour Package Due',
        minWidth: '120px',
        align: 'right',
        render: (row) => renderDueCell(getServiceDue(row, isTour)),
      },
      {
        key: 'hotelDue',
        header: 'Hotel Due',
        minWidth: '105px',
        align: 'right',
        render: (row) => renderDueCell(getServiceDue(row, isHotel)),
      },
      {
        key: 'transportDue',
        header: 'Transport Due',
        minWidth: '110px',
        align: 'right',
        render: (row) => renderDueCell(getServiceDue(row, isTransport)),
      },
      // ── Actions ───────────────────────────────────────────────
      {
        key: 'actions',
        header: 'Actions',
        width: '170px',
        align: 'center',
        render: (row) => (
          <TableActions
            row={row}
            onView={(r) => navigate(`/vendors/${r.id}`)}
            onUpdate={(r) => navigate(`/vendors/${r.id}/edit`)}
            onDelete={(r) => setDeleteTarget(r)}
            viewLabel="View"
            updateLabel="Edit"
            deleteLabel="Delete"
          />
        ),
      },
    ],
    [currentPage, pageSize, getServiceDue, navigate]
  );

  const hasActiveFilters = Boolean(searchQuery || serviceFilter);

  const handleResetFilters = () => {
    setSearchQuery('');
    setServiceFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Vendor bills, payments and advances are posted to <strong>Accounts → Vendor Payables</strong> automatically.
        </span>
        <button
          type="button"
          onClick={() => navigate('/accounts/payables')}
          className="shrink-0 font-semibold text-[#2F80ED] hover:underline"
        >
          Open Vendor Payables →
        </button>
      </div>

      {/* Main Table Card (Same design system as Visa segment table) */}
      <TableCard>
        {/* Header with Royal Blue Icon and + Add Vendor Action Button */}
        <TableHeader
          title="Vendors"
          subtitle="Manage vendor directory, services and corresponding service due amounts"
          icon={Building2}
          actionText="Add Vendor"
          onAction={() => navigate('/vendors/new')}
        />

        {/* Toolbar with Search & Filter */}
        <TableToolbar
          search={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by vendor name, mobile, email, service..."
          filters={[
            {
              id: 'service',
              value: serviceFilter,
              placeholder: 'All Services',
              options: services.map((s) => ({ value: s.id, label: s.name })),
              onChange: (val) => {
                setServiceFilter(val);
                setCurrentPage(1);
              },
            },
          ]}
        >
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              title="Reset all filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </TableToolbar>

        {/* Table with signature royal blue header */}
        <Table
          columns={columns}
          data={paginatedVendors}
          loading={loading}
          rowKey="id"
          emptyText="No vendors found"
          emptyDescription="Try adjusting your search query or service filter."
        />

        {/* Pagination Footer */}
        <TablePagination
          currentPage={currentPage}
          totalEntries={filteredVendors.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </TableCard>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Vendor"
        message={
          deleteTarget
            ? `Are you sure you want to delete vendor "${deleteTarget.name || deleteTarget.vendorName}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
