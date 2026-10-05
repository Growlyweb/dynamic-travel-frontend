import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader";
import Loader from "../../../components/common/Loader";
import ErrorState from "../../../components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/ShadcnDataTable";
import PassportManageDialog from "../components/PassportManageDialog";
import { visaApi, PASSPORT_STATUS_LABELS, PASSPORT_STATUS_TONES, PASSPORT_METHOD_LABELS, VISA_STAFF } from "../visa.api";
import { APP_ROUTES } from "../../../utils/constants";
import { formatDate } from "../../../utils/formatters";
import { getApiErrorMessage } from "../../../utils/helpers";

/**
 * Passport operations board (spec #15): every application with a physical
 * passport, its submission method, tracking status and assigned pickup staff.
 */
export default function VisaPassportOperations() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [countries, setCountries] = useState([]);
  const [visaTypes, setVisaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [managing, setManaging] = useState(null); // application being managed

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [applicationResult, countryResult, typeResult] = await Promise.all([
        visaApi.listApplications(),
        visaApi.listCountries(),
        visaApi.listVisaTypes(),
      ]);
      setRows(applicationResult.items ?? []);
      setCountries(countryResult.items ?? []);
      setVisaTypes(typeResult.items ?? []);
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statusOptions = Object.entries(PASSPORT_STATUS_LABELS).map(([value, label]) => ({ label, value }));
  const countryOptions = countries.map((country) => ({ label: country.name, value: country.id }));
  const visaTypeOptions = visaTypes.map((type) => ({ label: type.name, value: type.id }));
  const staffOptions = VISA_STAFF.map((staff) => ({ label: staff, value: staff }));

  const managingVisaType = managing ? visaTypes.find((type) => type.id === managing.visaTypeId) : null;

  return (
    <div className="stack">
      <PageHeader
        title="Passport operations"
        // description="Physical passport tracking across all applications — pickup requests, office submissions and embassy movements. Online visas are listed as “Not Required”."
        breadcrumbs={[{ label: "Visa" }, { label: "Passport operations" }]}
      />

      <div className="card">
        {loading ? (
          <Loader label="Loading passport operations…" />
        ) : error ? (
          <ErrorState title="Could not load passport operations" message={getApiErrorMessage(error)} onRetry={load} />
        ) : (
          <DataTable
            ariaLabel="Passport operations"
            data={rows}
            columns={[
              {
                key: "number",
                header: "Application",
                className: "font-medium whitespace-nowrap",
                searchValue: (row) =>
                  `${row.number} ${row.passport?.number ?? ""} ${row.applicant?.fullName ?? ""} ${row.applicant?.mobile ?? ""}`,
              },
              {
                key: "applicant",
                header: "Applicant",
                cell: (row) => (
                  <span>
                    <span className="font-medium">{row.applicant?.fullName}</span>
                    <span className="block text-xs text-muted-foreground">{row.applicant?.mobile}</span>
                  </span>
                ),
                sortValue: (row) => row.applicant?.fullName ?? "",
              },
              { key: "country", header: "Country" },
              { key: "visaType", header: "Visa type" },
              {
                key: "passportSubmissionMethod",
                header: "Method",
                cell: (row) => PASSPORT_METHOD_LABELS[row.passportSubmissionMethod] ?? "—",
                sortValue: (row) => row.passportSubmissionMethod ?? "",
              },
              {
                key: "passportStatus",
                header: "Passport status",
                sortable: false,
                searchValue: () => "",
                cell: (row) => (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      row.passportStatus === "delivered"
                        ? "bg-emerald-50 text-emerald-700"
                        : row.passportStatus === "not_received"
                          ? "bg-rose-50 text-rose-700"
                          : row.passportStatus === "not_required"
                            ? "bg-muted text-muted-foreground"
                            : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {PASSPORT_STATUS_LABELS[row.passportStatus] ?? row.passportStatus}
                  </span>
                ),
              },
              {
                key: "assignedStaff",
                header: "Assigned",
                cell: (row) => row.pickupRequest?.assignedStaff || row.assignedStaff || "—",
                sortValue: (row) => row.pickupRequest?.assignedStaff ?? row.assignedStaff ?? "",
              },
              {
                key: "updatedAt",
                header: "Updated",
                cell: (row) => formatDate(row.updatedAt),
                sortValue: (row) => row.updatedAt ?? "",
                className: "text-muted-foreground whitespace-nowrap",
              },
            ]}
            pageSize={10}
            itemLabel="applications"
            searchPlaceholder="Search number, passport, applicant…"
            emptyMessage="No applications match your search."
            defaultSort={{ key: "updatedAt", direction: "desc" }}
            filters={[
              { key: "countryId", label: "country", allLabel: "All countries", options: countryOptions },
              { key: "visaTypeId", label: "visa type", allLabel: "All visa types", options: visaTypeOptions },
              {
                key: "passportSubmissionMethod",
                label: "method",
                allLabel: "All methods",
                options: [
                  { label: "Pickup", value: "pickup" },
                  { label: "Office visit", value: "office" },
                  { label: "Online", value: "online" },
                ],
              },
              {
                key: "passportStatus",
                label: "passport status",
                allLabel: "All statuses",
                options: statusOptions,
              },
              {
                key: "assignedStaff",
                label: "staff",
                allLabel: "All staff",
                options: staffOptions,
                match: (row, value) =>
                  value === "__unassigned__"
                    ? !(row.pickupRequest?.assignedStaff || row.assignedStaff)
                    : (row.pickupRequest?.assignedStaff || row.assignedStaff) === value,
              },
            ]}
            getRowId={(row) => row.id}
            rowActions={(row) => (
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => setManaging(row)}>
                  Manage
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(APP_ROUTES.VISA_APPLICATION_DETAILS(row.id))}
                >
                  Application
                </Button>
              </div>
            )}
          />
        )}
      </div>

      <PassportManageDialog
        open={Boolean(managing)}
        onClose={() => setManaging(null)}
        application={managing}
        visaType={managingVisaType}
        staff={VISA_STAFF}
        onSaved={(updated) => {
          load();
          // keep the open dialog in sync with the fresh record
          if (updated) setManaging(updated);
        }}
      />
    </div>
  );
}
