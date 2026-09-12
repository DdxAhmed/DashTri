import React from 'react';
import { FlaskConical } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export default function FaultBench() {
  const { activeFault, injectFault } = useTelemetry();

  const faults = [
    { key: 'NONE', label: '✓ Baseline Nominal', activeClass: 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]', hoverColor: 'hover:text-emerald-400' },
    { key: 'BEARING_RACE', label: '⚡ Bearing Defect (Vib + Aco)', activeClass: 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]', hoverColor: 'hover:text-amber-400' },
    { key: 'TORQUE_RIPPLE', label: '∿ Torque Ripple (Kin Only)', activeClass: 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]', hoverColor: 'hover:text-amber-400' },
    { key: 'ARCING_SURGE', label: '🔥 Arc & Surge (Aco + Cur + Therm)', activeClass: 'bg-crimson-600 border-crimson-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]', hoverColor: 'hover:text-crimson-400' },
    { key: 'THERMAL_RUNAWAY', label: '🌡 Over-Temp (Therm Only)', activeClass: 'bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]', hoverColor: 'hover:text-amber-400' },
  ];

  return (
    <section className="cyber-card px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      <div className="flex items-center gap-2 text-slate-400">
        <FlaskConical className="w-4 h-4 text-cyan-400" />
        <span className="font-semibold text-slate-200">FAULT INJECTION BENCH:</span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Simulate physical powertrain defects to validate the 2-of-5 voting interlock:
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {faults.map((f) => {
          const isActive = activeFault === f.key;
          return (
            <button
              key={f.key}
              onClick={() => injectFault(f.key)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                isActive
                  ? `${f.activeClass} font-bold`
                  : `bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-300 ${f.hoverColor}`
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
