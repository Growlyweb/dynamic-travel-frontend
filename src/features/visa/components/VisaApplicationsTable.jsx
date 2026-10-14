import { EllipsisIcon, EyeIcon } from "lucide-react";

import { DataTable } from "@/components/tables/ShadcnDataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "../../../utils/formatters";
import { StatusActionCell } from "./StatusActionCell";

/**
 * Applications table (spec #12). Client-side search covers application
 * number, passport, applicant name, mobile and email; filters cover status,
 * country, and channel.
 */
export function VisaApplicationsTable({
  data,
  statusOptions = [],
  countryOptions = [],
  onView,
  onStatusChange,
  columns = [
    {
      key: "number",
      header: "Application",
      className: "font-medium whitespace-nowrap",
      // One search hit for: application number, passport, mobile, email.
      searchValue: (row) =>
        `${row.number} ${row.passport?.number ?? ""} ${row.applicant?.mobile ?? ""} ${row.applicant?.email ?? ""}`,
    },
    {
      key: "applicant",
      header: "Applicant",
      cell: (row) => (
        <span>
          <span className="font-medium">{row.applicant?.fullName}</span>
        </span>
      ),
      sortValue: (row) => row.applicant?.fullName ?? "",
    },
    {
      key: "passport",
      header: "Passport",
      cell: (row) => row.passport?.number,
      sortValue: (row) => row.passport?.number ?? "",
      searchValue: (row) => row.passport?.number ?? "",
    },
    { key: "country", header: "Country" },
    { key: "visaType", header: "Visa type" },
    {
      key: "channel",
      header: "Channel",
      cell: (row) => (row.channel === "b2b" ? "B2B" : "B2C"),
      sortValue: (row) => row.channel,
    },
    {
      key: "submittedAt",
      header: "Submitted",
      cell: (row) => formatDate(row.submittedAt),
      sortValue: (row) => row.submittedAt ?? "",
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      searchValue: () => "", // don't search on raw status keys
      cell: (row) => (
        <StatusActionCell
          row={row}
          statusOptions={statusOptions}
          onStatusChange={onStatusChange}
        />
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (row) => formatDate(row.updatedAt),
      sortValue: (row) => row.updatedAt ?? "",
      className: "text-muted-foreground whitespace-nowrap",
    },
  ],
}) {
  return (
    <DataTable
      ariaLabel="Visa applications"
      data={data}
      columns={columns}
      pageSize={10}
      itemLabel="applications"
      searchPlaceholder="Search number, passport, name, mobile, email…"
      emptyMessage="No applications match your search."
      defaultSort={{ key: "submittedAt", direction: "desc" }}
      filters={[
        {
          key: "status",
          label: "status",
          allLabel: "All statuses",
          options: statusOptions.map((option) => ({ label: option.label, value: option.value })),
        },
        {
          key: "countryId",
          label: "country",
          allLabel: "All countries",
          options: countryOptions,
        },
        {
          key: "channel",
          label: "channel",
          allLabel: "B2C & B2B",
          options: [
            { label: "B2C", value: "b2c" },
            { label: "B2B", value: "b2b" },
          ],
        },
      ]}
      rowActions={(row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`View application ${row.number}`}
            onClick={() => onView?.(row)}
          >
            <EyeIcon />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Actions for ${row.applicant?.fullName}`}
              >
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(row)}>
                <EyeIcon /> View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusChange?.(row, "action_required")}>
                Request documents…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    />
  );
}

export default VisaApplicationsTable;
