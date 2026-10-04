import { columns } from '@/components/new-tables/columns'
import { DataTable } from '@/components/new-tables/data-table'
import React from 'react'

const data =[
  {
    id: "728ed52f",
    amount: 100,
    status: "pending",
    email: "m@example.com",
  },
  {
    id: "489e1d42",
    amount: 125,
    status: "processing",
    email: "example@gmail.com",
  },
  // ...
]

const NewVisaTable = () => {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}

export default NewVisaTable