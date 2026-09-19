import React, { useState } from 'react';
import api from '../../services/api';
import { ShieldCheck, ShieldAlert, AlertCircle, X, HelpCircle } from 'lucide-react';

export default function VerificationModal({
  isOpen,
  onClose,
  targetType = 'incident', // 'incident' | 'resource'
  target,
  onActionComplete,
}) {
  const [action, setAction] = useState('VERIFY'); // 'VERIFY' | 'REJECT' | 'NEEDS_MORE_INFO'
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !target) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (action === 'REJECT' && !reason.trim()) {
      setError('A rejection reason is strictly required by disaster coordination protocol.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const endpoint =
        targetType === 'incident'
          ? `/incidents/${target._id}/verify`
          : `/resources/${target._id}/verify`;

      const res = await api.post(endpoint, {
        action,
        reason: reason.trim(),
      });

      if (res.data?.success) {
        if (onActionComplete) onActionComplete(res.data.incident || res.data.resource);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-700" />
            <h3 className="text-base font-bold text-navy-900">
              Coordinator Verification Decision
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-navy-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-2">Select Verification Action</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setAction('VERIFY'); setError(''); }}
                className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                  action === 'VERIFY'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verify</span>
              </button>

              <button
                type="button"
                onClick={() => { setAction('REJECT'); setError(''); }}
                className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                  action === 'REJECT'
                    ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Reject</span>
              </button>

              {targetType === 'incident' && (
                <button
                  type="button"
                  onClick={() => { setAction('NEEDS_MORE_INFO'); setError(''); }}
                  className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                    action === 'NEEDS_MORE_INFO'
                      ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Need Info</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">
              {action === 'REJECT' ? 'Rejection Reason (Required) *' : 'Verification Note / Cross-Check Remarks'}
            </label>
            <textarea
              rows={3}
              required={action === 'REJECT'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                action === 'REJECT'
                  ? 'State why this report is rejected (e.g., Duplicate report, false alarm, resolved on inspection)...'
                  : 'Document ground validation (e.g. Phone confirmed with warden, drone confirmed flooded ground level)...'
              }
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <strong>Human-in-the-Loop Protocol:</strong> Your coordinator badge, identity, and timestamp will be permanently logged in the audit trail. AI recommendations never override coordinator decisions.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded-xl text-white font-bold transition shadow-xs ${
                action === 'VERIFY'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : action === 'REJECT'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {submitting ? 'Applying Decision...' : 'Confirm Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
