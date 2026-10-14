import React from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import VisaCountriesTable from '../components/VisaCountriesTable'

export default function NewVisaCountries() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Visa Destinations"
        description="Manage visa destinations, versatile country requirements, Google Docs decorated checklists, and sample document previews."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Countries' }]}
      />
      <VisaCountriesTable />
    </div>
  )
}
