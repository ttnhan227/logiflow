import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { authService } from './services';

import MainLayout from './components/MainLayout';
import HomePage from './components/home/HomePage';

const AdminSideNav = lazy(() => import('./components/admin/AdminSideNav'));
const DispatchLayout = lazy(() => import('./components/dispatch/DispatchLayout'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const AboutPage = lazy(() => import('./components/home/AboutPage'));
const ServicesPage = lazy(() => import('./components/home/ServicesPage'));
const FleetPage = lazy(() => import('./components/home/FleetPage'));
const CoveragePage = lazy(() => import('./components/home/CoveragePage'));
const TrackPage = lazy(() => import('./components/home/TrackPage'));
const ContactPage = lazy(() => import('./components/home/ContactPage'));
const FaqPage = lazy(() => import('./components/home/FaqPage'));
const BusinessPage = lazy(() => import('./components/home/BusinessPage'));
const DriversPage = lazy(() => import('./components/home/DriversPage'));
const MobileAppPage = lazy(() => import('./components/home/MobileAppPage'));
const InsightsPage = lazy(() => import('./components/home/InsightsPage'));
const DriverRegisterPage = lazy(() => import('./components/auth/DriverRegisterPage'));
const CustomerRegisterPage = lazy(() => import('./components/auth/CustomerRegisterPage'));
const NotFoundPage = lazy(() => import('./components/common/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('./components/common/UnauthorizedPage'));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage'));
const ProfileEditPage = lazy(() => import('./components/profile/ProfileEditPage'));

const AdminDashboardPage = lazy(() => import('./components/admin/AdminDashboardPage'));
const AdminDriverManagementPage = lazy(() => import('./components/admin/AdminDriverManagementPage'));
const AdminCustomerManagementPage = lazy(() => import('./components/admin/AdminCustomerManagementPage'));
const AdminDispatcherManagementPage = lazy(() => import('./components/admin/AdminDispatcherManagementPage'));
const AdminUserDetailsPage = lazy(() => import('./components/admin/AdminUserDetailsPage'));
const AdminUserEditPage = lazy(() => import('./components/admin/AdminUserEditPage'));
const AdminSystemOverviewPage = lazy(() => import('./components/admin/AdminSystemOverviewPage'));
const AdminAuditLogPage = lazy(() => import('./components/admin/AdminAuditLogPage'));
const AdminRegistrationRequestsPage = lazy(() => import('./components/admin/AdminRegistrationRequestsPage'));
const AdminRegistrationRequestDetailsPage = lazy(() => import('./components/admin/AdminRegistrationRequestDetailsPage'));
const AdminVehiclesPage = lazy(() => import('./components/admin/AdminVehiclesPage'));
const AdminReportsPage = lazy(() => import('./components/admin/AdminReportsPage'));
const AdminTripsOversightPage = lazy(() => import('./components/admin/AdminTripsOversightPage'));
const AdminTripsOversightDetailsPage = lazy(() => import('./components/admin/AdminTripsOversightDetailsPage'));
const AdminNotificationsPage = lazy(() => import('./components/admin/AdminNotificationsPage'));
const AdminPaymentRequestPage = lazy(() => import('./components/admin/AdminPaymentRequestPage'));

const OrdersPage = lazy(() => import('./components/dispatch/OrdersPage'));
const OrderImportPage = lazy(() => import('./components/dispatch/OrderImportPage'));
const DispatchOrderDetailPage = lazy(() => import('./components/dispatch/DispatchOrderDetailPage'));
const AvailableDriversPage = lazy(() => import('./components/dispatch/AvailableDriversPage'));
const TripsPage = lazy(() => import('./components/dispatch/TripsPage'));
const TripCreatePage = lazy(() => import('./components/dispatch/TripCreatePage'));
const TripDetailPage = lazy(() => import('./components/dispatch/TripDetailPage'));
const TripAssignPage = lazy(() => import('./components/dispatch/TripAssignPage'));
const DispatchNotificationsPage = lazy(() => import('./components/dispatch/DispatchNotificationsPage'));
const DispatchReportsPage = lazy(() => import('./components/dispatch/DispatchReportsPage'));
const InvoiceDownloadPage = lazy(() => import('./components/customer/InvoiceDownloadPage'));

const ROUTE_TITLES = {
  '/': 'LogiFlow | Enterprise Freight Operations & Live Dispatch',
  '/about': 'About LogiFlow | Academic Freight Workflow Project',
  '/services': 'Freight Services & Workflows | LogiFlow',
  '/fleet': 'Sample Fleet & Vehicle Classes | LogiFlow',
  '/coverage': 'Pan-Vietnam Route Coverage Map | LogiFlow',
  '/track': 'Track Shipment & Telemetry | LogiFlow',
  '/contact': 'Contact & Form Demo | LogiFlow',
  '/faq': 'Frequently Asked Questions | LogiFlow',
  '/business': 'Enterprise Role-Based Workflows | LogiFlow',
  '/insights': 'Freight Market Insights & Analysis | LogiFlow',
  '/news': 'Freight Market Insights & Analysis | LogiFlow',
  '/mobile-app': 'Flutter Mobile Client Workflows | LogiFlow',
  '/drivers': 'Driver Partner Workflow | LogiFlow',
  '/login': 'Sign In | LogiFlow Control Tower',
  '/register/customer': 'Corporate Customer Registration | LogiFlow',
  '/register/driver': 'Driver Partner Application | LogiFlow',
  '/profile': 'User Profile | LogiFlow',
  '/profile/edit': 'Edit Profile | LogiFlow',
  '/unauthorized': 'Access Restricted (403) | LogiFlow',
  '/dispatch/orders': 'Dispatch Orders | LogiFlow Operations',
  '/dispatch/orders/import': 'Bulk Import Orders | LogiFlow Operations',
  '/dispatch/trips': 'Trips & Dispatch | LogiFlow Operations',
  '/dispatch/trips/create': 'Create Dispatch Trip | LogiFlow Operations',
  '/dispatch/drivers': 'Active Drivers | LogiFlow Operations',
  '/dispatch/notifications': 'Dispatch Notifications | LogiFlow Operations',
  '/dispatch/reports': 'Dispatch Performance Reports | LogiFlow Operations',
  '/admin/dashboard': 'Admin Control Tower | LogiFlow',
  '/admin/reports': 'Reports & Analytics | LogiFlow Admin',
  '/admin/notifications': 'Admin Notifications | LogiFlow Admin',
  '/admin/payment-requests': 'Payment Requests | LogiFlow Admin',
  '/admin/users/drivers': 'Driver Accounts | LogiFlow Admin',
  '/admin/users/customers': 'Customer Accounts | LogiFlow Admin',
  '/admin/users/dispatchers': 'Dispatcher Accounts | LogiFlow Admin',
  '/admin/system/overview': 'System Overview | LogiFlow Admin',
  '/admin/audit-logs': 'Security & Audit Logs | LogiFlow Admin',
  '/admin/trips-oversight': 'Trips Oversight | LogiFlow Admin',
  '/admin/registration-requests': 'Registration Requests | LogiFlow Admin',
  '/admin/vehicles': 'Fleet Vehicles | LogiFlow Admin',
};

const RouteTitleManager = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (ROUTE_TITLES[pathname]) {
      document.title = ROUTE_TITLES[pathname];
    } else if (pathname.startsWith('/dispatch/orders/')) {
      document.title = 'Order Detail | LogiFlow Operations';
    } else if (pathname.startsWith('/dispatch/trips/')) {
      document.title = 'Trip Telemetry & Assignment | LogiFlow Operations';
    } else if (pathname.startsWith('/admin/users/')) {
      document.title = 'User Account Details | LogiFlow Admin';
    } else if (pathname.startsWith('/admin/trips-oversight/')) {
      document.title = 'Trip Oversight Detail | LogiFlow Admin';
    } else if (pathname.startsWith('/admin/registration-requests/')) {
      document.title = 'Registration Review | LogiFlow Admin';
    } else if (pathname.startsWith('/orders/')) {
      document.title = 'Invoice Download | LogiFlow';
    } else {
      document.title = 'Page Not Found (404) | LogiFlow';
    }
  }, [pathname]);
  return null;
};

