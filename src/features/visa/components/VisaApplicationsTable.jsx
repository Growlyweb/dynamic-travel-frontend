import React, { useMemo } from "react";
import { Eye } from "lucide-react";
import { Table, TableBadge, TableCountryCell } from "../../../components/re-table";
import { formatDate } from "../../../utils/formatters";
import { StatusActionCell } from "./StatusActionCell";
import { PAYMENT_STATUS_TONES } from "../api/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const PAYMENT_VARIANTS = { success: "green", warning: "amber", danger: "red" };

// One page of applications as the server sent it. The filters, the search and the paging live in the page.
export function VisaApplicationsTable({ rows = [], loading, refreshing, statuses = [], isAdmin, onView, onChangeStatus }) {
  const columns = useMemo(
    () => [
      {
        key: "applicant",
        header: "Applicant",
        render: (row) => (
          <div className="flex gap-x-2">
            <Avatar>
              <AvatarFallback>{(row.applicant?.fullName || "—").slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900">{row.applicant?.fullName || "—"}</span>
              <span className="text-xs text-slate-400 truncate max-w-[170px]">{row.number}</span>
            </div>
          </div>
        ),
      },
      {
        key: "passport",
        header: "Passport",
        width: "120px",
        render: (row) => <span className="font-mono text-slate-700">{row.passport?.number || "—"}</span>,
      },
      { key: "country", header: "Country", width: "170px", render: (row) => <TableCountryCell name={row.country} /> },
      { key: "visaType", header: "Visa Type", render: (row) => <span className="font-medium text-slate-800">{row.visaType || "—"}</span> },
      {
        key: "channel",
        header: "Channel",
        width: "100px",
        render: (row) => (
          <TableBadge type="pill" variant={row.channel === "b2b" ? "purple" : "blue"}>
            {row.channel === "b2b" ? "B2B" : "B2C"}
          </TableBadge>
        ),
      },
      {
        key: "payment",
        header: "Payment",
        width: "110px",
        render: (row) => {
          const status = row.account?.paymentStatus;
          return status ? (
            <TableBadge type="pill" variant={PAYMENT_VARIANTS[PAYMENT_STATUS_TONES[status]] ?? "blue"}>
              {status}
            </TableBadge>
          ) : (
            "—"
          );
        },
      },
      { key: "assigned", header: "Staff", width: "130px", render: (row) => <span className="text-xs text-slate-600">{row.assignedStaff || "Unassigned"}</span> },
      { key: "submittedAt", header: "Submitted", width: "120px", render: (row) => <span className="text-slate-600 text-xs whitespace-nowrap">{formatDate(row.submittedAt)}</span> },
      { key: "status", header: "Status", render: (row) => <StatusActionCell row={row} statuses={statuses} isAdmin={isAdmin} onChange={onChangeStatus} /> },
      {
        key: "actions",
        header: "",
        align: "right",
        width: "90px",
        render: (row) => (
          <button
            type="button"
            onClick={() => onView?.(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-[#60A5FA] text-[#2563EB] bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
            title={`View application ${row.number}`}
          >
            <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>View</span>
          </button>
        ),
      },
    ],
    [statuses, isAdmin, onView, onChangeStatus]
  );

  return (
    <Table
      data={rows}
      columns={columns}
      rowKey="id"
      loading={loading}
      refreshing={refreshing}
      emptyText="No applications found"
      emptyDescription="Try another search, date range or filter."
    />
  );
}

export default VisaApplicationsTable;
