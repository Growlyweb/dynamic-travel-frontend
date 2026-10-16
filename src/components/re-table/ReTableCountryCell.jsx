import React from 'react';

/**
 * High-resolution SVG flags for countries commonly shown in visa tables.
 * Using inline SVGs ensures crisp, pixel-perfect rendering across all OSes (including Windows).
 */
const COUNTRY_FLAGS = {
  CN: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="30" height="20" fill="#DE2910" />
      {/* Big star */}
      <polygon
        fill="#FFDE00"
        points="5,2 6.18,5.62 9.8,5.62 6.87,7.76 7.98,11.38 5,9.14 2.02,11.38 3.13,7.76 0.2,5.62 3.82,5.62"
      />
      {/* 4 small stars */}
      <circle cx="10" cy="2.5" r="0.9" fill="#FFDE00" />
      <circle cx="12" cy="4.5" r="0.9" fill="#FFDE00" />
      <circle cx="12" cy="7.5" r="0.9" fill="#FFDE00" />
      <circle cx="10" cy="9.5" r="0.9" fill="#FFDE00" />
    </svg>
  ),
  JP: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="30" height="20" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </svg>
  ),
  IN: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.3" fill="none" stroke="#000080" strokeWidth="0.5" />
      <circle cx="15" cy="10" r="0.6" fill="#000080" />
    </svg>
  ),
  TH: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="30" height="3.33" fill="#A51931" />
      <rect y="3.33" width="30" height="3.33" fill="#F4F5F8" />
      <rect y="6.67" width="30" height="6.67" fill="#2D2A4A" />
      <rect y="13.33" width="30" height="3.33" fill="#F4F5F8" />
      <rect y="16.67" width="30" height="3.33" fill="#A51931" />
    </svg>
  ),
  MY: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      {/* 14 red & white stripes */}
      <rect width="30" height="20" fill="#CC0001" />
      <rect y="1.43" width="30" height="1.43" fill="#FFFFFF" />
      <rect y="4.29" width="30" height="1.43" fill="#FFFFFF" />
      <rect y="7.14" width="30" height="1.43" fill="#FFFFFF" />
      <rect y="10" width="30" height="1.43" fill="#FFFFFF" />
      <rect y="12.86" width="30" height="1.43" fill="#FFFFFF" />
      <rect y="15.71" width="30" height="1.43" fill="#FFFFFF" />
      <rect y="18.57" width="30" height="1.43" fill="#FFFFFF" />
      {/* Blue canton */}
      <rect width="15" height="11.43" fill="#010066" />
      {/* Yellow crescent and star */}
      <circle cx="6.5" cy="5.7" r="3.4" fill="#FFCC00" />
      <circle cx="7.5" cy="5.7" r="2.9" fill="#010066" />
      <circle cx="10" cy="5.7" r="1.8" fill="#FFCC00" />
    </svg>
  ),
  SG: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="30" height="10" fill="#ED2939" />
      <rect y="10" width="30" height="10" fill="#FFFFFF" />
      {/* Crescent */}
      <circle cx="6" cy="5" r="3.2" fill="#FFFFFF" />
      <circle cx="7.1" cy="5" r="2.9" fill="#ED2939" />
      {/* 5 mini stars */}
      <circle cx="8" cy="3.5" r="0.5" fill="#FFFFFF" />
      <circle cx="9.2" cy="4.2" r="0.5" fill="#FFFFFF" />
      <circle cx="9" cy="5.6" r="0.5" fill="#FFFFFF" />
      <circle cx="7.8" cy="6" r="0.5" fill="#FFFFFF" />
      <circle cx="8.3" cy="4.8" r="0.5" fill="#FFFFFF" />
    </svg>
  ),
  AE: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="30" height="6.67" fill="#00732F" />
      <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
      <rect y="13.33" width="30" height="6.67" fill="#000000" />
      <rect width="7.5" height="20" fill="#FF0000" />
    </svg>
  ),
  SA: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="30" height="20" fill="#006C35" />
      {/* Stylized Shahada / sword */}
      <rect x="7" y="13" width="16" height="1.2" fill="#FFFFFF" rx="0.5" />
      <polygon points="23,13.6 21,12 21,15" fill="#FFFFFF" />
      <text x="15" y="10.5" fill="#FFFFFF" fontSize="4.5" textAnchor="middle" fontWeight="bold">لا إله إلا الله</text>
    </svg>
  ),
  GB: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <clipPath id="gb-clip">
        <rect width="30" height="20" />
      </clipPath>
      <g clipPath="url(#gb-clip)">
        <rect width="30" height="20" fill="#012169" />
        <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" strokeWidth="3.5" />
        <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.8" />
        <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.6" />
      </g>
    </svg>
  ),
  US: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="30" height="20" fill="#B22234" />
      <rect y="1.54" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="4.62" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="7.69" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="10.77" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="13.85" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="16.92" width="30" height="1.54" fill="#FFFFFF" />
      <rect width="12" height="10.77" fill="#3C3B6E" />
      {/* 9 star dots in canton */}
      <circle cx="2.5" cy="2.2" r="0.6" fill="#FFFFFF" />
      <circle cx="6" cy="2.2" r="0.6" fill="#FFFFFF" />
      <circle cx="9.5" cy="2.2" r="0.6" fill="#FFFFFF" />
      <circle cx="4.2" cy="5.4" r="0.6" fill="#FFFFFF" />
      <circle cx="7.7" cy="5.4" r="0.6" fill="#FFFFFF" />
      <circle cx="2.5" cy="8.6" r="0.6" fill="#FFFFFF" />
      <circle cx="6" cy="8.6" r="0.6" fill="#FFFFFF" />
      <circle cx="9.5" cy="8.6" r="0.6" fill="#FFFFFF" />
    </svg>
  ),
  CA: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="7.5" height="20" fill="#FF0000" />
      <rect x="7.5" width="15" height="20" fill="#FFFFFF" />
      <rect x="22.5" width="7.5" height="20" fill="#FF0000" />
      <polygon points="15,4 16.5,8 19,7 17.5,10 20,11.5 16.5,13 16.5,16 13.5,16 13.5,13 10,11.5 12.5,10 11,7 13.5,8" fill="#FF0000" />
    </svg>
  ),
  AU: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="30" height="20" fill="#00008B" />
      {/* Mini Union Jack canton */}
      <rect width="15" height="10" fill="#012169" />
      <path d="M0,0 L15,10 M15,0 L0,10" stroke="#FFFFFF" strokeWidth="1.8" />
      <path d="M0,0 L15,10 M15,0 L0,10" stroke="#C8102E" strokeWidth="0.9" />
      <path d="M7.5,0 V10 M0,5 H15" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M7.5,0 V10 M0,5 H15" stroke="#C8102E" strokeWidth="1.8" />
      {/* Commonwealth Star */}
      <circle cx="7.5" cy="15" r="2.2" fill="#FFFFFF" />
      {/* Southern cross stars */}
      <circle cx="23" cy="3" r="0.8" fill="#FFFFFF" />
      <circle cx="20" cy="7" r="0.8" fill="#FFFFFF" />
      <circle cx="25" cy="9" r="0.8" fill="#FFFFFF" />
      <circle cx="22" cy="14" r="0.8" fill="#FFFFFF" />
    </svg>
  ),
  FR: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="10" height="20" fill="#002654" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </svg>
  ),
  DE: (
    <svg viewBox="0 0 30 20" className="w-full h-full object-cover">
      <rect width="30" height="6.67" fill="#000000" />
      <rect y="6.67" width="30" height="6.67" fill="#DD0000" />
      <rect y="13.33" width="30" height="6.67" fill="#FFCE00" />
    </svg>
  ),
};

