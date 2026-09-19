import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Compass,
  Layers,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Waves,
  HeartPulse,
  PackageCheck,
  ChevronRight,
  ShieldCheck,
  Radio,
  ExternalLink,
  Info,
  Play,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const SimulationHub = ({ isOpen, onClose, onScenarioStarted, onResetComplete }) => {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' | 'walkthrough' | 'data'
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState('FLOOD');
  const [currentWalkthroughStep, setCurrentWalkthroughStep] = useState(1);
  const [lastLaunchedIncident, setLastLaunchedIncident] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Fetch simulation telemetry
  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const res = await api.get('/simulation/status');
      if (res.data?.success) {
        setStatusData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch simulation status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  // Ensure coordinator credentials before performing coordinator actions
  const ensureCoordinatorAuth = async () => {
    if (user?.role === 'coordinator' || user?.role === 'admin') return true;
    try {
      await demoLogin('coordinator');
      return true;
    } catch (err) {
      console.error('Auto coordinator login failed:', err);
      return false;
    }
  };

  // Launch a scenario
  const handleLaunchScenario = async (scenarioKey) => {
    try {
      setLoadingScenario(true);
      setFeedbackMessage(null);
      await ensureCoordinatorAuth();

      const res = await api.post('/simulation/start', { scenario: scenarioKey });
      if (res.data?.success) {
        setActiveScenarioId(scenarioKey);
        setLastLaunchedIncident(res.data.incident);
        setFeedbackMessage({
          type: 'success',
          text: `Scenario "${res.data.scenario.name}" successfully launched with ${res.data.resources.length} matching resources!`,
        });
        await fetchStatus();
        if (onScenarioStarted) onScenarioStarted(res.data);
      }
    } catch (err) {
      console.error('Failed to launch scenario:', err);
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to start simulation scenario.',
      });
    } finally {
      setLoadingScenario(false);
    }
  };

  // Safe reset
  const handleResetData = async () => {
    if (!window.confirm('Reset all simulation scenarios to the clean demo baseline? (Real citizen records are always preserved).')) {
      return;
    }
    try {
      setResetting(true);
      setFeedbackMessage(null);
      await ensureCoordinatorAuth();

      const res = await api.post('/simulation/reset');
      if (res.data?.success) {
        setFeedbackMessage({
          type: 'success',
          text: 'Simulation data reset safely. Baseline demo records restored.',
        });
        setLastLaunchedIncident(null);
        setCurrentWalkthroughStep(1);
        await fetchStatus();
        if (onResetComplete) onResetComplete(res.data);
      }
    } catch (err) {
      console.error('Failed to reset simulation data:', err);
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reset simulation data.',
      });
    } finally {
      setResetting(false);
    }
  };

  // Advance demo step
  const handleAdvanceStep = async (stepKey) => {
    if (!lastLaunchedIncident?._id) {
      setFeedbackMessage({
        type: 'error',
        text: 'Please launch a scenario first before advancing demo steps.',
      });
      return;
    }
    try {
      await ensureCoordinatorAuth();
      const res = await api.post('/simulation/advance-step', {
        incidentId: lastLaunchedIncident._id,
        step: stepKey,
      });
      if (res.data?.success) {
        setLastLaunchedIncident(res.data.incident);
        setFeedbackMessage({
          type: 'success',
          text: `Step completed: ${res.data.message}`,
        });
      }
    } catch (err) {
      console.error('Step advancement error:', err);
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to advance demo step.',
      });
    }
  };

  const scenariosList = [
    {
      id: 'FLOOD',
      name: 'Campus Flash Flood Emergency',
      icon: Waves,
      themeColor: 'from-blue-600 to-teal-700',
      tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
      urgency: 'Critical',
      location: 'Hostel Block B, East Wing',
      summary: '18 students stranded in ground-floor dormitories due to runoff flooding; urgently require clean drinking water, inflatable rescue rafts, and volunteer evacuation team.',
      supplies: ['Drinking Water', 'Evacuation Boats', 'Food Rations', 'Volunteers'],
    },
    {
      id: 'FIRE',
      name: 'Substation Electrical Blaze',
      icon: Flame,
      themeColor: 'from-orange-600 to-red-700',
      tagColor: 'bg-red-100 text-red-800 border-red-200',
      urgency: 'Critical',
      location: 'Substation Sector 4 Perimeter',
      summary: 'Transformer spark fire threatening chemical storage depot with toxic smoke drifting towards academic blocks. Evacuation shuttle and burn trauma kits required.',
      supplies: ['Fire Extinguishers', 'Evacuation Transport', 'First Aid / Medical', 'Shelter'],
    },
    {
      id: 'MEDICAL',
      name: 'Staff Colony Respiratory Crisis',
      icon: HeartPulse,
      themeColor: 'from-rose-600 to-pink-700',
      tagColor: 'bg-rose-100 text-rose-800 border-rose-200',
      urgency: 'High',
      location: 'Staff Quarters Quonset 12',
      summary: 'Elderly residents suffering acute asthma exacerbation following generator exhaust buildup. Emergency oxygen concentrators and transport van required.',
      supplies: ['First Aid / Medical', 'Ambulance Support', 'Volunteers'],
    },
    {
      id: 'FOOD_WATER',
      name: 'Relief Camp Supply Shortage',
      icon: PackageCheck,
      themeColor: 'from-amber-600 to-emerald-700',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
      urgency: 'Medium',
      location: 'Community School Gymnasium',
      summary: '85 displaced evacuees in temporary relief hall facing acute drinking water shortage and food ration exhaustion. Clean drinking water & meal packets needed.',
      supplies: ['Drinking Water', 'Food Rations', 'Volunteers'],
    },
  ];

  const walkthroughSteps = [
    {
      step: 1,
      title: 'Initialize Crisis Scenario',
      desc: 'Pick and launch a synthetic disaster scenario (e.g. Flash Flood). Data enters the system marked with isSimulation: true.',
      actionLabel: 'Launch Flood Scenario',
      action: () => handleLaunchScenario('FLOOD'),
    },
    {
      step: 2,
      title: 'Inspect Intake in Command Center',
      desc: 'Switch to the Coordinator Command Center to observe the simulated case appearing under Pending Verification.',
      actionLabel: 'Open Command Center',
      action: () => {
        onClose();
        navigate('/coordinator');
      },
    },
    {
      step: 3,
      title: 'Human-in-the-Loop Verification',
      desc: 'Verify the incident authenticity as a coordinator. This transitions the case from PENDING_VERIFICATION to VERIFIED.',
      actionLabel: 'Verify Simulated Incident',
      action: () => handleAdvanceStep('VERIFY'),
    },
    {
      step: 4,
      title: 'View Incident Detail & Map Telemetry',
      desc: 'Inspect the detailed incident record with coordinates, requested supplies, and the simulated disclaimer banner.',
      actionLabel: 'Open Case Detail Page',
      action: () => {
        if (lastLaunchedIncident?._id) {
          onClose();
          navigate(`/incidents/${lastLaunchedIncident._id}`);
        } else {
          onClose();
          navigate('/coordinator');
        }
      },
    },
    {
      step: 5,
      title: 'Run AI Resource Matching',
      desc: 'Trigger the AI matching engine to evaluate depot supplies and find matching drinking water and rescue rafts.',
      actionLabel: 'Go to Matching in Command Center',
      action: () => {
        onClose();
        navigate('/coordinator');
      },
    },
    {
      step: 6,
      title: 'Assign Lead & Approve Allocation',
      desc: 'Assign lead coordinator and approve supply allocation. This links the resource offer and changes status to ASSIGNED.',
      actionLabel: 'Assign Lead Coordinator',
      action: () => handleAdvanceStep('ASSIGN_LEAD'),
    },
    {
      step: 7,
      title: 'Inspect Chronological Audit Trail',
      desc: 'Review the tamper-evident timeline and compliance audit log showing full accountability for all actions taken.',
      actionLabel: 'View Audit Logs',
      action: () => {
        onClose();
        navigate('/coordinator');
      },
    },
    {
      step: 8,
      title: 'Conclude & Conclude Exercise',
      desc: 'Mark the simulated exercise resolved and reset scenario data back to baseline when presentation concludes.',
      actionLabel: 'Resolve Incident',
      action: () => handleAdvanceStep('RESOLVE'),
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulation-hub-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-navy-900 via-primary-900 to-navy-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="simulation-hub-title" className="text-lg font-black tracking-tight text-white">
                  ResQNet AI Simulation &amp; Demo Hub
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
                  PHASE 6 ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Safe crisis scenario generation, guided demo walkthroughs, and isolated test datasets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Simulation Hub"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Disclaimer Notice */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-2.5 flex items-center space-x-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>NON-DISPATCH GUARANTEE:</strong> All records created in this mode carry{' '}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-[11px]">isSimulation: true</code>.
            Resetting clears only simulated records, keeping genuine citizen distress reports safe.
          </span>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div
            className={`mx-6 mt-3 p-3 rounded-xl text-xs flex items-center justify-between ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-semibold">{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-500 hover:text-slate-800 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex space-x-6 text-sm font-bold text-slate-600 bg-slate-50">
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'scenarios'
                ? 'border-primary-600 text-primary-800 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Crisis Scenarios</span>
          </button>

          <button
            onClick={() => setActiveTab('walkthrough')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'walkthrough'
                ? 'border-primary-600 text-primary-800 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Guided Walkthrough</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'data'
                ? 'border-primary-600 text-primary-800 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Data &amp; Safe Reset</span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {/* TAB 1: CRISIS SCENARIOS */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-navy-900">Predefined Emergency Scenarios</h3>
                  <p className="text-xs text-slate-500">
                    Select a scenario to populate the Command Center and Map with realistic distress demands and matching community resources.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400">4 Scenarios Ready</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenariosList.map((sc) => {
                  const Icon = sc.icon;
                  const isCurrentActive = activeScenarioId === sc.id;
                  return (
                    <div
                      key={sc.id}
                      className={`relative rounded-xl border p-4 transition-all flex flex-col justify-between ${
                        isCurrentActive
                          ? 'border-primary-500 bg-primary-50/30 ring-2 ring-primary-500/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-soft'
                      }`}
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${sc.themeColor} text-white flex items-center justify-center shadow-xs`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-navy-900 leading-tight">{sc.name}</h4>
                              <p className="text-[11px] text-slate-500">{sc.location}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.tagColor}`}>
                            {sc.urgency}
                          </span>
                        </div>

                        {/* Summary */}
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                          {sc.summary}
                        </p>

                        {/* Supplies Tag Cloud */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {sc.supplies.map((sup, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                            >
                              {sup}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Launch Button */}
                      <button
                        onClick={() => handleLaunchScenario(sc.id)}
                        disabled={loadingScenario}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs ${
                          isCurrentActive
                            ? 'bg-primary-700 hover:bg-primary-800 text-white'
                            : 'bg-navy-900 hover:bg-primary-700 text-white'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{loadingScenario ? 'Launching Scenario...' : 'Launch This Scenario'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GUIDED WALKTHROUGH */}
          {activeTab === 'walkthrough' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-navy-900">10-Step Interactive Demo Walkthrough</h3>
                  <p className="text-xs text-slate-500">
                    Follow this step-by-step coordination pipeline to present the complete ResQNet AI platform to evaluators.
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 font-black text-xs">
                  Step {currentWalkthroughStep} of {walkthroughSteps.length}
                </div>
              </div>

              {/* Steps Accordion / Stepper */}
              <div className="space-y-3">
                {walkthroughSteps.map((ws) => {
                  const isCurrent = currentWalkthroughStep === ws.step;
                  const isPast = currentWalkthroughStep > ws.step;

                  return (
                    <div
                      key={ws.step}
                      className={`rounded-xl border p-4 transition-all ${
                        isCurrent
                          ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500'
                          : isPast
                          ? 'border-slate-200 bg-slate-50/60 opacity-85'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                              isPast
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-primary-700 text-white ring-4 ring-primary-100'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isPast ? <CheckCircle2 className="w-4 h-4" /> : ws.step}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-navy-900">{ws.title}</h4>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{ws.desc}</p>
                          </div>
                        </div>

                        {/* Action CTA */}
                        <div className="shrink-0 flex items-center space-x-2">
                          <button
                            onClick={ws.action}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-navy-900 hover:bg-primary-700 text-white flex items-center space-x-1 transition-all shadow-xs"
                          >
                            <span>{ws.actionLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stepper Navigation Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  onClick={() => setCurrentWalkthroughStep((prev) => Math.max(1, prev - 1))}
                  disabled={currentWalkthroughStep === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  &larr; Previous Step
                </button>
                <button
                  onClick={() => setCurrentWalkthroughStep((prev) => Math.min(walkthroughSteps.length, prev + 1))}
                  disabled={currentWalkthroughStep === walkthroughSteps.length}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary-800 bg-primary-100 hover:bg-primary-200 disabled:opacity-40"
                >
                  Next Step &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DATA & SAFE RESET */}
          {activeTab === 'data' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-black text-navy-900">Simulation Data Management &amp; Safety Isolation</h3>
                <p className="text-xs text-slate-500">
                  ResQNet AI strictly enforces database separation between synthetic demonstration records and live citizen emergency reports.
                </p>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-center">
                  <p className="text-[11px] font-bold text-amber-800">Simulated Incidents</p>
                  <p className="text-2xl font-black text-amber-950 mt-1">
                    {statusData?.counts?.simulatedIncidents ?? 0}
                  </p>
                  <span className="text-[10px] text-amber-700 font-medium">Safe to purge</span>
                </div>

                <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-center">
                  <p className="text-[11px] font-bold text-emerald-800">Real Citizen Reports</p>
                  <p className="text-2xl font-black text-emerald-950 mt-1">
                    {statusData?.counts?.realIncidents ?? 0}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-medium">Permanently Protected</span>
                </div>

                <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-center">
                  <p className="text-[11px] font-bold text-amber-800">Simulated Resources</p>
                  <p className="text-2xl font-black text-amber-950 mt-1">
                    {statusData?.counts?.simulatedResources ?? 0}
                  </p>
                  <span className="text-[10px] text-amber-700 font-medium">Safe to purge</span>
                </div>

                <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-center">
                  <p className="text-[11px] font-bold text-emerald-800">Real Resource Offers</p>
                  <p className="text-2xl font-black text-emerald-950 mt-1">
                    {statusData?.counts?.realResources ?? 0}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-medium">Permanently Protected</span>
                </div>
              </div>

              {/* Safety Rules Accordion */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs text-slate-600">
                <h4 className="font-bold text-navy-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Strict System Safety Policies
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 ml-1">
                  <li>
                    <strong>Strict Flag Partitioning:</strong> Every scenario record contains{' '}
                    <code className="bg-white px-1 py-0.5 rounded font-mono text-slate-800">isSimulation: true</code>.
                  </li>
                  <li>
                    <strong>Guaranteed Real-World Safety:</strong> Purge actions strictly target{' '}
                    <code className="bg-white px-1 py-0.5 rounded font-mono text-slate-800">{`{ isSimulation: true }`}</code>.
                    Real citizen records are never deleted or modified.
                  </li>
                  <li>
                    <strong>No Automatic Dispatch:</strong> Allocations in simulation mode are visual demonstrations and do not send real SMS or deploy real municipal crews.
                  </li>
                </ul>
              </div>

              {/* Reset Action */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-navy-900">Purge &amp; Restore Baseline Demo Records</p>
                  <p className="text-[11px] text-slate-500">
                    Clears active scenario records and restores initial 4 demo incidents and 5 supply depots.
                  </p>
                </div>
                <button
                  onClick={handleResetData}
                  disabled={resetting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center space-x-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                  <span>{resetting ? 'Purging & Restoring...' : 'Reset Simulation Data'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Simulation Backend Ready (Port 5001)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationHub;
