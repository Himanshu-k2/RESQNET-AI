import React from 'react';
import { CheckCircle2, Clock, Layers, ShieldCheck, Database, MapPin, Radio, Bot, Zap, Check } from 'lucide-react';

export const PhaseTracker = () => {
  const phases = [
    {
      num: 'Phase 1',
      title: 'Project Setup & Core Infrastructure',
      desc: 'Node.js, Express, MongoDB (Dual-Mode in-memory & external), JWT auth, and React + Tailwind design system.',
      status: 'COMPLETED',
      features: [
        'Express REST API & Dual-mode MongoDB',
        'Role-based JWT authentication (Citizen, Coordinator, Admin)',
        'Responsive Tailwind CSS design system',
        'Automated disaster simulation data seed engine'
      ]
    },
    {
      num: 'Phase 2',
      title: 'Core Features: Need Help / Provide Help',
      desc: 'Emergency intake with validation & review, community resource registration, and live status toggling.',
      status: 'COMPLETED',
      features: [
        'Multi-step incident reporting with pre-submit review',
        'Community resource registration (water, food, medical, shelter)',
        'Live resource availability toggling',
        'Real-time community telemetry feed'
      ]
    },
    {
      num: 'Phase 3',
      title: 'AI Integration',
      desc: 'ResQGuide Multilingual Assistant, natural language incident extraction, and AI resource matching recommendations.',
      status: 'COMPLETED',
      features: [
        'ResQGuide multilingual conversational assistant',
        'Distress SMS / WhatsApp message telemetry extraction',
        'AI resource matching recommendation engine',
        'Executive incident briefing synthesis',
        'Rule-based heuristic fallback engine for offline reliability'
      ]
    },
    {
      num: 'Phase 4',
      title: 'Offline Functionality',
      desc: 'IndexedDB persistent storage layer, background sync queue, duplicate prevention, and network status detection.',
      status: 'COMPLETED',
      features: [
        'Client-side IndexedDB database (resqnet_offline)',
        'Heartbeat & browser online/offline status detection hook',
        'Global responsive connectivity banner',
        'Automatic reconnection synchronization queue',
        'clientId idempotency & duplicate incident prevention',
        'Dedicated Offline Queue management page (/offline-reports)'
      ]
    },
    {
      num: 'Phase 5',
      title: 'Dashboard & Map',
      desc: 'Interactive Leaflet crisis map, human-in-the-loop verification, resource dispatch approval, and audit logging.',
      status: 'COMPLETED',
      features: [
        'Multi-tab Coordinator Command Center (/coordinator)',
        'Interactive Leaflet + OpenStreetMap crisis map with categorized pins',
        'Human-in-the-loop verification with mandatory rejection rationale',
        'Incident detail case view (/incidents/:id) with timeline history',
        'Tactical coordinator task management',
        'Full compliance audit logging (AuditLog collection)'
      ]
    },
    {
      num: 'Phase 6',
      title: 'Simulation & Presentation Polish',
      desc: 'Disaster simulation sandbox, multi-scenario presets, guided presentation walkthrough, and safe data management.',
      status: 'COMPLETED',
      features: [
        'Emergency Simulation Engine with 4 crisis presets (Flood, Fire, Medical, Food/Water)',
        'Strict database isolation (isSimulation: true) preventing real-world dispatch confusion',
        'Safe reset & data purging protocol preserving real citizen distress reports',
        'Interactive 10-step guided presentation walkthrough stepper',
        'High-contrast accessible indicators, keyboard navigation & error recovery'
      ]
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            COMPLETED
          </span>
        );
      case 'IN PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Clock className="w-3.5 h-3.5 text-teal-600 animate-spin" />
            IN PROGRESS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            NOT STARTED
          </span>
        );
    }
  };

  // Accurate weighted calculation:
  // COMPLETED = 1.0, IN PROGRESS = 0.5, NOT STARTED = 0.0
  const completedPhases = phases.filter((p) => p.status === 'COMPLETED').length;
  const inProgressPhases = phases.filter((p) => p.status === 'IN PROGRESS').length;
  const notStartedPhases = phases.filter((p) => p.status === 'NOT STARTED').length;

  const progressScore = completedPhases * 1.0 + inProgressPhases * 0.5;
  const progressPercent = Math.round((progressScore / phases.length) * 100);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Roadmap Progress</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900">
            Platform Implementation Milestones
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified engineering progress across resilient data layers, multimodal AI, and coordinator command tooling.
          </p>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <div className="text-3xl font-black text-navy-900">{progressPercent}%</div>
          <div className="text-xs text-slate-500 font-semibold mt-0.5">
            {completedPhases} of {phases.length} Phases Completed
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {completedPhases} Completed • {inProgressPhases} In Progress • {notStartedPhases} Not Started
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 my-6 overflow-hidden border border-slate-200/60">
        <div
          className="bg-gradient-to-r from-teal-500 via-primary-600 to-emerald-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Grid of Phase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {phases.map((p) => {
          const isComp = p.status === 'COMPLETED';
          const isProg = p.status === 'IN PROGRESS';

          return (
            <div
              key={p.num}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isComp
                  ? 'bg-emerald-50/20 border-emerald-200/80 shadow-soft hover:shadow-soft-md'
                  : isProg
                  ? 'bg-teal-50/30 border-teal-300 shadow-soft ring-1 ring-teal-200'
                  : 'bg-slate-50/50 border-slate-200/70 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-black text-navy-900 uppercase tracking-wide">
                    {p.num}
                  </span>
                  {getStatusBadge(p.status)}
                </div>

                <h3 className="font-bold text-sm text-navy-900 mb-1.5 leading-snug">
                  {p.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {p.desc}
                </p>
              </div>

              {/* Verified Features List */}
              {p.features && p.features.length > 0 && (
                <div className="pt-3 border-t border-slate-200/60 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {isComp ? 'Verified Features' : 'Scope Target'}
                  </div>
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-tight">
                      {isComp ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5 ml-1 mr-1" />
                      )}
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
