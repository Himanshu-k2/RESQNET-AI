import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import InteractiveCrisisMap from '../components/map/InteractiveCrisisMap';
import VerificationModal from '../components/common/VerificationModal';
import TaskModal from '../components/common/TaskModal';
import ResourceDetailModal from '../components/common/ResourceDetailModal';
import AuditLogViewer from '../components/common/AuditLogViewer';
import {
  Radio,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Bot,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Users,
  Package,
  ArrowRight,
  RefreshCw,
  Send,
  Zap,
  Check,
  Filter,
  FileText,
  Layers,
  Search,
  CheckSquare,
  Activity,
  Phone,
  HelpCircle,
  Compass,
} from 'lucide-react';
import SimulationHub from '../components/simulation/SimulationHub';

export const CoordinatorDashboard = () => {
  const { user, isCoordinator, demoLogin } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'INCIDENTS' | 'MAP' | 'RESOURCES' | 'TASKS' | 'AUDIT'
  const [activeTab, setActiveTab] = useState('INCIDENTS');

  // Stats
  const [stats, setStats] = useState({
    totalIncidents: 0,
    pendingVerification: 0,
    verifiedIncidents: 0,
    activeIncidents: 0,
    assignedIncidents: 0,
    resolvedIncidents: 0,
    totalResources: 0,
    availableResources: 0,
    pendingResources: 0,
    totalTasks: 0,
  });

  // Incidents State
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [incidentSearch, setIncidentSearch] = useState('');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('ALL');
  const [incidentTypeFilter, setIncidentTypeFilter] = useState('ALL');
  const [incidentVerifyFilter, setIncidentVerifyFilter] = useState('ALL');

  // Resources State
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('ALL');
  const [resourceAvailFilter, setResourceAvailFilter] = useState('ALL');
  const [selectedResource, setSelectedResource] = useState(null);

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Modals
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isSimulationHubOpen, setIsSimulationHubOpen] = useState(false);

  // Map Filter State
  const [mapFilter, setMapFilter] = useState('ALL'); // 'ALL' | 'INCIDENTS' | 'RESOURCES' | 'VERIFIED' | 'PENDING'
  const [incidentSimulationFilter, setIncidentSimulationFilter] = useState('ALL'); // 'ALL' | 'SIMULATION' | 'REAL'

  // AI Summary & Matching (Quick side panel in dashboard)
  const [aiSummary, setAiSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [matchingData, setMatchingData] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [allocatingId, setAllocatingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  // Fetch overview stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics/overview');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Failed to load stats:', err.message);
    }
  };

  // Fetch incidents
  const fetchIncidents = async () => {
    try {
      setIncidentsLoading(true);
      let query = '/incidents?limit=50';
      if (incidentStatusFilter !== 'ALL') query += `&status=${incidentStatusFilter}`;
      if (incidentTypeFilter !== 'ALL') query += `&incidentType=${incidentTypeFilter}`;
      if (incidentVerifyFilter !== 'ALL') query += `&verificationStatus=${incidentVerifyFilter}`;
      if (incidentSimulationFilter === 'SIMULATION') query += `&isSimulation=true`;
      if (incidentSimulationFilter === 'REAL') query += `&isSimulation=false`;
      if (incidentSearch.trim()) query += `&search=${encodeURIComponent(incidentSearch.trim())}`;

      const res = await api.get(query);
      if (res.data?.incidents) {
        setIncidents(res.data.incidents);
        if (res.data.incidents.length > 0 && !selectedIncident) {
          setSelectedIncident(res.data.incidents[0]);
        } else if (selectedIncident) {
          const updated = res.data.incidents.find((i) => i._id === selectedIncident._id);
          if (updated) setSelectedIncident(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setIncidentsLoading(false);
    }
  };

  // Fetch resources
  const fetchResources = async () => {
    try {
      setResourcesLoading(true);
      let query = '/resources?limit=50';
      if (resourceTypeFilter !== 'ALL') query += `&resourceType=${resourceTypeFilter}`;
      if (resourceAvailFilter !== 'ALL') query += `&availability=${resourceAvailFilter}`;
      if (resourceSearch.trim()) query += `&search=${encodeURIComponent(resourceSearch.trim())}`;

      const res = await api.get(query);
      if (res.data?.resources) {
        setResources(res.data.resources);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setResourcesLoading(false);
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const res = await api.get('/tasks');
      if (res.data?.tasks) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      console.warn('Failed to load tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchIncidents();
    fetchResources();
    if (isCoordinator) fetchTasks();
  }, [incidentStatusFilter, incidentTypeFilter, incidentVerifyFilter, incidentSimulationFilter, isCoordinator]);

  const handleSelectIncident = (inc) => {
    setSelectedIncident(inc);
    setAiSummary('');
    setMatchingData(null);
    setActionSuccess('');
  };

  // AI Summary Handler
  const handleGenerateSummary = async () => {
    if (!selectedIncident) return;
    setGeneratingSummary(true);
    try {
      const res = await api.post('/ai/incident-summary', { incidentId: selectedIncident._id });
      if (res.data?.success) {
        setAiSummary(res.data.summary);
      }
    } catch (err) {
      alert('AI Summary generation failed: ' + err.message);
    } finally {
      setGeneratingSummary(false);
    }
  };

  // AI Matching Handler
  const handleRunResourceMatch = async () => {
    if (!selectedIncident) return;
    setMatchingLoading(true);
    try {
      const res = await api.post('/ai/resource-matching', { incidentId: selectedIncident._id });
      if (res.data?.success) {
        setMatchingData(res.data);
      }
    } catch (err) {
      alert('Resource matching error: ' + err.message);
    } finally {
      setMatchingLoading(false);
    }
  };

  // Approve Allocation Handler
  const handleApproveAllocation = async (resourceId) => {
    if (!selectedIncident || !resourceId) return;
    if (!isCoordinator) {
      alert('Only verified coordinators can officially allocate emergency resources.');
      return;
    }

    setAllocatingId(resourceId);
    setActionSuccess('');

    try {
      const res = await api.post('/ai/approve-allocation', {
        incidentId: selectedIncident._id,
        resourceId,
        notes: 'Allocation confirmed via Command Center.',
      });

      if (res.data?.success) {
        setActionSuccess(res.data.message);
        fetchIncidents();
        fetchResources();
        handleRunResourceMatch();
      }
    } catch (err) {
      alert('Allocation approval error: ' + (err.response?.data?.message || err.message));
    } finally {
      setAllocatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Modals */}
      <VerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        targetType="incident"
        target={selectedIncident}
        onActionComplete={(updated) => {
          setSelectedIncident(updated);
          fetchIncidents();
          fetchStats();
        }}
      />
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        incidentId={selectedIncident?._id}
        onTaskCreated={() => {
          fetchTasks();
          fetchStats();
        }}
      />
      <ResourceDetailModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        resource={selectedResource}
        isCoordinator={isCoordinator}
        onUpdate={() => {
          fetchResources();
          fetchStats();
        }}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-primary-700 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              Coordinator Command Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time incident triage, human-in-the-loop verification, and AI-assisted resource dispatch.
          </p>
        </div>

        {/* Quick Persona / Auth Status & Simulation Launcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulationHubOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-xs transition-all ring-1 ring-amber-400/50"
            title="Open Phase 6 Simulation Hub & Scenarios"
          >
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
            <span>Simulation Hub</span>
          </button>

          {isCoordinator ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Coordinator Active ({user.name})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-xl text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Citizen Mode</span>
              <button
                onClick={() => demoLogin('coordinator')}
                className="underline font-bold text-primary-700 hover:text-primary-800 ml-1"
              >
                1-Click Auth
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Operational Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reports</div>
          <div className="text-2xl font-black text-navy-900 mt-1">{stats.totalIncidents}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Telemetry Ingested</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-soft">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Verify</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.pendingVerification}</div>
          <div className="text-[10px] text-amber-800 mt-0.5">Awaiting Review</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-soft">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Verified Cases</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.verifiedIncidents}</div>
          <div className="text-[10px] text-emerald-800 mt-0.5">On-ground Confirmed</div>
        </div>

        <div className="p-4 rounded-2xl bg-primary-50/60 border border-primary-200/80 shadow-soft">
          <div className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">Active Response</div>
          <div className="text-2xl font-black text-primary-800 mt-1">{stats.activeIncidents}</div>
          <div className="text-[10px] text-primary-800 mt-0.5">In-flight Operations</div>
        </div>

        <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 shadow-soft">
          <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Available Supplies</div>
          <div className="text-2xl font-black text-teal-800 mt-1">{stats.availableResources}</div>
          <div className="text-[10px] text-teal-800 mt-0.5">Registered Depots</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-soft">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tactical Tasks</div>
          <div className="text-2xl font-black text-slate-700 mt-1">{stats.totalTasks || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Task Orders Issued</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        {[
          { id: 'INCIDENTS', label: 'Incident Management', icon: AlertTriangle },
          { id: 'MAP', label: 'Interactive Crisis Map', icon: MapPin },
          { id: 'RESOURCES', label: 'Resource Offers & Depots', icon: Package },
          { id: 'TASKS', label: 'Tactical Tasks', icon: CheckSquare },
          { id: 'AUDIT', label: 'Audit Trail & Compliance', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition ${
                isCurrent
                  ? 'bg-primary-700 text-white shadow-soft'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INCIDENT MANAGEMENT */}
      {activeTab === 'INCIDENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Incidents Filter & List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={incidentSearch}
                  onChange={(e) => setIncidentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchIncidents()}
                  placeholder="Search address, landmark, type..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Verification</label>
                  <select
                    value={incidentVerifyFilter}
                    onChange={(e) => setIncidentVerifyFilter(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
                  >
                    <option value="ALL">All Verification</option>
                    <option value="PENDING_VERIFICATION">Pending Verify</option>
                    <option value="VERIFIED">Verified Only</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="NEEDS_MORE_INFORMATION">Needs More Info</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Incident Type</label>
                  <select
                    value={incidentTypeFilter}
                    onChange={(e) => setIncidentTypeFilter(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
                  >
                    <option value="ALL">All Types</option>
                    <option value="Flood">Flood</option>
                    <option value="Fire">Fire</option>
                    <option value="Building Collapse">Collapse</option>
                    <option value="Medical Emergency">Medical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Source</label>
                  <select
                    value={incidentSimulationFilter}
                    onChange={(e) => setIncidentSimulationFilter(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
                  >
                    <option value="ALL">All Records</option>
                    <option value="REAL">Real Incidents Only</option>
                    <option value="SIMULATION">Simulation Data</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Incidents Card Feed */}
            {incidentsLoading ? (
              <div className="text-center py-12 text-xs text-slate-400">Loading incoming incidents...</div>
            ) : incidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                No incidents matching current criteria.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {incidents.map((inc) => {
                  const isSelected = selectedIncident?._id === inc._id;
                  const isVer = inc.verificationStatus === 'VERIFIED';
                  const isRej = inc.verificationStatus === 'REJECTED';

                  return (
                    <div
                      key={inc._id}
                      onClick={() => handleSelectIncident(inc)}
                      className={`p-4 rounded-2xl border cursor-pointer transition text-left space-y-2 ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/50 shadow-soft ring-2 ring-primary-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900 text-xs">{inc.incidentType}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isVer
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isRej
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {inc.verificationStatus || 'PENDING'}
                          </span>
                          {inc.isSimulation && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              SIMULATION
                            </span>
                          )}
                        </div>
                        <StatusBadge status={inc.status} />
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {inc.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{inc.location?.address}</span>
                        </span>
                        <span className="font-mono text-[10px]">
                          {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Incident Detail & Command Actions (7 cols) */}
          <div className="lg:col-span-7">
            {selectedIncident ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-soft">
                {/* Header with Case link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-navy-900">
                        {selectedIncident.incidentType} Incident Telemetry
                      </h2>
                      <StatusBadge status={selectedIncident.status} />
                      {selectedIncident.isSimulation && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          SIMULATION DATA
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Case ID: {selectedIncident._id}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/incidents/${selectedIncident._id}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center gap-1"
                    >
                      <span>Full Case View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Simulation Mode Alert Banner */}
                {selectedIncident.isSimulation && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>SIMULATION DATA:</strong> This incident is part of an exercise scenario. Actions taken will not dispatch live emergency services.
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-950 uppercase shrink-0">
                      DEMO DATA
                    </span>
                  </div>
                )}

                {/* Verification Control Bar */}
                {isCoordinator && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Verification State</div>
                      <div className="font-bold text-navy-900 text-xs">
                        {selectedIncident.verificationStatus || 'PENDING_VERIFICATION'}
                        {selectedIncident.verifiedByName && (
                          <span className="font-normal text-slate-500 ml-1">
                            (by {selectedIncident.verifiedByName})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsVerifyModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verify / Reject
                      </button>
                      <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        Assign Task
                      </button>
                    </div>
                  </div>
                )}

                {/* Core Incident Details */}
                <div className="space-y-3 text-xs">
                  <p className="text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
                    {selectedIncident.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Location</span>
                      <div className="font-semibold text-navy-900 mt-0.5 truncate">
                        {selectedIncident.location?.address}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Affected People</span>
                      <div className="font-semibold text-navy-900 mt-0.5">
                        {selectedIncident.affectedPeople || 'Unknown'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Urgency</span>
                      <div className="font-bold text-emergency-700 mt-0.5">
                        {selectedIncident.urgency}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Executive Briefing Tool */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-50/70 to-teal-50/50 border border-primary-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                      <Sparkles className="w-4 h-4 text-primary-700" />
                      AI Incident Executive Briefing
                    </div>
                    <button
                      onClick={handleGenerateSummary}
                      disabled={generatingSummary}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white flex items-center gap-1"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      {generatingSummary ? 'Synthesizing...' : 'Summarize'}
                    </button>
                  </div>
                  {aiSummary && (
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-primary-200/60 mt-2">
                      {aiSummary}
                    </p>
                  )}
                </div>

                {/* AI Resource Matching Tool */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-teal-600" />
                      Matching Community Resources
                    </h3>
                    <button
                      onClick={handleRunResourceMatch}
                      disabled={matchingLoading}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${matchingLoading ? 'animate-spin' : ''}`} />
                      {matchingLoading ? 'Matching...' : 'Query Supplies'}
                    </button>
                  </div>

                  {actionSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  {matchingData && matchingData.matches && matchingData.matches.length > 0 ? (
                    <div className="space-y-2">
                      {matchingData.matches.map((item, idx) => {
                        const res = item.resource;
                        const isAvailable = res?.availability === 'Available';
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5 flex-1">
                              <div className="font-bold text-navy-900">{res?.title}</div>
                              <div className="text-[11px] text-slate-500">
                                {res?.quantity} • {res?.location?.address}
                              </div>
                              <div className="text-[10px] text-teal-700 font-medium">{item.reason}</div>
                            </div>

                            {isCoordinator && isAvailable && (
                              <button
                                onClick={() => handleApproveAllocation(res._id)}
                                disabled={allocatingId === res._id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {allocatingId === res._id ? 'Allocating...' : 'Allocate'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Run AI query above to find verified depot supplies matching requested items.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                Select an incident on the left to inspect ground telemetry and issue coordinator orders.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE CRISIS MAP */}
      {activeTab === 'MAP' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-700" />
              <span className="text-xs font-bold text-navy-900">Map Filter:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL', label: 'All Markers' },
                  { id: 'INCIDENTS', label: 'Incidents Only' },
                  { id: 'RESOURCES', label: 'Resources Only' },
                  { id: 'VERIFIED', label: 'Verified Only' },
                  { id: 'PENDING', label: 'Pending Verification' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setMapFilter(f.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      mapFilter === f.id
                        ? 'bg-primary-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Showing active GPS coordinates from live coordination records
            </div>
          </div>

          <InteractiveCrisisMap
            incidents={incidents}
            resources={resources}
            filterMode={mapFilter}
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              setActiveTab('INCIDENTS');
            }}
            onSelectResource={(res) => {
              setSelectedResource(res);
              setIsResourceModalOpen(true);
            }}
          />
        </div>
      )}

      {/* TAB 3: RESOURCE MANAGEMENT */}
      {activeTab === 'RESOURCES' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchResources()}
                placeholder="Search resources, titles, locations..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={resourceTypeFilter}
                onChange={(e) => setResourceTypeFilter(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
              >
                <option value="ALL">All Supply Types</option>
                <option value="Water">Water</option>
                <option value="Food">Food</option>
                <option value="Rescue equipment">Rescue Equipment</option>
                <option value="Medical kits">Medical</option>
                <option value="Shelter">Shelter</option>
              </select>

              <select
                value={resourceAvailFilter}
                onChange={(e) => setResourceAvailFilter(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
              >
                <option value="ALL">All Availability</option>
                <option value="Available">Available</option>
                <option value="Allocated">Allocated</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          {resourcesLoading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading supply records...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((res) => {
                const isVer = res.verificationStatus === 'VERIFIED';
                return (
                  <div
                    key={res._id}
                    onClick={() => {
                      setSelectedResource(res);
                      setIsResourceModalOpen(true);
                    }}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft hover:border-slate-300 transition cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {res.resourceType}
                        </span>
                        {res.isSimulation && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            SIMULATION
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isVer
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {res.verificationStatus || 'PENDING'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-navy-900 leading-snug line-clamp-1">{res.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{res.description}</p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-navy-900">{res.quantity}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          res.availability === 'Available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {res.availability}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TACTICAL TASKS */}
      {activeTab === 'TASKS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-900">Coordinator Tactical Orders</h3>
            {isCoordinator && (
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold shadow-soft flex items-center gap-1.5"
              >
                <CheckSquare className="w-4 h-4" /> Create Tactical Order
              </button>
            )}
          </div>

          {tasksLoading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading tactical tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
              No tactical orders currently assigned.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-navy-900">{task.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Assignee: <strong className="text-slate-700">{task.assignedToName}</strong></span>
                    <span>Priority: <strong className="text-emergency-700">{task.priority}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="max-w-4xl mx-auto">
          <AuditLogViewer />
        </div>
      )}

      {/* Simulation Hub Modal */}
      <SimulationHub
        isOpen={isSimulationHubOpen}
        onClose={() => setIsSimulationHubOpen(false)}
        onScenarioStarted={() => {
          fetchIncidents();
          fetchResources();
          fetchStats();
        }}
        onResetComplete={() => {
          fetchIncidents();
          fetchResources();
          fetchStats();
        }}
      />
    </div>
  );
};
