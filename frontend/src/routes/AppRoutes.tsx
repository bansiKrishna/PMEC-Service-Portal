import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { UnauthorizedPage } from '../pages/auth/UnauthorizedPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { StaffManagementPage } from '../pages/admin/StaffManagementPage';
import { CertificateTemplatesPage } from '../pages/admin/CertificateTemplatesPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { ApplyBonafidePage } from '../pages/student/ApplyBonafidePage';
import { StudentApplicationsPage } from '../pages/student/StudentApplicationsPage';
import { ApplicationDetailsPage } from '../pages/student/ApplicationDetailsPage';
import { StudentCertificatesPage } from '../pages/student/StudentCertificatesPage';
import { StudentProfilePage } from '../pages/student/StudentProfilePage';

// DSW Pages
import { DswDashboard } from '../pages/dsw/DswDashboard';
import { DswApplicationsPage } from '../pages/dsw/DswApplicationsPage';
import { DswApplicationDetailsPage } from '../pages/dsw/DswApplicationDetailsPage';

// Principal Pages
import { PrincipalDashboard } from '../pages/principal/PrincipalDashboard';
import { PrincipalApplicationsPage } from '../pages/principal/PrincipalApplicationsPage';
import { PrincipalApplicationDetailsPage } from '../pages/principal/PrincipalApplicationDetailsPage';

// Librarian Pages
import { LibrarianDashboard } from '../pages/librarian/LibrarianDashboard';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, getDefaultRedirectPath } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={getDefaultRedirectPath()} replace />;
  }
  return <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Dashboard Shell Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* ADMIN ROUTES */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <StaffManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/certificate-templates"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <CertificateTemplatesPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminSettingsPage />
            </RoleGuard>
          }
        />

        {/* STUDENT ROUTES */}
        <Route
          path="/student/dashboard"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/student/bonafide"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <ApplyBonafidePage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/applications"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <StudentApplicationsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/applications/:id"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <ApplicationDetailsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/certificates"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <StudentCertificatesPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/profile"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <StudentProfilePage />
            </RoleGuard>
          }
        />

        {/* DSW ROUTES */}
        <Route
          path="/dsw/dashboard"
          element={
            <RoleGuard allowedRoles={['DSW']}>
              <DswDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/dsw/applications"
          element={
            <RoleGuard allowedRoles={['DSW']}>
              <DswApplicationsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/dsw/applications/:id"
          element={
            <RoleGuard allowedRoles={['DSW']}>
              <DswApplicationDetailsPage />
            </RoleGuard>
          }
        />

        {/* PRINCIPAL ROUTES */}
        <Route
          path="/principal/dashboard"
          element={
            <RoleGuard allowedRoles={['PRINCIPAL']}>
              <PrincipalDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/principal/applications"
          element={
            <RoleGuard allowedRoles={['PRINCIPAL']}>
              <PrincipalApplicationsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/principal/applications/:id"
          element={
            <RoleGuard allowedRoles={['PRINCIPAL']}>
              <PrincipalApplicationDetailsPage />
            </RoleGuard>
          }
        />

        {/* LIBRARIAN ROUTES */}
        <Route
          path="/librarian/dashboard"
          element={
            <RoleGuard allowedRoles={['LIBRARIAN']}>
              <LibrarianDashboard />
            </RoleGuard>
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
