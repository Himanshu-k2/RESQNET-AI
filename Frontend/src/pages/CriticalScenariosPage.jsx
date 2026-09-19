import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Flame,
  Droplets,
  HeartPulse,
  Mountain,
  CloudLightning,
  MapPin,
  Users,
  Box,
  ChevronRight,
  Sparkles,
  Bot,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  Activity,
  X,
  FileText,
  Radio,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PRIORITY_ORDER = {
  critical: 1,
  high: 2,
  moderate: 3,
  medium: 3,
  low: 4,
};

const CATEGORY_ICONS = {
  flood: Droplets,
  fire: Flame,
  medical: HeartPulse,
  earthquake: Mountain,
  'extreme weather': CloudLightning,
  'food / water': Box,
  'food and water': Box,
};

export const CriticalScenariosPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [scenarios, setScenarios] = useState([]);
  const [activeScenarioIds, setActiveScenarioIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  // Modal / Detail State
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [scenarioDetail, setScenarioDetail] = useState(null);
  const [detailError, setDetailError] = useState('');

  // AI Scenario Analysis State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/simulation/status');
      if (res.data?.success) {
        setScenarios(res.data.availableScenarios || []);
        setActiveScenarioIds(res.data.activeScenarios || []);
      } else {
        setError('Failed to fetch emergency simulation catalog.');
      }
    } catch (err) {
      console.error('Error fetching scenarios:', err);
      setError(err.response?.data?.message || 'Unable to connect to preparedness simulation service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  // Filter and sort scenarios
  const filteredAndSortedScenarios = useMemo(() => {
    let list = [...scenarios];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) =>
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.requiredResources?.some((r) => r.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'ALL') {
      list = list.filter((s) => s.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedPriority !== 'ALL') {
      list = list.filter((s) => s.urgency?.toLowerCase() === selectedPriority.toLowerCase());
    }

    // Sort order: Critical (1) -> High (2) -> Moderate (3) -> Low (4)
    list.sort((a, b) => {
      const pA = PRIORITY_ORDER[a.urgency?.toLowerCase()] || 99;
      const pB = PRIORITY_ORDER[b.urgency?.toLowerCase()] || 99;
      return pA - pB;
    });

    return list;
  }, [scenarios, searchQuery, selectedCategory, selectedPriority]);

  // Open Scenario Details
  const handleOpenDetails = async (scenario) => {
    setSelectedScenario(scenario);
    setScenarioDetail(null);
    setAiAnalysis(null);
    setAiError('');
    setDetailError('');

    try {
      setDetailLoading(true);
      const res = await api.get(`/simulation/scenarios/${scenario.id}`);
      if (res.data?.success) {
        setScenarioDetail(res.data.scenario);
      } else {
        setScenarioDetail(scenario);
      }
    } catch (err) {
      console.warn('Could not load detailed scenario gap analysis, showing baseline:', err);
      setScenarioDetail(scenario);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedScenario(null);
    setScenarioDetail(null);
    setAiAnalysis(null);
    setAiError('');
  };

  // Run AI Scenario Analysis
  const handleRunAiAnalysis = async () => {
    if (!selectedScenario) return;
    try {
      setAiLoading(true);
      setAiError('');
      const res = await api.post('/ai/scenario-analysis', {
        scenarioId: selectedScenario.id,
        scenarioData: scenarioDetail || selectedScenario,
      });

      if (res.data?.success && res.data.analysis) {
        setAiAnalysis(res.data.analysis);
      } else {
        setAiError('Unable to generate AI analysis at this time.');
      }
    } catch (err) {
      console.error('AI scenario analysis error:', err);
      setAiError(err.response?.data?.message || 'AI preparedness service is unavailable. Please check your network or try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Priority badge styling helper
  const getPriorityBadge = (priority) => {
    const p = (priority || '').toLowerCase();
    switch (p) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'moderate':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category) => {
    const IconComponent = CATEGORY_ICONS[(category || '').toLowerCase()] || Box;
    return <IconComponent className="w-4 h-4" />;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-soft text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-navy-900">Authentication Required</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The Critical Scenarios Hub is reserved for authorized emergency personnel, coordinators, and verified resource providers.
          </p>
          <div className="pt-2">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm shadow-soft transition-all"
            >
              Sign In to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Simulation Disclaimer Bar */}
      <div className="bg-amber-500 text-white py-2 px-4 shadow-xs text-xs font-bold flex items-center justify-center gap-2 tracking-wide">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>SIMULATION DATA ONLY — Synthetic preparedness scenarios for coordinator training & system stress-testing.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
                Critical Scenarios
              </h1>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">
                SIMULATION DATA ONLY
              </span>
            </div>
            <p className="text-sm text-slate-600 font-medium">
              AI-Assisted Emergency Preparedness & Operational Stress-Testing
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={fetchScenarios}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-navy-900 shadow-xs transition-all"
              title="Refresh Scenarios"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-soft space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scenarios by title, supply, or location..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50/50"
              />
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                <option value="ALL">All Categories</option>
                <option value="Flood">Flood</option>
                <option value="Fire">Fire</option>
                <option value="Medical">Medical</option>
                <option value="Earthquake">Earthquake</option>
                <option value="Extreme Weather">Extreme Weather</option>
                <option value="Food / Water">Food & Water</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchScenarios}
              className="font-bold underline hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft animate-pulse space-y-4"
              >
                <div className="h-5 bg-slate-100 rounded-md w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
                <div className="h-16 bg-slate-100 rounded-md w-full"></div>
                <div className="h-8 bg-slate-100 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAndSortedScenarios.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-soft">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-extrabold text-navy-900">No Preparedness Scenarios Found</h3>
            <p className="text-xs text-slate-500">
              No simulation scenarios matched your search and filter criteria. Try resetting your query or priority filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedPriority('ALL');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-navy-900 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Scenario Cards Grid */}
        {!loading && filteredAndSortedScenarios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedScenarios.map((scenario) => {
              const isActive = activeScenarioIds.includes(scenario.id);

              return (
                <div
                  key={scenario.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-soft hover:shadow-soft-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Header: Category + Priority */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {getCategoryIcon(scenario.category)}
                        <span>{scenario.category}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPriorityBadge(
                            scenario.urgency
                          )}`}
                        >
                          {scenario.urgency} Priority
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-black text-navy-900 text-base leading-snug group-hover:text-primary-700 transition-colors">
                        {scenario.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {scenario.description}
                      </p>
                    </div>

                    {/* Meta information: Location & People */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span className="truncate">{scenario.address || 'Simulated Area'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{scenario.affectedPeople || 'Simulation cohort'}</span>
                      </div>
                    </div>

                    {/* Required Resources Chips */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Required Resources:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(scenario.requiredResources || []).map((res, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200"
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="bg-slate-50/70 px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`}
                      ></span>
                      <span className="font-semibold text-slate-600 text-[11px]">
                        {isActive ? 'Simulated Active' : 'Ready to Simulate'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenDetails(scenario)}
                      className="inline-flex items-center gap-1 font-bold text-primary-700 hover:text-primary-800 text-xs group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SCENARIO DETAILS MODAL */}
      {selectedScenario && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                    SIMULATION DATA ONLY
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPriorityBadge(
                      selectedScenario.urgency
                    )}`}
                  >
                    {selectedScenario.urgency} Priority
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {selectedScenario.name}
                </h2>
                <p className="text-xs text-slate-300">
                  Category: <span className="font-bold text-white">{selectedScenario.category}</span> • Simulated Location:{' '}
                  <span className="font-bold text-white">{selectedScenario.address}</span>
                </p>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-navy-900">
              
              {/* Prominent Safety Disclaimer */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black">Synthetic Preparedness Model: </span>
                  These values are simulated. They do not represent verified real-world availability or active disaster dispatch orders.
                </div>
              </div>

              {/* Situation Overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Situation Overview</span>
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  {selectedScenario.description}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Affected Persons</span>
                    <span className="font-bold text-navy-900">{selectedScenario.affectedPeople || '18 students'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                    <span className="font-bold text-navy-900">{selectedScenario.safetyStatus || 'Under Simulated Review'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Landmark</span>
                    <span className="font-bold text-navy-900 truncate block">{selectedScenario.landmark || selectedScenario.address}</span>
                  </div>
                </div>
              </div>

              {/* Required vs Available vs Gap Analysis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Required vs. Staged In Simulation vs. Gap Analysis</span>
                  </h4>
                  {detailLoading && (
                    <span className="text-[10px] font-bold text-primary-600 animate-pulse">
                      Analyzing simulation inventory...
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Required Resource</th>
                        <th className="py-2.5 px-3">Simulated Status</th>
                        <th className="py-2.5 px-3">Simulated Gap / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(scenarioDetail?.resourceAnalysis || selectedScenario.requiredResources?.map((r) => ({
                        resourceType: r,
                        status: 'SIMULATED_STAGED',
                        availableOffers: [],
                      })) || []).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-bold text-navy-900">
                            {row.resourceType}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                row.status === 'PARTIALLY_STAGED' || row.status === 'SIMULATED_STAGED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {row.status === 'PARTIALLY_STAGED' || row.status === 'SIMULATED_STAGED'
                                ? 'Staged in Catalog'
                                : 'Simulated Shortage'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {row.availableOffers?.length > 0
                              ? `${row.availableOffers.length} simulated supply cache mapped.`
                              : 'Catalog baseline available for deployment drill.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step-by-Step Coordination Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Coordination Recommendations</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-navy-900 block mb-1">1. Triage & Verify</span>
                    <p className="text-slate-600 text-[11px]">
                      Acknowledge simulated distress call and verify safety condition of {selectedScenario.affectedPeople || 'affected occupants'}.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-navy-900 block mb-1">2. Staging Logistics</span>
                    <p className="text-slate-600 text-[11px]">
                      Deploy nearest volunteer caches to {selectedScenario.address} before road blockages worsen.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Scenario Analysis Section */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                      <span>AI Preparedness Analysis</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Use Gemini AI to analyze readiness gaps, operational risks, and coordination checklists.
                    </p>
                  </div>

                  <button
                    onClick={handleRunAiAnalysis}
                    disabled={aiLoading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-700 to-navy-900 hover:from-primary-800 hover:to-navy-950 text-white font-bold text-xs shadow-soft transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-teal-300 ${aiLoading ? 'animate-spin' : ''}`} />
                    <span>{aiLoading ? 'Analyzing Scenario...' : 'ANALYZE SCENARIO WITH AI'}</span>
                  </button>
                </div>

                {/* AI Error Alert */}
                {aiError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                    <span>{aiError}</span>
                    <button onClick={handleRunAiAnalysis} className="font-bold underline ml-2">
                      Retry
                    </button>
                  </div>
                )}

                {/* AI Analysis Output */}
                {aiAnalysis && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-primary-50/30 border border-primary-100 shadow-soft space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                        AI-GENERATED DEMONSTRATION
                      </span>
                      {aiAnalysis.isAiFallback && (
                        <span className="text-[10px] text-slate-500 font-semibold">
                          (Fallback Simulation Engine)
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">
                        Operational Summary
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200/80">
                        {aiAnalysis.summary}
                      </p>
                    </div>

                    {/* Simulated Gaps */}
                    {aiAnalysis.simulatedGaps?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                          Identified Resource Gaps & Bottlenecks
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                          {aiAnalysis.simulatedGaps.map((gap, gIdx) => (
                            <li key={gIdx}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Coordination Checklist */}
                    {aiAnalysis.coordinationChecklist?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-primary-800 uppercase tracking-wider">
                          Recommended Coordinator Action Checklist
                        </span>
                        <div className="space-y-1.5 pt-1">
                          {aiAnalysis.coordinationChecklist.map((item, cIdx) => (
                            <div
                              key={cIdx}
                              className="flex items-start gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/70"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                              <span className="text-slate-800 font-medium">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assumptions */}
                    {aiAnalysis.assumptions?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Model Assumptions
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500 italic">
                          {aiAnalysis.assumptions.map((asm, aIdx) => (
                            <li key={aIdx}>{asm}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-2 italic">
                      {aiAnalysis.disclaimer ||
                        'AI-GENERATED DEMONSTRATION: Synthetic preparedness simulation. Does not reflect live dispatch or actual emergency services deployment.'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-semibold">
                Simulated Disaster Drill Model
              </span>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalScenariosPage;
