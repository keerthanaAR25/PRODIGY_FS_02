import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';
import Layout from './components/layout/Layout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('./pages/EmployeeDetailPage'));
const EmployeeFormPage = lazy(() => import('./pages/EmployeeFormPage'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage'));
const TrashPage = lazy(() => import('./pages/TrashPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function Protected({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/" element={<Protected><Layout /></Protected>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/new" element={<Protected adminOnly><EmployeeFormPage /></Protected>} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="employees/:id/edit" element={<Protected adminOnly><EmployeeFormPage /></Protected>} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="activities" element={<Protected adminOnly><ActivitiesPage /></Protected>} />
          <Route path="trash" element={<Protected adminOnly><TrashPage /></Protected>} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#0d0c1d', color: '#f0eeff', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
          success: { iconTheme: { primary: '#10b981', secondary: '#0d0c1d' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0d0c1d' } }
        }} />
      </BrowserRouter>
    </AuthProvider>
  );
}

