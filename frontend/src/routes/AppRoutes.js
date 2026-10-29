import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/layout/AppLayout';

// Auth
import LoginPage from '../pages/LoginPage';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import EnquiriesPage from '../pages/admin/EnquiriesPage';
import AdminAdmissionsPage from '../pages/admin/AdminAdmissionsPage';
import { CoursesPage } from '../pages/admin/CoursesPage';
import UsersPage from '../pages/admin/UsersPage';
import ReportsPage from '../pages/admin/ReportsPage';

// Counsellor pages
import CounsellorDashboard from '../pages/counsellor/CounsellorDashboard';
import CounsellorLeadsPage from '../pages/counsellor/CounsellorLeadsPage';
import CounsellorAdmissionsPage from '../pages/counsellor/CounsellorAdmissionsPage';

// Trainer pages
import { TrainerDashboard, AttendancePage } from '../pages/trainer/TrainerPages';

// Student pages — single dashboard only
import { StudentDashboard } from '../pages/student/StudentPages';

const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  COUNSELLOR: '/counsellor/dashboard',
  TRAINER: '/trainer/dashboard',
  STUDENT: '/student/dashboard',
};

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user?.role] || '/login'} replace />;
}

function NotFoundPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 12,
    }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <h2 style={{ margin: 0 }}>Page Not Found</h2>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/enquiries" element={<EnquiriesPage />} />
          <Route path="/admin/admissions" element={<AdminAdmissionsPage />} />
          <Route path="/admin/courses" element={<CoursesPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Counsellor */}
      <Route element={<ProtectedRoute allowedRoles={['COUNSELLOR', 'ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/counsellor/dashboard" element={<CounsellorDashboard />} />
          <Route path="/counsellor/leads" element={<CounsellorLeadsPage />} />
          <Route path="/counsellor/followups" element={<CounsellorLeadsPage />} />
          <Route path="/counsellor/admissions" element={<CounsellorAdmissionsPage />} />
        </Route>
      </Route>

      {/* Trainer — only dashboard (students) + attendance */}
      <Route element={<ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
          <Route path="/trainer/students" element={<TrainerDashboard />} />
          <Route path="/trainer/attendance" element={<AttendancePage />} />
        </Route>
      </Route>

      {/* Student — single read-only dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          {/* Redirect sub-pages back to dashboard (student is single-page) */}
          <Route path="/student/courses" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/fees" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/attendance" element={<Navigate to="/student/dashboard" replace />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}