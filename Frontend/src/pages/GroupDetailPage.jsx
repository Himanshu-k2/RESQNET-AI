import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  Building,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  ArrowLeft,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  Clock,
  HelpCircle,
  Megaphone,
  PlusCircle,
  Trash2,
  Lock,
  Radio,
  MapPin,
  Info,
  RefreshCw,
  Send,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';

const CATEGORY_LABELS = {
  APARTMENT: 'Apartment / Complex',
  NEIGHBORHOOD: 'Neighborhood / Colony',
  WORKPLACE: 'Workplace / Office',
  SCHOOL_COLLEGE: 'School / College',
  VOLUNTEER_ORG: 'Volunteer Group',
  FAMILY_FRIENDS: 'Family & Friends',
  OTHER: 'Community Group'
};

export const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Active tab state (from URL param or default 'overview')
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Group data
  const [group, setGroup] = useState(null);
  const [membership, setMembership] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    safe: 0,
    assistanceRequested: 0,
    emergency: 0,
    unableToConfirm: 0,
    notCheckedIn: 0
  });
  const [userCheckIn, setUserCheckIn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Tab specific data
  const [members, setMembers] = useState([]);
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'NORMAL'
  });
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

  // Check-In form state
  const [checkInStatus, setCheckInStatus] = useState('I_AM_SAFE');
  const [checkInNote, setCheckInNote] = useState('');
  const [approxLocation, setApproxLocation] = useState('');
  const [locationShared, setLocationShared] = useState(false);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [checkInSuccessMsg, setCheckInSuccessMsg] = useState(null);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  useEffect(() => {
    if (activeTab === 'members') fetchMembers();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'incidents') fetchIncidents();
  }, [activeTab, groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/groups/${groupId}`);
      if (res.data?.success) {
        setGroup(res.data.group);
        setMembership(res.data.membership);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.userCheckIn) {
          setUserCheckIn(res.data.userCheckIn);
          setCheckInStatus(res.data.userCheckIn.status || 'I_AM_SAFE');
          setCheckInNote(res.data.userCheckIn.note || '');
          setApproxLocation(res.data.userCheckIn.approximateLocation || '');
          setLocationShared(!!res.data.userCheckIn.locationShared);
        }
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
      setError(err.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await api.get(`/groups/${groupId}/members`);
      if (res.data?.success) {
        setMembers(res.data.members || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const res = await api.get(`/groups/${groupId}/announcements`);
      if (res.data?.success) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoadingIncidents(true);
      const res = await api.get(`/groups/${groupId}/incidents`);
      if (res.data?.success) {
        setIncidents(res.data.incidents || []);
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoadingIncidents(false);
    }
  };

  const handleCopyCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmitCheckIn = async (e) => {
    e.preventDefault();
    try {
      setSubmittingCheckIn(true);
      setCheckInSuccessMsg(null);
      const payload = {
        status: checkInStatus,
        note: checkInNote.trim(),
        approximateLocation: approxLocation.trim(),
        locationShared: locationShared
      };
      const res = await api.post(`/groups/${groupId}/check-ins`, payload);
      if (res.data?.success) {
        setUserCheckIn(res.data.checkIn);
        setCheckInSuccessMsg('Your voluntary safety check-in has been recorded.');
        fetchGroupDetails();
        setTimeout(() => setCheckInSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Error submitting check-in:', err);
      alert(err.message || 'Failed to submit check-in.');
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) return;

    try {
      setPostingAnnouncement(true);
      const res = await api.post(`/groups/${groupId}/announcements`, newAnnouncement);
      if (res.data?.success) {
        setAnnouncements([res.data.announcement, ...announcements]);
        setNewAnnouncement({ title: '', message: '', priority: 'NORMAL' });
      }
    } catch (err) {
      console.error('Error posting announcement:', err);
      alert(err.message || 'Failed to post announcement.');
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const res = await api.delete(`/groups/${groupId}/announcements/${announcementId}`);
      if (res.data?.success) {
        setAnnouncements(announcements.filter((a) => a._id !== announcementId));
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  const isAdminOrMod = membership?.role === 'admin' || membership?.role === 'moderator' || user?.role === 'coordinator';

  // Filter members
  const filteredMembers = members.filter((m) => {
    if (memberFilter === 'ALL') return true;
    if (memberFilter === 'NOT_CHECKED_IN') return !m.checkIn;
    return m.checkIn?.status === memberFilter;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-3" />
        <p className="text-sm font-medium">Loading community group details...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-navy-900">Group Not Found or Inaccessible</h2>
        <p className="text-sm text-slate-600">{error || 'You may not have permission to view this private group.'}</p>
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-700 text-white font-bold text-xs shadow-soft"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Groups</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/groups"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Community Groups</span>
        </Link>

        {group.inviteCode && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-500 font-semibold">Invite Code:</span>
            <span className="font-mono font-black text-primary-700 tracking-wider">
              {group.inviteCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 text-slate-400 hover:text-primary-700 transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Group Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-800 text-xs font-bold border border-primary-200/60">
                <Users className="w-3.5 h-3.5 text-primary-600" />
                <span>{CATEGORY_LABELS[group.category] || group.category}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <Lock className="w-3 h-3 text-slate-400" />
                {group.privacy === 'INVITE_ONLY' ? 'Invite Only' : 'Private'}
              </span>
              {membership && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>My Role: {membership.role?.toUpperCase()}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              {group.name}
            </h1>

            {group.areaDescription && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{group.areaDescription}</span>
              </p>
            )}

            {group.description && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed mt-1">
                {group.description}
              </p>
            )}
          </div>

          {/* Primary Quick CTAs */}
          <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('check_in')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>{userCheckIn ? 'Update My Check-In' : 'Safety Check-In'}</span>
            </button>

            <Link
              to={`/need-help?groupId=${group._id}`}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Incident for Group</span>
            </Link>
          </div>
        </div>

        {/* 5-part Roll-call Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Safe</span>
            <span className="text-xl font-black text-emerald-900">{stats.safe || 0}</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Needs Aid</span>
            <span className="text-xl font-black text-amber-900">{stats.assistanceRequested || 0}</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Emergency</span>
            <span className="text-xl font-black text-rose-900">{stats.emergency || 0}</span>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Unable to Confirm</span>
            <span className="text-xl font-black text-indigo-900">{stats.unableToConfirm || 0}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Not Checked In</span>
            <span className="text-xl font-black text-slate-700">{stats.notCheckedIn || 0}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl px-2 py-1 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-primary-50 text-primary-800 border border-primary-200/60'
              : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('check_in')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'check_in'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/40'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Voluntary Safety Check-In</span>
          {userCheckIn && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'members'
              ? 'bg-primary-50 text-primary-800 border border-primary-200/60'
              : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-primary-600" />
          <span>Members &amp; Roll-Call ({stats.totalMembers || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'announcements'
              ? 'bg-primary-50 text-primary-800 border border-primary-200/60'
              : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-amber-600" />
          <span>Announcements</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'incidents'
              ? 'bg-emergency-50 text-emergency-800 border border-emergency-200/60'
              : 'text-slate-600 hover:text-emergency-700 hover:bg-emergency-50/40'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-emergency-500" />
          <span>Group Incidents</span>
        </button>
      </div>

      {/* ==================== TAB 1: OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Group Feed / Welcome / Announcements preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Safety Information Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
              <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-navy-900 font-bold">Voluntary Coordination Guarantee: </strong>
                Safety check-ins in this group are strictly voluntary and kept within verified group members. Check-ins do not trigger governmental dispatch. In urgent life-or-death emergencies, call emergency services (112 / 911) immediately.
              </div>
            </div>

            {/* My Check-In Quick Status Box */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>My Safety Status</span>
                </h3>
                <button
                  onClick={() => setActiveTab('check_in')}
                  className="text-xs font-bold text-primary-700 hover:text-primary-800 underline"
                >
                  {userCheckIn ? 'Change Status' : 'Check In Now'}
                </button>
              </div>

              {userCheckIn ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      userCheckIn.status === 'I_AM_SAFE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : userCheckIn.status === 'I_NEED_ASSISTANCE'
                        ? 'bg-amber-100 text-amber-800'
                        : userCheckIn.status === 'EMERGENCY'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {userCheckIn.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Updated {new Date(userCheckIn.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {userCheckIn.note && (
                    <p className="text-xs text-slate-700 font-medium">
                      "{userCheckIn.note}"
                    </p>
                  )}
                  {userCheckIn.locationShared && userCheckIn.approximateLocation && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Approx: {userCheckIn.approximateLocation}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                  <span>You haven't recorded your voluntary safety status for this group yet.</span>
                  <button
                    onClick={() => setActiveTab('check_in')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs hover:bg-amber-700"
                  >
                    Check In
                  </button>
                </div>
              )}
            </div>

            {/* Group Announcements Preview */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-600" />
                  <span>Recent Announcements</span>
                </h3>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className="text-xs font-bold text-primary-700 hover:text-primary-800"
                >
                  View All Announcements
                </button>
              </div>

              {announcements.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No announcements posted yet.
                  {isAdminOrMod && (
                    <div className="mt-2">
                      <button
                        onClick={() => setActiveTab('announcements')}
                        className="font-bold text-primary-700 underline"
                      >
                        Post first notice
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {announcements.slice(0, 3).map((ann) => (
                    <div
                      key={ann._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-background-light space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-navy-900">{ann.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ann.priority === 'SAFETY_NOTICE'
                            ? 'bg-rose-100 text-rose-800'
                            : ann.priority === 'IMPORTANT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-primary-50 text-primary-700'
                        }`}>
                          {ann.priority.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{ann.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Group Details & Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft space-y-4">
              <h3 className="text-base font-bold text-navy-900">Group Information</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Category</span>
                  <span className="font-bold text-navy-900">{CATEGORY_LABELS[group.category] || group.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Location Covered</span>
                  <span className="font-bold text-navy-900">{group.areaDescription || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Created On</span>
                  <span className="font-bold text-navy-900">{new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Total Registered Members</span>
                  <span className="font-bold text-navy-900">{stats.totalMembers || 1} people</span>
                </div>
              </div>
            </div>

            {/* Invite Members Card */}
            <div className="bg-gradient-to-br from-primary-900 to-navy-900 rounded-3xl p-6 text-white shadow-soft space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Invite Members</h3>
              </div>
              <p className="text-xs text-slate-300">
                Share this 6-character code with neighbors to let them join this coordination group.
              </p>
              <div className="p-3 rounded-xl bg-white/10 border border-white/20 flex items-center justify-between">
                <span className="font-mono font-black text-xl text-teal-300 tracking-wider select-all">
                  {group.inviteCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-white text-navy-900 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: SAFETY CHECK-IN ==================== */}
      {activeTab === 'check_in' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Non-dispatch disclaimer */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-5 flex items-start gap-3.5 text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-sm">Voluntary Community Check-In Only</h4>
              <p className="leading-relaxed">
                Submitting this check-in shares your status only with members of this group. <strong>It does not contact police, fire, or ambulance dispatch.</strong> In a life-threatening crisis, call official emergency authorities directly (e.g. 112 / 911).
              </p>
            </div>
          </div>

          {checkInSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{checkInSuccessMsg}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-6">
            <div>
              <h2 className="text-xl font-black text-navy-900">
                Update Your Voluntary Safety Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Let your neighbors and coordinators know how you and your household are doing.
              </p>
            </div>

            <form onSubmit={handleSubmitCheckIn} className="space-y-6">
              {/* 4 Status Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. I_AM_SAFE */}
                <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  checkInStatus === 'I_AM_SAFE'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="checkInStatus"
                    value="I_AM_SAFE"
                    checked={checkInStatus === 'I_AM_SAFE'}
                    onChange={() => setCheckInStatus('I_AM_SAFE')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-emerald-900">I Am Safe</h4>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Household is secure, no immediate assistance needed.
                    </p>
                  </div>
                </label>

                {/* 2. I_NEED_ASSISTANCE */}
                <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  checkInStatus === 'I_NEED_ASSISTANCE'
                    ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="checkInStatus"
                    value="I_NEED_ASSISTANCE"
                    checked={checkInStatus === 'I_NEED_ASSISTANCE'}
                    onChange={() => setCheckInStatus('I_NEED_ASSISTANCE')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-bold text-amber-900">I Need Assistance</h4>
                    </div>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Non-critical aid requested: water, food, medicine, battery power.
                    </p>
                  </div>
                </label>

                {/* 3. EMERGENCY */}
                <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  checkInStatus === 'EMERGENCY'
                    ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="checkInStatus"
                    value="EMERGENCY"
                    checked={checkInStatus === 'EMERGENCY'}
                    onChange={() => setCheckInStatus('EMERGENCY')}
                    className="mt-1 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <h4 className="text-xs font-bold text-rose-900">Emergency / Distress</h4>
                    </div>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      High urgency: medical help or flood evacuation needed.
                    </p>
                  </div>
                </label>

                {/* 4. UNABLE_TO_CONFIRM */}
                <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  checkInStatus === 'UNABLE_TO_CONFIRM'
                    ? 'border-indigo-500 bg-indigo-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="checkInStatus"
                    value="UNABLE_TO_CONFIRM"
                    checked={checkInStatus === 'UNABLE_TO_CONFIRM'}
                    onChange={() => setCheckInStatus('UNABLE_TO_CONFIRM')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-indigo-900">Unable to Confirm</h4>
                    </div>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Checking on dependents or partial safety.
                    </p>
                  </div>
                </label>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                  Optional Note / Situation Details
                </label>
                <textarea
                  value={checkInNote}
                  onChange={(e) => setCheckInNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Safe on 4th floor with 2 elderly family members. We have 3 days of clean drinking water."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs font-medium"
                />
              </div>

              {/* Approximate Location & Consent Toggle */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span>Approximate Location within Group Area</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={locationShared}
                      onChange={(e) => setLocationShared(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Share with members</span>
                  </label>
                </div>

                <input
                  type="text"
                  value={approxLocation}
                  onChange={(e) => setApproxLocation(e.target.value)}
                  placeholder="e.g. Block B, Flat 402 or Community Hall"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs font-medium bg-white"
                />
                <p className="text-[11px] text-slate-500">
                  Approximate locations are only visible to group members when "Share with members" is checked.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={submittingCheckIn}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingCheckIn ? 'Recording...' : 'Save Voluntary Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: MEMBERS & ROLL-CALL ==================== */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Member Roll-Call Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            {[
              { id: 'ALL', label: 'All Members', count: stats.totalMembers },
              { id: 'I_AM_SAFE', label: 'Safe', count: stats.safe },
              { id: 'I_NEED_ASSISTANCE', label: 'Needs Aid', count: stats.assistanceRequested },
              { id: 'EMERGENCY', label: 'Emergency', count: stats.emergency },
              { id: 'UNABLE_TO_CONFIRM', label: 'Unable to Confirm', count: stats.unableToConfirm },
              { id: 'NOT_CHECKED_IN', label: 'Not Checked In', count: stats.notCheckedIn }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setMemberFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  memberFilter === f.id
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{f.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  memberFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {f.count || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Members List */}
          {loadingMembers ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary-600 mb-2" />
              Loading group roster...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No members match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((m) => {
                const isSafe = m.checkIn?.status === 'I_AM_SAFE';
                const isNeed = m.checkIn?.status === 'I_NEED_ASSISTANCE';
                const isEmerg = m.checkIn?.status === 'EMERGENCY';
                const isUnable = m.checkIn?.status === 'UNABLE_TO_CONFIRM';
                const notChecked = !m.checkIn;

                return (
                  <div
                    key={m.userId}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-soft space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs border border-primary-200 shrink-0">
                            {m.name ? m.name.slice(0, 2).toUpperCase() : 'MB'}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-navy-900 leading-tight">
                              {m.name}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {m.role}
                            </span>
                          </div>
                        </div>

                        {/* Status badge */}
                        {notChecked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            Not Checked In
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSafe
                              ? 'bg-emerald-100 text-emerald-800'
                              : isNeed
                              ? 'bg-amber-100 text-amber-800'
                              : isEmerg
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {m.checkIn.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      {/* Note if available */}
                      {m.checkIn?.note && (
                        <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg italic">
                          "{m.checkIn.note}"
                        </p>
                      )}

                      {/* Approximate Location */}
                      {m.checkIn?.approximateLocation && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{m.checkIn.approximateLocation}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Joined {new Date(m.joinedAt).toLocaleDateString()}</span>
                      {m.checkIn?.updatedAt && (
                        <span>Checked in {new Date(m.checkIn.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 4: ANNOUNCEMENTS ==================== */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Post Notice Form (for Admin, Moderator, Coordinator) */}
          {isAdminOrMod && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Megaphone className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-navy-900">Post Group Safety Notice / Announcement</h3>
              </div>

              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      placeholder="e.g. Drinking water tanker arrives at Gate 2"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                      Priority Level
                    </label>
                    <select
                      value={newAnnouncement.priority}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 text-xs font-medium bg-white"
                    >
                      <option value="NORMAL">Normal Notice</option>
                      <option value="IMPORTANT">Important</option>
                      <option value="SAFETY_NOTICE">Safety Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                    Announcement Message
                  </label>
                  <textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    rows={3}
                    placeholder="Details, instructions, or meeting points..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 text-xs font-medium"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={postingAnnouncement}
                    className="px-5 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs shadow-soft transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{postingAnnouncement ? 'Publishing...' : 'Publish Announcement'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Announcements Feed */}
          {loadingAnnouncements ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary-600 mb-2" />
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No announcements have been published in this group yet.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  className={`rounded-2xl p-5 border shadow-soft transition-all space-y-3 ${
                    ann.priority === 'SAFETY_NOTICE'
                      ? 'bg-rose-50/50 border-rose-200'
                      : ann.priority === 'IMPORTANT'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          ann.priority === 'SAFETY_NOTICE'
                            ? 'bg-rose-600 text-white'
                            : ann.priority === 'IMPORTANT'
                            ? 'bg-amber-500 text-white'
                            : 'bg-primary-100 text-primary-800'
                        }`}>
                          {ann.priority.replace(/_/g, ' ')}
                        </span>
                        <h4 className="font-bold text-sm text-navy-900">
                          {ann.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Posted by <strong>{ann.author?.name || 'Coordinator'}</strong> • {new Date(ann.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {isAdminOrMod && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {ann.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 5: GROUP INCIDENTS ==================== */}
      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-navy-900">Group-Linked Emergency Incidents</h3>
              <p className="text-xs text-slate-500">
                Emergencies reported by or linked specifically to members of {group.name}.
              </p>
            </div>

            <Link
              to={`/need-help?groupId=${group._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-xs shadow-soft transition-all self-start sm:self-auto"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Incident for This Group</span>
            </Link>
          </div>

          {loadingIncidents ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary-600 mb-2" />
              Loading group incidents...
            </div>
          ) : incidents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-navy-900">No active incidents reported for this group.</p>
              <p className="text-slate-500">Everyone in this group is currently operating safely.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidents.map((inc) => (
                <div
                  key={inc._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-navy-900 block">
                          {inc.incidentType}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(inc.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <StatusBadge status={inc.status} size="sm" />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {inc.description}
                    </p>

                    {inc.location?.address && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{inc.location.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Severity: <strong>{inc.severity || 'Medium'}</strong>
                    </span>
                    <Link
                      to={`/incidents/${inc._id}`}
                      className="text-primary-700 hover:text-primary-800 font-bold text-xs"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
