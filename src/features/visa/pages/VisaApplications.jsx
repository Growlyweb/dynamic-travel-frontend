
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  FileSpreadsheet,
  RotateCcw,
  X,
} from "lucide-react";

import PageHeader from "../../../components/layout/PageHeader";
import Loader from "../../../components/common/Loader";
import ErrorState from "../../../components/common/ErrorState";
import { TableCard, TableHeader } from "../../../components/re-table";

import VisaApplicationsTable from "../components/VisaApplicationsTable";
import StatusChangeDialog from "../components/StatusChangeDialog";
import AddApplicationPopover from "../components/AddApplicationPopover";

import { visaApi } from "../visa.api";
import { APP_ROUTES, VISA_STATUS_TONES } from "../../../utils/constants";
import { getApiErrorMessage } from "../../../utils/helpers";

const inputClassName = [
  "h-9 w-full min-w-0 rounded-lg border border-slate-200",
  "bg-white px-3 text-sm text-slate-700",
  "outline-none transition-colors",
  "hover:border-slate-300",
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10",
].join(" ");

export default function VisaApplications() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [statusConfigs, setStatusConfigs] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);

  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");

  const [statusChange, setStatusChange] = useState(null);
  const [updatingIds, setUpdatingIds] = useState([]);

  // --------------------------------------------------
  // Data loading
  // --------------------------------------------------

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [applications, statuses, countries] = await Promise.all([
        visaApi.listApplications(),
        visaApi.listStatusConfigs(),
        visaApi.listCountries(),
      ]);

      setRows(applications.items ?? []);

      setStatusConfigs(
        (statuses.items ?? []).filter((status) => status.active)
      );

      setCountryOptions(
        (countries.items ?? []).map((country) => ({
          label: country.name,
          value: country.id,
        }))
      );

      setActionError("");
    } catch (err) {
      if (silent) {
        setActionError(getApiErrorMessage(err));
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // --------------------------------------------------
  // Derived data
  // --------------------------------------------------

  const statusOptions = useMemo(
    () =>
      statusConfigs.map((config) => ({
        label: config.displayName,
        value: config.key,
        tone: VISA_STATUS_TONES[config.key] ?? "neutral",
      })),
    [statusConfigs]
  );

  const filteredRows = useMemo(() => {
    const { dateFrom, dateTo } = filters;

    return rows.filter((row) => {
      if (!dateFrom && !dateTo) return true;
      if (!row.submittedAt) return false;

      const submittedDate = String(row.submittedAt).slice(0, 10);

      if (dateFrom && submittedDate < dateFrom) return false;
      if (dateTo && submittedDate > dateTo) return false;

      return true;
    });
  }, [rows, filters]);

  const hasActiveFilters = Boolean(
    filters.dateFrom || filters.dateTo
  );

  const invalidDateRange = Boolean(
    filters.dateFrom &&
    filters.dateTo &&
    filters.dateFrom > filters.dateTo
  );

  // --------------------------------------------------
  // Filter handlers
  // --------------------------------------------------

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
    });
  };

  // --------------------------------------------------
  // Status management
  // --------------------------------------------------

  const handleStatusChange = async (
    application,
    nextStatus,
    customNote,
    customDisplayName
  ) => {
    const status = nextStatus || application.status;
    const hasCustomNote = customNote !== undefined;

    if (!hasCustomNote && status === application.status) {
      return;
    }

    if (
      !hasCustomNote &&
      ["action_required"].includes(status)
    ) {
      setStatusChange({
        application,
        presetStatus: status,
      });
      return;
    }

    if (updatingIds.includes(application.id)) return;

    setUpdatingIds((previous) => [
      ...previous,
      application.id,
    ]);

    setActionError("");

    try {
      if (customDisplayName) {
        try {
          await visaApi.saveStatusConfig({
            displayName: customDisplayName,
            key: status,
            category: "in_progress",
            active: true,
          });
        } catch (err) {
          console.warn("Could not register status config:", err);
        }
      }

      await visaApi.changeStatus(application.id, {
        status,
        ...(hasCustomNote && {
          note: customNote.trim() || undefined,
        }),
      });

      setRows((previous) =>
        previous.map((row) =>
          row.id === application.id
            ? {
              ...row,
              status,
              ...(hasCustomNote && {
                customNote: customNote.trim(),
              }),
            }
            : row
        )
      );

      // Refresh from server without blocking the table.
      await load({ silent: true });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setUpdatingIds((previous) =>
        previous.filter((id) => id !== application.id)
      );
    }
  };


  // --------------------------------------------------
  // Create application
  // --------------------------------------------------

  const handleApplicationCreated = async (payload) => {
    setActionError("");

    try {
      const created = await visaApi.createApplication(payload);

      if (created?.id) {
        setRows((previous) => [
          created,
          ...previous.filter((row) => row.id !== created.id),
        ]);
      } else {
        await load({ silent: true });
      }

      return created;
    } catch (err) {
      setActionError(getApiErrorMessage(err));
      throw err;
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="w-full min-w-0 space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: "Visa" },
          { label: "Applications" },
        ]}
      />

      <TableCard className="w-full min-w-0 overflow-hidden">
        {loading ? (
          <div className="py-16">
            <Loader label="Loading visa applications..." />
          </div>
        ) : error ? (
          <div className="py-10">
            <ErrorState
              title="Unable to load applications"
              message={getApiErrorMessage(error)}
              onRetry={() => load()}
            />
          </div>
        ) : (
          <div className="min-w-0">
            {/* Page section header */}
            <TableHeader
              title="Visa Applications"
              subtitle="Manage applications and track visa processing progress."
              icon={FileSpreadsheet}
              extraActions={
                <AddApplicationPopover
                  countryOptions={countryOptions}
                  onCreated={handleApplicationCreated}
                />
              }
            />

            {/* Filters */}
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="w-full sm:w-44">
                    <label
                      htmlFor="visa-date-from"
                      className="mb-1.5 block text-xs font-medium text-slate-600"
                    >
                      From date
                    </label>

                    <div className="relative">
                      <input
                        id="visa-date-from"
                        type="date"
                        value={filters.dateFrom}
                        max={filters.dateTo || undefined}
                        onChange={(event) =>
                          updateFilter(
                            "dateFrom",
                            event.target.value
                          )
                        }
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="w-full sm:w-44">
                    <label
                      htmlFor="visa-date-to"
                      className="mb-1.5 block text-xs font-medium text-slate-600"
                    >
                      To date
                    </label>

                    <input
                      id="visa-date-to"
                      type="date"
                      value={filters.dateTo}
                      min={filters.dateFrom || undefined}
                      onChange={(event) =>
                        updateFilter(
                          "dateTo",
                          event.target.value
                        )
                      }
                      className={inputClassName}
                    />
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    >
                      <X size={14} />
                      Clear filters
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 lg:justify-end">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays
                      size={15}
                      className="text-slate-400"
                    />
                    <span>
                      {filteredRows.length}{" "}
                      {filteredRows.length === 1
                        ? "application"
                        : "applications"}
                      {hasActiveFilters ? " found" : " total"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => load({ silent: true })}
                    disabled={refreshing}
                    aria-label="Refresh applications"
                    title="Refresh applications"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw
                      size={15}
                      className={refreshing ? "animate-spin" : ""}
                    />
                  </button>
                </div>
              </div>

              {invalidDateRange && (
                <p className="mt-2 text-xs text-red-600">
                  The start date cannot be later than the end date.
                </p>
              )}
            </div>

            {/* API feedback */}
            {actionError && (
              <div
                role="alert"
                className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-5"
              >
                <span>{actionError}</span>

                <button
                  type="button"
                  onClick={() => setActionError("")}
                  aria-label="Dismiss error"
                  className="shrink-0 text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Applications table */}
            <div className="min-w-0">
              <VisaApplicationsTable
                data={invalidDateRange ? [] : filteredRows}
                statusOptions={statusOptions}
                countryOptions={countryOptions}
                onView={(row) =>
                  navigate(
                    APP_ROUTES.VISA_APPLICATION_DETAILS(row.id)
                  )
                }
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        )}
      </TableCard>

      {/* Status dialog */}
      <StatusChangeDialog
        open={Boolean(statusChange)}
        onClose={() => setStatusChange(null)}
        application={statusChange?.application}
        statusOptions={statusConfigs}
        initialStatus={statusChange?.presetStatus}
        onSaved={() => {
          setStatusChange(null);
          load({ silent: true });
        }}
      />
    </div>
  );
}
