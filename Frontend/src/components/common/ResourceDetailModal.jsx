import React, { useState } from 'react';
import api from '../../services/api';
import { Package, ShieldCheck, ShieldAlert, X, AlertCircle, MapPin, Clock } from 'lucide-react';

export default function ResourceDetailModal({ isOpen, onClose, resource, isCoordinator, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !resource) return null;

  const handleVerify = async (action) => {
    try {
      setUpdating(true);
      setError('');
      const reason = action === 'REJECT' ? prompt('Please enter reason for rejection:') : 'Verified by coordinator.';
      if (action === 'REJECT' && (!reason || !reason.trim())) {
        setUpdating(false);
        return;
      }

      const res = await api.post(`/resources/${resource._id}/verify`, {
        action,
        reason,
      });

      if (res.data?.success) {
        if (onUpdate) onUpdate(res.data.resource);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setUpdating(false);
    }
  };

  const isVerified = resource.verificationStatus === 'VERIFIED';
  const isRejected = resource.verificationStatus === 'REJECTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-navy-900">Resource Offer Telemetry</h3>
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

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Resource Title</span>
            <h4 className="text-sm font-bold text-navy-900">{resource.title}</h4>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-0.5 rounded-md font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Type: {resource.resourceType}
            </span>
            <span className="px-2.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-800 border border-slate-200">
              Availability: {resource.availability}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-md font-bold border ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isRejected
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {resource.verificationStatus || 'PENDING_VERIFICATION'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
            <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed mt-0.5">
              {resource.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Capacity / Units</span>
              <div className="font-bold text-navy-900 mt-0.5">{resource.quantity}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
              <div className="font-semibold text-navy-900 mt-0.5 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{resource.location?.address}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Provider Contact</span>
              <div className="font-semibold text-navy-900">{resource.contact?.name}</div>
              <div className="text-[11px] text-slate-500">{resource.contact?.phone}</div>
            </div>
            <div className="text-right text-[10px] text-slate-400">
              <div>Logged: {new Date(resource.createdAt).toLocaleDateString()}</div>
              {resource.verifiedByName && <div className="text-emerald-700 font-semibold">Verified by {resource.verifiedByName}</div>}
            </div>
          </div>
        </div>

        {/* Coordinator Verification Actions */}
        {isCoordinator && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            {!isVerified && (
              <button
                disabled={updating}
                onClick={() => handleVerify('VERIFY')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Verify Offer
              </button>
            )}
            {!isRejected && (
              <button
                disabled={updating}
                onClick={() => handleVerify('REJECT')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Reject Offer
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
