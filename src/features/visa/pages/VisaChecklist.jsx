import React from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import { VisaChecklistTable } from '../../../components/re-table';

export default function VisaChecklist() {
  return (
    <div className="stack">
      <PageHeader
        // title="Checklists"
        breadcrumbs={[{ label: 'Visa' }, { label: 'Checklists' }]}
      />

      <VisaChecklistTable />
    </div>
  );
}
