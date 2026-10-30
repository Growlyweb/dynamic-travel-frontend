import React from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import VisaChecklistTable from '../components/VisaChecklistTable';

export default function VisaChecklist() {
  return (
    <div className="stack">
      <PageHeader breadcrumbs={[{ label: 'Visa' }, { label: 'Checklists' }]} />

      <VisaChecklistTable />
    </div>
  );
}
