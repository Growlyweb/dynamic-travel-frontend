import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import OverviewCards from '../components/OverviewCards'
import VisaOverview from '../components/VisaOverview'
import TourOverview from '../components/TourOverview'
import RecentApplications from '../components/RecentApplications'
import RecentActivities from '../components/RecentActivities'
import { dashboardApi } from '../../dashboard/dashboard.api'
import { getApiErrorMessage } from '../../../utils/helpers'
import { usePermission } from '../../../hooks/usePermission'

export default function Dashboard() {
  const { can } = usePermission()
  const [data, setData] = useState({
    overview: {},
    visaTrend: [],
    tourTrend: [],
    recentApplications: [],
    recentActivities: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overview, visaTrend, tourTrend, recentApplications, recentActivities] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getVisaTrend(),
        dashboardApi.getTourTrend(),
        dashboardApi.getRecentApplications(),
        dashboardApi.getRecentActivities(),
      ])
      setData({
        overview: overview ?? {},
        visaTrend: Array.isArray(visaTrend) ? visaTrend : visaTrend?.items ?? [],
        tourTrend: Array.isArray(tourTrend) ? tourTrend : tourTrend?.items ?? [],
        recentApplications: Array.isArray(recentApplications) ? recentApplications : recentApplications?.items ?? [],
        recentActivities: Array.isArray(recentActivities) ? recentActivities : recentActivities?.items ?? [],
      })
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Loader fullPage label="Loading dashboard…" />
  if (error) return <ErrorState title="Could not load the dashboard" message={getApiErrorMessage(error)} onRetry={load} />

  const showVisa = can('visa.view')
  const showTours = can('tours.view')

  return (
    <div className="stack bg-background">
      <PageHeader title="Dashboard" />
      
      {/* Overview Cards filter inside according to permissions */}
      <OverviewCards overview={data.overview} />

      {(showVisa || showTours) && (
        <div className="grid grid--2">
          {showVisa && <VisaOverview data={data.visaTrend} />}
          {showTours && <TourOverview data={data.tourTrend} />}
        </div>
      )}

      <div className="grid grid--2">
        {showVisa && <RecentApplications items={data.recentApplications} />}
        <RecentActivities items={data.recentActivities} />
      </div>
    </div>
  )
}
