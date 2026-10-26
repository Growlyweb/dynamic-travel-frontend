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
const SetupAccount = lazy(() => import("../features/auth/pages/SetupAccount"));

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
const MessageTemplates = lazy(
  () => import("../features/visa/pages/MessageTemplates"),
);
const MessageLog = lazy(() => import("../features/visa/pages/MessageLog"));

const TourPackages = lazy(() => import("../features/tours/pages/TourPackages"));
const TourDetails = lazy(() => import("../features/tours/pages/TourDetails"));
const CreateTour = lazy(() => import("../features/tours/pages/CreateTour"));
const EditTour = lazy(() => import("../features/tours/pages/EditTour"));
const CustomTours = lazy(() => import("../features/tours/pages/CustomTours"));

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

const VendorList = lazy(() => import("../features/vendors/pages/VendorList"));
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
const AccountsHome = lazy(
  () => import("../features/reports/simple-accounts/pages/AccountsHome"),
);
const SimpleSales = lazy(
  () => import("../features/reports/simple-accounts/pages/Sales"),
);
const ClientDues = lazy(
  () => import("../features/reports/simple-accounts/pages/ClientDues"),
);
const MoneyReceipts = lazy(
  () => import("../features/reports/simple-accounts/pages/MoneyReceipts"),
);
const SimpleMonthly = lazy(
  () => import("../features/reports/simple-accounts/pages/MonthlyReport"),
);
const SimpleProfit = lazy(
  () => import("../features/reports/simple-accounts/pages/ProfitExpenses"),
);
const SimpleCategories = lazy(
  () => import("../features/reports/simple-accounts/pages/Categories"),
);
const SimplePriceList = lazy(
  () => import("../features/reports/simple-accounts/pages/PriceList"),
);
const ReportMarketing = lazy(
  () => import("../features/marketing/pages/ReportMarketing"),
);
const SimpleClients = lazy(
  () => import("../features/reports/simple-accounts/pages/ClientList"),
);
const SimplePayables = lazy(
  () => import("../features/reports/simple-accounts/pages/VendorPayables"),
);
const AccountPartners = lazy(
  () => import("../features/reports/simple-accounts/pages/Partners"),
);
const Profile = lazy(() => import("../features/settings/pages/Profile"));
const Settings = lazy(() => import("../features/settings/pages/Settings"));
const Security = lazy(() => import("../features/settings/pages/Security"));

