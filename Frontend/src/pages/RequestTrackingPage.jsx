import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  KeyRound,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MapPin,
  Tag,
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';

export const RequestTrackingPage = () => {
  const [searchParams] = useSearchParams();
  const [requestId, setRequestId] = useState(searchParams.get('requestId') || '');
  const [trackingPin, setTrackingPin] = useState(searchParams.get('pin') || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestData, setRequestData] = useState(null);

  const fetchStatus = async (id, pin, userPhone) => {
    if (!id || !id.trim()) {
      setError('Please provide a valid Emergency Request ID.');
      return;
    }
    setLoading(true);
    setError('');
    setRequestData(null);

    try {
      const res = await api.post('/incidents/track', {
        requestId: id.trim(),
        trackingPin: pin ? pin.trim() : undefined,
        phone: userPhone ? userPhone.trim() : undefined,
      });

      if (res.data?.success) {
        setRequestData(res.data.request);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not retrieve request status. Please verify your Request ID and PIN / Phone number.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramId = searchParams.get('requestId');
    const paramPin = searchParams.get('pin');
    if (paramId) {
      setRequestId(paramId);
      if (paramPin) setTrackingPin(paramPin);
      fetchStatus(paramId, paramPin, '');
    }
  }, []);

  const handleTrack = (e) => {
    e.preventDefault();
    fetchStatus(requestId, trackingPin, phone);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2 border border-teal-200 shadow-soft">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Track Emergency Request
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Confidential real-time coordination status verification for citizens and emergency requesters.
        </p>
      </div>

      {/* Query Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Emergency Request ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. REQ-MM98-01"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm uppercase font-mono rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                6-digit Tracking PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="e.g. 583921"
                  value={trackingPin}
                  onChange={(e) => setTrackingPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                OR Requester Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+91..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-soft transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Verifying Reference...' : 'Track Incident Status'}</span>
          </button>
        </form>
      </div>

      {/* Result Card */}
      {requestData && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Emergency Request Reference
              </span>
              <h2 className="text-xl font-black text-navy-900 font-mono">
                {requestData.requestId}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={requestData.status} />
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700">
                Urgency: {requestData.urgency}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Incident Type</span>
                <span className="font-bold text-navy-900">{requestData.incidentType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">General Area</span>
                <span className="font-semibold text-slate-700">{requestData.generalArea}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Reported At</span>
                <span className="font-medium text-slate-600">
                  {new Date(requestData.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-teal-900 font-medium">Verification Status</span>
                <span className="font-bold text-teal-800">{requestData.verificationStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-teal-900 font-medium">Last Progress Update</span>
                <span className="font-medium text-teal-700">
                  {new Date(requestData.updatedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-[11px] text-teal-900 pt-1">
                Disaster coordinators have been notified. Resources are queued according to triage priority.
              </div>
            </div>
          </div>

          {/* Event Timeline */}
          {requestData.timeline && requestData.timeline.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Progress Timeline
              </h3>
              <div className="border-l-2 border-slate-200 ml-3 pl-4 space-y-4">
                {requestData.timeline.map((event, idx) => (
                  <div key={idx} className="relative text-xs space-y-1">
                    <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900">{event.eventType.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Life Peril Notice */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Immediate Threat to Life?</strong> If the situation worsens, do not wait for status updates. Immediately call emergency services: <strong>112 / 911</strong>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
