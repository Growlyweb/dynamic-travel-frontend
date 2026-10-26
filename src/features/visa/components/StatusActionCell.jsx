import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/helpers";

/**
 * StatusActionCell Component
 * - Box system (rectangular, no round circle)
 * - Colorless styling (no colored badge or text)
 * - Dropdown menu with:
 *   1. Approved
 *   2. Rejected
 *   3. Custom added statuses
 *   4. "+ Add more status" which reveals a single input box + "Add" button
 */
export function StatusActionCell({
  row,
  statusOptions = [],
  onStatusChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newStatusText, setNewStatusText] = useState("");
  const [localStatuses, setLocalStatuses] = useState([]);
  const inputRef = useRef(null);

  // Focus input when showAddInput becomes true
  useEffect(() => {
    if (showAddInput) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [showAddInput]);

  // Reset add input state when popover closes
  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      setShowAddInput(false);
      setNewStatusText("");
    }
  };

  // Combine parent statusOptions with locally added statuses (exclude old/legacy system statuses)
  const allCustomStatuses = useMemo(() => {
    const excludedKeys = new Set([
      "approved",
      "rejected",
      "submitted",
      "under_review",
      "action_required",
      "documents_completed",
      "processing",
      "submitted_to_embassy",
      "completed",
      "passport_ready",
      "cancelled",
      "passport_submitted",
    ]);

    const combined = [...localStatuses, ...statusOptions];
    const seen = new Set(excludedKeys);
    const unique = [];

    for (const opt of combined) {
      if (!seen.has(opt.value)) {
        seen.add(opt.value);
        unique.push(opt);
      }
    }
    return unique;
  }, [statusOptions, localStatuses]);

  // Compute active status label
  const currentLabel =
    row.status === "rejected"
      ? "Rejected"
      : row.status === "approved"
      ? "Approved"
      : allCustomStatuses.find((o) => o.value === row.status)?.label ||
        localStatuses.find((o) => o.value === row.status)?.label ||
        (row.status &&
        ![
          "submitted",
          "under_review",
          "action_required",
          "documents_completed",
          "processing",
          "submitted_to_embassy",
          "completed",
          "passport_ready",
          "cancelled",
          "passport_submitted",
        ].includes(row.status)
          ? String(row.status)
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")
          : "Approved");

  // Select an existing status
  const handleSelectStatus = (value, label) => {
    onStatusChange?.(row, value, `${label} by admin`, label);
    setIsOpen(false);
  };


  // Add a new custom written status
  const handleAddNewStatus = (e) => {
    if (e) e.preventDefault();
    const trimmed = newStatusText.trim();
    if (!trimmed) return;

    const normalizedKey = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const newOption = {
      label: trimmed,
      value: normalizedKey || `custom_${Date.now()}`,
    };

    setLocalStatuses((prev) => [...prev, newOption]);
    onStatusChange?.(row, newOption.value, undefined, trimmed);

    setNewStatusText("");
    setShowAddInput(false);
    setIsOpen(false);
  };

  return (
    <div className="inline-flex items-center py-0.5">
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        {/* Box trigger - rectangular, no round circles, no colors */}
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-8 min-w-[105px] max-w-[185px] px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-medium inline-flex items-center justify-between gap-2 transition-colors cursor-pointer shadow-2xs outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            aria-label={`Status for ${row.applicant?.fullName}: ${currentLabel}`}
          >
            <span className="truncate">{currentLabel}</span>
            <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
          </button>
        </PopoverTrigger>

        {/* Dropdown Menu */}
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-56 p-1 rounded-md border border-slate-200 bg-white shadow-lg text-slate-800 z-50 flex flex-col gap-0.5"
        >
          {/* Action 1: Approved */}
          <button
            type="button"
            onClick={() => handleSelectStatus("approved", "Approved")}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded text-left transition-colors cursor-pointer",
              row.status === "approved"
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <span>Approved</span>
            {row.status === "approved" && (
              <Check className="size-3.5 text-slate-700 shrink-0" />
            )}
          </button>

          {/* Action 2: Rejected */}
          <button
            type="button"
            onClick={() => handleSelectStatus("rejected", "Rejected")}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded text-left transition-colors cursor-pointer",
              row.status === "rejected"
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <span>Rejected</span>
            {row.status === "rejected" && (
              <Check className="size-3.5 text-slate-700 shrink-0" />
            )}
          </button>

          {/* Any other or custom added statuses */}
          {allCustomStatuses.length > 0 && (
            <>
              <div className="my-1 border-t border-slate-100" />
              {allCustomStatuses.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectStatus(opt.value, opt.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded text-left transition-colors cursor-pointer",
                    row.status === opt.value
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {row.status === opt.value && (
                    <Check className="size-3.5 text-slate-700 shrink-0" />
                  )}
                </button>
              ))}
            </>
          )}

          <div className="my-1 border-t border-slate-100" />

          {/* "+ Add more status" button or single input box + Add button */}
          {!showAddInput ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddInput(true);
              }}
              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <Plus className="size-3.5 text-slate-500 shrink-0" />
              <span>Add more status</span>
            </button>
          ) : (
            <form
              onSubmit={handleAddNewStatus}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 p-1"
            >
              <input
                ref={inputRef}
                type="text"
                value={newStatusText}
                onChange={(e) => setNewStatusText(e.target.value)}
                placeholder="Enter status..."
                className="h-7 flex-1 min-w-0 rounded border border-slate-200 px-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newStatusText.trim()}
                className="h-7 px-2.5 rounded bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                Add
              </button>
            </form>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default StatusActionCell;


