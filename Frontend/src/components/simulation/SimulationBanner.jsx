import React from 'react';
import { ShieldAlert, RotateCcw, Compass, Sparkles, ChevronRight } from 'lucide-react';

export const SimulationBanner = ({
  simulationStatus,
  activeScenarioName,
  onOpenHub,
  onResetSimulation,
  resetting,
}) => {
  if (!simulationStatus?.simulationMode) return null;

  return (
    <div
      role="region"
      aria-label="Simulation Mode Banner"
      className="bg-gradient-to-r from-amber-600 via-amber-700 to-primary-900 text-white shadow-md border-b border-amber-500/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left: Simulation Indicator */}
        <div className="flex items-center space-x-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded font-black tracking-wider text-[11px] bg-amber-950/70 border border-amber-300/40 text-amber-200 uppercase">
              SIMULATION MODE ACTIVE
            </span>
            <span className="hidden md:inline text-amber-100 font-medium">
              {activeScenarioName ? (
                <>Scenario: <strong className="text-white">{activeScenarioName}</strong></>
              ) : (
                'Demonstrating synthetic disaster coordination data'
              )}
            </span>
            <span className="hidden lg:inline text-amber-200/80 text-xs">
              • Real-world dispatch is inactive
            </span>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={onOpenHub}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/25 font-semibold text-white transition-all shadow-xs"
            title="Open Interactive Demo Hub & Scenario Switcher"
          >
            <Compass className="w-3.5 h-3.5 text-amber-200" />
            <span>Walkthrough Hub</span>
            <ChevronRight className="w-3 h-3 text-amber-200" />
          </button>

          <button
            onClick={onResetSimulation}
            disabled={resetting}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/35 font-semibold text-amber-100 hover:text-white border border-amber-400/30 transition-all disabled:opacity-50"
            title="Purge scenario simulation data and restore clean demo baseline"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{resetting ? 'Resetting...' : 'Reset Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationBanner;
