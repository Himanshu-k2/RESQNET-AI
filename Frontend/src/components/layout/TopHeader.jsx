import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  CheckCircle2,
  AlertTriangle,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ROUTE_TITLES = {
  '/': 'Home / Disaster Telemetry',
  '/auth': 'Authentication Gateway',
  '/need-help': 'Emergency Distress Reporting',
  '/track': 'Real-time Request Tracking',
  '/provider/dashboard': 'Help Provider Control Center',
  '/admin/dashboard': 'Admin Command Center',
  '/admin/requests': 'Emergency Requests & Resource Assignments',
  '/coordinator': 'Coordinator Command Center',
  '/critical-scenarios': 'Critical Scenarios Preparedness Hub',
  '/groups': 'Community Safety Mesh',
  '/groups/create': 'Create Community Group',
  '/groups/join': 'Join Community Group',
  '/offline-reports': 'Offline Incident Queue',
  '/notifications': 'Notification Center',
};

export const TopHeader = ({ onToggleMobileSidebar, unreadCount = 0, onRefreshNotifications }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [quickNotifications, setQuickNotifications] = useState([]);
  const [loadingQuickNotifs, setLoadingQuickNotifs] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Derive current page title
  const currentTitle =
    ROUTE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/groups/') ? 'Community Group Details' : 'ResQNet AI Portal');

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch recent notifications when dropdown opens
  const handleToggleNotifications = async () => {
    const nextState = !notificationDropdownOpen;
    setNotificationDropdownOpen(nextState);
    if (nextState && isAuthenticated) {
      try {
        setLoadingQuickNotifs(true);
        const res = await api.get('/notifications?limit=5');
        if (res.data?.success) {
          setQuickNotifications(res.data.notifications || []);
        }
      } catch (err) {
        console.warn('Could not load quick notifications:', err);
      } finally {
        setLoadingQuickNotifs(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setQuickNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile Sidebar Toggle + Page Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                ResQNet AI
              </span>
              <span className="text-xs text-slate-300 hidden sm:inline">•</span>
              <h1 className="text-sm sm:text-base font-black text-navy-900 truncate">
                {currentTitle}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Actions & User Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Notification Bell Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleToggleNotifications}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {notificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in duration-150">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-primary-600" />
                        <span className="text-xs font-bold text-navy-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-800 text-[10px] font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-primary-700 hover:text-primary-800"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {loadingQuickNotifs ? (
                        <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
                      ) : quickNotifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                          <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto" />
                          <p className="font-semibold text-slate-600">You're all caught up!</p>
                          <p className="text-[11px] text-slate-400">No new notifications.</p>
                        </div>
                      ) : (
                        quickNotifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => {
                              setNotificationDropdownOpen(false);
                              navigate('/notifications');
                            }}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors space-y-1 ${
                              !n.isRead ? 'bg-primary-50/40' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-navy-900 line-clamp-1">{n.title}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationDropdownOpen(false)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-800"
                      >
                        <span>View All in Notification Center</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Pill & Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all focus:outline-none"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs border border-primary-200">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-navy-900 leading-tight truncate max-w-[120px]">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium capitalize truncate">
                      {user?.role}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in duration-150">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-100">
                      <p className="text-xs font-bold text-navy-900">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-800">
                        {user?.role}
                      </span>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      {user?.role === 'RESOURCE_PROVIDER' && (
                        <Link
                          to="/provider/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-navy-900"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          <span>Provider Control Center</span>
                        </Link>
                      )}

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-navy-900"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Admin Command Center</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/auth"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-navy-900 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth?tab=register"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white shadow-soft transition-all"
              >
                Register as Provider
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
