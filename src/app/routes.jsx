import { Suspense, lazy } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Loader from '../components/common/Loader'
import { APP_ROUTES } from '../utils/constants'
import { useAuth } from '../hooks/useAuth'
import { usePermission } from '../hooks/usePermission'
import NewVisaCountries from '@/features/visa/pages/NewVisaCountries'

const Login = lazy(() => import('../features/auth/pages/Login'))
const ForgotPassword = lazy(() => import('../features/auth/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('../features/auth/pages/ResetPassword'))
const VerifyOTP = lazy(() => import('../features/auth/pages/VerifyOTP'))

const Dashboard = lazy(() => import('../features/dashboard/pages/Dashboard'))

const Users = lazy(() => import('../features/users/pages/Users'))
const UserDetails = lazy(() => import('../features/users/pages/UserDetails'))
const UserEdit = lazy(() => import('../features/users/pages/UserEdit'))

const VisaApplications = lazy(() => import('../features/visa/pages/VisaApplications'))
const VisaApplicationDetails = lazy(() => import('../features/visa/pages/VisaApplicationDetails'))
const VisaChecklist = lazy(() => import('../features/visa/pages/VisaChecklist'))
const VisaCountries = lazy(() => import('../features/visa/pages/VisaCountries'))
const VisaStatus = lazy(() => import('../features/visa/pages/VisaStatus'))

const TourPackages = lazy(() => import('../features/tours/pages/TourPackages'))
const TourDetails = lazy(() => import('../features/tours/pages/TourDetails'))
const CreateTour = lazy(() => import('../features/tours/pages/CreateTour'))
const EditTour = lazy(() => import('../features/tours/pages/EditTour'))
const CustomTours = lazy(() => import('../features/tours/pages/CustomTours'))
const CustomTourBuilder = lazy(() => import('../features/tours/pages/CustomTourBuilder'))

const Partners = lazy(() => import('../features/b2b/pages/Partners'))
const PartnerDetails = lazy(() => import('../features/b2b/pages/PartnerDetails'))
const PartnerApplications = lazy(() => import('../features/b2b/pages/PartnerApplications'))
const PickupRequests = lazy(() => import('../features/b2b/pages/PickupRequests'))
const Commissions = lazy(() => import('../features/b2b/pages/Commissions'))
const Withdrawals = lazy(() => import('../features/b2b/pages/Withdrawals'))
const PartnerDocuments = lazy(() => import('../features/b2b/pages/PartnerDocuments'))

const Customers = lazy(() => import('../features/b2c/pages/Customers'))
const CustomerDetails = lazy(() => import('../features/b2c/pages/CustomerDetails'))

const Documents = lazy(() => import('../features/documents/pages/Documents'))
const DocumentDetails = lazy(() => import('../features/documents/pages/DocumentDetails'))

const Notifications = lazy(() => import('../features/notifications/pages/Notifications'))
const Reports = lazy(() => import('../features/reports/pages/Reports'))

const Profile = lazy(() => import('../features/settings/pages/Profile'))
const Settings = lazy(() => import('../features/settings/pages/Settings'))
const Security = lazy(() => import('../features/settings/pages/Security'))

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace state={{ from: location.pathname }} />
  }
  return children
}

function RequirePermission({ permission, children }) {
  const { can } = usePermission()
  if (!can(permission)) return <Navigate to={APP_ROUTES.DASHBOARD} replace />
  return children
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Loader fullPage label="Loading…" />}>
      <Routes>
        <Route path="/" element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />
        <Route path={APP_ROUTES.LOGIN} element={<Login />} />
        <Route path={APP_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={APP_ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={APP_ROUTES.VERIFY_OTP} element={<VerifyOTP />} />

        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="users" element={<RequirePermission permission="users.view"><Users /></RequirePermission>} />
          <Route path="users/:id" element={<RequirePermission permission="users.view"><UserDetails /></RequirePermission>} />
          <Route path="users/:id/edit" element={<RequirePermission permission="users.edit"><UserEdit /></RequirePermission>} />

          <Route path="visa/applications" element={<RequirePermission permission="visa.view"><VisaApplications /></RequirePermission>} />
          <Route path="visa/applications/:id" element={<RequirePermission permission="visa.view"><VisaApplicationDetails /></RequirePermission>} />
          <Route path="visa/checklist" element={<RequirePermission permission="visa.view"><VisaChecklist /></RequirePermission>} />
          <Route path="visa/countries" element={<RequirePermission permission="visa.view"><NewVisaCountries /></RequirePermission>} />
          <Route path="visa/status" element={<RequirePermission permission="visa.view"><VisaStatus /></RequirePermission>} />

          <Route path="tours" element={<RequirePermission permission="tours.view"><TourPackages /></RequirePermission>} />
          <Route path="tours/new" element={<RequirePermission permission="tours.edit"><CreateTour /></RequirePermission>} />
          <Route path="tours/custom" element={<RequirePermission permission="tours.view"><CustomTours /></RequirePermission>} />
          <Route path="tours/custom/builder" element={<RequirePermission permission="tours.view"><CustomTourBuilder /></RequirePermission>} />
          <Route path="tours/:id" element={<RequirePermission permission="tours.view"><TourDetails /></RequirePermission>} />
          <Route path="tours/:id/edit" element={<RequirePermission permission="tours.edit"><EditTour /></RequirePermission>} />

          <Route path="b2b/partners" element={<RequirePermission permission="b2b.view"><Partners /></RequirePermission>} />
          <Route path="b2b/partners/:id" element={<RequirePermission permission="b2b.view"><PartnerDetails /></RequirePermission>} />
          <Route path="b2b/applications" element={<RequirePermission permission="b2b.view"><PartnerApplications /></RequirePermission>} />
          <Route path="b2b/pickups" element={<RequirePermission permission="b2b.view"><PickupRequests /></RequirePermission>} />
          <Route path="b2b/commissions" element={<RequirePermission permission="b2b.view"><Commissions /></RequirePermission>} />
          <Route path="b2b/withdrawals" element={<RequirePermission permission="b2b.view"><Withdrawals /></RequirePermission>} />
          <Route path="b2b/documents" element={<RequirePermission permission="b2b.view"><PartnerDocuments /></RequirePermission>} />

          <Route path="b2c/customers" element={<RequirePermission permission="b2c.view"><Customers /></RequirePermission>} />
          <Route path="b2c/customers/:id" element={<RequirePermission permission="b2c.view"><CustomerDetails /></RequirePermission>} />

          <Route path="documents" element={<RequirePermission permission="documents.view"><Documents /></RequirePermission>} />
          <Route path="documents/:id" element={<RequirePermission permission="documents.view"><DocumentDetails /></RequirePermission>} />

          <Route path="notifications" element={<Notifications />} />
          <Route path="reports" element={<RequirePermission permission="reports.view"><Reports /></RequirePermission>} />

          <Route path="settings" element={<Settings />} />
          <Route path="settings/profile" element={<Profile />} />
          <Route path="settings/security" element={<Security />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

function NotFoundPage() {
  return (
    <div className="not-found">
      <p className="not-found__code">404</p>
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist or has been moved.</p>
      <Link className="btn btn--primary" to={APP_ROUTES.DASHBOARD}>
        Back to dashboard
      </Link>
    </div>
  )
}
