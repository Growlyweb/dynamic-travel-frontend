import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Plus,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { toneClasses } from "@/components/tables/ShadcnDataTable";
import { cn } from "@/utils/helpers";

/**
 * Enhanced Status cell with dropdown menu (Approve, Reject, Custom Note),
 * displaying custom notes directly in the cell, with a shadcn Popover UI
 * to review and update notes.
 */
export function StatusActionCell({
  row,
  statusOptions = [],
  onStatusChange,
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(row.status || "approved");
  const [note, setNote] = useState("");

  const currentOption = statusOptions.find((o) => o.value === row.status);
  const currentLabel = currentOption?.label ?? row.status?.replace(/_/g, " ") ?? "Status";
  const currentTone = currentOption?.tone ?? "neutral";

  // Derive existing custom note from application data
  const activeNote =
    row.customNote ||
    row.note ||
    row.internalNotes?.[0]?.text ||
    row.actionRequired?.message ||
    row.rejection?.customerReason ||
    row.rejection?.internalReason ||
    "";

  function handleOpenCustomNote() {
    setSelectedStatus(row.status || "approved");
    setNote(activeNote || "");
    setTimeout(() => {
      setPopoverOpen(true);
    }, 50);
  }

  function handleUpdateWithNote() {
    onStatusChange?.(row, selectedStatus, note);
    setPopoverOpen(false);
  }

  return (
    <div className="flex flex-col items-start gap-1 py-0.5 max-w-[220px]">
      <div className="relative inline-flex items-center">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          {/* Overlay trigger for positioning popover precisely at the button */}
          <PopoverTrigger asChild>
            <span
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
            />
          </PopoverTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 w-auto min-w-28 rounded-full border-0 px-2.5 text-xs font-medium justify-between gap-1.5 transition-all shadow-xs cursor-pointer",
                  toneClasses[currentTone] ?? toneClasses.neutral
                )}
                aria-label={`Status for ${row.applicant?.fullName}: ${currentLabel}`}
              >
                <span className="truncate">{currentLabel}</span>
                <ChevronDown className="size-3 shrink-0 opacity-70" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => onStatusChange?.(row, "approved")}
                className="gap-2 text-emerald-700 hover:text-emerald-800 focus:text-emerald-800 focus:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 cursor-pointer font-medium"
              >
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Approve</span>
                {row.status === "approved" && (
                  <Check className="size-3.5 ml-auto text-emerald-600" />
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onStatusChange?.(row, "rejected")}
                className="gap-2 text-rose-700 hover:text-rose-800 focus:text-rose-800 focus:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer font-medium"
              >
                <XCircle className="size-4 text-rose-600 dark:text-rose-400" />
                <span>Reject</span>
                {row.status === "rejected" && (
                  <Check className="size-3.5 ml-auto text-rose-600" />
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleOpenCustomNote}
                className="gap-2 text-primary hover:text-primary focus:text-primary focus:bg-primary/10 cursor-pointer font-medium"
              >
                <FileText className="size-4 text-primary" />
                <span>Custom note…</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={6}
            className="w-84 max-w-[92vw] p-4 rounded-2xl shadow-2xl border bg-card text-card-foreground flex flex-col gap-3.5"
          >
            <PopoverHeader className="pb-1 border-b border-border">
              <PopoverTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span>Status & Custom Note</span>
              </PopoverTitle>
              <PopoverDescription className="text-xs text-muted-foreground truncate">
                {row.applicant?.fullName} · {row.number}
              </PopoverDescription>
            </PopoverHeader>

            <div className="flex flex-col gap-3">
              {/* Target Status Selection */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Target Status
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    type="button"
                    size="xs"
                    variant={selectedStatus === "approved" ? "default" : "outline"}
                    className={cn(
                      "h-8 text-xs font-medium cursor-pointer",
                      selectedStatus === "approved"
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "text-muted-foreground"
                    )}
                    onClick={() => setSelectedStatus("approved")}
                  >
                    <CheckCircle2 className="size-3.5 mr-1" /> Approve
                  </Button>

                  <Button
                    type="button"
                    size="xs"
                    variant={selectedStatus === "rejected" ? "default" : "outline"}
                    className={cn(
                      "h-8 text-xs font-medium cursor-pointer",
                      selectedStatus === "rejected"
                        ? "bg-rose-600 text-white hover:bg-rose-700"
                        : "text-muted-foreground"
                    )}
                    onClick={() => setSelectedStatus("rejected")}
                  >
                    <XCircle className="size-3.5 mr-1" /> Reject
                  </Button>
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-ring text-foreground"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note Input */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`note-${row.id}`} className="text-xs font-medium text-foreground">
                  Notes / Remarks
                </Label>
                <textarea
                  id={`note-${row.id}`}
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter custom note, reason, or remarks for this status update…"
                  className="w-full rounded-xl border border-input bg-input/20 p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-sans"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs px-2.5 cursor-pointer"
                  onClick={() => setPopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs px-3 font-medium cursor-pointer"
                  onClick={handleUpdateWithNote}
                >
                  Update status
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Custom Note displayed directly in Status column */}
      {activeNote ? (
        <button
          type="button"
          onClick={handleOpenCustomNote}
          className="group/note flex items-center gap-1.5 max-w-[200px] text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors text-left"
          title={`Custom note: "${activeNote}" (Click to edit)`}
        >
          <FileText className="size-3 shrink-0 text-amber-500/80 group-hover/note:text-primary transition-colors" />
          <span className="truncate italic font-normal text-muted-foreground group-hover/note:text-foreground">
            "{activeNote}"
          </span>
        </button>
      ) : null}
    </div>
  );
}

export default StatusActionCell;
