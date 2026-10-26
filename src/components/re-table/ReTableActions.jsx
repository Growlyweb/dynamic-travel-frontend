import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';

/**
 * ReTableActions Component
 * Provides the three signature outline action buttons (View, Update, Delete)
 * exactly styled after the screenshot, along with custom action slots.
 */
export function ReTableActions({
  row,
  onView,
  onUpdate,
  onDelete,
  showView = true,
  showUpdate = true,
  showDelete = true,
  viewLabel = 'View',
  updateLabel = 'Update',
  deleteLabel = 'Delete',
  viewIcon,
  updateIcon,
  deleteIcon,
  disabled = false,
  extraActions,
  className = '',
}) {
  const renderIcon = (customIcon, DefaultIcon, iconClass) => {
    const Resolved = customIcon !== undefined ? customIcon : DefaultIcon;
    if (!Resolved) return null;
    if (React.isValidElement(Resolved)) return Resolved;
    return <Resolved className={iconClass} />;
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showView && onView && (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onView(row);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border border-[#60A5FA] text-[#2563EB] bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          title={viewLabel}
        >
          {renderIcon(viewIcon, Eye, 'w-3.5 h-3.5 text-[#2563EB] shrink-0')}
          <span>{viewLabel}</span>
        </button>
      )}

      {showUpdate && onUpdate && (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onUpdate(row);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border border-[#FBBF24] text-[#D97706] bg-white hover:bg-amber-50 active:bg-amber-100 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          title={updateLabel}
        >
          {renderIcon(updateIcon, Pencil, 'w-3.5 h-3.5 text-[#D97706] shrink-0')}
          <span>{updateLabel}</span>
        </button>
      )}

      {showDelete && onDelete && (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border border-[#F87171] text-[#DC2626] bg-white hover:bg-rose-50 active:bg-rose-100 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          title={deleteLabel}
        >
          {renderIcon(deleteIcon, Trash2, 'w-3.5 h-3.5 text-[#DC2626] shrink-0')}
          <span>{deleteLabel}</span>
        </button>
      )}

      {typeof extraActions === 'function' ? extraActions(row) : extraActions}
    </div>
  );
}

export default ReTableActions;
