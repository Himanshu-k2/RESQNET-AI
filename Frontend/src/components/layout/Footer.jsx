import React from 'react';
import { ShieldCheck, AlertCircle, Cpu, Wifi, Database } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      {/* Advisory Banner */}
      <div className="bg-emergency-900/40 border-b border-emergency-800/60 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center space-x-3 text-xs text-rose-200">
          <AlertCircle className="w-5 h-5 text-emergency-500 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-white">EMERGENCY ADVISORY:</strong> RESQNET AI is an intelligent coordination platform designed to organize community resources and incident verification. It does not replace official municipal dispatch services (e.g. 911 / 112). In life-threatening emergencies, notify official authorities first.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Description */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">
                RESQNET <span className="text-teal-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              AI-Powered Emergency Coordination & Resource Network. Bridging critical supply gaps during disasters through multimodal AI triage, offline-first IndexedDB resilience, and verified coordinator resource matching.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-teal-400" /> Modular Gemini AI
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-emerald-400" /> Offline-First IDB
              </span>
              <span className="flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-amber-400" /> Zero-Loss Sync
              </span>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="/need-help" className="hover:text-white transition-colors">
                  🚨 Report Incident (Need Help)
                </a>
              </li>
              <li>
                <a href="/provide-help" className="hover:text-white transition-colors">
                  🤝 Register Resources (Provide Help)
                </a>
              </li>
              <li>
                <a href="/coordinator" className="hover:text-white transition-colors">
                  🛡️ Coordinator Verification Command
                </a>
              </li>
            </ul>
          </div>

          {/* Verification & Ethics */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Verification Standards
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              All submitted emergency reports and resource offers are tagged as <span className="text-amber-400 font-medium">PENDING_VERIFICATION</span> until validated by authenticated disaster coordinators.
            </p>
            <div className="flex items-center space-x-1.5 text-xs text-teal-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Coordinator Authorization Enforced</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ResQNet AI. Emergency Coordination &amp; Resource Network.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Backend Port 5001 • Frontend Port 5174
          </p>
        </div>
      </div>
    </footer>
  );
};
