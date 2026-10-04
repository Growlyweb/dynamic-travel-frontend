import BarChart from '../../../components/charts/BarChart'

export default function TourOverview({ data = [] }) {
  return (
    <div className="card">
      <p className="card__title">Tour bookings · this season</p>
      <BarChart data={data} />
    </div>
  )
}
