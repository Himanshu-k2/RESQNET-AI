import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Users,
  Shield,
  Package,
  Layers,
  Sparkles,
  ChevronRight,
  X,
  HelpCircle,
  Copy,
  Check,
  Send,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  PENDING_VERIFICATION: { label: 'Pending Verification', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  NEEDS_MORE_INFORMATION: { label: 'Needs More Info', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  VERIFIED: { label: 'Verified', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  RESOURCE_MATCHED: { label: 'Resource Matched', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  ASSIGNED: { label: 'Assigned', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  RESOLVED: { label: 'Resolved', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  DUPLICATE: { label: 'Duplicate', color: 'bg-gray-100 text-gray-700 border-gray-300' },
};

const CATEGORIES = [
  'ALL',
  'Flood',
  'Fire',
  'Building Collapse',
  'Medical Emergency',
  'Earthquake',
  'Extreme Weather',
  'Accident',
  'Missing Person',
  'Other',
];

const PRIORITIES = ['ALL', 'Critical', 'High', 'Medium', 'Low'];

export const AdminRequestsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [showSimulation, setShowSimulation] = useState(false);

  // Selected Incident Detail Modal
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Resource Assignment Modal & Data
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [availableResources, setAvailableResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (!showSimulation) params.append('isSimulation', 'false');
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedCategory !== 'ALL') params.append('incidentType', selectedCategory);
      if (selectedPriority !== 'ALL') params.append('urgency', selectedPriority);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/incidents?${params.toString()}`);
      if (res.data?.success) {
        setIncidents(res.data.incidents || []);
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError(err.response?.data?.message || 'Failed to retrieve emergency requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchIncidents();
  }, [isAuthenticated, showSimulation, selectedStatus, selectedCategory, selectedPriority]);

  // Handle Search Input (debounce fetch)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIncidents();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Verification actions (VERIFY, REJECT, NEEDS_MORE_INFO, DUPLICATE)
  const handleVerifyAction = async (action) => {
    if (!selectedIncident) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/incidents/${selectedIncident._id}/verify`, {
        action,
        reason: reviewNote.trim() || undefined,
      });

      if (res.data?.success) {
        setSelectedIncident(res.data.incident);
        setIncidents((prev) =>
          prev.map((inc) => (inc._id === selectedIncident._id ? res.data.incident : inc))
        );
        setReviewNote('');
      }
    } catch (err) {
      alert('Verification update failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Open Resource Assignment Dialog
  const handleOpenAssign = async (incident) => {
    setSelectedIncident(incident);
    setAssignModalOpen(true);
    setSelectedResourceId('');
    setAssignmentNote('');
    setAiSuggestions([]);

    try {
      setLoadingResources(true);
      // Fetch verified available resources from DB
      const res = await api.get('/resources?verificationStatus=VERIFIED&availability=Available');
      if (res.data?.success) {
        const verifiedOffers = res.data.resources || [];
        setAvailableResources(verifiedOffers);

        // Run AI matching suggestions
        setLoadingAi(true);
        try {
          const aiRes = await api.post('/ai/resource-matching', {
            incidentId: incident._id,
            availableResources: verifiedOffers,
          });
          if (aiRes.data?.matches) {
            setAiSuggestions(aiRes.data.matches);
          }
        } catch (aiErr) {
          console.warn('AI resource match fallback:', aiErr.message);
        } finally {
          setLoadingAi(false);
        }
      }
    } catch (err) {
      console.error('Failed to load resources for assignment:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  // Confirm Resource Assignment (Admin Action)
  const handleConfirmAssignment = async () => {
    if (!selectedIncident || !selectedResourceId) {
      alert('Please select a verified resource to assign.');
      return;
    }

    try {
      setAssigning(true);
      const res = await api.post('/assignments', {
        incidentId: selectedIncident._id,
        resourceId: selectedResourceId,
        notes: assignmentNote.trim(),
      });

      if (res.data?.success) {
        alert(`Assignment Confirmed: ${res.data.message}`);
        setAssignModalOpen(false);
        // Refresh local incident state
        if (res.data.incident) {
          setSelectedIncident(res.data.incident);
          setIncidents((prev) =>
            prev.map((i) => (i._id === selectedIncident._id ? res.data.incident : i))
          );
        }
        fetchIncidents();
      }
    } catch (err) {
      alert('Assignment creation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setAssigning(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch ((p || '').toLowerCase()) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
              Admin Console
            </span>
            <span className="text-xs font-bold text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Live Database Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            Emergency Requests & Resource Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review citizen distress submissions, execute human-in-the-loop verification, and authorize relief supply allocations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <input
              type="checkbox"
              checked={showSimulation}
              onChange={(e) => setShowSimulation(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span>Include Demo Data</span>
          </label>

          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
            title="Refresh Requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-soft space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search by Request ID, Address, or Description */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Request ID (e.g. REQ-), address, or incident..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="ALL">All Statuses</option>
              {Object.keys(STATUS_CONFIG).map((st) => (
                <option key={st} value={st}>
                  {STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Types' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p === 'ALL' ? 'All Priorities' : p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchIncidents} className="font-bold underline ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Requests Table & Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm sm:text-base font-bold text-navy-900">
              Emergency Requests ({incidents.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">Sorted by newest report</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading requests...</div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center space-y-3 max-w-sm mx-auto">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-navy-900">No emergency requests found</h3>
            <p className="text-xs text-slate-500">
              {showSimulation
                ? 'No records match your selected filter criteria.'
                : 'No real citizen requests match your search. Toggle "Include Demo Data" if you want to inspect synthetic scenarios.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request ID / Type</th>
                  <th className="py-3 px-4">Location &amp; People</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Status / Verification</th>
                  <th className="py-3 px-4">Requested Supplies</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.map((incident) => {
                  const statusConf = STATUS_CONFIG[incident.status] || {
                    label: incident.status,
                    color: 'bg-slate-100 text-slate-700',
                  };

                  return (
                    <tr key={incident._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID & Type */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-navy-900 block">
                            {incident.requestId || `REQ-${incident._id.slice(-6).toUpperCase()}`}
                          </span>
                          <span className="text-slate-500 font-semibold">{incident.incidentType}</span>
                          {incident.isSimulation && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 ml-1">
                              SIMULATION
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location & People */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-medium text-navy-900 truncate">{incident.location?.address}</p>
                        <p className="text-[11px] text-slate-500">Affected: {incident.affectedPeople || 'Unknown'}</p>
                      </td>

                      {/* Urgency */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPriorityBadge(
                            incident.urgency
                          )}`}
                        >
                          {incident.urgency}
                        </span>
                      </td>

                      {/* Status & Verification */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusConf.color}`}
                          >
                            {statusConf.label}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {incident.verificationStatus === 'VERIFIED'
                              ? `Verified by ${incident.verifiedByName || 'Coordinator'}`
                              : incident.verificationStatus}
                          </p>
                        </div>
                      </td>

                      {/* Requested Supplies */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {(incident.requiredResources || []).slice(0, 3).map((res, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium truncate max-w-[120px]"
                            >
                              {res}
                            </span>
                          ))}
                          {(incident.requiredResources?.length || 0) > 3 && (
                            <span className="text-[10px] text-slate-400 font-bold">
                              +{incident.requiredResources.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2 shrink-0">
                        <button
                          onClick={() => setSelectedIncident(incident)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Details
                        </button>

                        {/* Assign Button (Available for verified incidents) */}
                        {incident.verificationStatus === 'VERIFIED' && (
                          <button
                            onClick={() => handleOpenAssign(incident)}
                            className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-all"
                          >
                            Assign Resource
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REQUEST DETAILS MODAL */}
      {selectedIncident && !assignModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-purple-300">
                    {selectedIncident.requestId || `REQ-${selectedIncident._id.slice(-6).toUpperCase()}`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                    {selectedIncident.incidentType}
                  </span>
                  {selectedIncident.isSimulation && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-navy-950">
                      SIMULATION DATA ONLY
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-white">{selectedIncident.location?.address}</h3>
                <p className="text-xs text-slate-300">
                  Reported at: {new Date(selectedIncident.createdAt).toLocaleString()} • Safety:{' '}
                  <span className="font-bold text-white">{selectedIncident.safetyStatus}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-navy-900">
              {/* Situation Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Emergency Situation Description
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 leading-relaxed font-medium">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Grid: Coordinates & Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Landmark / Proximity</span>
                  <p className="font-bold text-navy-900">{selectedIncident.location?.landmark || 'Not specified'}</p>
                  <p className="text-[11px] text-slate-500">
                    GPS: {selectedIncident.location?.coordinates?.lat || 'N/A'},{' '}
                    {selectedIncident.location?.coordinates?.lng || 'N/A'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Reporter Contact Information</span>
                  <p className="font-bold text-navy-900">{selectedIncident.contact?.name || 'Anonymous'}</p>
                  <p className="text-[11px] text-slate-500">Phone: {selectedIncident.contact?.phone || 'Not provided'}</p>
                </div>
              </div>

              {/* Requested Resources */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Requested Emergency Resources
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedIncident.requiredResources || []).map((r, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verification Controls Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Human-in-the-Loop Verification Controls</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Current: <strong>{selectedIncident.verificationStatus}</strong>
                  </span>
                </div>

                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Enter optional coordinator review notes or reason for verification/rejection..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleVerifyAction('VERIFY')}
                    disabled={actionLoading || selectedIncident.verificationStatus === 'VERIFIED'}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify Request</span>
                  </button>

                  <button
                    onClick={() => handleVerifyAction('NEEDS_MORE_INFO')}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Request More Info</span>
                  </button>

                  <button
                    onClick={() => handleVerifyAction('DUPLICATE')}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Mark Duplicate</span>
                  </button>

                  <button
                    onClick={() => handleVerifyAction('REJECT')}
                    disabled={actionLoading || selectedIncident.verificationStatus === 'REJECTED'}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Timeline History */}
              {selectedIncident.timeline?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Incident History & Audit Timeline
                  </h4>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-4 text-xs">
                    {selectedIncident.timeline.map((evt, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900">{evt.eventType}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(evt.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{evt.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              {selectedIncident.verificationStatus === 'VERIFIED' ? (
                <button
                  onClick={() => handleOpenAssign(selectedIncident)}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-soft transition-all"
                >
                  Proceed to Resource Assignment
                </button>
              ) : (
                <span className="text-xs text-slate-400">Request must be VERIFIED before assigning resources</span>
              )}

              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOURCE ASSIGNMENT MODAL (WORKFLOW 10 & 11) */}
      {assignModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 to-navy-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-400 text-navy-950">
                  Resource Assignment Workflow
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Assign Verified Resources to {selectedIncident.requestId || 'Request'}
                </h3>
                <p className="text-xs text-purple-200">
                  Target: {selectedIncident.location?.address} • Needs: {(selectedIncident.requiredResources || []).join(', ')}
                </p>
              </div>

              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-navy-900 text-xs">
              
              {/* AI Suggested Matches Notice */}
              {loadingAi ? (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
                  <span>Evaluating verified inventory with AI matching model...</span>
                </div>
              ) : aiSuggestions.length > 0 ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold uppercase text-[11px] tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>AI Suggested Matches</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    The intelligence engine recommended matching items based on demand proximity and category.
                    <strong className="text-navy-900 font-bold ml-1">Admin confirmation required below.</strong>
                  </p>
                </div>
              ) : null}

              {/* Resource Selection List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-navy-900">
                  Select Verified Community Resource <span className="text-rose-500">*</span>
                </label>

                {loadingResources ? (
                  <div className="p-6 text-center text-slate-400">Loading verified community resources...</div>
                ) : availableResources.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-center">
                    No verified available resources found in catalog. Providers must register items and coordinators must verify them first.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {availableResources.map((res) => {
                      const isAiMatched = aiSuggestions.some((m) => m.resourceId === res._id);
                      const isSelected = selectedResourceId === res._id;

                      return (
                        <div
                          key={res._id}
                          onClick={() => setSelectedResourceId(res._id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/50 shadow-soft ring-2 ring-purple-500/20'
                              : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-navy-900 text-xs truncate">{res.title}</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                {res.resourceType}
                              </span>
                              {isAiMatched && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                  AI Suggested Match
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              Quantity: <strong>{res.quantity} {res.unit ? `(${res.unit})` : ''}</strong> • Location:{' '}
                              {res.location?.address}
                            </p>
                          </div>

                          <div className="shrink-0">
                            <input
                              type="radio"
                              name="selectedResource"
                              checked={isSelected}
                              onChange={() => setSelectedResourceId(res._id)}
                              className="text-purple-600 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Coordinator Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-navy-900">
                  Assignment Instructions / Dispatch Notes (Sent to Provider)
                </label>
                <textarea
                  rows={2}
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  placeholder="e.g. Priority staging via Gate 2. Coordinate delivery with on-site staff."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Explicit Confirmation Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Confirming this assignment transitions request status to <strong>ASSIGNED</strong>, reserves the resource, and immediately sends an official notification to the provider.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmAssignment}
                disabled={assigning || !selectedResourceId}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-soft transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{assigning ? 'Creating Assignment...' : 'Admin Approved Assignment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestsPage;
