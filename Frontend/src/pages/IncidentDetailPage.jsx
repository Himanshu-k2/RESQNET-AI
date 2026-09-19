import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import IncidentTimeline from '../components/common/IncidentTimeline';
import VerificationModal from '../components/common/VerificationModal';
import TaskModal from '../components/common/TaskModal';
import AuditLogViewer from '../components/common/AuditLogViewer';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Bot,
  Sparkles,
  Package,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  CheckSquare,
  RefreshCw,
  Phone,
  Mail,
  HelpCircle,
  Check
} from 'lucide-react';

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isCoordinator, demoLogin } = useAuth();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  // Coordinator Note input
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // AI Summary
  const [aiSummary, setAiSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // AI Resource Matching
  const [matchingData, setMatchingData] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [allocatingId, setAllocatingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  // Status Change
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchIncident = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/incidents/${id}`);
      if (res.data?.incident) {
        setIncident(res.data.incident);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleGenerateSummary = async () => {
    if (!incident) return;
    setGeneratingSummary(true);
    try {
      const res = await api.post('/ai/incident-summary', { incidentId: incident._id });
      if (res.data?.success) {
        setAiSummary(res.data.summary);
      }
    } catch (err) {
      alert('AI Summary generation failed: ' + err.message);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleRunResourceMatch = async () => {
    if (!incident) return;
    setMatchingLoading(true);
    try {
      const res = await api.post('/ai/resource-matching', { incidentId: incident._id });
      if (res.data?.success) {
        setMatchingData(res.data);
      }
    } catch (err) {
      alert('Resource matching error: ' + err.message);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleApproveAllocation = async (resourceId) => {
    if (!incident || !resourceId) return;
    if (!isCoordinator) {
      alert('Only verified coordinators can officially allocate emergency resources.');
      return;
    }

    setAllocatingId(resourceId);
    setActionSuccess('');

    try {
      const res = await api.post('/ai/approve-allocation', {
        incidentId: incident._id,
        resourceId,
        notes: 'Allocation confirmed from Incident Detail Page.',
      });

      if (res.data?.success) {
        setActionSuccess(res.data.message);
        fetchIncident();
        handleRunResourceMatch();
      }
    } catch (err) {
      alert('Allocation approval error: ' + (err.response?.data?.message || err.message));
    } finally {
      setAllocatingId(null);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setSavingNote(true);
      const res = await api.post(`/incidents/${incident._id}/notes`, { note: noteText.trim() });
      if (res.data?.success) {
        setIncident(res.data.incident);
        setNoteText('');
      }
    } catch (err) {
      alert('Failed to add note: ' + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/incidents/${incident._id}`, { status: newStatus });
      if (res.data?.success) {
        setIncident(res.data.incident);
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignToMe = async () => {
    try {
      const res = await api.post(`/incidents/${incident._id}/assign`, {
        coordinatorId: user._id,
        coordinatorName: user.name,
      });
      if (res.data?.success) {
        setIncident(res.data.incident);
      }
    } catch (err) {
      alert('Failed to assign coordinator: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading emergency incident telemetry...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-navy-900">Incident Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'This report may have been archived.'}</p>
        <Link
          to="/coordinator"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-700 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Command Center
        </Link>
      </div>
    );
  }

  const isVerified = incident.verificationStatus === 'VERIFIED';
  const isRejected = incident.verificationStatus === 'REJECTED';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Modals */}
      <VerificationModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        targetType="incident"
        target={incident}
        onActionComplete={(updated) => setIncident(updated)}
      />
      <TaskModal
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        incidentId={incident._id}
        onTaskCreated={() => fetchIncident()}
      />

      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link
            to="/coordinator"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Coordinator Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">
              {incident.incidentType} Emergency Case
            </h1>
            <StatusBadge status={incident.status} />
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isRejected
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {incident.verificationStatus || 'PENDING_VERIFICATION'}
            </span>
            {incident.isSimulation && (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                SIMULATION DATA
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5 font-mono">
            <span>Case ID: {incident._id}</span>
            <span>Logged: {new Date(incident.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons for Authorized Coordinators */}
        {isCoordinator ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsVerifyOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-soft transition"
            >
              <ShieldCheck className="w-4 h-4" /> Verify / Reject Case
            </button>
            <button
              onClick={() => setIsTaskOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white flex items-center gap-1.5 shadow-soft transition"
            >
              <CheckSquare className="w-4 h-4" /> Add Tactical Task
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Viewing in Citizen View. Login as Coordinator for dispatch actions.</span>
            <button
              onClick={() => demoLogin('coordinator')}
              className="font-bold underline text-primary-700 hover:text-primary-800 ml-1"
            >
              Switch to Coordinator
            </button>
          </div>
        )}
      </div>

      {/* Simulation Mode Alert Banner */}
      {incident.isSimulation && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start justify-between gap-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wide text-amber-900">
                  DISASTER SIMULATION SCENARIO
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-950 uppercase">
                  DEMO DATA ONLY
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                This record is generated by the Phase 6 Disaster Simulation Engine for demonstration and testing.
                It does not represent a real-world emergency distress call and will not dispatch municipal first responders.
              </p>
            </div>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid: Details + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Core Incident Data & AI Tools */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rejection Warning if rejected */}
          {isRejected && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-2 text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Report Rejected by Coordinator
              </div>
              <p>Reason: {incident.rejectionReason || 'No reason specified.'}</p>
            </div>
          )}

          {/* Description Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-soft">
            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-700" />
              Incident Description & Field Telemetry
            </h2>
            <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              {incident.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                <div className="font-semibold text-navy-900 mt-0.5 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                  <span>{incident.location?.address}</span>
                </div>
                {incident.location?.landmark && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Landmark: {incident.location.landmark}
                  </div>
                )}
                {incident.location?.coordinates?.lat && (
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    GPS: {incident.location.coordinates.lat.toFixed(4)}, {incident.location.coordinates.lng.toFixed(4)}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Affected People</span>
                <div className="font-semibold text-navy-900 mt-0.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{incident.affectedPeople || 'Unknown'}</span>
                </div>
                <div className="text-[11px] font-bold text-emergency-700 mt-1">
                  Safety: {incident.safetyStatus}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Coordinator</span>
                <div className="font-semibold text-navy-900 mt-0.5 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                  <span>{incident.assignedCoordinatorName || 'Unassigned'}</span>
                </div>
                {isCoordinator && !incident.assignedCoordinator && (
                  <button
                    onClick={handleAssignToMe}
                    className="mt-2 text-[11px] font-bold text-primary-700 hover:text-primary-800 underline"
                  >
                    Assign to Me
                  </button>
                )}
              </div>
            </div>

            {/* Requested Supplies */}
            <div className="pt-2">
              <span className="text-xs font-bold text-navy-900 block mb-2">Requested Resources & Supplies</span>
              <div className="flex flex-wrap gap-2">
                {incident.requiredResources && incident.requiredResources.length > 0 ? (
                  incident.requiredResources.map((res, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-primary-50 text-primary-900 border border-primary-200/80"
                    >
                      {res}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No specific supplies tagged</span>
                )}
              </div>
            </div>

            {/* Reporter Contact Info (Role-based Protected) */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Reported by:</span>
                <span className="font-semibold text-navy-900">{incident.contact?.name || 'Anonymous'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {incident.contact?.phone || 'No phone'}
                </span>
                {incident.contact?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {incident.contact?.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Executive Briefing */}
          <div className="bg-gradient-to-br from-primary-50/70 via-teal-50/50 to-white rounded-3xl border border-primary-200/80 p-6 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-700" />
                <h3 className="text-sm font-bold text-navy-900">
                  AI Incident Executive Briefing
                </h3>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white flex items-center gap-1.5 shadow-xs transition"
              >
                <Bot className="w-3.5 h-3.5" />
                {generatingSummary ? 'Synthesizing...' : 'Generate Briefing'}
              </button>
            </div>

            {aiSummary ? (
              <div className="p-4 rounded-2xl bg-white border border-primary-200/60 text-xs text-slate-700 leading-relaxed">
                {aiSummary}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Click above to generate an objective 4-5 sentence summary synthesizing verified facts, headcount, and recommended action steps.
              </p>
            )}
          </div>

          {/* AI Resource Matching Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  AI Resource Matching & Allocation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI Recommendation • Human Coordinator Approval Required
                </p>
              </div>

              <button
                onClick={handleRunResourceMatch}
                disabled={matchingLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${matchingLoading ? 'animate-spin' : ''}`} />
                {matchingLoading ? 'Querying Supplies...' : 'Match Available Resources'}
              </button>
            </div>

            {matchingData ? (
              <div className="space-y-4">
                {matchingData.matches && matchingData.matches.length > 0 ? (
                  <div className="space-y-3">
                    {matchingData.matches.map((item, idx) => {
                      const res = item.resource;
                      const isAvailable = res?.availability === 'Available';
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition"
                        >
                          <div className="space-y-1 flex-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-navy-900 text-sm">{res?.title || 'Resource'}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                                {res?.resourceType}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border text-slate-700">
                                Status: {res?.availability}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px]">{item.reason}</p>
                            <div className="text-slate-400 text-[10px]">
                              Quantity: {res?.quantity} • Location: {res?.location?.address}
                            </div>
                          </div>

                          {isCoordinator && isAvailable && (
                            <button
                              onClick={() => handleApproveAllocation(res._id)}
                              disabled={allocatingId === res._id}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {allocatingId === res._id ? 'Approving...' : 'Approve Allocation'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                    No matching supplies currently registered in local depots.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Click "Match Available Resources" to scan registered community supplies.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline, Coordinator Notes, and Audit Logs */}
        <div className="space-y-6">
          {/* Status Quick Control (Coordinators only) */}
          {isCoordinator && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-soft">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                Incident Lifecycle Control
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                  <button
                    key={st}
                    disabled={updatingStatus || incident.status === st}
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 px-3 rounded-xl font-bold border transition text-center ${
                      incident.status === st
                        ? 'bg-primary-700 text-white border-primary-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Incident Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-soft">
            <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-700" />
              Incident Event Timeline
            </h3>
            <IncidentTimeline timeline={incident.timeline} />
          </div>

          {/* Coordinator Notes Log & Input */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-soft">
            <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-700" />
              Coordination Notes
            </h3>

            {incident.notes && incident.notes.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {incident.notes.map((note, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-snug">
                    {note}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">No notes recorded yet.</div>
            )}

            {isCoordinator && (
              <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add quick tactical note..."
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={savingNote || !noteText.trim()}
                  className="w-full py-1.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {savingNote ? 'Recording...' : 'Add Note'}
                </button>
              </form>
            )}
          </div>

          {/* Audit Log for this incident */}
          {isCoordinator && <AuditLogViewer targetId={incident._id} />}
        </div>
      </div>
    </div>
  );
}
