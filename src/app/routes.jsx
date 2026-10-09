import { Suspense, lazy } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import Loader from "../components/common/Loader";
import { APP_ROUTES } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";
import { usePermission } from "../hooks/usePermission";
import NewVisaCountries from "@/features/visa/pages/NewVisaCountries";

const Login = lazy(() => import("../features/auth/pages/Login"));
const ForgotPassword = lazy(
  () => import("../features/auth/pages/ForgotPassword"),
);
const ResetPassword = lazy(
  () => import("../features/auth/pages/ResetPassword"),
);
const VerifyOTP = lazy(() => import("../features/auth/pages/VerifyOTP"));

const Dashboard = lazy(() => import("../features/dashboard/pages/Dashboard"));

const Users = lazy(() => import("../features/users/pages/Users"));
const UserDetails = lazy(() => import("../features/users/pages/UserDetails"));
const UserEdit = lazy(() => import("../features/users/pages/UserEdit"));
const RolesPermissions = lazy(
  () => import("../features/users/pages/RolesPermissions"),
);

const VisaDashboard = lazy(() => import("../features/visa/pages/VisaDashboard"));
const VisaApplications = lazy(
  () => import("../features/visa/pages/VisaApplications"),
);
const VisaApplicationDetails = lazy(
  () => import("../features/visa/pages/VisaApplicationDetails"),
);
const VisaChecklist = lazy(
  () => import("../features/visa/pages/VisaChecklist"),
);
const VisaStatus = lazy(() => import("../features/visa/pages/VisaStatus"));
const VisaStatuses = lazy(() => import("../features/visa/pages/VisaStatuses"));
const VisaTypes = lazy(() => import("../features/visa/pages/VisaTypes"));
const VisaPricing = lazy(() => import("../features/visa/pages/VisaPricing"));
const VisaQuotations = lazy(
  () => import("../features/visa/pages/VisaQuotations"),
);
const VisaPassportOperations = lazy(
  () => import("../features/visa/pages/VisaPassportOperations"),
);
const SmsTemplates = lazy(
  () => import("../features/visa/pages/SmsTemplates"),
);
const SmsLogs = lazy(() => import("../features/visa/pages/SmsLogs"));

const TourPackages = lazy(() => import("../features/tours/pages/TourPackages"));
const TourDetails = lazy(() => import("../features/tours/pages/TourDetails"));
const CreateTour = lazy(() => import("../features/tours/pages/CreateTour"));
const EditTour = lazy(() => import("../features/tours/pages/EditTour"));
const CustomTours = lazy(() => import("../features/tours/pages/CustomTours"));
const CustomTourBuilder = lazy(
  () => import("../features/tours/pages/CustomTourBuilder"),
);

const Partners = lazy(() => import("../features/b2b/pages/Partners"));
const PartnerDetails = lazy(
  () => import("../features/b2b/pages/PartnerDetails"),
);
const PartnerApplications = lazy(
  () => import("../features/b2b/pages/PartnerApplications"),
);
const PickupRequests = lazy(
  () => import("../features/b2b/pages/PickupRequests"),
);
const Commissions = lazy(() => import("../features/b2b/pages/Commissions"));
const Withdrawals = lazy(() => import("../features/b2b/pages/Withdrawals"));
const PartnerDocuments = lazy(
  () => import("../features/b2b/pages/PartnerDocuments"),
);

const Customers = lazy(() => import("../features/b2c/pages/Customers"));
const CustomerDetails = lazy(
  () => import("../features/b2c/pages/CustomerDetails"),
);

const MembershipPlans = lazy(
  () => import("../features/membership/pages/MembershipPlans"),
);
const MembershipMembers = lazy(
  () => import("../features/membership/pages/MembershipMembers"),
);
const MembershipReports = lazy(
  () => import("../features/membership/pages/MembershipReports"),
);

const VendorDashboard = lazy(
  () => import("../features/vendors/pages/VendorDashboard"),
);
const VendorList = lazy(() => import("../features/vendors/pages/VendorList"));
const VendorForm = lazy(() => import("../features/vendors/pages/VendorForm"));
const VendorServices = lazy(
  () => import("../features/vendors/pages/VendorServices"),
);
const VendorBills = lazy(() => import("../features/vendors/pages/VendorBills"));
const VendorPayments = lazy(
  () => import("../features/vendors/pages/VendorPayments"),
);
const VendorDetail = lazy(
  () => import("../features/vendors/pages/VendorDetail"),
);

