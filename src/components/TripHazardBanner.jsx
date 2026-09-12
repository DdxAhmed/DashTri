import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export default function TripHazardBanner() {
  const { interlockArmed, openResetModal } = useTelemetry();

  if (interlockArmed) return null;

  return (
    <div className="hazard-stripes border-b border-crimson-500/60 text-crimson-400 px-4 py-2 text-center text-xs font-mono font-bold tracking-wider animate-pulse-fast flex items-center justify-center gap-3">
      <AlertOctagon className="w-4 h-4 text-crimson-400" />
      <span>CRITICAL HARDWARE TRIP EXECUTED BY EDGE INTERLOCK // POWER STAGE ISOLATED IN &lt;1ms // MANUAL CLEAR REQUIRED</span>
      <button 
        onClick={openResetModal} 
        className="ml-4 px-2 py-0.5 bg-crimson-600 hover:bg-crimson-500 text-white rounded text-[11px] font-sans uppercase tracking-normal transition-colors"
      >
        Clear & Re-Arm
      </button>
    </div>
  );
}
