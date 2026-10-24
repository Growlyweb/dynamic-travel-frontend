import React from 'react';

/**
 * TableBadge Component
 * 1. type="status": Pill with indicator dot (Active, Inactive, Pending, etc.)
 * 2. type="pill": Smooth rounded badge for tags/types (Multiple, Single, etc.)
 */

const STATUS_VARIANTS = {
  active: {
    container: 'bg-[#ECFDF5] text-[#15803D] border-[#D1FAE5]',
    dot: 'bg-[#22C55E]',
  },
  inactive: {
    container: 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]',
    dot: 'bg-[#EF4444]',
  },
  pending: {
    container: 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]',
    dot: 'bg-[#F59E0B]',
  },
  paused: {
    container: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    dot: 'bg-[#94A3B8]',
  },
  success: {
    container: 'bg-[#ECFDF5] text-[#15803D] border-[#D1FAE5]',
    dot: 'bg-[#22C55E]',
  },
  warning: {
    container: 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]',
    dot: 'bg-[#F59E0B]',
  },
  danger: {
    container: 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]',
    dot: 'bg-[#EF4444]',
  },
  info: {
    container: 'bg-[#EBF5FF] text-[#2563EB] border-[#DBEAFE]',
    dot: 'bg-[#3B82F6]',
  },
};

const PILL_VARIANTS = {
  blue: 'bg-[#EBF5FF] text-[#2563EB] border-[#DBEAFE]',
  gray: 'bg-[#F1F3F5] text-[#475569] border-[#E2E8F0]',
  green: 'bg-[#ECFDF5] text-[#15803D] border-[#D1FAE5]',
  amber: 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]',
  purple: 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]',
  rose: 'bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]',
};

export function TableBadge({
  children,
  type = 'pill',
  variant = 'blue',
  showDot = true,
  dotPulse = false,
  className = '',
  ...props
}) {
  if (type === 'status') {
    const normalizedVariant = String(variant).toLowerCase();
    const config = STATUS_VARIANTS[normalizedVariant] || STATUS_VARIANTS.active;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.container} ${className}`}
        {...props}
      >
        {showDot && (
          <span className="relative flex h-2 w-2">
            {dotPulse && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}
              />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
          </span>
        )}
        <span>{children}</span>
      </span>
    );
  }

  const normalizedVariant = String(variant).toLowerCase();
  const colorClass = PILL_VARIANTS[normalizedVariant] || PILL_VARIANTS.gray;

  return (
    <span
      className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-medium border ${colorClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default TableBadge;
