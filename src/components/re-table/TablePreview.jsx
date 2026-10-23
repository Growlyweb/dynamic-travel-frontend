import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import TableCard from './TableCard';
import TableHeader from './TableHeader';
import TableToolbar from './TableToolbar';
import Table from './Table';
import TablePagination from './TablePagination';
import TableBadge from './TableBadge';
import TableActions from './TableActions';
import TableCountryCell from './TableCountryCell';
import AddVisaChecklistModal from './AddVisaChecklistModal';
import { VISA_CHECKLIST_DUMMY_DATA } from './dummyData';

/**
 * TablePreview / VisaChecklistTable Component
 * Interactive table system reproducing the exact design and data from the provided image.
 */
export function TablePreview() {
  // Master data state initialized with the 25 sample entries
  const [dataList, setDataList] = useState(VISA_CHECKLIST_DUMMY_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [entryTypeFilter, setEntryTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Interactive Dialog States
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return dataList.filter((item) => {
      // Search matching
      const matchesSearch =
        !searchQuery.trim() ||
        item.country.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase().trim());

      // Entry type filter
      const matchesEntryType =
        !entryTypeFilter || item.visaType.toLowerCase() === entryTypeFilter.toLowerCase();

      // Status filter
      const matchesStatus =
        !statusFilter || item.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesEntryType && matchesStatus;
    });
  }, [dataList, searchQuery, entryTypeFilter, statusFilter]);

  // Paginated dataset
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Adjust page if search reduces total pages below current page
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage && totalPages > 0) {
    setCurrentPage(safePage);
  }

  // Column definitions configured for Table
  const columns = useMemo(
    () => [
      {
        key: 'serialNumber',
        header: '#',
        width: '56px',
        align: 'left',
        render: (row, idx) => (
          <span className="text-slate-600 font-normal">
            {(currentPage - 1) * pageSize + idx + 1}
          </span>
        ),
      },
      {
        key: 'country',
        header: 'Country',
        width: '180px',
        render: (row) => (
          <TableCountryCell
            name={row.country}
            code={row.countryCode}
            flag={row.flag}
          />
        ),
      },
      {
        key: 'visaType',
        header: 'Visa Type',
        width: '130px',
        render: (row) => {
          const isMultiple = row.visaType.toLowerCase() === 'multiple';
          return (
            <TableBadge
              type="pill"
              variant={isMultiple ? 'blue' : 'gray'}
            >
              {row.visaType}
            </TableBadge>
          );
        },
      },
      {
        key: 'title',
        header: 'Title',
        render: (row) => (
          <span className="text-slate-700 font-normal truncate block max-w-md">
            {row.title}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '130px',
        render: (row) => (
          <TableBadge
            type="status"
            variant={row.status.toLowerCase() === 'active' ? 'active' : 'inactive'}
          >
            {row.status}
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
            onView={(r) => setViewingItem(r)}
            onUpdate={(r) => setEditingItem({ ...r })}
            onDelete={(r) => setDeletingItem(r)}
          />
        ),
      },
    ],
    [currentPage, pageSize]
  );

  const handleDeleteItem = () => {
    if (!deletingItem) return;
    setDataList((prev) => prev.filter((item) => item.id !== deletingItem.id));
    showToast(`Deleted checklist entry #${deletingItem.id}`);
    setDeletingItem(null);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setEntryTypeFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(searchQuery || entryTypeFilter || statusFilter);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Table Card */}
      <TableCard>
        {/* Header */}
        <TableHeader
          title="Visa Check List"
          subtitle="Manage country wise visa document checklist"
          icon={ClipboardCheck}
          actionText="Add Check List"
          onAction={() => setIsAddOpen(true)}
          actionIcon={Plus}
        />

        {/* Toolbar with Search & Filter Dropdowns */}
        <TableToolbar
          search={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by country, title..."
          filters={[
            {
              id: 'entryType',
              value: entryTypeFilter,
              placeholder: 'All Entry Types',
              options: [
                { value: 'Multiple', label: 'Multiple' },
                { value: 'Single', label: 'Single' },
              ],
              onChange: (val) => {
                setEntryTypeFilter(val);
                setCurrentPage(1);
              },
            },
            {
              id: 'status',
              value: statusFilter,
              placeholder: 'All Status',
              options: [
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ],
              onChange: (val) => {
                setStatusFilter(val);
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

        {/* Core Table */}
        <Table
          columns={columns}
          data={paginatedData}
          rowKey="id"
          emptyText="No checklist items found"
          emptyDescription="Try clearing your search query or changing filter criteria."
        />

        {/* Pagination Footer */}
        <TablePagination
          currentPage={currentPage}
          totalEntries={filteredData.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </TableCard>

      {/* View Item Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                <span>Checklist Item Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Country:</span>
                <span className="font-medium text-slate-800 flex items-center gap-2">
                  <TableCountryCell name={viewingItem.country} code={viewingItem.countryCode} flag={viewingItem.flag} />
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Visa Type:</span>
                <TableBadge type="pill" variant={viewingItem.visaType.toLowerCase() === 'multiple' ? 'blue' : 'gray'}>
                  {viewingItem.visaType}
                </TableBadge>
              </div>
              <div className="flex flex-col py-1 border-b border-slate-50">
                <span className="text-slate-500 mb-1">Title:</span>
                <span className="font-medium text-slate-800">{viewingItem.title}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Status:</span>
                <TableBadge type="status" variant={viewingItem.status.toLowerCase()}>
                  {viewingItem.status}
                </TableBadge>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Display Order:</span>
                <span className="font-medium text-slate-800">{viewingItem.displayOrder}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Created Date:</span>
                <span className="font-mono text-slate-700">{viewingItem.createdDate}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg">Confirm Deletion</h3>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete the checklist item for{' '}
              <strong className="text-slate-800">{deletingItem.country}</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Visa Checklist Modal matching reference image */}
      <AddVisaChecklistModal
        open={isAddOpen || Boolean(editingItem)}
        initialData={editingItem}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItem(null);
        }}
        onSave={(savedItem) => {
          if (editingItem) {
            setDataList((prev) =>
              prev.map((item) =>
                item.id === savedItem.id ? { ...item, ...savedItem } : item
              )
            );
            showToast(`Updated "${savedItem.title}"`);
          } else {
            const newItem = {
              ...savedItem,
              id: Date.now(),
              serialNumber: dataList.length + 1,
              status: savedItem.status || 'Active',
              createdDate: new Date().toISOString().split('T')[0],
            };
            setDataList([newItem, ...dataList]);
            showToast(`Added checklist item for ${savedItem.country}`);
          }
          setIsAddOpen(false);
          setEditingItem(null);
        }}
      />
    </div>
  );
}

export const VisaChecklistTable = TablePreview;
export default TablePreview;