const COUNTRY_CODE_MAP = {
  'china': 'CN',
  'japan': 'JP',
  'india': 'IN',
  'thailand': 'TH',
  'malaysia': 'MY',
  'singapore': 'SG',
  'uae': 'AE',
  'united arab emirates': 'AE',
  'saudi arabia': 'SA',
  'united kingdom': 'GB',
  'uk': 'GB',
  'united states': 'US',
  'usa': 'US',
  'canada': 'CA',
  'australia': 'AU',
  'france': 'FR',
  'germany': 'DE',
};

/**
 * ReTableCountryCell Component
 * Renders a crisp country flag inside a rounded card + bold country name
 */
export function ReTableCountryCell({
  name,
  code,
  flag,
  className = '',
  textClassName = 'font-semibold text-slate-800 text-sm',
}) {
  const normalizedCode = (
    code ||
    (name ? COUNTRY_CODE_MAP[name.trim().toLowerCase()] : null) ||
    ''
  ).toUpperCase();

  const svgFlag = COUNTRY_FLAGS[normalizedCode];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="w-7 h-5 rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.12)] border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center bg-slate-100"
        aria-hidden="true"
      >
        {svgFlag ? (
          svgFlag
        ) : typeof flag === 'string' && flag.startsWith('http') ? (
          <img src={flag} alt={name || 'Flag'} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm leading-none">{flag || '🌐'}</span>
        )}
      </span>
      {name && <span className={textClassName}>{name}</span>}
    </div>
  );
}

export default ReTableCountryCell;
