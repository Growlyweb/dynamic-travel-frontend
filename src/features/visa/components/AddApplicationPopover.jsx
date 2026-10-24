import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewApplicationModal } from './NewApplicationModal';

/**
 * AddApplicationPopover / AddApplicationTrigger
 * Entry button and modal launcher for "+ Add application" on the Visa Applications page.
 * Uses the dynamic NewApplicationModal component.
 */
export function AddApplicationPopover({
  countryOptions = [],
  onCreated,
  className = '',
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0066FF] hover:bg-[#0055D6] active:bg-[#0047B3] text-white shadow-sm hover:shadow transition-all duration-150 cursor-pointer ${className}`}
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Add application</span>
      </button>

      <NewApplicationModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
        countryOptions={countryOptions}
      />
    </>
  );
}

export { NewApplicationModal, NewApplicationModal as AddApplicationModal } from './NewApplicationModal';
export default AddApplicationPopover;
