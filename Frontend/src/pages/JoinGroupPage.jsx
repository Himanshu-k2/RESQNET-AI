import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  KeyRound,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Users,
  ShieldCheck,
  Building
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const JoinGroupPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter an invite code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/groups/join', { inviteCode: cleanCode });
      if (res.data?.success) {
        // Redirect to the group page
        navigate(`/groups/${res.data.group._id}`);
      }
    } catch (err) {
      console.error('Error joining group:', err);
      setError(err.message || 'Could not join community group. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      {/* Back link */}
      <Link
        to="/groups"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Groups</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-soft space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mx-auto border border-primary-100">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900">
            Join a Community Group
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
            Enter the 6-character private invite code provided by your building admin or community coordinator.
          </p>
        </div>

        {!isAuthenticated && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              You need to be signed in to join a group. You can enter the code now, and will be prompted to sign in if needed.
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. A3F9Z2"
              maxLength={8}
              autoFocus
              required
              className="w-full text-center text-2xl sm:text-3xl font-mono font-black tracking-widest uppercase px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-100 placeholder:text-slate-300 transition-all text-navy-900"
            />
            <p className="text-center text-[11px] text-slate-400 mt-1.5">
              Code is case-insensitive (auto-capitalized)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="w-full py-3.5 px-4 rounded-2xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm shadow-soft transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Verifying &amp; Joining...</span>
            ) : (
              <>
                <span>Join Group</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2 text-xs text-slate-500">
          <p>
            Don't have an invite code?
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/groups/create"
              className="font-bold text-primary-700 hover:text-primary-800"
            >
              Create a New Group
            </Link>
            <span>•</span>
            <Link
              to="/groups"
              className="font-bold text-slate-600 hover:text-navy-900"
            >
              My Community Groups
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
