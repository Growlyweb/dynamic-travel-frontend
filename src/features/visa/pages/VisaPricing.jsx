import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Coins, Pencil, RefreshCw } from 'lucide-react';
import PageHeader from '../../../components/layout/PageHeader';
import {
  TableCard,
  TableHeader,
  TableToolbar,
  Table,
  TablePagination,
  TableBadge,
  TableCountryCell,
} from '../../../components/re-table';
import VisaTypeDialog from '../components/VisaTypeDialog';
import { visaApi } from '../visa.api';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { useAction } from '../../../hooks/useAction';

export default function VisaPricing() {
  const run = useAction();
  const [countries, setCountries] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, value } = await run(() => Promise.all([visaApi.listCountries(), visaApi.listVisaTypes()]));
    if (ok) {
      setCountries(value[0].items ?? []);
      setTypes(value[1].items ?? []);
    }
    setLoading(false);
  }, [run]);

  useEffect(() => {
    load();
  }, [load]);

  const countryById = useCallback(
    (id) => countries.find((country) => country.id === id),
    [countries]
  );

  // Filtered rows
  const filteredTypes = useMemo(() => {
    return types.filter((row) => {
      const country = countryById(row.countryId);
      const countryName = country?.name ?? '';

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCountry = countryName.toLowerCase().includes(q);
        const matchesName = (row.name ?? '').toLowerCase().includes(q);
        const matchesCurrency = (row.currency ?? '').toLowerCase().includes(q);
        if (!matchesCountry && !matchesName && !matchesCurrency) return false;
      }

      // Country filter
      if (countryFilter && row.countryId !== countryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter && row.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [types, searchQuery, countryFilter, statusFilter, countryById]);

  // Paginated rows
  const paginatedTypes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTypes.slice(start, start + pageSize);
  }, [filteredTypes, currentPage, pageSize]);

  // Adjust page if search reduces total pages below current page
  const totalPages = Math.max(1, Math.ceil(filteredTypes.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage && totalPages > 0) {
    setCurrentPage(safePage);
  }

  const hasActiveFilters = Boolean(searchQuery || countryFilter || statusFilter);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCountryFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const columns = useMemo(
    () => [
      {
        key: 'countryId',
        header: 'Country',
        width: '180px',
        render: (row) => {
          const country = countryById(row.countryId);
          return (
            <TableCountryCell
              name={country?.name ?? '—'}
              code={country?.code}
              flag={country?.flag}
            />
          );
        },
      },
      {
        key: 'name',
        header: 'Visa Type',
        render: (row) => <span className="font-semibold text-slate-800">{row.name}</span>,
      },
      // {
      //   key: 'currency',
      //   header: 'Currency',
      //   width: '100px',
      //   render: (row) => (
      //     <TableBadge type="pill" variant="gray">
      //       {row.currency}
      //     </TableBadge>
      //   ),
      // },
      {
        key: 'embassy',
        header: 'Embassy Fee',
        align: 'center',
        render: (row) => formatCurrency(row.fees?.embassy ?? 0, row.currency),
      },
      {
        key: 'service',
        header: 'Service Fee',
        align: 'center',
        render: (row) => formatCurrency(row.fees?.service ?? 0, row.currency),
      },
      {
        key: 'vat',
        header: 'VAT',
        align: 'center',
        render: (row) => formatCurrency(row.fees?.vat ?? 0, row.currency),
      },
      {
        key: 'b2cPrice',
        header: 'B2C Total',
        align: 'center',
        render: (row) => (
          <span className="font-semibold text-slate-900">
            {formatCurrency(row.b2cPrice, row.currency)}
          </span>
        ),
      },
      {
        key: 'b2bNetPrice',
        header: 'B2B Total',
        align: 'center',
        render: (row) =>
          row.b2bNetPrice == null ? (
            <span className="text-slate-400">—</span>
          ) : (
            <span className="font-semibold text-slate-900">
              {formatCurrency(row.b2bNetPrice, row.currency)}
            </span>
          ),
      },
      {
        key: 'validFrom',
        header: 'Effective From',
        align: 'center',
        render: (row) => (row.validFrom ? formatDate(row.validFrom) : '—'),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <TableBadge
            type="status"
            variant={row.status === 'active' ? 'active' : 'warning'}
          >
            {row.status === 'active' ? 'Active' : 'Paused'}
          </TableBadge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'center',
        width: '130px',
        render: (row) => (
          <button
            type="button"
            onClick={() => {
              setEditing(row);
              setDialogOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border border-[#60A5FA] text-[#2563EB] bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-xs cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Edit pricing</span>
          </button>
        ),
      },
    ],
    [countryById]
  );

  return (
    <div className="stack">
      <PageHeader
        // title="Visa pricing"
        breadcrumbs={[{ label: 'Visa' }, { label: 'Pricing' }]}
      />

      <TableCard>
        <TableHeader
          title="Visa Pricing Plans"
          subtitle="B2C and B2B pricing breakdown by visa type and country"
          icon={Coins}
        />

        <TableToolbar
          search={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by country, visa type, currency..."
          filters={[
            {
              id: 'country',
              value: countryFilter,
              placeholder: 'All Countries',
              options: countries.map((c) => ({ value: c.id, label: c.name })),
              onChange: (val) => {
                setCountryFilter(val);
                setCurrentPage(1);
              },
            },
            {
              id: 'status',
              value: statusFilter,
              placeholder: 'All Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
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
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </TableToolbar>

        <Table
          loading={loading}
          data={paginatedTypes}
          columns={columns}
          rowKey="id"
          emptyText="No pricing configured"
          emptyDescription="Add a visa type or adjust your filters to view pricing."
        />

        <TablePagination
          currentPage={currentPage}
          totalEntries={filteredTypes.length}
          pageSize={pageSize}
          itemLabel="pricing plans"
          onPageChange={(page) => setCurrentPage(page)}
        />
      </TableCard>

      <VisaTypeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        visaType={editing}
        countries={countries}
        onSaved={load}
      />
    </div>
  );
}
