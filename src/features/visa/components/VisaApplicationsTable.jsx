import React, { useMemo } from "react";
import { Eye, MoreHorizontal } from "lucide-react";
import { Table, TableBadge, TableCountryCell } from "../../../components/re-table";
import { formatDate } from "../../../utils/formatters";
import { StatusActionCell } from "./StatusActionCell";
import { nextStatuses } from "../statusRules";
import { PAYMENT_STATUS_TONES } from "../api/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const PAYMENT_VARIANTS = { success: "green", warning: "amber", danger: "red" };
const REQUEST_DOCUMENTS = "action_required";

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
      {
        key: "country",
        header: "Country",
        width: "170px",
        render: (row) =>
          row.country ? (
            <span title={row.country}>
              <TableCountryCell name={row.country} textClassName="font-semibold text-slate-800 text-sm truncate max-w-[90px]" />
            </span>
          ) : (
            "—"
          ),
      },
      {
        key: "service",
        header: "Service",
        width: "170px",
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">{row.serviceLabel || "Visa"}</span>
            <span className="text-xs text-slate-400 truncate max-w-[120px]" title={row.serviceSummary}>
              {row.serviceSummary || "—"}
            </span>
          </div>
        ),
      },
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
      { key: "assigned", header: "Staff", width: "110px", render: (row) => <span className="text-xs text-slate-600">{row.assignedStaff || "Unassigned"}</span> },
      { key: "submittedAt", header: "Submitted", width: "120px", render: (row) => <span className="text-slate-600 text-xs whitespace-nowrap">{formatDate(row.submittedAt)}</span> },
      { key: "status", header: "Status", render: (row) => <StatusActionCell row={row} statuses={statuses} isAdmin={isAdmin} onChange={onChangeStatus} /> },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        width: "90px",
        render: (row) => {
          const canRequestDocuments = Boolean(onChangeStatus) && nextStatuses(row.status, statuses, { isAdmin }).some((status) => status.key === REQUEST_DOCUMENTS);
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => onView?.(row)}
                className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-[#60A5FA] text-[#2563EB] bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
                title={`View application ${row.number}`}
                aria-label={`View application ${row.number}`}
              >
                <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                    aria-label={`Actions for ${row.applicant?.fullName ?? row.number}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onView?.(row)}>
                    <Eye className="w-4 h-4 mr-2" /> View details
                  </DropdownMenuItem>
                  {canRequestDocuments ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onChangeStatus(row, REQUEST_DOCUMENTS)}>Request documents…</DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
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