// Protected Route Component with role-based access
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if route requires specific role
  // Allow ADMIN users to access all role-specific pages
  if (requiredRole && user.role !== 'ADMIN' && user.role !== requiredRole) {
    return <UnauthorizedPage />;
  }

  return children;
};

// Handle redirection after login based on user role
const AuthRedirect = () => {
  const user = authService.getCurrentUser();
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user?.role === 'CUSTOMER') {
    return <Navigate to="/track" replace />;
  } else if (user?.role === 'DISPATCHER') {
    return <Navigate to="/dispatch/orders" replace />;
  } else {
    return <Navigate to="/" replace />;
  }
};

function App() {
  return (
    <Router>
      <RouteTitleManager />
      <Suspense fallback={<div className="route-loading" role="status">Loading page…</div>}>
      <Routes>
        {/* Public routes with MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/coverage" element={<CoveragePage />} />
          <Route path="/pricing" element={<Navigate to="/business" replace />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/business" element={<BusinessPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/news" element={<InsightsPage />} />
          <Route path="/mobile-app" element={<MobileAppPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/profile/edit" element={
            <ProtectedRoute>
              <ProfileEditPage />
            </ProtectedRoute>
          } />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/orders/:orderId/invoice" element={
            <ProtectedRoute>
              <InvoiceDownloadPage />
            </ProtectedRoute>
          } />
        </Route>


          {/* Dispatch routes with DispatchLayout */}
        <Route element={<DispatchLayout />}>
          <Route path="/dispatch/orders" element={
            <ProtectedRoute requiredRole="DISPATCHER">
              <OrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/dispatch/orders/import" element={
            <ProtectedRoute requiredRole="DISPATCHER">
              <OrderImportPage />
            </ProtectedRoute>
          } />
          <Route path="/dispatch/orders/:orderId" element={
            <ProtectedRoute requiredRole="DISPATCHER">
              <DispatchOrderDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/dispatch/trips" element={
            <ProtectedRoute requiredRole="DISPATCHER">
              <TripsPage />
            </ProtectedRoute>
          } />
          <Route path="/dispatch/trips/create" element={
            <ProtectedRoute requiredRole="DISPATCHER">
              <TripCreatePage />
            </ProtectedRoute>
          } />
          <Route path="/dispatch/trips/:tripId" element={
            <ProtectedRoute requiredRole="DISPATCHER">
              <TripDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/dispatch/trips/:tripId/assign" element={
            <ProtectedRoute requiredRole="DISPATCHER">
              <TripAssignPage />
            </ProtectedRoute>
          } />
          <Route path="/dispatch/drivers" element={
            <ProtectedRoute requiredRole="DISPATCHER">
              <AvailableDriversPage />
            </ProtectedRoute>
          } />
          <Route path="/dispatch/notifications" element={
            <ProtectedRoute requiredRole="DISPATCHER">
              <DispatchNotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/dispatch/reports" element={
            <ProtectedRoute requiredRole="DISPATCHER">
              <DispatchReportsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Admin routes with AdminLayout (sidebar) */}
        <Route element={<AdminSideNav />}>
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminNotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/payment-requests" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminPaymentRequestPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/users/drivers" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDriverManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/customers" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminCustomerManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/dispatchers" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDispatcherManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/drivers/:userId" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminUserDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/customers/:userId" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminUserDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/dispatchers/:userId" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminUserDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:userId/edit" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminUserEditPage />
            </ProtectedRoute>
          } />


          <Route path="/admin/system/overview" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminSystemOverviewPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminAuditLogPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/trips-oversight" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminTripsOversightPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/trips-oversight/:tripId" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminTripsOversightDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/registration-requests" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminRegistrationRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/registration-requests/:requestId" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminRegistrationRequestDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/vehicles" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminVehiclesPage />
            </ProtectedRoute>
          } />
        </Route>



        <Route path="/login" element={
          authService.getCurrentUser() ?
          <AuthRedirect /> :
          <LoginPage />
        } />
        <Route path="/register/driver" element={<DriverRegisterPage />} />
        <Route path="/register/customer" element={<CustomerRegisterPage />} />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
