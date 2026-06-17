import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { storage } from './services/storage';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import BatchProcess from './pages/BatchProcess';
import FAQList from './pages/FAQList';
import Statistics from './pages/Statistics';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

export default function App() {
  useEffect(() => {
    storage.initializeData();
    if (typeof window !== 'undefined' && 'Notification' in window && 
        window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TicketList />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tickets/create"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CreateTicket />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tickets/batch"
            element={
              <ProtectedRoute allowedRoles={['engineer', 'admin']}>
                <MainLayout>
                  <BatchProcess />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TicketDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/faq"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FAQList />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/statistics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <Statistics />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Notifications />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}
