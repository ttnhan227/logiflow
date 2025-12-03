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
import DriverRegisterPage from "./components/auth/DriverRegisterPage";
import NotFoundPage from "./components/common/NotFoundPage";
import UnauthorizedPage from "./components/common/UnauthorizedPage";
import ProfilePage from "./components/profile/ProfilePage";
import ProfileEditPage from "./components/profile/ProfileEditPage";

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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
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
