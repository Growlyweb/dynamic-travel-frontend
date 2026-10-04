import LineChart from '../../../components/charts/LineChart'

export default function VisaOverview({ data = [] }) {
  return (
    <div className="card bg-card">
      <p className="card__title">Visa applications · last 12 months</p>
      <LineChart data={data} />
    </div>
  )
}
