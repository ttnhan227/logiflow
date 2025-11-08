import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from './services';
import './App.css';
import './components/layout.css';
import MainLayout from './components/MainLayout';
import LoginPage from "./components/auth/LoginPage";
import HomePage from "./components/home/HomePage";
import AboutPage from "./components/home/AboutPage";
import AdminDashboardPage from "./components/admin/AdminDashboardPage";
import NotFoundPage from "./components/common/NotFoundPage";
import UnauthorizedPage from "./components/common/UnauthorizedPage";

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
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>
        <Route path="/login" element={
          authService.getCurrentUser() ? 
          <AuthRedirect /> : 
          <LoginPage />
        } />
        
        {/* Home route - No protection */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />

        {/* Admin dashboard */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboardPage />
          </ProtectedRoute>
        } />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
