import React from 'react';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  UserCheck,
  FileEdit,
  HelpCircle
} from 'lucide-react';

export default function IncidentTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
        <Clock className="w-5 h-5 mx-auto mb-1 text-slate-300" />
        No timeline events logged yet.
      </div>
    );
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'REPORT_CREATED':
      case 'REPORT_SUBMITTED':
        return <Clock className="w-3.5 h-3.5 text-blue-600" />;
      case 'INCIDENT_VERIFIED':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'INCIDENT_REJECTED':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
      case 'RESOURCE_ALLOCATED':
        return <PackageCheck className="w-3.5 h-3.5 text-teal-600" />;
      case 'COORDINATOR_ASSIGNED':
        return <UserCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'STATUS_UPDATED':
      case 'COORDINATOR_NOTE':
        return <FileEdit className="w-3.5 h-3.5 text-slate-600" />;
      case 'NEEDS_MORE_INFORMATION':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />;
    }
  };

  const getEventBg = (type) => {
    switch (type) {
      case 'INCIDENT_VERIFIED':
        return 'bg-emerald-50 border-emerald-200';
      case 'INCIDENT_REJECTED':
        return 'bg-rose-50 border-rose-200';
      case 'RESOURCE_ALLOCATED':
        return 'bg-teal-50 border-teal-200';
      case 'NEEDS_MORE_INFORMATION':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {timeline.map((event, idx) => (
        <div key={idx} className="relative group">
          {/* Timeline Node dot */}
          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border border-slate-300 shadow-xs flex items-center justify-center">
            {getEventIcon(event.eventType)}
          </div>

          <div className={`p-3 rounded-xl border text-xs transition ${getEventBg(event.eventType)}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-navy-900 tracking-tight">
                {event.eventType.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" />
                {event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {event.description}
            </p>
            {event.performedBy && (
              <div className="mt-1 text-[10px] text-slate-500 font-medium">
                By: {event.performedBy} ({event.performedByRole || 'system'})
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