function RequireAuth({ children }) {
  const { isAuthenticated, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loader fullPage label="Loading…" />;
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
        <Route path="/dashboard/login/staff" element={<Navigate to="/dashboard/login/admin" replace />} />
        <Route path="/login/:role" element={<Navigate to="/dashboard/login/admin" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard/login/admin" replace />} />

        <Route path="/dashboard/setup-account" element={<SetupAccount />} />

        <Route path="/dashboard/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard/forgot-password/:role" element={<Navigate to="/dashboard/forgot-password" replace />} />
        <Route path="/dashboard/reset-password/:role" element={<Navigate to="/dashboard/reset-password" replace />} />
        <Route path="/dashboard/verify-otp/:role" element={<Navigate to="/dashboard/reset-password" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/dashboard/forgot-password" replace />} />
        <Route path="/reset-password" element={<Navigate to="/dashboard/reset-password" replace />} />

        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />

          {/* Simple Accounts */}
          <Route
            path="accounts"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <AccountsHome />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/sales"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <SimpleSales />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/dues"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <ClientDues />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/receipts"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <MoneyReceipts />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/monthly"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <SimpleMonthly />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/profit"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <SimpleProfit />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/categories"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <SimpleCategories />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/price-list"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <SimplePriceList />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/agents"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <SimpleClients kind="B2B" />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/clients"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <SimpleClients kind="B2C" />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/payables"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <SimplePayables />
              </RequirePermission>
            }
          />
          <Route
            path="accounts/partners"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <AccountPartners />
              </RequirePermission>
            }
          />

          <Route
            path="users"
            element={
              <RequirePermission permission="ADMIN_ONLY">
                <Users />
              </RequirePermission>
            }
          />
          <Route
            path="users/:id"
            element={
              <RequirePermission permission="ADMIN_ONLY">
                <UserDetails />
              </RequirePermission>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <RequirePermission permission="ADMIN_ONLY">
                <UserEdit />
              </RequirePermission>
            }
          />
          <Route
            path="roles"
            element={
              <RequirePermission permission="ADMIN_ONLY">
                <RolesPermissions />
              </RequirePermission>
            }
          />

          <Route
            path="visa"
            element={
              <RequirePermission permission="VISA_VIEW">
                <VisaDashboard />
              </RequirePermission>
            }
          />
          <Route
            path="visa/applications"
            element={
              <RequirePermission permission="VISA_VIEW">
                <VisaApplications />
              </RequirePermission>
            }
          />
          <Route
            path="visa/applications/:id"
            element={
              <RequirePermission permission="VISA_VIEW">
                <VisaApplicationDetails />
              </RequirePermission>
            }
          />
          <Route
            path="visa/checklist"
            element={
              <RequirePermission permission="VISA_VIEW">
                <VisaChecklist />
              </RequirePermission>
            }
          />
          <Route
            path="visa/countries"
            element={
              <RequirePermission permission="VISA_VIEW">
                <NewVisaCountries />
              </RequirePermission>
            }
          />
          <Route
            path="visa/status-board"
            element={
              <RequirePermission permission="VISA_VIEW">
                <VisaStatus />
              </RequirePermission>
            }
          />
          <Route
            path="visa/statuses"
            element={
              <RequirePermission permission="VISA_VIEW">
                <VisaStatuses />
              </RequirePermission>
            }
          />
          <Route
            path="visa/types"
            element={
              <RequirePermission permission="VISA_VIEW">
                <VisaTypes />
              </RequirePermission>
            }
          />
          <Route
            path="visa/pricing"
            element={
              <RequirePermission permission="VISA_VIEW">
                <VisaPricing />
              </RequirePermission>
            }
          />
          <Route
            path="visa/quotations"
            element={
              <RequirePermission permission="VISA_VIEW">
                <VisaQuotations />
              </RequirePermission>
            }
          />
          <Route
            path="visa/passports"
            element={
              <RequirePermission permission="VISA_VIEW">
                <VisaPassportOperations />
              </RequirePermission>
            }
          />
          <Route
            path="visa/sms/templates"
            element={
              <RequirePermission permission="VISA_VIEW">
                <MessageTemplates />
              </RequirePermission>
            }
          />
          <Route
            path="visa/sms/logs"
            element={
              <RequirePermission permission="VISA_VIEW">
                <MessageLog />
              </RequirePermission>
            }
          />

          <Route
            path="tours/packages"
            element={
              <RequirePermission permission="TOURS_VIEW">
                <TourPackages />
              </RequirePermission>
            }
          />
          <Route
            path="tours/new"
            element={
              <RequirePermission permission="TOUR_MANAGE">
                <CreateTour />
              </RequirePermission>
            }
          />
          <Route
            path="tours/custom"
            element={
              <RequirePermission permission="TOURS_VIEW">
                <CustomTours />
              </RequirePermission>
            }
          />
          <Route
            path="tours/:id"
            element={
              <RequirePermission permission="TOURS_VIEW">
                <TourDetails />
              </RequirePermission>
            }
          />
          <Route
            path="tours/:id/edit"
            element={
              <RequirePermission permission="TOUR_MANAGE">
                <EditTour />
              </RequirePermission>
            }
          />
            <Route
            path="reports/marketing"
            element={
              <RequirePermission permission="REPORTS_VIEW">
                <ReportMarketing />
              </RequirePermission>
            }
          />
          

          <Route
            path="b2b/partners"
            element={
              <RequirePermission permission="B2B_VIEW">
                <Partners />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/partners/:id"
            element={
              <RequirePermission permission="B2B_VIEW">
                <PartnerDetails />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/applications"
            element={
              <RequirePermission permission="B2B_VIEW">
                <PartnerApplications />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/pickups"
            element={
              <RequirePermission permission="B2B_VIEW">
                <PickupRequests />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/commissions"
            element={
              <RequirePermission permission="B2B_VIEW">
                <Commissions />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/withdrawals"
            element={
              <RequirePermission permission="B2B_VIEW">
                <Withdrawals />
              </RequirePermission>
            }
          />
          <Route
            path="b2b/documents"
            element={
              <RequirePermission permission="B2B_VIEW">
                <PartnerDocuments />
              </RequirePermission>
            }
          />

          <Route
            path="b2c/customers"
            element={
              <RequirePermission permission="B2C_VIEW">
                <Customers />
              </RequirePermission>
            }
          />
          <Route
            path="b2c/customers/:id"
            element={
              <RequirePermission permission="B2C_VIEW">
                <CustomerDetails />
              </RequirePermission>
            }
          />

          <Route
            path="membership/plans"
            element={
              <RequirePermission permission="MEMBERSHIP_MANAGE">
                <MembershipPlans />
              </RequirePermission>
            }
          />
          <Route
            path="membership/members"
            element={
              <RequirePermission permission="MEMBERSHIP_MANAGE">
                <MembershipMembers />
              </RequirePermission>
            }
          />
          <Route
            path="membership/reports"
            element={
              <RequirePermission permission="MEMBERSHIP_MANAGE">
                <MembershipReports />
              </RequirePermission>
            }
          />

          {/* Vendors */}
          <Route path="vendors/dashboard" element={<Navigate to="/vendors" replace />} />
          <Route path="vendors" element={<RequirePermission permission="VENDOR_VIEW"><VendorList /></RequirePermission>} />
          <Route path="vendors/new" element={<RequirePermission permission="VENDOR_MANAGE"><VendorList openNew /></RequirePermission>} />
          <Route path="vendors/services" element={<RequirePermission permission="VENDOR_VIEW"><VendorServices /></RequirePermission>} />
          <Route path="vendors/bills" element={<RequirePermission permission="VENDOR_VIEW"><VendorBills /></RequirePermission>} />
          <Route path="vendors/payments" element={<RequirePermission permission="VENDOR_VIEW"><VendorPayments /></RequirePermission>} />
          <Route path="vendors/:id" element={<RequirePermission permission="VENDOR_VIEW"><VendorDetail /></RequirePermission>} />
          <Route path="vendors/:id/edit" element={<RequirePermission permission="VENDOR_VIEW"><VendorDetail /></RequirePermission>} />

          <Route
            path="documents"
            element={
              <RequirePermission permission="DOCUMENT_VIEW">
                <Documents />
              </RequirePermission>
            }
          />
          <Route
            path="documents/:id"
            element={
              <RequirePermission permission="DOCUMENT_VIEW">
                <DocumentDetails />
              </RequirePermission>
            }
          />

          <Route path="notifications" element={<Notifications />} />

          {/* Accounting */}
          <Route path="reports/*" element={<Navigate to="/accounts" replace />} />

          <Route path="settings" element={<RequirePermission permission="SETTINGS_VIEW"><Settings /></RequirePermission>} />
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
