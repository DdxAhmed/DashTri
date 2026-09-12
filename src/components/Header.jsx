import React from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  AlertOctagon, 
  Activity, 
  Radio, 
  Settings2, 
  Volume2, 
  VolumeX, 
  AlertTriangle 
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export default function Header() {
  const { 
    interlockArmed, 
    telemetry, 
    muted, 
    toggleMute, 
    toggleSourceModal, 
    promptManualTrip 
  } = useTelemetry();

  const { connection } = telemetry;

  return (
    <header className="cyber-card corner-bracket px-4 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Branding & Core Dynamic Status */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-slate-900 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
          <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
        </div>
        
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
              TRI-MODAL
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v4.2-PRO
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-mono text-slate-300 tracking-wide font-medium">
              EDGE ACTIVE <span className="text-slate-500">|</span> <span className="text-emerald-400">FreeRTOS Core 0/1 Synchronized</span>
            </span>
          </div>
        </div>
      </div>

      {/* Center: Hardware Interlock Status Indicator */}
      <div className="flex items-center">
        <div 
          className={`px-5 py-2 rounded-lg border transition-all duration-300 flex items-center gap-3 ${
            interlockArmed 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : 'bg-crimson-500/20 border-crimson-500/80 text-crimson-400 shadow-[0_0_30px_rgba(239,68,68,0.7)] animate-pulse-fast'
          }`}
        >
          <div className="relative flex items-center justify-center">
            {interlockArmed ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-crimson-400 animate-bounce" />
            )}
          </div>
          <div className="text-left">
            <div className="text-[9px] uppercase tracking-widest font-mono text-slate-400">Interlock State</div>
            <div 
              className={`font-mono text-sm font-bold tracking-wider ${
                interlockArmed 
                  ? 'text-emerald-400 glow-text-emerald' 
                  : 'text-crimson-400 glow-text-crimson'
              }`}
            >
              {interlockArmed ? 'SYSTEM ARMED' : 'SAFETY RELAY TRIPPED (<1ms)'}
            </div>
          </div>
          <div className="hidden sm:block pl-3 border-l border-white/10 text-[10px] font-mono text-slate-400">
            <div>CUTOFF LATENCY</div>
            <div className={`font-semibold font-mono ${interlockArmed ? 'text-emerald-400' : 'text-crimson-400'}`}>
              &lt; 0.82 ms
            </div>
          </div>
        </div>
      </div>

      {/* Right: Telemetry Health, Audio & Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Live Connectivity Metrics Capsule */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs font-mono">
          <div className="flex items-center gap-1.5" title="WebSocket link state">
            <span className={`w-2 h-2 rounded-full ${connection.connected ? 'bg-emerald-400' : 'bg-crimson-400 animate-ping'}`}></span>
            <span className="text-slate-300 text-[11px]">
              {connection.mode === 'MOCK' ? 'LIVE MOCK' : (connection.connected ? 'LIVE WS' : 'CONNECTING...')}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1" title="Round-trip Ping Latency">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 tabular-nums font-semibold">{connection.pingMs}ms</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1" title="Telemetry Packet Drop Rate">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-emerald-400 tabular-nums">{connection.dropRatePct.toFixed(2)}%</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1" title="Client Rendering Frame Rate">
            <span className="text-slate-400 text-[10px]">FPS</span>
            <span className="text-white font-semibold tabular-nums">{connection.fps}</span>
          </div>
        </div>

        {/* Telemetry Source Toggle */}
        <button 
          onClick={toggleSourceModal}
          className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors" 
          title="Switch between Simulated Edge Rig and Physical Hardware WS"
        >
          <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Source: {connection.mode === 'MOCK' ? 'Sim Rig' : 'ESP32 WS'}</span>
        </button>

        {/* Audio Alerts Toggle */}
        <button 
          onClick={toggleMute}
          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs transition-colors" 
          title="Toggle Synthesized Audio Alerts"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-slate-600" />
          ) : (
            <Volume2 className="w-4 h-4 text-slate-300" />
          )}
        </button>

        {/* Emergency Manual E-Stop Trigger */}
        <button 
          onClick={promptManualTrip}
          className="relative group px-3.5 py-1.5 rounded-md bg-crimson-600/90 hover:bg-crimson-500 text-white font-display text-xs font-bold tracking-wider uppercase border border-crimson-400/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all active:scale-95 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>EMERGENCY TRIP</span>
        </button>
      </div>
    </header>
  );
}
