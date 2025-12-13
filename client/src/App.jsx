import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from './services';
import './App.css';
import './components/layout.css';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/admin/AdminLayout';
import LoginPage from "./components/auth/LoginPage";
import HomePage from "./components/home/HomePage";
import AboutPage from "./components/home/AboutPage";
import AdminDashboardPage from "./components/admin/AdminDashboardPage";
import UserManagementPage from "./components/admin/AdminUserManagementPage";
import AdminUserDetailsPage from "./components/admin/AdminUserDetailsPage";
import AdminUserEditPage from "./components/admin/AdminUserEditPage";
import AdminSettingsPage from "./components/admin/AdminSettingsPage";
import AdminAuditLogPage from "./components/admin/AdminAuditLogPage";
import NotFoundPage from "./components/common/NotFoundPage";
import UnauthorizedPage from "./components/common/UnauthorizedPage";
import ProfilePage from "./components/profile/ProfilePage";
import ProfileEditPage from "./components/profile/ProfileEditPage";
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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        {/* Admin routes with AdminLayout (sidebar) */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboardPage />
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
          <Route path="/admin/settings" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminAuditLogPage />
            </ProtectedRoute>
          } />
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



        <Route path="/login" element={
          authService.getCurrentUser() ? 
          <AuthRedirect /> : 
          <LoginPage />
        } />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
