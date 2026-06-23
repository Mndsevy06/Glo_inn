import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }  from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { ClientLayout } from '@/components/layouts/ClientLayout';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { LandingPage } from '@/pages/public/LandingPage';
import { MenuPage } from '@/pages/public/MenuPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { ClientHomePage } from '@/pages/client/ClientHomePage';
import { ClientOrdersPage } from '@/pages/client/ClientOrdersPage';
import { ClientNotificationsPage } from '@/pages/client/ClientNotificationsPage';
import { DashboardHomePage } from '@/pages/dashboard/DashboardHomePage';
import { NewOrderPage } from '@/pages/dashboard/NewOrderPage';
import { OrdersListPage } from '@/pages/dashboard/OrdersListPage';
import { ReportsPage } from '@/pages/dashboard/ReportsPage';
import { UsersPage } from '@/pages/dashboard/UsersPage';

function RequireAuth({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Client */}
              <Route path="/client" element={<RequireAuth allowedRoles={['client']}><ClientLayout /></RequireAuth>}>
                <Route index element={<ClientHomePage />} />
                <Route path="orders" element={<ClientOrdersPage />} />
                <Route path="notifications" element={<ClientNotificationsPage />} />
              </Route>

              {/* Dashboard (Receptionniste + Gerant) */}
              <Route path="/dashboard" element={<RequireAuth allowedRoles={['receptionniste', 'gerant']}><DashboardLayout /></RequireAuth>}>
                <Route index element={<DashboardHomePage />} />
                <Route path="new-order" element={<NewOrderPage />} />
                <Route path="orders" element={<OrdersListPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="users" element={<UsersPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
