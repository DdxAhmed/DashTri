import React from 'react';
import { 
  Binary, 
  Activity, 
  BarChart2, 
  Gauge, 
  Zap, 
  Flame, 
  ShieldAlert 
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export default function AiHealthMatrixWidget() {
  const { interlockArmed, telemetry } = useTelemetry();
  const { aiHealth, vibration, acoustic, kinematics, current, thermal } = telemetry;

  const votes = aiHealth.activeVotes;
  const score = aiHealth.overallScore;

  const healthOffset = 251.2 - ((score / 100) * 251.2);
  let healthStroke = '#10B981';
  let healthLabel = 'OPTIMAL';
  if (score < 60) {
    healthStroke = '#EF4444';
    healthLabel = 'CRITICAL';
  } else if (score <= 85) {
    healthStroke = '#F59E0B';
    healthLabel = 'DEGRADED';
  }

  const domains = [
    {
      id: 'vib',
      name: '1. Vibration Kinematics',
      icon: Activity,
      iconColor: 'text-cyan-400',
      loss: vibration.anomalyLoss,
      isFault: aiHealth.domainVotes.vibration
    },
    {
      id: 'aco',
      name: '2. Wideband Acoustic FFT',
      icon: BarChart2,
      iconColor: 'text-violet-400',
      loss: acoustic.anomalyLoss,
      isFault: aiHealth.domainVotes.acoustic
    },
    {
      id: 'kin',
      name: '3. Kinematics & Ripple',
      icon: Gauge,
      iconColor: 'text-blue-400',
      loss: kinematics.anomalyLoss,
      isFault: aiHealth.domainVotes.kinematics
    },
    {
      id: 'cur',
      name: '4. Phase Current Balance',
      icon: Zap,
      iconColor: 'text-amber-400',
      loss: current.anomalyLoss,
      isFault: aiHealth.domainVotes.current
    },
    {
      id: 'thm',
      name: '5. Thermal Radiometry',
      icon: Flame,
      iconColor: 'text-crimson-400',
      loss: thermal.anomalyLoss,
      isFault: aiHealth.domainVotes.thermal
    }
  ];

  return (
    <div className="cyber-card corner-bracket p-4 flex flex-col justify-between space-y-3 md:col-span-2 xl:col-span-2">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30">
            <Binary className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-white tracking-wide">
              EDGE AI HEALTH INDEX & 2-OF-5 CROSS-VALIDATION MATRIX
            </h2>
            <p className="text-[10px] font-mono text-slate-400">TinyML Autoencoder Anomaly Scoring & Fail-Safe Voting Interlock</p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400 text-[11px]">ACTIVE FAULT VOTES:</span>
          <span 
            className={`px-2.5 py-0.5 rounded font-bold border ${
              votes >= 2 
                ? 'bg-crimson-500/20 border-crimson-500/60 text-crimson-400 animate-pulse' 
                : (votes === 1 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400')
            }`}
          >
            {votes} / 5 ({interlockArmed ? 'ARMED' : 'TRIPPED'})
          </span>
        </div>
      </div>

      {/* Top Dual-Section: Health Dial + 5 Domains Voting Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Machine Health Index Progress Radial Dial */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#1E293B" strokeWidth="8" fill="transparent"/>
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke={healthStroke} 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray="251.2" 
                strokeDashoffset={healthOffset} 
                strokeLinecap="round" 
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-mono text-slate-400 uppercase">HEALTH INDEX</span>
              <span 
                className="font-mono text-2xl font-bold tabular-nums" 
                style={{ color: healthStroke }}
              >
                {score}%
              </span>
              <span className="text-[9px] font-mono text-slate-300 font-semibold">{healthLabel}</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-2 text-center">
            EST. TTF:{' '}
            <span className={score < 60 ? 'text-crimson-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {score < 60 ? '< 48 hrs' : '> 12,500 hrs'}
            </span>
          </div>
        </div>

        {/* 5 Physical Domains Consensus Table */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span>PHYSICAL SENSING DOMAIN</span>
            <span>ANOMALY RECONSTRUCTION</span>
            <span>INTERLOCK VOTE</span>
          </div>

          {domains.map(d => {
            const Icon = d.icon;
            return (
              <div 
                key={d.id} 
                className={`flex items-center justify-between px-3 py-2 rounded-lg font-mono text-xs transition-colors border ${
                  d.isFault 
                    ? 'bg-crimson-950/40 border-crimson-500/40' 
                    : 'bg-slate-900/80 border-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${d.iconColor}`} />
                  <span className="font-semibold text-white">{d.name}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Residual:{' '}
                  <span className={d.isFault ? 'text-crimson-400 font-bold' : 'text-emerald-400'}>
                    {d.loss.toFixed(3)}
                  </span>
                </div>
                <span 
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    d.isFault 
                      ? 'bg-crimson-500/30 border-crimson-500/70 text-crimson-300 animate-pulse' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {d.isFault ? 'FAULT VOTE (+1)' : 'OK (NO FAULT)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-of-5 Logic Explanation Box */}
      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 font-mono text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-slate-200">SAFETY CRITERIA:</strong> Hardware interlock trips automatically if and only if{' '}
            <strong className="text-cyan-300">≥ 2 independent domains</strong> register abnormal signatures (2-out-of-5 consensus).
          </span>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline shrink-0">
          Prevents single-sensor false positive shutdowns
        </span>
      </div>
    </div>
  );
}
