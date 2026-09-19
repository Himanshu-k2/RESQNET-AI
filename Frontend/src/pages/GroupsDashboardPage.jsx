import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  PlusCircle,
  KeyRound,
  ShieldCheck,
  Building,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORY_ICONS = {
  APARTMENT: Building,
  NEIGHBORHOOD: Home,
  WORKPLACE: Briefcase,
  SCHOOL_COLLEGE: GraduationCap,
  VOLUNTEER_ORG: Heart,
  FAMILY_FRIENDS: Users,
  OTHER: Users
};

const CATEGORY_LABELS = {
  APARTMENT: 'Apartment / Complex',
  NEIGHBORHOOD: 'Neighborhood / Colony',
  WORKPLACE: 'Workplace / Office',
  SCHOOL_COLLEGE: 'School / College',
  VOLUNTEER_ORG: 'Volunteer Group',
  FAMILY_FRIENDS: 'Family & Friends',
  OTHER: 'Community Group'
};

export const GroupsDashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyGroups();
  }, [isAuthenticated]);

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!isAuthenticated) {
        setGroups([]);
        setLoading(false);
        return;
      }
      const res = await api.get('/groups/my');
      if (res.data?.success) {
        setGroups(res.data.groups || []);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError(err.message || 'Failed to load community groups.');
    } finally {
      setLoading(false);
    }
  };

  // Metrics computation
  const totalGroups = groups.length;
  const totalMembers = groups.reduce((acc, g) => acc + (g.memberCount || 1), 0);
  const safeCount = groups.filter((g) => g.myCheckIn?.status === 'I_AM_SAFE').length;
  const needHelpCount = groups.filter((g) => g.myCheckIn?.status === 'I_NEED_ASSISTANCE' || g.myCheckIn?.status === 'EMERGENCY').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1.5">
            <Users className="w-4 h-4 text-primary-600" />
            <span>Community Resilience Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight">
            My Community Groups
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Coordinate with neighbors, run voluntary safety roll-calls, and share verified updates during crises.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/groups/join"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-all"
          >
            <KeyRound className="w-4 h-4 text-primary-600" />
            <span>Join with Code</span>
          </Link>
          <Link
            to="/groups/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs sm:text-sm shadow-soft transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Group</span>
          </Link>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">My Groups</span>
            <Users className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-900">
            {totalGroups}
          </div>
          <p className="text-[11px] text-slate-500">
            Enrolled emergency circles
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Members</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-900">
            {totalMembers}
          </div>
          <p className="text-[11px] text-slate-500">
            Across your joined groups
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Safe Check-Ins</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900">
            {safeCount}
          </div>
          <p className="text-[11px] text-emerald-700">
            Active safe confirmations
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-soft space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Assistance Needed</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900">
            {needHelpCount}
          </div>
          <p className="text-[11px] text-amber-700">
            Requesting mutual aid support
          </p>
        </div>
      </div>

      {/* Unauthenticated notice */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-primary-50 to-teal-50 border border-primary-200/70 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-900">Sign in to manage your community groups</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Join your building or neighborhood circle to check in safely, receive verified notices, and assist neighbors.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white shadow-soft"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            >
              Register
            </Link>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchMyGroups}
            className="ml-auto font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Groups List / Loading / Empty */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-600" />
          <p>Loading your community groups...</p>
        </div>
      ) : groups.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-soft space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mx-auto border border-primary-100">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-navy-900">
              No Community Groups Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Connect with your apartment building, residential colony, workplace, or volunteer unit to keep track of everyone’s safety during emergencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/groups/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs shadow-soft transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Group</span>
            </Link>
            <Link
              to="/groups/join"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-xs transition-all"
            >
              <KeyRound className="w-4 h-4 text-primary-600" />
              <span>Join with Invite Code</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Groups Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const CategoryIcon = CATEGORY_ICONS[group.category] || Users;
            return (
              <div
                key={group._id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-primary-300 p-6 shadow-soft hover:shadow-soft-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top row: Category badge & Privacy */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-800 text-[11px] font-bold border border-primary-200/60">
                      <CategoryIcon className="w-3.5 h-3.5 text-primary-600" />
                      <span>{CATEGORY_LABELS[group.category] || group.category}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                      {group.privacy === 'INVITE_ONLY' ? 'Invite Only' : 'Private'}
                    </span>
                  </div>

                  {/* Group Name & Area */}
                  <div>
                    <h3 className="text-lg font-black text-navy-900 tracking-tight leading-snug">
                      {group.name}
                    </h3>
                    {group.areaDescription && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {group.areaDescription}
                      </p>
                    )}
                  </div>

                  {group.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>
                  )}
                </div>

                {/* Status & Footer */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{group.memberCount || 1}</strong> members
                    </span>

                    <span className="text-[11px] font-bold text-primary-700 uppercase">
                      Role: {group.myRole || 'Member'}
                    </span>
                  </div>

                  {/* My check-in status preview */}
                  <div className="p-2.5 rounded-xl bg-background-light border border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-semibold">My Check-In:</span>
                    {group.myCheckIn ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        group.myCheckIn.status === 'I_AM_SAFE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : group.myCheckIn.status === 'I_NEED_ASSISTANCE'
                          ? 'bg-amber-100 text-amber-800'
                          : group.myCheckIn.status === 'EMERGENCY'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {group.myCheckIn.status.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                        Not Checked In
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/groups/${group._id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-primary-800 text-white font-bold text-xs transition-all shadow-xs"
                  >
                    <span>Open Group</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
