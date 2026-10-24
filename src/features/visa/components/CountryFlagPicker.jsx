import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, Globe } from "lucide-react";

export const WORLD_COUNTRIES = [
  { name: "China", code: "CN", flag: "🇨🇳", processingMode: "Embassy Appointment", processingTime: "5–7 working days" },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪", processingMode: "eVisa (Online)", processingTime: "3–4 working days" },
  { name: "Malaysia", code: "MY", flag: "🇲🇾", processingMode: "eVisa (Online)", processingTime: "2–3 working days" },
  { name: "Schengen (France)", code: "FR", flag: "🇫🇷", processingMode: "VFS Global Appointment", processingTime: "10–15 working days" },
  { name: "Schengen (Italy)", code: "IT", flag: "🇮🇹", processingMode: "VFS Global Appointment", processingTime: "12–18 working days" },
  { name: "Schengen (Germany)", code: "DE", flag: "🇩🇪", processingMode: "Embassy Appointment", processingTime: "10–15 working days" },
  { name: "Schengen (Spain)", code: "ES", flag: "🇪🇸", processingMode: "BLS International", processingTime: "10–14 working days" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", processingMode: "VFS Biometrics", processingTime: "15–20 working days" },
  { name: "United States", code: "US", flag: "🇺🇸", processingMode: "Consular Interview", processingTime: "Interview queue + 3–5 days" },
  { name: "Canada", code: "CA", flag: "🇨🇦", processingMode: "Online Portal + Biometrics", processingTime: "20–30 working days" },
  { name: "Australia", code: "AU", flag: "🇦🇺", processingMode: "ImmiAccount eVisa", processingTime: "15–25 working days" },
  { name: "Singapore", code: "SG", flag: "🇸🇬", processingMode: "Physical Passport Submission", processingTime: "3–5 working days" },
  { name: "Thailand", code: "TH", flag: "🇹🇭", processingMode: "eVisa (Online)", processingTime: "3–7 working days" },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦", processingMode: "eVisa / Tasheer Center", processingTime: "2–5 working days" },
  { name: "Qatar", code: "QA", flag: "🇶🇦", processingMode: "Hayya eVisa Portal", processingTime: "24–48 hours" },
  { name: "Turkey", code: "TR", flag: "🇹🇷", processingMode: "eVisa / Gateway Visa Center", processingTime: "5–7 working days" },
  { name: "Japan", code: "JP", flag: "🇯🇵", processingMode: "eVISA / Embassy Submission", processingTime: "5–8 working days" },
  { name: "South Korea", code: "KR", flag: "🇰🇷", processingMode: "K-ETA / Embassy Submission", processingTime: "7–10 working days" },
  { name: "India", code: "IN", flag: "🇮🇳", processingMode: "IVAC Physical Submission", processingTime: "5–10 working days" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩", processingMode: "eVisa / VoA", processingTime: "2–3 working days" },
  { name: "Vietnam", code: "VN", flag: "🇻🇳", processingMode: "Official eVisa Portal", processingTime: "3–5 working days" },
  { name: "Egypt", code: "EG", flag: "🇪🇬", processingMode: "Embassy Visa Submission", processingTime: "7–12 working days" },
  { name: "Maldives", code: "MV", flag: "🇲🇻", processingMode: "Visa on Arrival / IMUGA", processingTime: "Instant at border" },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰", processingMode: "ETA Online Approval", processingTime: "24–48 hours" },
  { name: "Nepal", code: "NP", flag: "🇳🇵", processingMode: "Embassy / On Arrival", processingTime: "1–3 working days" },
  { name: "Brazil", code: "BR", flag: "🇧🇷", processingMode: "Consular Submission", processingTime: "10–15 working days" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿", processingMode: "Immigration Online / NZeTA", processingTime: "20–30 working days" },
  { name: "Switzerland", code: "CH", flag: "🇨🇭", processingMode: "VFS Global Appointment", processingTime: "10–15 working days" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦", processingMode: "VFS Center Submission", processingTime: "10–15 working days" },
  { name: "Oman", code: "OM", flag: "🇴🇲", processingMode: "Royal Oman Police eVisa", processingTime: "24–72 hours" },
  { name: "Kuwait", code: "KW", flag: "🇰🇼", processingMode: "eVisa / Embassy Visa", processingTime: "3–5 working days" },
  { name: "Bahrain", code: "BH", flag: "🇧🇭", processingMode: "NPRA eVisa", processingTime: "3–5 working days" },
];

export default function CountryFlagPicker({
  countryName = "",
  countryCode = "",
  countryFlag = "🌐",
  onSelectCountry,
  onChangeName,
  onChangeCode,
  onChangeFlag,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = WORLD_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handlePick = (item) => {
    onSelectCountry?.(item);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2.5">
        {/* Flag Selector Dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-lg shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="Choose country from list"
          >
            <span className="text-xl leading-none">{countryFlag || "🌐"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Searchable Dropdown Menu */}
          {open && (
            <div className="absolute left-0 top-11 z-50 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95 duration-100">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search destination country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-blue-500"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {filtered.map((item) => {
                  const isSelected = item.name.toLowerCase() === countryName.toLowerCase();
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handlePick(item)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                        isSelected
                          ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.flag}</span>
                        <span>{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.code})</span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No matching countries found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Country Name Input */}
        <div className="flex-1">
          <input
            type="text"
            required
            value={countryName}
            onChange={(e) => onChangeName?.(e.target.value)}
            placeholder="e.g. China, United Arab Emirates, Malaysia"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 shadow-2xs outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Country ISO Code */}
        <div className="w-20">
          <input
            type="text"
            maxLength={3}
            value={countryCode}
            onChange={(e) => onChangeCode?.(e.target.value.toUpperCase())}
            placeholder="CODE"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-center text-sm font-bold uppercase tracking-wider text-slate-700 shadow-2xs outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            title="2-letter ISO country code (e.g. CN, AE, MY)"
          />
        </div>
      </div>
      <p className="text-[11px] text-slate-400">
        Click flag icon to pick from standard world destinations, or enter custom destination and code.
      </p>
    </div>
  );
}
