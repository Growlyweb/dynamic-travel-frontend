import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';

/**
 * TableActions Component
 * Three signature outline action buttons (View, Update, Delete) and custom action slots.
 */
export function TableActions({
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
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md text-background bg-[var(--color-info)] hover:bg-[var(--color-info)]/90 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          title={viewLabel}
        >
          {renderIcon(viewIcon, Eye, 'w-3.5 h-3.5 text-background shrink-0')}
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
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md text-background bg-[var(--color-warning-dark)] hover:bg-[var(--color-warning)]/90 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          title={updateLabel}
        >
          {renderIcon(updateIcon, Pencil, 'w-3.5 h-3.5 text-background shrink-0')}
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
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border border-[--color-danger] text-background bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          title={deleteLabel}
        >
          {renderIcon(deleteIcon, Trash2, 'w-3.5 h-3.5 text-background shrink-0')}
          <span>{deleteLabel}</span>
        </button>
      )}

      {typeof extraActions === 'function' ? extraActions(row) : extraActions}
    </div>
  );
}

export default TableActions;
