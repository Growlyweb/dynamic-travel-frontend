import React from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import { ReTablePreview } from '../../../components/re-table';

export default function ReTablePreviewPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] min-h-screen space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Reusable Table Preview"
          description="Interactive demonstration of the newly generated reusable table components (@/components/re-table) matching the Visa Check List design."
          breadcrumbs={[
            { label: 'Components' },
            { label: 're-table' },
            { label: 'Preview' },
          ]}
        />
        <ReTablePreview />
      </div>
    </div>
  );
}
