import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter,
  RefreshCw,
  FileCheck2,
  Layers,
  Sparkles,
} from "lucide-react";
import { visaApi } from "../visa.api";
import VisaCountryViewDialog from "./VisaCountryViewDialog";
import VisaCountryFormDialog from "./VisaCountryFormDialog";
import { useToast } from "../../../context/ToastContext";
import { errorMessage } from "../../../utils/errors";

export function VisaCountriesTable({
  data: initialData,
  onDataChange,
}) {
  const toast = useToast();
  const [countries, setCountries] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog States
  const [viewingCountry, setViewingCountry] = useState(null);
  const [editingCountry, setEditingCountry] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingCountry, setDeletingCountry] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch from visaApi if no static data is injected
  const loadCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await visaApi.listCountries();
      const items = (res.items || []).map((country) => ({ ...country, flag: country.flag || "🌐" }));
      setCountries(items);
      onDataChange?.(items);
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the countries."));
    } finally {
      setLoading(false);
    }
  }, [onDataChange, toast]);

  useEffect(() => {
    if (!initialData) {
      loadCountries();
    } else {
      setCountries(initialData);
      setLoading(false);
    }
  }, [initialData, loadCountries]);

  // Filtered & Sorted countries
  const filteredCountries = useMemo(() => {
    return countries.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.processingMode && c.processingMode.toLowerCase().includes(q));

      const isCountryActive = c.status === "active";
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isCountryActive) ||
        (statusFilter === "deactive" && !isCountryActive);

      return matchSearch && matchStatus;
    });
  }, [countries, search, statusFilter]);

  // Toggle Active / Deactive status
  const handleToggleStatus = async (country) => {
    const nextStatus = country.status === "active" ? "paused" : "active";
    try {
      await visaApi.updateCountry(country.id, { status: nextStatus });
      setCountries((prev) =>
        prev.map((c) => (c.id === country.id ? { ...c, status: nextStatus } : c))
      );
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  // Save (Create or Edit)
  const handleSaveCountry = async (savedPayload) => {
    await visaApi.saveCountry(savedPayload);
    toast.success(`${savedPayload.name} saved.`);
    await loadCountries();
  };

  // Delete Country
  const handleDeleteConfirm = async () => {
    if (!deletingCountry) return;
    setIsDeleting(true);
    try {
      await visaApi.removeCountry(deletingCountry.id);
      setCountries((prev) => prev.filter((c) => c.id !== deletingCountry.id));
      setDeletingCountry(null);
    } catch (err) {
      toast.error(errorMessage(err));
      setDeletingCountry(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card with Add Country Button */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Visa Destinations & Checklists
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {filteredCountries.length} {filteredCountries.length === 1 ? "Country" : "Countries"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure versatile country visa processing, Google Docs style checklists, and sample document previews.
          </p>
        </div>

        {/* Prominent "+ Add Country" Button at top */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadCountries()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Country</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by country name, code, or processing mode..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Status:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              statusFilter === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            All ({countries.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              statusFilter === "active"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            Active ({countries.filter((c) => c.status === "active").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("deactive")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              statusFilter === "deactive"
                ? "bg-amber-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            Deactive ({countries.filter((c) => c.status !== "active").length})
          </button>
        </div>
      </div>

      {/* Main Countries Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                <th className="py-3.5 px-4">Country Name</th>
                <th className="py-3.5 px-4">Visa Processing</th>
                <th className="py-3.5 px-4">Checklist Form</th>
                <th className="py-3.5 px-4">Media Samples</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="text-xs">Loading visa destinations...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCountries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Globe className="mx-auto h-8 w-8 text-slate-300 mb-2 dark:text-slate-600" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No matching visa countries found
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search criteria or add a new country.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCountries.map((country) => {
                  const isActive = country.status === "active";
                  return (
                    <tr
                      key={country.id}
                      className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      {/* Country Name + Flag + Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl shadow-2xs dark:bg-slate-800">
                            {country.flag || "🌐"}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {country.name}
                              </span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {country.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                              {country.description || "Versatile visa processing requirements"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Visa Processing Mode & Time */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {country.processingMode || "—"}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{country.processingTime || "—"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Checklist Form Spec */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                          <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                          <span>Google Docs Decorated</span>
                        </div>
                      </td>

                      {/* Media Samples */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {(country.sampleDocs || []).length} Sample(s)
                        </span>
                      </td>

                      {/* Status Active / Deactive */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(country)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition hover:opacity-85 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                            }`}
                          />
                          <span>{isActive ? "Active" : "Deactive"}</span>
                        </button>
                      </td>

                      {/* DIRECT ACTION BUTTONS (NOT IN DROPDOWN) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* 1. View Button -> Opens Backdrop Popup */}
                          <button
                            type="button"
                            onClick={() => setViewingCountry(country)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-blue-400 hover:bg-blue-50/60 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="View Country Details & Checklist"
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>View</span>
                          </button>

                          {/* 2. Edit Button -> Opens Shopify-style Edit Popup */}
                          <button
                            type="button"
                            onClick={() => setEditingCountry(country)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Edit Country & Checklist"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          {/* 3. Delete Button -> Direct in table cell */}
                          <button
                            type="button"
                            onClick={() => setDeletingCountry(country)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200/80 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-2xs transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-950/60 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            title="Delete this country entry"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP 1: View Country Backdrop Modal */}
      <VisaCountryViewDialog
        open={Boolean(viewingCountry)}
        country={viewingCountry}
        onClose={() => setViewingCountry(null)}
        onEdit={(countryToEdit) => {
          setViewingCountry(null);
          setEditingCountry(countryToEdit);
        }}
      />

      {/* POPUP 2: Add / Edit Country Backdrop Modal (Shopify Add Item Style) */}
      <VisaCountryFormDialog
        open={isAddOpen || Boolean(editingCountry)}
        country={editingCountry}
        positionMax={countries.length + 1}
        onClose={() => {
          setIsAddOpen(false);
          setEditingCountry(null);
        }}
        onSave={handleSaveCountry}
      />

      {/* POPUP 3: Delete Confirmation Backdrop Dialog */}
      {deletingCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Visa Country?
              </h3>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 dark:text-white">
                {deletingCountry.flag} {deletingCountry.name}
              </strong>{" "}
              from the visa service list? Its associated checklist and requirements will also be removed.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCountry(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? "Deleting..." : "Delete Country"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisaCountriesTable;
