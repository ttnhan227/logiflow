import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from './services';
import './App.css';
import './components/layout.css';
import MainLayout from './components/MainLayout';
import AdminSideNav from './components/admin/AdminSideNav';
import LoginPage from "./components/auth/LoginPage";
import HomePage from "./components/home/HomePage";
import AboutPage from "./components/home/AboutPage";
import ServicesPage from "./components/home/ServicesPage";
import FleetPage from "./components/home/FleetPage";
import CoveragePage from "./components/home/CoveragePage";
import TrackPage from "./components/home/TrackPage";
import ContactPage from "./components/home/ContactPage";
import FaqPage from "./components/home/FaqPage";
import BusinessPage from "./components/home/BusinessPage";
import DriversPage from "./components/home/DriversPage";
import MobileAppPage from "./components/home/MobileAppPage";
import AdminDashboardPage from "./components/admin/AdminDashboardPage";
import UserManagementPage from "./components/admin/AdminUserManagementPage";
import AdminUserDetailsPage from "./components/admin/AdminUserDetailsPage";
import AdminUserEditPage from "./components/admin/AdminUserEditPage";
import AdminSettingsPage from "./components/admin/AdminSettingsPage";
import AdminSystemOverviewPage from "./components/admin/AdminSystemOverviewPage";
import AdminAuditLogPage from "./components/admin/AdminAuditLogPage";
import AdminRegistrationRequestsPage from "./components/admin/AdminRegistrationRequestsPage";
import AdminRegistrationRequestDetailsPage from "./components/admin/AdminRegistrationRequestDetailsPage";
import AdminRoutesPage from "./components/admin/AdminRoutesPage";
import AdminVehiclesPage from "./components/admin/AdminVehiclesPage";
import AdminReportsPage from "./components/admin/AdminReportsPage";
import AdminTripsOversightPage from "./components/admin/AdminTripsOversightPage";
import AdminTripsOversightDetailsPage from "./components/admin/AdminTripsOversightDetailsPage";
import AdminNotificationsPage from "./components/admin/AdminNotificationsPage";
import DriverRegisterPage from "./components/auth/DriverRegisterPage";
import NotFoundPage from "./components/common/NotFoundPage";
import UnauthorizedPage from "./components/common/UnauthorizedPage";
import ProfilePage from "./components/profile/ProfilePage";
import ProfileEditPage from "./components/profile/ProfileEditPage";
import OrdersPage from "./components/dispatch/OrdersPage";
import OrderImportPage from "./components/dispatch/OrderImportPage";
import DispatchOrderDetailPage from "./components/dispatch/DispatchOrderDetailPage";
import AvailableDriversPage from './components/dispatch/AvailableDriversPage';
import TripsPage from "./components/dispatch/TripsPage";
import TripCreatePage from "./components/dispatch/TripCreatePage";
import TripDetailPage from "./components/dispatch/TripDetailPage";
import TripAssignPage from "./components/dispatch/TripAssignPage";
import DispatchNotificationsPage from "./components/dispatch/DispatchNotificationsPage";
import DispatchLayout from "./components/dispatch/DispatchLayout";
import DriverManager from "./components/manager/DriverManager/DriverManager.jsx";
import IssueReports from "./components/manager/IssueReports/IssueReports";
import CompliancePage from "./components/manager/Compliance/CompliancePage";
import RouteAnalyticsPage from "./components/manager/RouteAnalytics/RouteAnalyticsPage";
import AlertsPage from "./components/manager/Alerts/AlertsPage";
import ManagerActivitiesPage from "./components/manager/Activities/ManagerActivitiesPage";
import ManagerLayout from './components/manager/ManagerLayout.jsx';

// Protected Route Component with role-based access
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [authState, setAuthState] = useState({ loading: true, user: null });
  const location = useLocation();

  useEffect(() => {
    const user = authService.getCurrentUser();
    setAuthState({ loading: false, user });
  }, [location]);

  if (authState.loading) {
    return <div>Loading...</div>;
  }

  // Only redirect to login if coming from login page
  if (!authState.user && location.state?.from === '/login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if route requires specific role
  if (requiredRole && authState.user.role !== requiredRole) {
    // Show unauthorized page if user doesn't have required role
    return <UnauthorizedPage />;
  }

  return children;
};

// Handle redirection after login based on user role
const AuthRedirect = () => {
  const user = authService.getCurrentUser();
  return user?.role === 'ADMIN' ? 
    <Navigate to="/admin/dashboard" replace /> : 
    <Navigate to="/" replace />;
};



function App() {
  return (
    <Router>
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
          <Route path="/mobile-app" element={<MobileAppPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

          {/* Manager routes with ManagerLayout (sidebar) */}
        <Route element={<ManagerLayout/>}>
          <Route path="/manager/drivers" element={
            <ProtectedRoute requiredRole="MANAGER">
              <DriverManager/>
            </ProtectedRoute>
          } />
          <Route path="/manager/issues" element={
            <ProtectedRoute requiredRole="MANAGER">
              <IssueReports/>
            </ProtectedRoute>
          } />
          <Route path="/manager/compliance" element={
            <ProtectedRoute requiredRole="MANAGER">
              <CompliancePage/>
            </ProtectedRoute>
          } />
          <Route path="/manager/analytics/routes" element={
            <ProtectedRoute requiredRole="MANAGER">
              <RouteAnalyticsPage/>
            </ProtectedRoute>
          } />
          <Route path="/manager/alerts" element={
            <ProtectedRoute requiredRole="MANAGER">
              <AlertsPage/>
            </ProtectedRoute>
          } />
          <Route path="/manager/activities" element={
            <ProtectedRoute requiredRole="MANAGER">
              <ManagerActivitiesPage/>
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
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="ADMIN">
              <UserManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:userId" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminUserDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:userId/edit" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminUserEditPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/system/configuration" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminSettingsPage />
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
          <Route path="/admin/routes" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminRoutesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/vehicles" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminVehiclesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminReportsPage />
            </ProtectedRoute>
          } />
        </Route>



        <Route path="/login" element={
          authService.getCurrentUser() ? 
          <AuthRedirect /> : 
          <LoginPage />
        } />
        <Route path="/register/driver" element={<DriverRegisterPage />} />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
