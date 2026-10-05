import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  FilterIcon,
  SearchIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
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

export const toneClasses = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

/** Reusable inline-editable status pill (use inside a column's `cell`). */
export function StatusSelect({ value, options, onChange, label }) {
  const current = options.find((o) => o.value === value);
  return (
    <Select value={value} onValueChange={(v) => v && onChange?.(v)}>
      <SelectTrigger
        aria-label={label}
        className={`h-7 w-auto min-w-32 rounded-full border-0 px-2.5 text-xs font-medium ${
          toneClasses[current?.tone ?? "neutral"]
        }`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function SortButton({ label, active, direction, onClick }) {
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
      onClick={onClick}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <Icon data-icon="inline-end" />
    </Button>
  );
}

// 1 … 4 5 [6] 7 8 … 20  -> keeps the footer a constant width
function getPageItems(current, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(count - 1, current + 1);
  if (start > 2) items.push("start-ellipsis");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < count - 1) items.push("end-ellipsis");
  items.push(count);
  return items;
}

/**
 * columns: [{
 *   key, header,
 *   sortable = true,
 *   sortValue?: (row) => any,      // defaults to row[key]
 *   searchValue?: (row) => string, // defaults to row[key]; return "" to exclude
 *   cell?: (row) => ReactNode,     // defaults to row[key]
 *   className?, headerClassName?
 * }]
 *
 * filters: [{
 *   key, label, options: [{label, value}], allLabel?,
 *   match?: (row, value) => boolean // defaults to row[key] === value
 * }]
 *
 * rowActions: (row) => ReactNode    // rendered in the last column
 */
export function DataTable({
  data,
  columns,
  getRowId = (row) => row.id,
  filters = [],
  rowActions,
  pageSize = 10,
  defaultSort,
  searchPlaceholder = "Search...",
  emptyMessage = "No results match your search.",
  itemLabel = "items",
  rowHeightClass = "h-14",
  ariaLabel,
}) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [sort, setSort] = useState(
    defaultSort ?? { key: null, direction: "asc" },
  );
  const [page, setPage] = useState(1);

  const columnCount = columns.length + (rowActions ? 1 : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sortCol = columns.find((c) => c.key === sort.key);

    return data
      .filter((row) =>
        filters.every((f) => {
          const v = filterValues[f.key];
          if (!v || v === "all") return true;
          return f.match ? f.match(row, v) : row[f.key] === v;
        }),
      )
      .filter(
        (row) =>
          !q ||
          columns
            .map((c) => (c.searchValue ? c.searchValue(row) : row[c.key]))
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => {
        if (!sortCol) return 0;
        const get = (r) =>
          sortCol.sortValue ? sortCol.sortValue(r) : r[sortCol.key];
        const result = String(get(a) ?? "").localeCompare(
          String(get(b) ?? ""),
          undefined,
          { numeric: true },
        );
        return sort.direction === "asc" ? result : -result;
      });
  }, [data, columns, filters, filterValues, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Pad short pages so the table height never changes between pages.
  const fillerCount = pageCount > 1 ? pageSize - rows.length : 0;

  const updateSort = (key) => {
    setSort((s) =>
      s.key === key
        ? { key, direction: s.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
    setPage(1);
  };

  return (
    <section className="flex flex-col gap-5" aria-label={ariaLabel}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-10 pl-9"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {filters.map((f) => (
            <Select
              key={f.key}
              value={filterValues[f.key] ?? "all"}
              onValueChange={(v) => {
                setFilterValues((s) => ({ ...s, [f.key]: v ?? "all" }));
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-10 w-full md:w-48"
                aria-label={`Filter by ${f.label}`}
              >
                <FilterIcon className="text-muted-foreground" />
                <SelectValue placeholder={f.allLabel ?? `All ${f.label}`} />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectItem value="all">
                    {f.allLabel ?? `All ${f.label}`}
                  </SelectItem>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.headerClassName}>
                    {col.sortable === false ? (
                      col.header
                    ) : (
                      <SortButton
                        label={col.header}
                        active={sort.key === col.key}
                        direction={sort.direction}
                        onClick={() => updateSort(col.key)}
                      />
                    )}
                  </TableHead>
                ))}
                {rowActions && (
                  <TableHead className="w-16 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length ? (
                <>
                  {rows.map((row) => (
                    <TableRow key={getRowId(row)} className={rowHeightClass}>
                      {columns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                          {col.cell ? col.cell(row) : row[col.key]}
                        </TableCell>
                      ))}
                      {rowActions && (
                        <TableCell className="text-right">
                          {rowActions(row)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}

                  {Array.from({ length: Math.max(0, fillerCount) }, (_, i) => (
                    <TableRow
                      key={`filler-${i}`}
                      aria-hidden
                      className={`${rowHeightClass} border-0 hover:bg-transparent`}
                    >
                      <TableCell colSpan={columnCount} />
                    </TableRow>
                  ))}
                </>
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columnCount}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {emptyMessage}
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
            {itemLabel}
          </p>

          <Pagination className="mx-0 w-auto justify-start sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={currentPage === 1}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(Math.max(1, currentPage - 1));
                  }}
                />
              </PaginationItem>

              {getPageItems(currentPage, pageCount).map((item) => (
                <PaginationItem key={item}>
                  {typeof item === "string" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={item === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={currentPage === pageCount}
                  className={
                    currentPage === pageCount
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(Math.min(pageCount, currentPage + 1));
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
