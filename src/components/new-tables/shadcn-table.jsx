import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  EllipsisIcon,
  FilterIcon,
  SearchIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";

const toneClasses = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

const labels = {
  id: "ID",
  reference: "Passport No",
  applicant: "Applicant",
  country: "Country",
  type: "Visa Type",
  submittedAt: "Submitted",
  status: "Status",
  assignee: "Assignee",
};

function SortButton({ label, column, sortKey, direction, onSort }) {
  const active = sortKey === column;

  const Icon = active
    ? direction === "asc"
      ? ArrowUpIcon
      : ArrowDownIcon
    : ArrowUpDownIcon;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-7 px-2 font-medium text-muted-foreground hover:text-foreground"
      onClick={() => onSort(column)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <Icon data-icon="inline-end" />
    </Button>
  );
}

export function VisaApplicationsTable({
  data = [
    {
      id: "visa_501",
      reference: "VS-2026-0501",
      applicant: "Rohan Gupta",
      country: "United Arab Emirates",
      type: "Tourist",
      submittedAt: "2026-09-28",
      status: "in_review",
      assignee: "Priya Nair",
    },
    {
      id: "visa_502",
      reference: "VS-2026-0502",
      applicant: "Sara Ali",
      country: "Schengen (France)",
      type: "Tourist",
      submittedAt: "2026-09-25",
      status: "approved",
      assignee: "Daniel Osei",
    },
    {
      id: "visa_503",
      reference: "VS-2026-0503",
      applicant: "Tom Becker",
      country: "United Kingdom",
      type: "Business",
      submittedAt: "2026-09-22",
      status: "action_required",
      assignee: "Priya Nair",
    },
    {
      id: "visa_504",
      reference: "VS-2026-0504",
      applicant: "Nina Roy",
      country: "Singapore",
      type: "Tourist",
      submittedAt: "2026-09-30",
      status: "submitted",
      assignee: "Unassigned",
    },
  ],
  statusOptions = [
    { label: "Submitted", value: "submitted" },
    { label: "In review", value: "in_review" },
    { label: "Action required", value: "action_required" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ],
  pageSize = 10,
  onStatusChange,
  onView,
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("submittedAt");
  const [direction, setDirection] = useState("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return data
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .filter(
        (item) =>
          !query.trim() ||
          [
            item.reference,
            item.applicant,
            item.country,
            item.type,
            item.assignee,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      )
      .sort((a, b) => {
        const result = String(a[sortKey]).localeCompare(
          String(b[sortKey]),
          undefined,
          { numeric: true },
        );

        return direction === "asc" ? result : -result;
      });
  }, [data, direction, query, sortKey, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  const currentPage = Math.min(page, pageCount);

  const rows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const statusFor = (value) =>
    statusOptions.find((option) => option.value === value) ?? {
      value,
      label: value,
      tone: "neutral",
    };

  const updateSort = (column) => {
    if (sortKey === column) {
      setDirection((value) => (value === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setDirection("asc");
    }

    setPage(1);
  };

  const resetPage = () => setPage(1);

  return (
    <section className="flex flex-col gap-5" aria-label="Visa applications">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            placeholder="Search applications..."
            aria-label="Search applications"
            className="h-10 pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value ?? "all");
            resetPage();
          }}
        >
          <SelectTrigger
            className="h-10 w-full md:w-48"
            aria-label="Filter by status"
          >
            <FilterIcon className="text-muted-foreground" />
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>

          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>

              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                {[
                  "reference",
                  "applicant",
                  "country",
                  "type",
                  "assignee",
                  "status",
                ].map((column) => (
                  <TableHead key={column}>
                    <SortButton
                      label={labels[column]}
                      column={column}
                      sortKey={sortKey}
                      direction={direction}
                      onSort={updateSort}
                    />
                  </TableHead>
                ))}

                <TableHead className="w-16 text-right">
                  <span className="sr-only">Action</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length ? (
                rows.map((application) => {
                  const status = statusFor(application.status);

                  return (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {application.reference}
                      </TableCell>

                      <TableCell>{application.applicant}</TableCell>

                      <TableCell className="max-w-48 truncate text-muted-foreground">
                        {application.country}
                      </TableCell>

                      <TableCell>{application.type}</TableCell>

                      <TableCell className="text-muted-foreground">
                        {application.assignee}
                      </TableCell>

                      <TableCell>
                        <Select
                          value={application.status}
                          onValueChange={(value) =>
                            value && onStatusChange?.(application, value)
                          }
                        >
                          <SelectTrigger
                            className={`h-7 w-auto min-w-32 rounded-full border-0 px-2.5 text-xs font-medium ${
                              toneClasses[status.tone || "neutral"]
                            }`}
                            aria-label={`Status for ${application.applicant}`}
                          >
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectGroup>
                              {statusOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions for ${application.applicant}`}
                            >
                              <EllipsisIcon />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onView?.(application)}
                            >
                              View details
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() =>
                                onStatusChange?.(application, "action_required")
                              }
                            >
                              Mark action required
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No applications match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            applications
          </p>

          <Pagination className="mx-0 w-auto justify-start sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((value) => Math.max(1, value - 1));
                  }}
                />
              </PaginationItem>

              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (number) => (
                  <PaginationItem key={number}>
                    <PaginationLink
                      href="#"
                      isActive={number === currentPage}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(number);
                      }}
                    >
                      {number}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((value) => Math.min(pageCount, value + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </section>
  );
}

export default VisaApplicationsTable;

export { toneClasses };

export const DEFAULT_VISA_PAGE_SIZE = 10;

export const APPLICATIONS_TABLE_VERSION = "1.0";

export const VISA_APPLICATIONS_COLUMNS = [
  "reference",
  "applicant",
  "country",
  "type",
  "assignee",
  "status",
  "action",
];

export const VISA_APPLICATIONS_FEATURES = [
  "search",
  "status filter",
  "sortable columns",
  "inline status dropdown",
  "pagination",
  "actions",
];

export const VISA_APPLICATIONS_USAGE =
  "<VisaApplicationsTable data={applications} statusOptions={statuses} />";

export const getApplicationStatus = (value, options) =>
  options.find((option) => option.value === value) ?? {
    value,
    label: value,
    tone: "neutral",
  };

export const ApplicationTable = VisaApplicationsTable;
export const APPLICATIONS_TABLE_READY = true;
