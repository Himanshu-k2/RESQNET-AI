import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Package,
  AlertTriangle,
  HeartHandshake,
  FileText,
  RefreshCw,
  CheckCheck,
  ArrowLeft,
  Filter,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const NotificationsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/notifications?limit=50');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchNotifications();
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch('/notifications/read-all');
      if (res.data?.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const filteredNotifications = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'RESOURCE_ASSIGNED':
      case 'RESOURCE_ASSIGNMENT_UPDATED':
        return <Package className="w-5 h-5 text-teal-600" />;
      case 'HELP_REQUEST_STATUS_UPDATED':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'RESOURCE_VERIFICATION_UPDATED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-primary-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 text-xs font-black">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Official emergency resource assignments, status updates, and coordination dispatches
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-navy-900 shadow-xs transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5 text-primary-600" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            !filterUnread
              ? 'bg-primary-50 text-primary-800 border border-primary-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterUnread
              ? 'bg-primary-50 text-primary-800 border border-primary-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchNotifications} className="font-bold underline ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft animate-pulse space-y-2.5"
            >
              <div className="h-4 bg-slate-100 rounded-md w-1/3"></div>
              <div className="h-3 bg-slate-100 rounded-md w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotifications.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-soft">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-base font-extrabold text-navy-900">
            {filterUnread ? 'No Unread Notifications' : 'No Notifications Yet'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {filterUnread
              ? 'All of your notifications have been marked as read.'
              : 'When emergency coordinators assign your resources or update relief requests, alerts will appear here.'}
          </p>
        </div>
      )}

      {/* Notification List */}
      {!loading && filteredNotifications.length > 0 && (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !notif.isRead
                  ? 'bg-white border-primary-200 shadow-soft ring-1 ring-primary-100'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-white shadow-2xs'
              }`}
            >
              <div className="flex items-start space-x-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !notif.isRead ? 'bg-primary-50 ring-1 ring-primary-200' : 'bg-slate-100'
                  }`}
                >
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-navy-900 leading-snug">
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    )}
                    {notif.relatedRequestId && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {notif.relatedRequestId}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif._id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    Mark as Read
                  </button>
                )}

                {notif.relatedRequestId && (
                  <Link
                    to={`/track`}
                    className="px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-800 text-xs font-bold transition-colors"
                  >
                    Track
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
