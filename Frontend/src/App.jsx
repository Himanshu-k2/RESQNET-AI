import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { Footer } from './components/layout/Footer';
import OfflineBanner from './components/OfflineBanner';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { CriticalScenariosPage } from './pages/CriticalScenariosPage';
import { NeedHelpPage } from './pages/NeedHelpPage';
import { ProvideHelpPage } from './pages/ProvideHelpPage';
import { CoordinatorDashboard } from './pages/CoordinatorDashboard';
import OfflineReports from './pages/OfflineReports';
import IncidentDetailPage from './pages/IncidentDetailPage';
import { GroupsDashboardPage } from './pages/GroupsDashboardPage';
import { CreateGroupPage } from './pages/CreateGroupPage';
import { JoinGroupPage } from './pages/JoinGroupPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { ProviderDashboard } from './pages/ProviderDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminRequestsPage } from './pages/AdminRequestsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { RequestTrackingPage } from './pages/RequestTrackingPage';
import { useAuth } from './context/AuthContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { getPendingReports } from './services/offlineStorage';
import { syncPendingReports } from './services/syncService';
import api from './services/api';

function App() {
  const { isAuthenticated } = useAuth();
  const isOnline = useOnlineStatus();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncState, setSyncState] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadNotifications = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/notifications?limit=1');
      if (res.data?.success) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not fetch notifications unread count:', err.message);
    }
  };

  const refreshPendingCount = async () => {
    try {
      const pending = await getPendingReports();
      setPendingCount(pending.length);
      return pending.length;
    } catch (err) {
      console.warn('Could not read pending reports:', err);
      return 0;
    }
  };

  // Poll for pending reports & unread notifications
  useEffect(() => {
    refreshPendingCount();
    fetchUnreadNotifications();
    const interval = setInterval(() => {
      refreshPendingCount();
      fetchUnreadNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Automatic synchronization trigger when connection returns
  useEffect(() => {
    if (isOnline) {
      refreshPendingCount().then((count) => {
        if (count > 0) {
          setSyncState('syncing');
          const token = localStorage.getItem('resqnet_token');
          syncPendingReports(token, (event) => {
            if (event.type === 'uploaded' || event.type === 'failed') {
              refreshPendingCount();
            }
          })
            .then(async () => {
              const remaining = await refreshPendingCount();
              if (remaining === 0) {
                setSyncState('success');
                setTimeout(() => setSyncState('idle'), 6000);
              } else {
                setSyncState('error');
              }
            })
            .catch(() => {
              setSyncState('error');
            });
        }
      });
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen bg-slate-50 text-navy-900 flex overflow-x-hidden selection:bg-teal-100 selection:text-teal-900">
      {/* 1. Responsive Sidebar on Left (Desktop Fixed, Mobile Drawer) */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        unreadCount={unreadCount}
      />

      {/* 2. Main Content Column beside Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Offline Banner (Only when offline or syncing) */}
        <OfflineBanner
          isOnline={isOnline}
          syncState={syncState}
          pendingCount={pendingCount}
        />

        {/* Clean Top Header with Breadcrumb, Notification Bell & User Profile */}
        <TopHeader
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          unreadCount={unreadCount}
          onRefreshNotifications={fetchUnreadNotifications}
        />

        {/* Page Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth?tab=register" replace />} />
            <Route path="/register/provider" element={<Navigate to="/auth?tab=register" replace />} />
            <Route path="/critical-scenarios" element={<CriticalScenariosPage />} />
            <Route path="/provider/dashboard" element={<ProviderDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/requests" element={<AdminRequestsPage />} />
            <Route path="/admin/assignments" element={<AdminRequestsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/track" element={<RequestTrackingPage />} />
            <Route path="/need-help" element={<NeedHelpPage />} />
            <Route path="/provide-help" element={<ProvideHelpPage />} />
            <Route path="/coordinator" element={<CoordinatorDashboard />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="/groups" element={<GroupsDashboardPage />} />
            <Route path="/groups/create" element={<CreateGroupPage />} />
            <Route path="/groups/join" element={<JoinGroupPage />} />
            <Route path="/groups/:groupId" element={<GroupDetailPage />} />
            <Route path="/offline-reports" element={<OfflineReports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
