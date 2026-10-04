import { config } from '../../app/config'
import { apiClient } from '../../services/apiClient'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Demo payloads so the dashboard is populated while VITE_ENABLE_MOCKS=true.
const DEMO = {
  overview: {
    totalVisaApplications: 1284,
    visaDelta: '+8.2%',
    activeTours: 48,
    tourDelta: '+4.6%',
    totalCustomers: 2310,
    customerDelta: '+12.1%',
    revenueThisMonth: 84500,
    revenueDelta: '+6.8%',
  },
  visaTrend: MONTHS.map((label, index) => ({
    label,
    value: 60 + Math.round(40 * Math.sin(index / 1.8)) + index * 4,
  })),
  tourTrend: MONTHS.slice(0, 8).map((label, index) => ({
    label,
    value: 18 + ((index * 7) % 23),
  })),
  recentApplications: [
    {
      id: 'visa_501',
      reference: 'VS-2026-0501',
      applicant: 'Rohan Gupta',
      country: 'United Arab Emirates',
      submittedAt: '2026-10-01T09:24:00Z',
      status: 'in_review',
    },
    {
      id: 'visa_502',
      reference: 'VS-2026-0502',
      applicant: 'Sara Ali',
      country: 'Schengen (France)',
      submittedAt: '2026-09-30T15:02:00Z',
      status: 'approved',
    },
    {
      id: 'visa_503',
      reference: 'VS-2026-0503',
      applicant: 'Tom Becker',
      country: 'United Kingdom',
      submittedAt: '2026-09-29T11:40:00Z',
      status: 'action_required',
    },
    {
      id: 'visa_504',
      reference: 'VS-2026-0504',
      applicant: 'Nina Roy',
      country: 'Singapore',
      submittedAt: '2026-09-28T08:12:00Z',
      status: 'submitted',
    },
  ],
  recentActivities: [
    { id: 'act_1', actor: 'Priya Nair', action: 'approved visa VS-2026-0491 for Leh Cohen', at: '2026-10-02T10:05:00Z' },
    { id: 'act_2', actor: 'Daniel Osei', action: 'published tour package "Swiss Alps Explorer"', at: '2026-10-02T08:44:00Z' },
    { id: 'act_3', actor: 'System', action: 'received a withdrawal request from Skyline Travels', at: '2026-10-01T16:30:00Z' },
    { id: 'act_4', actor: 'Mei Chen', action: 'uploaded 3 documents for visa VS-2026-0488', at: '2026-10-01T09:18:00Z' },
    { id: 'act_5', actor: 'Alex Morgan', action: 'invited a new user lucas@example.com', at: '2026-09-30T14:02:00Z' },
  ],
}

export const dashboardApi = {
  getOverview: () => (config.enableMocks ? DEMO.overview : apiClient.get('/dashboard/overview')),
  getVisaTrend: () => (config.enableMocks ? DEMO.visaTrend : apiClient.get('/dashboard/visa-trend')),
  getTourTrend: () => (config.enableMocks ? DEMO.tourTrend : apiClient.get('/dashboard/tour-trend')),
  getRecentApplications: () =>
    config.enableMocks ? DEMO.recentApplications : apiClient.get('/dashboard/recent-applications'),
  getRecentActivities: () =>
    config.enableMocks ? DEMO.recentActivities : apiClient.get('/dashboard/recent-activities'),
}
