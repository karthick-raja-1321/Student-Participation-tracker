import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';

// Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/Dashboard';
import Events from '../pages/events/Events';
import EventDetails from '../pages/events/EventDetails';
import EventAnalytics from '../pages/events/EventAnalytics';
import Submissions from '../pages/submissions/Submissions';
import PhaseISubmission from '../pages/submissions/PhaseISubmission';
import PhaseIISubmission from '../pages/submissions/PhaseIISubmission';
import Approvals from '../pages/approvals/Approvals';
import Reports from '../pages/reports/Reports';
import Students from '../pages/students/Students';
import SubmissionTracking from '../pages/students/SubmissionTracking';
import ODReceipt from '../pages/students/ODReceipt';
import Faculty from '../pages/faculty/Faculty';
import Departments from '../pages/departments/Departments';
import ExcelImport from '../pages/excel/ExcelImport';
import Notifications from '../pages/notifications/Notifications';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetails />} />
        <Route path="events/:eventId/analytics" element={<EventAnalytics />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="submissions/phase-i/new" element={<PhaseISubmission />} />
        <Route path="submissions/phase-ii/new/:id" element={<PhaseIISubmission />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="reports" element={<Reports />} />
        <Route path="students" element={<Students />} />
        <Route path="students/submissions/:submissionId/tracking" element={<SubmissionTracking />} />
        <Route path="students/submissions/:submissionId/receipt" element={<ODReceipt />} />
        <Route path="faculty" element={<Faculty />} />
        <Route path="departments" element={<Departments />} />
        <Route path="excel" element={<ExcelImport />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
