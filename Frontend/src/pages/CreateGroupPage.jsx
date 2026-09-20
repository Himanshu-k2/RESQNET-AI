import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  PlusCircle,
  Building,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Lock,
  Radio,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'APARTMENT', label: 'Apartment / Housing Complex', desc: 'Building, society, or tower neighbors' },
  { value: 'NEIGHBORHOOD', label: 'Neighborhood / Colony', desc: 'Street, sector, or local residential block' },
  { value: 'WORKPLACE', label: 'Workplace / Office', desc: 'Colleagues and floor emergency teams' },
  { value: 'SCHOOL_COLLEGE', label: 'School / University Campus', desc: 'Students, faculty, or dorm members' },
  { value: 'VOLUNTEER_ORG', label: 'Volunteer / Mutual Aid Group', desc: 'Relief teams and organized responders' },
  { value: 'FAMILY_FRIENDS', label: 'Family & Friends Circle', desc: 'Close relatives and trusted friends' },
  { value: 'OTHER', label: 'Other Community', desc: 'Any community group coordinating safety' }
];

export const CreateGroupPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: 'APARTMENT',
    areaDescription: '',
    description: '',
    privacy: 'INVITE_ONLY'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdGroup, setCreatedGroup] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError('You must be signed in to create a community group. Redirecting to login...');
      setTimeout(() => navigate('/auth?tab=login'), 1500);
      return;
    }

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError('Please provide a group name.');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Group name must be at least 2 characters.');
      return;
    }

    if (trimmedName.length > 60) {
      setError('Group name cannot exceed 60 characters.');
      return;
    }

    const payload = {
      name: trimmedName,
      category: formData.category || 'APARTMENT',
      areaDescription: (formData.areaDescription || '').trim().slice(0, 100),
      description: (formData.description || '').trim().slice(0, 300),
      privacy: formData.privacy || 'INVITE_ONLY',
    };

    console.log('[CreateGroupPage] Submitting create group payload:', payload);

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/groups', payload);
      console.log('[CreateGroupPage] Group created response:', res.data);
      if (res.data?.success) {
        setCreatedGroup(res.data.group);
      }
    } catch (err) {
      console.error('[CreateGroupPage] Failed to create community group:', {
        status: err.status,
        message: err.message,
        backendResponse: err.response?.data,
      });

      if (err.status === 401) {
        setError('Your session has expired or you are not logged in. Please sign in to create a group.');
      } else {
        setError(err.message || 'Failed to create community group.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdGroup?.inviteCode) {
      navigator.clipboard.writeText(createdGroup.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button */}
      <Link
        to="/groups"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Groups</span>
      </Link>

      {/* Success View when created */}
      {createdGroup ? (
        <div className="bg-white rounded-3xl border border-emerald-200/90 p-8 sm:p-10 shadow-soft space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-navy-900">
              Community Group Created!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              <strong className="text-navy-900 font-bold">{createdGroup.name}</strong> is now live. Share the private invite code with your members so they can join and check in.
            </p>
          </div>

          {/* Invite Code Box */}
          <div className="max-w-sm mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Group Invite Code
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-black tracking-widest text-primary-700 select-all">
                {createdGroup.inviteCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs"
                title="Copy Invite Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {copied ? 'Copied to clipboard!' : 'Members use this code to join in one click'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate(`/groups/${createdGroup._id}`)}
              className="px-6 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm shadow-soft transition-all"
            >
              Go to Group Dashboard
            </button>
            <Link
              to="/groups"
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
            >
              Back to All Groups
            </Link>
          </div>
        </div>
      ) : (
        /* Form View */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-soft space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
              <Users className="w-4 h-4 text-primary-600" />
              <span>Step 1 of 1</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-900">
              Create a Community Group
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Set up a private coordination circle for your building, neighborhood, workplace, or family during crisis situations.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Authentication Required</p>
                <p className="text-amber-800">
                  You need to be signed in to create and manage a community group.{' '}
                  <Link to="/auth?tab=login" className="underline font-bold text-amber-950 hover:text-primary-700">
                    Sign in here
                  </Link>{' '}
                  or{' '}
                  <Link to="/auth?tab=register" className="underline font-bold text-amber-950 hover:text-primary-700">
                    register an account
                  </Link>.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                Group Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Greenwood Heights - Tower B"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                A recognizable name for residents, colleagues, or volunteers.
              </p>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} — {cat.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Area / Neighborhood Description */}
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                Area / Location Description
              </label>
              <input
                type="text"
                value={formData.areaDescription}
                onChange={(e) => setFormData({ ...formData, areaDescription: e.target.value })}
                placeholder="e.g. Sector 62, Block B &amp; C, South Wing"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Helps members identify the physical area covered by this group.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                Group Description / Purpose (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="e.g. Resident voluntary roll-calls, flood alerts, and generator fuel coordination."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
              />
            </div>

            {/* Privacy Setting */}
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                Access &amp; Privacy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  formData.privacy === 'INVITE_ONLY'
                    ? 'border-primary-500 bg-primary-50/50'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}>
                  <input
                    type="radio"
                    name="privacy"
                    value="INVITE_ONLY"
                    checked={formData.privacy === 'INVITE_ONLY'}
                    onChange={() => setFormData({ ...formData, privacy: 'INVITE_ONLY' })}
                    className="mt-1"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-navy-900">Invite-Only (Recommended)</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Anyone with the 6-character code can join directly.
                    </p>
                  </div>
                </label>

                <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  formData.privacy === 'PRIVATE'
                    ? 'border-primary-500 bg-primary-50/50'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}>
                  <input
                    type="radio"
                    name="privacy"
                    value="PRIVATE"
                    checked={formData.privacy === 'PRIVATE'}
                    onChange={() => setFormData({ ...formData, privacy: 'PRIVATE' })}
                    className="mt-1"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-navy-900">Private</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Restricted to group members invited specifically.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Info Callout */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                As the group creator, you will automatically be designated as the Group Admin and can publish safety notices, moderate members, and review roll-calls.
              </span>
            </div>

            {/* Submit button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                to="/groups"
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs shadow-soft transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Creating Group...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
