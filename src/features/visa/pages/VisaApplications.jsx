import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader";
import Loader from "../../../components/common/Loader";
import ErrorState from "../../../components/common/ErrorState";
import Input from "../../../components/common/Input";
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
        title="Visa applications"
        breadcrumbs={[{ label: "Visa" }, { label: "Applications" }]}
      />

      <div className="card w-full min-w-0 max-w-full overflow-hidden">
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4 flex-wrap">
              <div className="filters flex flex-wrap items-end gap-3">
                <Input
                  label="From"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
                <Input
                  label="To"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </div>

              <AddApplicationPopover
                countryOptions={countryOptions}
                onCreated={handleApplicationCreated}
              />
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
      </div>

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
