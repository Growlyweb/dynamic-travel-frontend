import React, { useMemo, useState } from "react";
import { Eye, MoreHorizontal, RefreshCw } from "lucide-react";
import {
  Table,
  TableToolbar,
  TablePagination,
  TableBadge,
  TableCountryCell,
} from "../../../components/re-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "../../../utils/formatters";
import { StatusActionCell } from "./StatusActionCell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * VisaApplicationsTable Component
 * Applications table with signature royal blue header, integrated toolbar,
 * client-side search across number, passport, applicant name, mobile, and email,
 * status/country/channel filters, and clean pagination.
 */
export function VisaApplicationsTable({
  data = [],
  statusOptions = [],
  countryOptions = [],
  onView,
  onStatusChange,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtered and sorted dataset
  const filteredData = useMemo(() => {
    let result = data.filter((row) => {
      // Search matching across application number, passport, applicant name, mobile, email, country, visa type
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = [
          row.number,
          row.passport?.number,
          row.applicant?.fullName,
          row.applicant?.mobile,
          row.applicant?.email,
          row.country,
          row.visaType,
        ].some((field) => field && String(field).toLowerCase().includes(q));

        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter && row.status !== statusFilter) {
        return false;
      }

      // Country filter
      if (countryFilter && row.countryId !== countryFilter) {
        return false;
      }

      // Channel filter
      if (channelFilter && row.channel !== channelFilter) {
        return false;
      }

      return true;
    });

    // Default sorting: submittedAt descending
    result.sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [data, searchQuery, statusFilter, countryFilter, channelFilter]);

  // Paginated dataset
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Adjust page if search reduces total pages below current page
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage && totalPages > 0) {
    setCurrentPage(safePage);
  }

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter || countryFilter || channelFilter
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCountryFilter("");
    setChannelFilter("");
    setCurrentPage(1);
  };

  const columns = useMemo(
    () => [
      // {
      //   key: "number",
      //   header: "Application",
      //   width: "140px",
      //   render: (row) => (
      //     <span className="font-mono font-semibold text-slate-800 whitespace-nowrap">
      //       {row.number}
      //     </span>
      //   ),
      // },
      {
        key: "applicant",
        header: "Applicant",
        render: (row) => (
          <div className="flex gap-x-2">
            <Avatar>
              <AvatarImage src={row.applicant?.photo || ""} />
              <AvatarFallback>{row.applicant?.fullName.split(' ')[0].slice(0, 1).toUpperCase() || "—"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900">
                {row.applicant?.fullName || "—"}
              </span>
              {(row.applicant?.mobile || row.applicant?.email) && (
                <span className="text-xs text-slate-400 truncate max-w-[170px]">
                  {row.applicant?.mobile || row.applicant?.email}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "passport",
        header: "Passport",
        width: "120px",
        render: (row) => (
          <span className="font-mono text-slate-700">
            {row.passport?.number || "—"}
          </span>
        ),
      },
      {
        key: "country",
        header: "Country",
        width: "170px",
        render: (row) => (
          <TableCountryCell
            name={row.country}
            code={row.countryCode}
          />
        ),
      },
      {
        key: "visaType",
        header: "Visa Type",
        render: (row) => (
          <span className="font-medium text-slate-800">{row.visaType || "—"}</span>
        ),
      },
      {
        key: "channel",
        header: "Channel",
        width: "100px",
        render: (row) => (
          <TableBadge
            type="pill"
            variant={row.channel === "b2b" ? "purple" : "blue"}
          >
            {row.channel === "b2b" ? "B2B" : "B2C"}
          </TableBadge>
        ),
      },
      {
        key: "submittedAt",
        header: "Submitted",
        width: "120px",
        render: (row) => (
          <span className="text-slate-600 text-xs whitespace-nowrap">
            {formatDate(row.submittedAt)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        // width: "160px",
        render: (row) => (
          <StatusActionCell
            row={row}
            statusOptions={statusOptions}
            onStatusChange={onStatusChange}
          />
        ),
      },
      // {
      //   key: "updatedAt",
      //   header: "Updated",
      //   width: "120px",
      //   render: (row) => (
      //     <span className="text-slate-400 text-xs whitespace-nowrap">
      //       {formatDate(row.updatedAt)}
      //     </span>
      //   ),
      // },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        width: "140px",
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onView?.(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-[#60A5FA] text-[#2563EB] bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
              title={`View application ${row.number}`}
            >
              <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>View</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-label={`Actions for ${row.applicant?.fullName}`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onView?.(row)}>
                  <Eye className="w-4 h-4 mr-2" /> View details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange?.(row, "action_required")}>
                  Request documents…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [statusOptions, onStatusChange, onView]
  );

  return (
    <div className="w-full space-y-3">
      {/* Table Toolbar */}
      <TableToolbar
        search={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search number, passport, name, mobile, email…"
        filters={[
          {
            id: "status",
            value: statusFilter,
            placeholder: "All Statuses",
            options: statusOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            })),
            onChange: (val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            },
          },
          {
            id: "countryId",
            value: countryFilter,
            placeholder: "All Countries",
            options: countryOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            })),
            onChange: (val) => {
              setCountryFilter(val);
              setCurrentPage(1);
            },
          },
          {
            id: "channel",
            value: channelFilter,
            placeholder: "All Channels",
            options: [
              { value: "b2c", label: "B2C" },
              { value: "b2b", label: "B2B" },
            ],
            onChange: (val) => {
              setChannelFilter(val);
              setCurrentPage(1);
            },
          },
        ]}
      >
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Reset all filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </TableToolbar>

      {/* Table with Royal Blue Header */}
      <Table
        data={paginatedData}
        columns={columns}
        rowKey="id"
        emptyText="No applications found"
        emptyDescription="Try adjusting your search query, date ranges, or filter criteria."
      />

      {/* Pagination Footer */}
      <TablePagination
        currentPage={currentPage}
        totalEntries={filteredData.length}
        pageSize={pageSize}
        itemLabel="applications"
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}

export default VisaApplicationsTable;
