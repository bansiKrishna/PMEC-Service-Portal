import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleGuard } from "./RoleGuard";
import { PageSkeleton } from "../components/common/PageSkeleton";

// Auth Pages
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";

const UnauthorizedPage = lazy(() =>
  import("../pages/auth/UnauthorizedPage").then((m) => ({ default: m.UnauthorizedPage })),
);
const AdminDashboard = lazy(() =>
  import("../pages/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })),
);
const StaffManagementPage = lazy(() =>
  import("../pages/admin/StaffManagementPage").then((m) => ({ default: m.StaffManagementPage })),
);
const CertificateTemplatesPage = lazy(() =>
  import("../pages/admin/CertificateTemplatesPage").then((m) => ({ default: m.CertificateTemplatesPage })),
);
const AdminSettingsPage = lazy(() =>
  import("../pages/admin/AdminSettingsPage").then((m) => ({ default: m.AdminSettingsPage })),
);
const EmailServiceSettingsPage = lazy(() =>
  import("../pages/admin/EmailServiceSettingsPage").then((m) => ({ default: m.EmailServiceSettingsPage })),
);
const SemesterRegistrationManagementPage = lazy(() =>
  import("../pages/admin/SemesterRegistrationManagementPage"),
);
const StudentDashboard = lazy(() =>
  import("../pages/student/StudentDashboard").then((m) => ({ default: m.StudentDashboard })),
);
const ApplyBonafidePage = lazy(() =>
  import("../pages/student/ApplyBonafidePage").then((m) => ({ default: m.ApplyBonafidePage })),
);
const StudentApplicationsPage = lazy(() =>
  import("../pages/student/StudentApplicationsPage").then((m) => ({ default: m.StudentApplicationsPage })),
);
const ApplicationDetailsPage = lazy(() =>
  import("../pages/student/ApplicationDetailsPage").then((m) => ({ default: m.ApplicationDetailsPage })),
);
const StudentCertificatesPage = lazy(() =>
  import("../pages/student/StudentCertificatesPage").then((m) => ({ default: m.StudentCertificatesPage })),
);
const StudentProfilePage = lazy(() =>
  import("../pages/student/StudentProfilePage").then((m) => ({ default: m.StudentProfilePage })),
);
const SemesterRegistrationPage = lazy(() =>
  import("../pages/student/SemesterRegistrationPage"),
);
const SemesterRegistrationDetailsPage = lazy(() =>
  import("../pages/student/SemesterRegistrationDetailsPage").then((m) => ({ default: m.SemesterRegistrationDetailsPage })),
);
const RegistrationReviewPage = lazy(() =>
  import("../pages/semester-registration/RegistrationReviewPage").then((m) => ({ default: m.RegistrationReviewPage })),
);
const DswDashboard = lazy(() =>
  import("../pages/dsw/DswDashboard").then((m) => ({ default: m.DswDashboard })),
);
const DswApplicationsPage = lazy(() =>
  import("../pages/dsw/DswApplicationsPage").then((m) => ({ default: m.DswApplicationsPage })),
);
const DswApplicationDetailsPage = lazy(() =>
  import("../pages/dsw/DswApplicationDetailsPage").then((m) => ({ default: m.DswApplicationDetailsPage })),
);
const DswReviewHistoryPage = lazy(() => import("../pages/dsw/DswReviewHistoryPage"));
const PrincipalDashboard = lazy(() =>
  import("../pages/principal/PrincipalDashboard").then((m) => ({ default: m.PrincipalDashboard })),
);
const PrincipalApplicationsPage = lazy(() =>
  import("../pages/principal/PrincipalApplicationsPage").then((m) => ({ default: m.PrincipalApplicationsPage })),
);
const PrincipalApplicationDetailsPage = lazy(() =>
  import("../pages/principal/PrincipalApplicationDetailsPage").then((m) => ({ default: m.PrincipalApplicationDetailsPage })),
);
const LibrarianDashboard = lazy(() =>
  import("../pages/librarian/LibrarianDashboard").then((m) => ({ default: m.LibrarianDashboard })),
);

const RootRedirect: React.FC = () => {
  const { isAuthenticated, getDefaultRedirectPath } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={getDefaultRedirectPath()} replace />;
  }
  return <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
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
            <RoleGuard allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <RoleGuard allowedRoles={["ADMIN"]}>
              <StaffManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/certificate-templates"
          element={
            <RoleGuard allowedRoles={["ADMIN"]}>
              <CertificateTemplatesPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleGuard allowedRoles={["ADMIN"]}>
              <AdminSettingsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/email-settings"
          element={
            <RoleGuard allowedRoles={["ADMIN"]}>
              <EmailServiceSettingsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/semester-registration"
          element={
            <RoleGuard allowedRoles={["ADMIN"]}>
              <SemesterRegistrationManagementPage />
            </RoleGuard>
          }
        />

        {/* STUDENT ROUTES */}
        <Route
          path="/student/dashboard"
          element={
            <RoleGuard allowedRoles={["STUDENT"]}>
              <StudentDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/student/bonafide"
          element={
            <RoleGuard allowedRoles={["STUDENT"]}>
              <ApplyBonafidePage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/applications"
          element={
            <RoleGuard allowedRoles={["STUDENT"]}>
              <StudentApplicationsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/applications/:id"
          element={
            <RoleGuard allowedRoles={["STUDENT"]}>
              <ApplicationDetailsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/certificates"
          element={
            <RoleGuard allowedRoles={["STUDENT"]}>
              <StudentCertificatesPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/profile"
          element={
            <RoleGuard allowedRoles={["STUDENT"]}>
              <StudentProfilePage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/semester-registration"
          element={
            <RoleGuard allowedRoles={["STUDENT"]}>
              <SemesterRegistrationPage />
            </RoleGuard>
          }
        />
        <Route
          path="/student/semester-registration/:id"
          element={
            <RoleGuard allowedRoles={["STUDENT"]}>
              <SemesterRegistrationDetailsPage />
            </RoleGuard>
          }
        />

        {/* DSW ROUTES */}
        <Route
          path="/dsw/dashboard"
          element={
            <RoleGuard allowedRoles={["DSW"]}>
              <DswDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/dsw/applications"
          element={
            <RoleGuard allowedRoles={["DSW"]}>
              <DswApplicationsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/dsw/applications/:id"
          element={
            <RoleGuard allowedRoles={["DSW"]}>
              <DswApplicationDetailsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/dsw/review-history"
          element={
            <RoleGuard allowedRoles={["DSW"]}>
              <DswReviewHistoryPage />
            </RoleGuard>
          }
        />
        <Route
          path="/dsw/registrations"
          element={
            <RoleGuard allowedRoles={["DSW"]}>
              <RegistrationReviewPage />
            </RoleGuard>
          }
        />

        {/* PRINCIPAL ROUTES */}
        <Route
          path="/principal/dashboard"
          element={
            <RoleGuard allowedRoles={["PRINCIPAL"]}>
              <PrincipalDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/principal/applications"
          element={
            <RoleGuard allowedRoles={["PRINCIPAL"]}>
              <PrincipalApplicationsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/principal/applications/:id"
          element={
            <RoleGuard allowedRoles={["PRINCIPAL"]}>
              <PrincipalApplicationDetailsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/principal/registrations"
          element={
            <RoleGuard allowedRoles={["PRINCIPAL"]}>
              <RegistrationReviewPage />
            </RoleGuard>
          }
        />

        {/* LIBRARIAN ROUTES */}
        <Route
          path="/librarian/dashboard"
          element={
            <RoleGuard allowedRoles={["LIBRARIAN"]}>
              <LibrarianDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/librarian/applications"
          element={
            <RoleGuard allowedRoles={["LIBRARIAN"]}>
              <RegistrationReviewPage />
            </RoleGuard>
          }
        />
        <Route
          path="/librarian/review-history"
          element={
            <RoleGuard allowedRoles={["LIBRARIAN"]}>
              <RegistrationReviewPage initialTab="ALL" />
            </RoleGuard>
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </React.Suspense>
  );
};
