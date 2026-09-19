import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  AlertTriangle,
  Package,
  FileText,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';

export const AdminDashboard = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'resources' | 'users' | 'audit'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data States
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Metrics
  const [metrics, setMetrics] = useState({
    pendingRequests: 0,
    verifiedRequests: 0,
    pendingResources: 0,
    verifiedResources: 0,
    totalUsers: 0,
    coordinatorsCount: 0,
  });

  const fetchAllAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [incRes, resRes, usrRes, audRes] = await Promise.all([
        api.get('/incidents?limit=100'),
        api.get('/resources?limit=100'),
        api.get('/users?limit=100'),
        api.get('/audit?limit=50'),
      ]);

      const incData = incRes.data?.incidents || [];
      const resData = resRes.data?.resources || [];
      const usrData = usrRes.data?.users || [];
      const audData = audRes.data?.logs || [];

      setRequests(incData);
      setResources(resData);
      setUsersList(usrData);
      setAuditLogs(audData);

      setMetrics({
        pendingRequests: incData.filter((i) => i.verificationStatus === 'PENDING_VERIFICATION').length,
        verifiedRequests: incData.filter((i) => i.verificationStatus === 'VERIFIED').length,
        pendingResources: resData.filter((r) => r.verificationStatus === 'PENDING_VERIFICATION').length,
        verifiedResources: resData.filter((r) => r.verificationStatus === 'VERIFIED').length,
        totalUsers: usrData.length,
        coordinatorsCount: usrData.filter(
          (u) => (u.role || '').toUpperCase() === 'COORDINATOR' || u.role === 'coordinator'
        ).length,
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load administrative console data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    const roleUpper = (user?.role || '').toUpperCase();
    if (roleUpper !== 'ADMIN' && user?.role !== 'admin') {
      navigate('/coordinator');
      return;
    }
    fetchAllAdminData();
  }, [isAuthenticated, user]);

  // Request Verification
  const handleVerifyRequest = async (id, action) => {
    try {
      await api.post(`/incidents/${id}/verify`, {
        action,
        reason: action === 'VERIFY' ? 'Administrative approval' : 'Administrative rejection',
      });
      setSuccessMsg(`Incident marked as ${action === 'VERIFY' ? 'VERIFIED' : 'REJECTED'}.`);
      fetchAllAdminData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Action failed');
    }
  };

  // Resource Verification
  const handleVerifyResource = async (id, action) => {
    try {
      await api.post(`/resources/${id}/verify`, {
        action,
        reason: action === 'VERIFY' ? 'Administrative approval' : 'Administrative rejection',
      });
      setSuccessMsg(`Resource marked as ${action === 'VERIFY' ? 'VERIFIED' : 'REJECTED'}.`);
      fetchAllAdminData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Action failed');
    }
  };

  // Role Promotion / Assignment
  const handleRoleChange = async (userId, targetRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: targetRole });
      setSuccessMsg(`User role successfully changed to ${targetRole}.`);
      fetchAllAdminData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Role change failed');
    }
  };

  // Toggle User Active Status
  const handleStatusToggle = async (userId, currentActive) => {
    try {
      await api.patch(`/users/${userId}/status`, { isActive: !currentActive });
      setSuccessMsg(`User account ${!currentActive ? 'activated' : 'deactivated'}.`);
      fetchAllAdminData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Status update failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-primary-950 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-200 border border-primary-400/30 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-300" />
              <span>System Command &amp; RBAC Control Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Administrative Control Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Manage verified emergency requests, review resource offers, appoint Disaster Coordinators, and inspect audit logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchAllAdminData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Console</span>
            </button>
            <Link
              to="/admin/requests"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-black text-xs shadow-soft transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-navy-950" />
              <span>Manage Requests & Assignments</span>
            </Link>
            <Link
              to="/coordinator"
              className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-soft transition-all"
            >
              Go to Command Map
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Requests</span>
          <p className="text-xl font-black text-rose-600 mt-1">{metrics.pendingRequests}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Requests</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{metrics.verifiedRequests}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Resources</span>
          <p className="text-xl font-black text-amber-600 mt-1">{metrics.pendingResources}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Resources</span>
          <p className="text-xl font-black text-teal-600 mt-1">{metrics.verifiedResources}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Coordinators</span>
          <p className="text-xl font-black text-primary-600 mt-1">{metrics.coordinatorsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total User Accounts</span>
          <p className="text-xl font-black text-navy-900 mt-1">{metrics.totalUsers}</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        {[
          { id: 'requests', label: 'Emergency Requests', icon: AlertTriangle, count: requests.length },
          { id: 'resources', label: 'Resource Offers', icon: Package, count: resources.length },
          { id: 'users', label: 'User Roles & Accounts', icon: Users, count: usersList.length },
          { id: 'audit', label: 'System Audit Logs', icon: FileText, count: auditLogs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-2 border-b-2 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'border-primary-700 text-primary-800'
                  : 'border-transparent text-slate-500 hover:text-navy-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EMERGENCY REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-900">
              Emergency Request Queue &amp; Verification
            </h2>
            <span className="text-xs text-slate-500">Sorted by newest intake</span>
          </div>

          <div className="divide-y divide-slate-100">
            {requests.map((reqItem) => (
              <div key={reqItem._id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-primary-800 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-200">
                        {reqItem.requestId || reqItem._id}
                      </span>
                      <span className="text-xs font-bold text-navy-900">{reqItem.incidentType}</span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        ({reqItem.location?.address})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{reqItem.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={reqItem.status} />
                    {reqItem.verificationStatus === 'PENDING_VERIFICATION' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleVerifyRequest(reqItem._id, 'VERIFY')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                        </button>
                        <button
                          onClick={() => handleVerifyRequest(reqItem._id, 'REJECT')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Reported By: {reqItem.contact?.name || 'Anonymous Citizen'}</span>
                  <span>{new Date(reqItem.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RESOURCE OFFERS */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-900">
              Community Resource Offers &amp; Staging
            </h2>
            <span className="text-xs text-slate-500">Requires human coordinator verification</span>
          </div>

          <div className="divide-y divide-slate-100">
            {resources.map((resItem) => (
              <div key={resItem._id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        {resItem.resourceType}
                      </span>
                      <h3 className="text-sm font-bold text-navy-900">{resItem.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{resItem.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {resItem.availability}
                    </span>
                    {resItem.verificationStatus === 'PENDING_VERIFICATION' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleVerifyResource(resItem._id, 'VERIFY')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                        </button>
                        <button
                          onClick={() => handleVerifyResource(resItem._id, 'REJECT')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                          resItem.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {resItem.verificationStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    Provider: {resItem.contact?.name || 'Community Provider'} ({resItem.quantity})
                  </span>
                  <span>{resItem.location?.address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT & ROLE ASSIGNMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy-900">
                User Management &amp; Role Assignments
              </h2>
              <p className="text-xs text-slate-500">
                Only Administrators can appoint users to the COORDINATOR role or toggle account active status.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Role Action</th>
                  <th className="py-3 px-4 text-right">Account Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => {
                  const roleUpper = (u.role || '').toUpperCase();
                  const isCurrentAdmin = u._id === user?.id || u._id === user?._id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-navy-900">{u.name}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                            roleUpper === 'ADMIN'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : roleUpper === 'COORDINATOR' || u.role === 'coordinator'
                              ? 'bg-primary-50 text-primary-800 border-primary-200'
                              : 'bg-teal-50 text-teal-800 border-teal-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            u.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {roleUpper !== 'ADMIN' && (
                          <div className="flex items-center gap-1.5">
                            {roleUpper !== 'COORDINATOR' && u.role !== 'coordinator' ? (
                              <button
                                onClick={() => handleRoleChange(u._id, 'COORDINATOR')}
                                className="px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 font-bold text-[11px] transition-colors"
                              >
                                Appoint Coordinator
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoleChange(u._id, 'RESOURCE_PROVIDER')}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                              >
                                Demote to Provider
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isCurrentAdmin && (
                          <button
                            onClick={() => handleStatusToggle(u._id, u.isActive !== false)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                              u.isActive !== false
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-900">
              Immutable Action &amp; Triage Audit Log
            </h2>
            <span className="text-xs text-slate-500">Security &amp; Accountability Trail</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log._id} className="p-4 hover:bg-slate-50/50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-navy-900 bg-slate-100 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  <strong>{log.userName || 'System'}</strong> ({log.userRole || 'system'}) performed action on {log.targetType} {log.targetId}. Reason: "{log.reason || 'None provided'}".
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
