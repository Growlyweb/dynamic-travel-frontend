import React from 'react';

/**
 * ReTableCard Component
 * Modern card container providing the rounded white background, soft shadow,
 * and clean spacing seen in the design image.
 */
export function ReTableCard({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 md:p-8 space-y-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default ReTableCard;
