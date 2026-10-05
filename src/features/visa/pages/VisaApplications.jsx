import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader";
import Loader from "../../../components/common/Loader";
import ErrorState from "../../../components/common/ErrorState";
import Input from "../../../components/common/Input";
import VisaApplicationsTable from "../components/VisaApplicationsTable";
import StatusChangeDialog from "../components/StatusChangeDialog";
import { visaApi, VISA_STAFF } from "../visa.api";
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
   * Quick status change from the table. Decisions that need a reason
   * (action_required, rejected) open the dialog instead of saving directly.
   */
  function handleStatusChange(application, nextStatus) {
    if (nextStatus === application.status) return;
    setStatusChange({ application, presetStatus: nextStatus });
  }

  const staffOptions = [
    ...VISA_STAFF.map((staff) => ({ label: staff, value: staff })),
    { label: "Unassigned", value: "__unassigned__" },
  ];

  return (
    <div className="stack">
      <PageHeader
        title="Visa applications"
        // description="Every application from submission to decision, with B2C/B2B channel, staff assignment and status."
        breadcrumbs={[{ label: "Visa" }, { label: "Applications" }]}
      />

      <div className="card">
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
            <div className="filters mb-4">
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
            <VisaApplicationsTable
              data={filteredRows}
              statusOptions={statusOptions}
              countryOptions={countryOptions}
              staffOptions={staffOptions}
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
