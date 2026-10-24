import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check, Globe } from 'lucide-react';
import { fetchCountries } from '../../services/countries.service';

/**
 * CountrySelect Component
 * Fetches real country data & flags via restcountries/flagcdn API with search and fallback
 */
export function CountrySelect({
  value = 'China',
  countryCode = 'CN',
  onChange,
  className = '',
}) {
  const [countries, setCountries] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchCountries().then((list) => {
      if (active) {
        setCountries(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountry = countries.find(
    (c) =>
      c.name.toLowerCase() === (value || '').toLowerCase() ||
      c.code.toUpperCase() === (countryCode || '').toUpperCase()
  ) || {
    name: value || 'China',
    code: countryCode || 'CN',
    flag: `https://flagcdn.com/w40/${(countryCode || 'cn').toLowerCase()}.png`,
  };

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-4.5 rounded shadow-2xs border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center bg-slate-100">
            {selectedCountry.flag ? (
              <img
                src={selectedCountry.flag}
                alt={selectedCountry.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <Globe className="w-3.5 h-3.5 text-slate-400" />
            )}
          </span>
          <span className="font-medium text-slate-800 truncate">{selectedCountry.name}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {/* Dropdown Menu with Search */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                autoFocus
                placeholder="Search country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Countries list */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading countries...</div>
            ) : filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No countries found</div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected =
                  c.name.toLowerCase() === selectedCountry.name.toLowerCase();
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange?.(c);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-3.5 rounded border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center bg-slate-100">
                        {c.flag ? (
                          <img
                            src={c.flag}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Globe className="w-3 h-3 text-slate-400" />
                        )}
                      </span>
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({c.code})</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CountrySelect;
