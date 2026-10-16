import React from 'react';
import { Plus, ClipboardCheck } from 'lucide-react';

/**
 * TableHeader Component
 * Title block with dark icon container, title, subtitle, and primary action button.
 */
export function TableHeader({
  title,
  subtitle,
  icon,
  actionText,
  onAction,
  actionIcon,
  actionDisabled = false,
  extraActions,
  className = '',
}) {
  const Icon = icon !== undefined ? icon : ClipboardCheck;
  const ActionIcon = actionIcon !== undefined ? actionIcon : Plus;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 ${className}`}>
      {/* Title & Icon */}
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-[#0B192C] flex items-center justify-center text-white shrink-0 shadow-xs">
            {React.isValidElement(Icon) ? (
              Icon
            ) : (
              <Icon className="w-6 h-6 stroke-[2]" />
            )}
          </div>
        )}
        <div>
          {title && <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>}
          {subtitle && <p className="text-sm text-slate-500 font-normal mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {extraActions}

        {actionText && onAction && (
          <button
            type="button"
            disabled={actionDisabled}
            onClick={onAction}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0066FF] hover:bg-[#0055D6] active:bg-[#0047B3] text-white shadow-sm hover:shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ActionIcon && (
              React.isValidElement(ActionIcon) ? ActionIcon : <ActionIcon className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{actionText}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default TableHeader;
