import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import RootLayout from './src/app/layout';
import Page from './src/app/page';
import LoginPage from './src/app/login/page';
import DashboardPage from './src/app/(main)/dashboard/page';
import ClientsPage from './src/app/(main)/clients/page';
import BillingPage from './src/app/(main)/billing/page';
import MainLayout from './src/app/(main)/layout';

// Middleware / Protected Route Wrapper
const ProtectedRoute = () => {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// The App component now acts purely as the Next.js Framework "Server" 
// determining which layout/page to render based on the URL.
const App: React.FC = () => {
  return (
    <Router>
      <RootLayout>
        <Routes>
          {/* Root Route (src/app/page.tsx) */}
          <Route path="/" element={<Page />} />

          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes Group (src/app/(main)/layout.tsx applied via ProtectedRoute) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/billing" element={<BillingPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RootLayout>
    </Router>
  );
};

export default App;