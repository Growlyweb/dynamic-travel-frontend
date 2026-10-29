import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { Table, TableCard, TableHeader, TableToolbar, TablePagination, TableBadge, TableActions, TableCountryCell } from '../../../components/re-table';
import ErrorState from '../../../components/common/ErrorState';
import AddVisaChecklistModal from './AddVisaChecklistModal';
import ViewVisaChecklistModal from './ViewVisaChecklistModal';
import { visaApi } from '../visa.api';
import { useServerTable } from '../../../hooks/useServerTable';
import { usePermission } from '../../../hooks/usePermission';
import { useToast } from '../../../context/ToastContext';
import { PERMISSIONS } from '../../../utils/permissions';
import { errorMessage } from '../../../utils/errors';

const ENTRY_TYPE_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'multiple', label: 'Multiple' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * VisaChecklistTable Component
 * The "Visa Check List" pages of every country and visa type: search, filters, and view, update and delete.
 * The pages are kept on the server; the country and the visa type of a page come from the visa catalog.
 */
export function VisaChecklistTable() {
  const toast = useToast();
  const { can } = usePermission();
  const canEdit = can(PERMISSIONS.VISA_EDIT);

  const [entryTypeFilter, setEntryTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countries, setCountries] = useState([]);
  const [types, setTypes] = useState([]);

  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filters = useMemo(() => ({ entries: entryTypeFilter, status: statusFilter }), [entryTypeFilter, statusFilter]);
  const table = useServerTable({ table: 'visa-checklists', fetcher: visaApi.listChecklistEntries, filters });

  // The country and the visa type of a new page are picked from the catalog.
  useEffect(() => {
    Promise.all([visaApi.listCountries(), visaApi.listVisaTypes()])
      .then(([countryResult, typeResult]) => {
        setCountries(countryResult.items);
        setTypes(typeResult.items);
      })
      .catch((error) => toast.error(errorMessage(error)));
  }, [toast]);

  const { page, pageSize } = table;

  const columns = useMemo(
    () => [
      {
        key: 'serialNumber',
        header: '#',
        width: '56px',
        align: 'left',
        render: (row, idx) => <span className="text-slate-600 font-normal">{(page - 1) * pageSize + idx + 1}</span>,
      },
      {
        key: 'country',
        header: 'Country',
        width: '180px',
        render: (row) => <TableCountryCell name={row.countryName} code={row.countryCode} flag={row.flag} />,
      },
      {
        key: 'visaType',
        header: 'Visa Type',
        width: '130px',
        render: (row) => (
          <TableBadge type="pill" variant={row.entries === 'multiple' ? 'blue' : 'gray'}>
            {row.visaTypeName}
          </TableBadge>
        ),
      },
      {
        key: 'title',
        header: 'Title',
        render: (row) => <span className="text-slate-700 font-normal truncate block max-w-md">{row.title}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        width: '130px',
        render: (row) => (
          <TableBadge type="status" variant={row.status === 'active' ? 'active' : 'inactive'}>
            {row.status === 'active' ? 'Active' : 'Inactive'}
          </TableBadge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        width: '270px',
        align: 'center',
        render: (row) => (
          <TableActions
            row={row}
            showUpdate={canEdit}
            showDelete={canEdit}
            onView={(r) => setViewingItem(r)}
            onUpdate={(r) => setEditingItem({ ...r })}
            onDelete={(r) => setDeletingItem(r)}
          />
        ),
      },
    ],
    [page, pageSize, canEdit],
  );

  const handleSave = useCallback(
    async (payload) => {
      const saved = await visaApi.saveChecklistEntry(payload);
      toast.success(payload.id ? `Updated "${saved.title}"` : `Added checklist item for ${saved.countryName}`);
      table.reload();
      return saved;
    },
    [toast, table],
  );

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await visaApi.removeChecklistEntry(deletingItem.id);
      toast.success(`Deleted checklist entry ${deletingItem.code}`);
      setDeletingItem(null);
      table.reload();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    table.setSearch('');
    setEntryTypeFilter('');
    setStatusFilter('');
  };

  const hasActiveFilters = Boolean(table.search || entryTypeFilter || statusFilter);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <TableCard>
        <TableHeader
          title="Visa Check List"
          subtitle="Manage country wise visa document checklist"
          icon={ClipboardCheck}
          actionText={canEdit ? 'Add Check List' : undefined}
          onAction={canEdit ? () => setIsAddOpen(true) : undefined}
          actionIcon={Plus}
        />

        <TableToolbar
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search by country, title..."
          filters={[
            { id: 'entryType', value: entryTypeFilter, placeholder: 'All Entry Types', options: ENTRY_TYPE_OPTIONS, onChange: setEntryTypeFilter },
            { id: 'status', value: statusFilter, placeholder: 'All Status', options: STATUS_OPTIONS, onChange: setStatusFilter },
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

        {table.error ? (
          <div className="py-10">
            <ErrorState title="Unable to load checklists" message={errorMessage(table.error)} onRetry={table.reload} />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={table.rows}
              rowKey="id"
              loading={table.loading}
              refreshing={table.refreshing}
              emptyText="No checklist items found"
              emptyDescription="Try clearing your search query or changing filter criteria."
            />
            <TablePagination {...table.paginationProps} itemLabel="entries" />
          </>
        )}
      </TableCard>

      <ViewVisaChecklistModal open={Boolean(viewingItem)} item={viewingItem} onClose={() => setViewingItem(null)} onEdit={canEdit ? (item) => setEditingItem({ ...item }) : undefined} />

      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-checklist-title" className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 id="delete-checklist-title" className="font-semibold text-slate-900 text-lg">
                Confirm Deletion
              </h3>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete the checklist item for <strong className="text-slate-800">{deletingItem.countryName}</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddVisaChecklistModal
        open={isAddOpen || Boolean(editingItem)}
        initialData={editingItem}
        countries={countries}
        types={types}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}

export default VisaChecklistTable;
