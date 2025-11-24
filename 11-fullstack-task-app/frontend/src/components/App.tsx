/**
 * Main App Component
 * Handles routing and application layout
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Layout components
import AppLayout from './AppLayout';
import AuthLayout from './AuthLayout';

// Page components (lazy loaded for performance)
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const TasksPage = React.lazy(() => import('@/pages/TasksPage'));
const ProjectsPage = React.lazy(() => import('@/pages/ProjectsPage'));
const TeamsPage = React.lazy(() => import('@/pages/TeamsPage'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));

// Loading component
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const App: React.FC = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route
            path="login"
            element={
              <React.Suspense fallback={<PageLoading />}>
                {user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
              </React.Suspense>
            }
          />
          <Route
            path="register"
            element={
              <React.Suspense fallback={<PageLoading />}>
                {user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
              </React.Suspense>
            }
          />
        </Route>

        {/* Protected routes */}
        <Route
          path="/"
          element={
            user ? <AppLayout /> : <Navigate to="/auth/login" replace />
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <React.Suspense fallback={<PageLoading />}>
                <DashboardPage />
              </React.Suspense>
            }
          />
          <Route
            path="tasks"
            element={
              <React.Suspense fallback={<PageLoading />}>
                <TasksPage />
              </React.Suspense>
            }
          />
          <Route
            path="projects"
            element={
              <React.Suspense fallback={<PageLoading />}>
                <ProjectsPage />
              </React.Suspense>
            }
          />
          <Route
            path="teams"
            element={
              <React.Suspense fallback={<PageLoading />}>
                <TeamsPage />
              </React.Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <React.Suspense fallback={<PageLoading />}>
                <ProfilePage />
              </React.Suspense>
            }
          />
        </Route>

        {/* 404 route */}
        <Route
          path="*"
          element={
            <React.Suspense fallback={<PageLoading />}>
              <NotFoundPage />
            </React.Suspense>
          }
        />
      </Routes>
    </div>
  );
};

export default App;