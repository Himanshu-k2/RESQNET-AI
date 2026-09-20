import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  HeartHandshake,
  Bot,
  WifiOff,
  Radio,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  Activity,
  AlertTriangle,
  Package,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Users,
  Megaphone,
  UserCheck,
  Info,
  ChevronRight,
  Compass,
  X,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const LandingPage = () => {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  // Dashboard Overview state
  const [stats, setStats] = useState({
    totalIncidents: 4,
    pendingVerification: 2,
    activeRequests: 4,
    availableResources: 5,
  });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Community Activity state
  const [communityActivity, setCommunityActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    fetchDashboardOverview();
    fetchCommunityActivity();
  }, [isAuthenticated]);

  const fetchDashboardOverview = async () => {
    try {
      setLoadingDashboard(true);
      const res = await api.get('/analytics/overview');
      if (res.data?.success) {
        setStats(res.data.stats);
        setRecentIncidents(res.data.recentIncidents || []);
        setRecentResources(res.data.recentResources || []);
      }
    } catch (err) {
      console.warn('Could not fetch live dashboard stats:', err.message);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchCommunityActivity = async () => {
    try {
      setLoadingActivity(true);
      const res = await api.get('/groups/activity');
      if (res.data?.success) {
        setCommunityActivity(res.data.activity || res.data.activities || []);
      }
    } catch (err) {
      console.warn('Could not fetch community activity:', err.message);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleQuickDemo = async (role) => {
    try {
      await demoLogin(role);
      if (role === 'coordinator') {
        navigate('/coordinator');
      } else {
        navigate('/need-help');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [roleErrorMessage, setRoleErrorMessage] = useState('');

  const handleProvideHelpClick = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    const role = (user?.role || '').toUpperCase();
    if (role === 'RESOURCE_PROVIDER' || role === 'CITIZEN') {
      navigate('/provider/dashboard');
    } else {
      setRoleErrorMessage(
        `Access restricted: You are currently signed in as "${user?.role}". Only registered Resource Providers can stage relief supplies. If you want to offer supplies or volunteer equipment, please sign in with a Resource Provider account.`
      );
    }
  };

  return (
    <div className="space-y-16 pb-16">
      




      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-10 text-center">
        {/* Soft Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-800 text-xs font-bold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary-600" />
          <span>AI-Powered Crisis Resilience & Rapid Resource Coordination</span>
        </div>

        {/* Brand & Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black text-navy-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
          Connecting Emergency Needs with <span className="text-primary-700">Verified Support</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          An open emergency network coordinating citizen distress requests with verified volunteer supplies, powered by human-in-the-loop verification and offline-first data sync.
        </p>

        {/* PRIMARY CALL-TO-ACTION BUTTONS */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
          {/* I NEED HELP - Soft Coral */}
          <Link
            to="/need-help"
            className="w-full sm:w-1/2 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-base sm:text-lg shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-200 group border border-emergency-700/50"
          >
            <AlertTriangle className="w-6 h-6 text-rose-200 group-hover:scale-110 transition-transform" />
            <span>I NEED HELP</span>
          </Link>

          {/* I CAN PROVIDE HELP - Calming Green / Teal */}
          <button
            type="button"
            onClick={handleProvideHelpClick}
            className="w-full sm:w-1/2 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-provider-600 hover:bg-provider-700 text-white font-bold text-base sm:text-lg shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-200 group border border-provider-700/50"
          >
            <HeartHandshake className="w-6 h-6 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>I CAN PROVIDE HELP</span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
          <Link
            to="/track"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Track Existing Request (ID + PIN)</span>
          </Link>
          <Link
            to="/auth?tab=register"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-800 border border-slate-200 transition-colors"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-primary-600" />
            <span>Register as Help Provider</span>
          </Link>
        </div>

        <p className="mt-3 text-xs text-slate-500 font-medium">
          Anonymous distress reporting supported • All new entries set to PENDING_VERIFICATION
        </p>

        {/* ONE PROMINENT BUTTON: VIEW CRITICAL SCENARIOS (Visible after login to Admin, Resource Provider, Coordinator) */}
        {isAuthenticated && (
          <div className="mt-6 flex flex-col items-center justify-center">
            <Link
              to="/critical-scenarios"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-black text-sm shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all ring-2 ring-amber-400/40 tracking-wide"
            >
              <Compass className="w-4 h-4 text-amber-100" />
              <span>VIEW CRITICAL SCENARIOS</span>
            </Link>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">
              AI-Assisted Emergency Preparedness
            </span>
          </div>
        )}

        {/* Evaluator Quick Access Strip */}
        <div className="mt-8 pt-6 border-t border-slate-200 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Evaluator 1-Click Personas:
          </span>
          <button
            onClick={() => handleQuickDemo('coordinator')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-primary-800 border border-slate-300 hover:border-primary-500 hover:bg-primary-50 transition-all shadow-xs"
          >
            <Radio className="w-3.5 h-3.5 text-primary-600" />
            <span>Cmdr. Sarah Jenkins (Coordinator)</span>
          </button>
          <button
            onClick={() => handleQuickDemo('citizen')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:border-slate-500 hover:bg-slate-50 transition-all shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-slate-600" />
            <span>Alex Rivera (Citizen Provider)</span>
          </button>
        </div>
      </section>

      {/* TELEMETRY DASHBOARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-6">
          
          {/* Dashboard Header & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
                <Activity className="w-4 h-4" />
                <span>Live Telemetry & Resource Network</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900">
                Live Disaster Telemetry & Network Overview
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Data Synchronization
              </span>
              <button
                onClick={fetchDashboardOverview}
                disabled={loadingDashboard}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 transition-all shadow-xs"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-4 h-4 ${loadingDashboard ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 4 Real-time Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Emergency Reports */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
                <AlertTriangle className="w-4 h-4 text-emergency-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-navy-900">
                {stats.totalIncidents}
              </div>
              <p className="text-[11px] text-slate-500">
                Total community crisis logs recorded
              </p>
            </div>

            {/* Card 2: Pending Verification */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Verification</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-900">
                {stats.pendingVerification}
              </div>
              <p className="text-[11px] text-amber-700">
                Awaiting coordinator validation
              </p>
            </div>

            {/* Card 3: Active Resource Requests */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-2">
              <div className="flex items-center justify-between text-sky-700">
                <span className="text-xs font-bold uppercase tracking-wider">Active Requests</span>
                <TrendingUp className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-sky-900">
                {stats.activeRequests}
              </div>
              <p className="text-[11px] text-sky-700">
                Unresolved community aid needs
              </p>
            </div>

            {/* Card 4: Available Resources */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-xs font-bold uppercase tracking-wider">Available Supplies</span>
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900">
                {stats.availableResources}
              </div>
              <p className="text-[11px] text-emerald-700">
                Ready for coordinator allocation
              </p>
            </div>

          </div>

          {/* Two-Column Feed: Recent Incidents & Recent Resource Offers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            
            {/* Left Column: Recent Incidents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-emergency-500" />
                  Recent Distress Reports
                </h3>
                <Link
                  to="/need-help"
                  className="text-xs font-bold text-emergency-600 hover:text-emergency-700 flex items-center gap-1"
                >
                  Report Emergency <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {recentIncidents.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No reports found.</p>
                ) : (
                  recentIncidents.map((inc) => (
                    <div
                      key={inc._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-background-light hover:bg-white transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-navy-900">
                              {inc.incidentType}
                            </span>
                            {inc.isSimulation && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                DEMO DATA
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {inc.location?.address}
                          </p>
                        </div>
                        <StatusBadge status={inc.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {inc.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Recent Resource Offers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-provider-500" />
                  Recent Relief Offers
                </h3>
                <Link
                  to="/provide-help"
                  className="text-xs font-bold text-provider-600 hover:text-provider-700 flex items-center gap-1"
                >
                  Provide Resources <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {recentResources.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No resource offers found.</p>
                ) : (
                  recentResources.map((res) => (
                    <div
                      key={res._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-background-light hover:bg-white transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-navy-900">
                              {res.title}
                            </span>
                            {res.isSimulation && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                DEMO DATA
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Qty: <strong className="text-navy-900">{res.quantity}</strong> • {res.contact?.name}
                          </p>
                        </div>
                        <StatusBadge status={res.availability} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {res.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Action Triggers Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Need immediate support or have resources ready for distribution?
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to="/need-help"
                className="w-1/2 sm:w-auto px-4 py-2 rounded-xl bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-xs text-center transition-all shadow-xs"
              >
                Report Emergency
              </Link>
              <Link
                to="/provide-help"
                className="w-1/2 sm:w-auto px-4 py-2 rounded-xl bg-provider-600 hover:bg-provider-700 text-white font-bold text-xs text-center transition-all shadow-xs"
              >
                Provide Resources
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* COMMUNITY SAFETY OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Section Header */}
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              <span>Community Safety Overview</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              Community Safety Overview
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Stay informed, connected, and ready to support your community.
            </p>
          </div>

          {/* Welcome / Orientation Card */}
          <div className="bg-gradient-to-r from-navy-900 via-primary-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-primary-800/40">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-semibold backdrop-blur-xs">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>Mutual Aid &amp; Voluntary Coordination Mesh</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isAuthenticated ? `Welcome back, ${user?.name || 'Responder'}!` : 'Welcome to ResQNet AI Emergency Network'}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {isAuthenticated
                  ? `Signed in as a verified ${user?.role || 'community member'}. Connect with your neighborhood groups, run voluntary safety roll-calls, or request rapid relief.`
                  : 'Join local community groups to perform voluntary safety check-ins, share verified neighborhood announcements, and coordinate mutual assistance during disasters.'}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto shrink-0">
              <Link
                to="/need-help"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-xs text-center shadow-soft transition-all"
              >
                Report Emergency
              </Link>
              <Link
                to="/provide-help"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-provider-600 hover:bg-provider-700 text-white font-bold text-xs text-center shadow-soft transition-all"
              >
                Provide Resources
              </Link>
              <Link
                to={isAuthenticated ? "/groups" : "/groups/join"}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center border border-white/20 shadow-soft transition-all"
              >
                {isAuthenticated ? "My Groups" : "Join a Community"}
              </Link>
            </div>
          </div>

          {/* 4 Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Need Help */}
            <Link
              to="/need-help"
              className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft hover:shadow-soft-md hover:border-emergency-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emergency-50 text-emergency-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-navy-900 text-sm mb-1 group-hover:text-emergency-700 transition-colors">
                  Need Help
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Report an urgent crisis or request medical, clean water, or shelter aid.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-emergency-600">
                <span>Submit Request</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Provide Help */}
            <Link
              to="/provide-help"
              className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft hover:shadow-soft-md hover:border-provider-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-provider-50 text-provider-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-navy-900 text-sm mb-1 group-hover:text-provider-700 transition-colors">
                  Provide Help
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Register supplies, transport vehicles, or volunteer teams to assist nearby neighbors.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-provider-600">
                <span>Offer Resources</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Community Groups */}
            <Link
              to="/groups"
              className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft hover:shadow-soft-md hover:border-primary-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-navy-900 text-sm mb-1 group-hover:text-primary-700 transition-colors">
                  Community Groups
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Coordinate with your apartment, neighborhood, or organization with voluntary safety check-ins.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-primary-700">
                <span>View My Groups</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4: Command Center */}
            <Link
              to="/coordinator"
              className="group bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft hover:shadow-soft-md hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Radio className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-navy-900 text-sm mb-1 group-hover:text-indigo-700 transition-colors">
                  Command Center
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Review verified incident reports, allocate relief, and monitor live telemetry.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-700">
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Safety Information & Non-Dispatch Disclaimer Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-navy-900 font-bold">Important Safety Notice: </strong>
              ResQNet AI helps organize community mutual aid, volunteer supplies, and distress reports. In life-threatening emergencies requiring immediate rescue or police response, please contact your local emergency authorities (e.g. 112 / 911) first. Community check-ins are strictly voluntary and do not automatically contact government dispatchers.
            </div>
          </div>
        </div>
      </section>

      {/* RECENT COMMUNITY ACTIVITY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
                <Activity className="w-4 h-4" />
                <span>Live Feed</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-navy-900">
                Recent Community Activity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Updates from local community groups, voluntary check-ins, and verified relief activity.
              </p>
            </div>

            <Link
              to="/groups"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs font-bold text-navy-900 transition-all shadow-xs self-start sm:self-auto"
            >
              <Users className="w-3.5 h-3.5 text-primary-600" />
              <span>Explore Groups</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingActivity ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary-600 mb-2" />
              Loading recent community activity...
            </div>
          ) : communityActivity.length === 0 ? (
            /* Empty state required by prompt */
            <div className="py-10 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                Your community updates will appear here once you join a group or participate in a safety activity.
              </p>
              <div>
                <Link
                  to="/groups"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white shadow-soft transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Explore Community Groups</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityActivity.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-background-light hover:bg-white transition-all space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-primary-800 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {item.groupName}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      {item.type === 'announcement' ? (
                        <Megaphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : item.type === 'check_in' ? (
                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Activity className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-navy-900 leading-snug">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>{item.authorName || 'Community Member'}</span>
                    {item.groupId && (
                      <Link
                        to={`/groups/${item.groupId}`}
                        className="text-primary-700 hover:text-primary-800 font-bold flex items-center gap-0.5"
                      >
                        View Group <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4 Core Crisis Resilience Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
            Designed for Real-World Crisis Conditions
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Traditional tools break during power loss or high panic. ResQNet AI combines resilient data modeling with human accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: ResQGuide AI */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-soft-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 border border-teal-100">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-navy-900 text-base mb-1.5">ResQGuide AI Assistant</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Step-by-step guidance in English, Hindi, and Hinglish. Automatically parses distress phrasing into structured, non-hallucinated emergency telemetry.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-primary-700">
              <span>Intelligent Triage</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 2: Offline-First IndexedDB */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-soft-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 border border-amber-100">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-navy-900 text-base mb-1.5">Zero-Loss Offline Cache</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                When cell networks drop, reports are safely sealed in browser IndexedDB storage and auto-synced the moment connection is restored.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-amber-700">
              <span>Zero-Loss Storage</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 3: AI Resource Matching */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-soft-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-100">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-navy-900 text-base mb-1.5">AI Resource Matching</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Recommends pairing urgent distress reports with nearby registered food, clean water, boats, and medical inventory with transparent rationale.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-700">
              <span>Smart Allocation</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 4: Coordinator Command */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-soft-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 border border-indigo-100">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-navy-900 text-base mb-1.5">Coordinator Command</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Human-in-the-loop verification pipeline. Coordinators review status, approve matches, and manage incident dispatch timelines.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-700">
              <span>Command Center</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Ethics Principles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-navy-900 rounded-3xl p-8 sm:p-12 text-white shadow-soft-lg">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-teal-300 font-semibold mb-4">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Ethical AI & Crisis Principles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Responsible Design. Absolute Transparency.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              In emergencies, clarity and honesty save lives. ResQNet AI enforces strict guardrails:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <Lock className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-slate-100">Privacy Safeguards</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Precise locations are safeguarded to protect vulnerable shelters from unwarranted public exposure.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-slate-100">Verification Gatekeeping</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    All incoming reports start as PENDING_VERIFICATION. No automatic panic alerts are broadcast.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <Bot className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-slate-100">Zero Hallucinations</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    The platform permits "I don't know" rather than forcing users or AI to invent casualty numbers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-slate-100">Full Audit History</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Every state transition and resource allocation is timestamped with coordinator identification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Access Feedback Modal */}
      {roleErrorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900">Resource Provider Portal</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {roleErrorMessage}
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setRoleErrorMessage('')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
              >
                Dismiss
              </button>
              <Link
                to="/auth?tab=register"
                onClick={() => setRoleErrorMessage('')}
                className="px-4 py-2 rounded-xl bg-primary-700 hover:bg-primary-800 text-xs font-bold text-white shadow-soft transition-colors"
              >
                Sign In as Provider
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
