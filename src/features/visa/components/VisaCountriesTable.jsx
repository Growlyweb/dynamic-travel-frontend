import { EllipsisIcon } from "lucide-react";

import { DataTable, StatusSelect } from "@/components/tables/ShadcnDataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const VISA_STATUSES = [
  { label: "Submitted", value: "submitted", tone: "info" },
  { label: "In review", value: "in_review", tone: "warning" },
  { label: "Action required", value: "action_required", tone: "danger" },
  { label: "Approved", value: "approved", tone: "success" },
  { label: "Rejected", value: "rejected", tone: "neutral" },
];

export function VisaApplicationsTable({
  data,
  statusOptions = VISA_STATUSES,
  pageSize = 10,
  onStatusChange,
  onView,
}) {
  const columns = [
    { key: "reference", header: "Passport No", className: "font-medium" },
    { key: "applicant", header: "Applicant" },
    {
      key: "country",
      header: "Country",
      className: "max-w-48 truncate text-muted-foreground",
    },
    { key: "type", header: "Visa Type" },
    { key: "assignee", header: "Assignee", className: "text-muted-foreground" },
    {
      key: "status",
      header: "Status",
      searchValue: () => "", // don't search on raw status values
      cell: (row) => (
        <StatusSelect
          value={row.status}
          options={statusOptions}
          label={`Status for ${row.applicant}`}
          onChange={(value) => onStatusChange?.(row, value)}
        />
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Visa applications"
      data={data}
      columns={columns}
      pageSize={pageSize}
      itemLabel="applications"
      searchPlaceholder="Search applications..."
      emptyMessage="No applications match your search."
      defaultSort={{ key: "submittedAt", direction: "desc" }}
      filters={[
        {
          key: "status",
          label: "status",
          allLabel: "All statuses",
          options: statusOptions,
        },
      ]}
      rowActions={(row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for ${row.applicant}`}
            >
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(row)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onStatusChange?.(row, "action_required")}
            >
              Download Passport
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}

export default VisaApplicationsTable;
