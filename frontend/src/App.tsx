import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import NotificationList from './components/ui/NotificationList';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BancosPage from './pages/BancosPage';
import ChequerasPage from './pages/ChequerasPage';
import ChequesPage from './pages/ChequesPage';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="bancos" element={<BancosPage />} />
              <Route path="chequeras" element={<ChequerasPage />} />
              <Route path="cheques" element={<ChequesPage />} />
            </Route>
          </Routes>
          
          {/* Global notifications - available on all pages */}
          <NotificationList />
        </div>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
