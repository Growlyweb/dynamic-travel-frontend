import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet } from "lucide-react";
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

export default function VisaApplications() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [statusConfigs, setStatusConfigs] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusChange, setStatusChange] = useState(null); // { application, presetStatus? }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [applicationResult, statusResult, countryResult] = await Promise.all([
        visaApi.listApplications(),
        visaApi.listStatusConfigs(),
        visaApi.listCountries(),
      ]);
      setRows(applicationResult.items ?? []);
      setStatusConfigs((statusResult.items ?? []).filter((config) => config.active));
      setCountryOptions(
        (countryResult.items ?? []).map((country) => ({
          label: country.name,
          value: country.id,
        })),
      );
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statusOptions = statusConfigs.map((config) => ({
    label: config.displayName,
    value: config.key,
    tone: VISA_STATUS_TONES[config.key] ?? "neutral",
  }));

  const filteredRows = rows.filter((row) => {
    if (dateFrom && row.submittedAt < dateFrom) return false;
    if (dateTo && row.submittedAt > dateTo) return false;
    return true;
  });

  /**
   * Status change from table dropdown or popover.
   * If note is provided, saves directly with note.
   * If action_required/rejected without note, opens detailed dialog.
   */
  async function handleStatusChange(application, nextStatus, customNote) {
    if (customNote !== undefined) {
      try {
        await visaApi.changeStatus(application.id, {
          status: nextStatus || application.status,
          note: customNote.trim() || undefined,
        });
        setRows((prev) =>
          prev.map((r) =>
            r.id === application.id
              ? {
                ...r,
                status: nextStatus || r.status,
                customNote: customNote.trim() || r.customNote,
              }
              : r
          )
        );
        await load();
      } catch (err) {
        console.error("Failed to update status with note:", err);
      }
      return;
    }

    if (nextStatus === application.status) return;

    if (nextStatus === "action_required" || nextStatus === "rejected") {
      setStatusChange({ application, presetStatus: nextStatus });
    } else {
      try {
        await visaApi.changeStatus(application.id, {
          status: nextStatus,
        });
        setRows((prev) =>
          prev.map((r) =>
            r.id === application.id ? { ...r, status: nextStatus } : r
          )
        );
        await load();
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    }
  }

  async function handleApplicationCreated(payload) {
    try {
      const created = await visaApi.createApplication(payload);
      setRows((prev) => [created, ...prev]);
    } catch (err) {
      console.error("Failed to create application:", err);
    }
  }

  return (
    <div className="stack w-full min-w-0 max-w-full">
      <PageHeader
        // title="Visa applications"
        breadcrumbs={[{ label: "Visa" }, { label: "Applications" }]}
      />

      <TableCard className="w-full min-w-0 max-w-full">
        {loading ? (
          <Loader label="Loading applications…" />
        ) : error ? (
          <ErrorState
            title="Could not load applications"
            message={getApiErrorMessage(error)}
            onRetry={load}
          />
        ) : (
          <>
            <TableHeader
              title="Visa Applications"
              subtitle="Track and manage all submitted visa applications and applicant statuses"
              icon={FileSpreadsheet}
              extraActions={
                <AddApplicationPopover
                  countryOptions={countryOptions}
                  onCreated={handleApplicationCreated}
                />
              }
            />

            {/* Date Range Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span>Filter by date:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                      className="text-xs text-blue-600 hover:underline cursor-pointer ml-1"
                    >
                      Clear dates
                    </button>
                  )}
                </div>
              </div>
            </div>

            <VisaApplicationsTable
              data={filteredRows}
              statusOptions={statusOptions}
              countryOptions={countryOptions}
              onView={(row) => navigate(APP_ROUTES.VISA_APPLICATION_DETAILS(row.id))}
              onStatusChange={handleStatusChange}
            />
          </>
        )}
      </TableCard>

      <StatusChangeDialog
        open={Boolean(statusChange)}
        onClose={() => setStatusChange(null)}
        application={statusChange?.application}
        statusOptions={statusConfigs}
        initialStatus={statusChange?.presetStatus}
        onSaved={load}
      />
    </div>
  );
}