const Documents = lazy(() => import("../features/documents/pages/Documents"));
const DocumentDetails = lazy(
  () => import("../features/documents/pages/DocumentDetails"),
);

const Notifications = lazy(
  () => import("../features/notifications/pages/Notifications"),
);
const Reports = lazy(() => import("../features/reports/pages/Reports"));

const Profile = lazy(() => import("../features/settings/pages/Profile"));
const Settings = lazy(() => import("../features/settings/pages/Settings"));
const Security = lazy(() => import("../features/settings/pages/Security"));

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return (
      <Navigate
        to={APP_ROUTES.LOGIN_ADMIN}
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  return children;
}

function RequirePermission({ permission, children }) {
  const { can } = usePermission();
  if (!can(permission)) return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Loader fullPage label="Loading…" />}>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={APP_ROUTES.DASHBOARD} replace />}
        />
        <Route path="/dashboard/login/admin" element={<Login />} />
        <Route path="/dashboard/login/staff" element={<Login />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/login" element={<Navigate to="/dashboard/login/admin" replace />} />

        <Route path="/dashboard/forgot-password/:role" element={<ForgotPassword />} />
        <Route path="/forgot-password/:role" element={<ForgotPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard/verify-otp/:role" element={<VerifyOTP />} />
        <Route path="/verify-otp/:role" element={<VerifyOTP />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />

        <Route path="/dashboard/reset-password/:role" element={<ResetPassword />} />
        <Route path="/reset-password/:role" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />

          <Route
            path="users"
            element={
              <RequirePermission permission="users.view">
                <Users />
              </RequirePermission>
            }
          />
          <Route
            path="users/:id"
            element={
              <RequirePermission permission="users.view">
                <UserDetails />
              </RequirePermission>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <RequirePermission permission="users.edit">
                <UserEdit />
              </RequirePermission>
            }
          />
          <Route
            path="roles"
            element={
              <RequirePermission permission="users.view">
                <RolesPermissions />
              </RequirePermission>
            }
          />

          <Route
            path="visa"
            element={
              <RequirePermission permission="visa.view">
                <VisaDashboard />
              </RequirePermission>
            }
          />
          <Route
            path="visa/applications"
            element={
              <RequirePermission permission="visa.view">
                <VisaApplications />
              </RequirePermission>
            }
          />
          <Route
            path="visa/applications/:id"
            element={
              <RequirePermission permission="visa.view">
                <VisaApplicationDetails />
              </RequirePermission>
            }
          />
          <Route
            path="visa/checklist"
            element={
              <RequirePermission permission="visa.view">
                <VisaChecklist />
              </RequirePermission>
            }
          />
          <Route
            path="visa/countries"
            element={
              <RequirePermission permission="visa.view">
                <NewVisaCountries />
              </RequirePermission>
            }
          />
          <Route
            path="visa/status-board"
            element={
              <RequirePermission permission="visa.view">
                <VisaStatus />
              </RequirePermission>
            }
          />
          <Route
            path="visa/statuses"
            element={
              <RequirePermission permission="visa.view">
                <VisaStatuses />
              </RequirePermission>
            }
          />
          <Route
            path="visa/types"
            element={
              <RequirePermission permission="visa.view">
                <VisaTypes />
              </RequirePermission>
            }
          />
          <Route
            path="visa/pricing"
            element={
              <RequirePermission permission="visa.view">
                <VisaPricing />
              </RequirePermission>
            }
          />
          <Route
            path="visa/quotations"
            element={
              <RequirePermission permission="visa.view">
                <VisaQuotations />
              </RequirePermission>
            }
          />
          <Route
            path="visa/passports"
            element={
              <RequirePermission permission="visa.view">
                <VisaPassportOperations />
              </RequirePermission>
            }
          />
          <Route
            path="visa/sms/templates"
            element={
              <RequirePermission permission="visa.view">
                <SmsTemplates />
              </RequirePermission>
            }
          />
          <Route
            path="visa/sms/logs"
            element={
              <RequirePermission permission="visa.view">
                <SmsLogs />
              </RequirePermission>
            }
          />

          <Route
            path="tours"
            element={
              <RequirePermission permission="tours.view">
                <TourPackages />
              </RequirePermission>
            }
          />
          <Route
            path="tours/new"
            element={
              <RequirePermission permission="tours.edit">
                <CreateTour />
              </RequirePermission>
            }
          />
          <Route
            path="tours/custom"
            element={
              <RequirePermission permission="tours.view">
                <CustomTours />
              </RequirePermission>
            }
          />
          <Route
            path="tours/custom/builder"
            element={
              <RequirePermission permission="tours.view">
                <CustomTourBuilder />
              </RequirePermission>
            }
          />
          <Route
            path="tours/:id"
            element={
              <RequirePermission permission="tours.view">
                <TourDetails />
              </RequirePermission>
            }
          />
          <Route
            path="tours/:id/edit"
            element={
              <RequirePermission permission="tours.edit">
                <EditTour />
              </RequirePermission>
            }
          />

          <Route
            path="b2b/partners"
            element={
              <RequirePermission permission="b2b.view">
                <Partners />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/partners/:id"
            element={
              <RequirePermission permission="b2b.view">
                <PartnerDetails />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/applications"
            element={
              <RequirePermission permission="b2b.view">
                <PartnerApplications />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/pickups"
            element={
              <RequirePermission permission="b2b.view">
                <PickupRequests />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/commissions"
            element={
              <RequirePermission permission="b2b.view">
                <Commissions />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/withdrawals"
            element={
              <RequirePermission permission="b2b.view">
                <Withdrawals />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/documents"
            element={
              <RequirePermission permission="b2b.view">
                <PartnerDocuments />
              </RequirePermission>
            }
          />

          <Route
            path="b2c/customers"
            element={
              <RequirePermission permission="b2c.view">
                <Customers />
              </RequirePermission>
            }
          />
          <Route
            path="b2c/customers/:id"
            element={
              <RequirePermission permission="b2c.view">
                <CustomerDetails />
              </RequirePermission>
            }
          />

          <Route
            path="membership/plans"
            element={
              <RequirePermission permission="memberships.view">
                <MembershipPlans />
              </RequirePermission>
            }
          />
          <Route
            path="membership/members"
            element={
              <RequirePermission permission="memberships.view">
                <MembershipMembers />
              </RequirePermission>
            }
          />
          <Route
            path="membership/reports"
            element={
              <RequirePermission permission="memberships.view">
                <MembershipReports />
              </RequirePermission>
            }
          />

          {/* Vendors */}
          <Route path="vendors/dashboard" element={<VendorDashboard />} />
          <Route path="vendors" element={<VendorList />} />
          <Route path="vendors/new" element={<VendorForm />} />
          <Route path="vendors/services" element={<VendorServices />} />
          <Route path="vendors/bills" element={<VendorBills />} />
          <Route path="vendors/payments" element={<VendorPayments />} />
          <Route path="vendors/:id" element={<VendorDetail />} />
          <Route path="vendors/:id/edit" element={<VendorForm />} />

          <Route
            path="documents"
            element={
              <RequirePermission permission="documents.view">
                <Documents />
              </RequirePermission>
            }
          />
          <Route
            path="documents/:id"
            element={
              <RequirePermission permission="documents.view">
                <DocumentDetails />
              </RequirePermission>
            }
          />

          <Route path="notifications" element={<Notifications />} />
          <Route
            path="reports"
            element={
              <RequirePermission permission="reports.view">
                <Reports />
              </RequirePermission>
            }
          />

          <Route path="settings" element={<Settings />} />
          <Route path="settings/profile" element={<Profile />} />
          <Route path="settings/security" element={<Security />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function NotFoundPage() {
  return (
    <div className="not-found">
      <p className="not-found__code">404</p>
      <h1>Page not found</h1>
      <p className="muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link className="btn btn--primary" to={APP_ROUTES.DASHBOARD}>
        Back to dashboard
      </Link>
    </div>
  );
}
