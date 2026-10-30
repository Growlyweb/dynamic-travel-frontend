import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, RotateCcw, X } from "lucide-react";

import PageHeader from "../../../components/layout/PageHeader";
import ErrorState from "../../../components/common/ErrorState";
import { TableCard, TableHeader, TableToolbar, TablePagination } from "../../../components/re-table";

import VisaApplicationsTable from "../components/VisaApplicationsTable";
import StatusChangeDialog from "../components/StatusChangeDialog";
import AddApplicationPopover from "../components/AddApplicationPopover";

import { visaApi, SERVICE_OPTIONS } from "../visa.api";
import { useServerTable } from "../../../hooks/useServerTable";
import { usePermission } from "../../../hooks/usePermission";
import { useToast } from "../../../context/ToastContext";
import { APP_ROUTES } from "../../../utils/constants";
import { PERMISSIONS } from "../../../utils/permissions";
import { errorMessage } from "../../../utils/errors";

const inputClassName = [
  "h-9 w-full min-w-0 rounded-lg border border-slate-200",
  "bg-white px-3 text-sm text-slate-700",
  "outline-none transition-colors",
  "hover:border-slate-300",
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10",
].join(" ");

const EMPTY_FILTERS = { serviceType: "", status: "", countryId: "", channel: "", staff: "", paymentStatus: "", from: "", to: "" };

export default function VisaApplications() {
  const navigate = useNavigate();
  const toast = useToast();
  const { can, isAdmin } = usePermission();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [statuses, setStatuses] = useState([]);
  const [countries, setCountries] = useState([]);
  const [staff, setStaff] = useState([]);
  const [statusChange, setStatusChange] = useState(null);

  // The dates are checked here, so an impossible range is never sent.
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to);
  const sent = useMemo(() => (invalidRange ? { ...filters, from: "", to: "" } : filters), [filters, invalidRange]);

  const table = useServerTable({ table: "visa-applications", fetcher: visaApi.listApplications, filters: sent });

  useEffect(() => {
    Promise.all([visaApi.listStatusConfigs(), visaApi.listCountries(), visaApi.listStaff()])
      .then(([statusResult, countryResult, staffResult]) => {
        setStatuses(statusResult.items);
        setCountries(countryResult.items);
        setStaff(Array.isArray(staffResult) ? staffResult : staffResult.items ?? []);
      })
      .catch((error) => toast.error(errorMessage(error)));
  }, [toast]);

  const update = (key, value) => setFilters((previous) => ({ ...previous, [key]: value }));
  const hasFilters = Object.values(filters).some(Boolean) || Boolean(table.search);
  const clear = () => {
    setFilters(EMPTY_FILTERS);
    table.setSearch("");
  };

  const handleCreated = useCallback(
    async (payload) => {
      const created = await visaApi.createApplication(payload);
      toast.success(`Application ${created.number} created.`);
      table.reload();
      return created;
    },
    [toast, table],
  );

  const openStatus = useCallback((application, initialStatus) => setStatusChange({ application, initialStatus }), []);
  const canCreate = can(PERMISSIONS.VISA_EDIT);

  return (
    <div className="w-full min-w-0 space-y-5">
      <PageHeader breadcrumbs={[{ label: "Visa" }, { label: "Applications" }]} />

      <TableCard className="w-full min-w-0 overflow-hidden">
        <TableHeader
          title="Visa Applications"
          subtitle="Manage applications and track visa processing progress."
          icon={FileSpreadsheet}
          extraActions={canCreate ? <AddApplicationPopover onCreated={handleCreated} /> : null}
        />

        <TableToolbar
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search number, passport, name, phone, hotel, route…"
          filters={[
            { id: "serviceType", value: filters.serviceType, placeholder: "All services", options: SERVICE_OPTIONS, onChange: (value) => update("serviceType", value) },
            { id: "status", value: filters.status, placeholder: "All statuses", options: statuses.map((status) => ({ value: status.key, label: status.displayName })), onChange: (value) => update("status", value) },
            { id: "countryId", value: filters.countryId, placeholder: "All countries", options: countries.map((country) => ({ value: country.id, label: country.name })), onChange: (value) => update("countryId", value) },
            { id: "channel", value: filters.channel, placeholder: "All channels", options: [{ value: "b2c", label: "B2C" }, { value: "b2b", label: "B2B" }], onChange: (value) => update("channel", value) },
            { id: "paymentStatus", value: filters.paymentStatus, placeholder: "Any payment", options: ["Paid", "Partial", "Unpaid"].map((value) => ({ value, label: value })), onChange: (value) => update("paymentStatus", value) },
            { id: "staff", value: filters.staff, placeholder: "Any staff", options: [{ value: "unassigned", label: "Unassigned" }, ...staff.map((person) => ({ value: person.id ?? person._id, label: person.name }))], onChange: (value) => update("staff", value) },
          ]}
        >
          <div className="flex items-end gap-2">
            <input aria-label="From date" type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => update("from", event.target.value)} className={`${inputClassName} w-40`} />
            <input aria-label="To date" type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => update("to", event.target.value)} className={`${inputClassName} w-40`} />
            {hasFilters ? (
              <button type="button" onClick={clear} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                <X size={14} /> Clear
              </button>
            ) : null}
            <button type="button" onClick={table.reload} disabled={table.refreshing} aria-label="Refresh applications" title="Refresh" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50">
              <RotateCcw size={15} className={table.refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </TableToolbar>
        {invalidRange ? <p className="pb-2 text-xs text-red-600">The start date cannot be later than the end date.</p> : null}

        {table.error ? (
          <div className="py-10">
            <ErrorState title="Unable to load applications" message={errorMessage(table.error)} onRetry={table.reload} />
          </div>
        ) : (
          <>
            <VisaApplicationsTable
              rows={table.rows}
              loading={table.loading}
              refreshing={table.refreshing}
              statuses={statuses}
              isAdmin={isAdmin}
              onView={(row) => navigate(APP_ROUTES.VISA_APPLICATION_DETAILS(row.id || row._id))}
              onChangeStatus={can(PERMISSIONS.VISA_UPDATE) ? openStatus : undefined}
            />
            <TablePagination {...table.paginationProps} itemLabel="applications" />
          </>
        )}
      </TableCard>

      <StatusChangeDialog
        open={Boolean(statusChange)}
        onClose={() => setStatusChange(null)}
        application={statusChange?.application}
        initialStatus={statusChange?.initialStatus}
        statusOptions={statuses}
        onSaved={() => {
          setStatusChange(null);
          toast.success("Status updated.");
          table.reload();
        }}
      />
    </div>
  );
}
