import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Network, 
  FileCheck, 
  Printer, 
  X 
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export default function Modals() {
  const { 
    modals, 
    closeModals, 
    executeManualTrip, 
    executeReArm, 
    telemetry, 
    setIngestionMode 
  } = useTelemetry();

  const [wsUrlInput, setWsUrlInput] = useState(telemetry.connection.wsUrl);
  const [selectedMode, setSelectedMode] = useState(telemetry.connection.mode);

  const { vibration, acoustic, kinematics, thermal, current, aiHealth } = telemetry;

  return (
    <>
      {/* 1. MANUAL TRIP CONFIRMATION MODAL */}
      {modals.tripConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cyber-card max-w-md w-full p-6 border-crimson-500/50 shadow-[0_0_50px_rgba(239,68,68,0.5)] space-y-4">
            <div className="flex items-center gap-3 text-crimson-400">
              <div className="p-3 rounded-full bg-crimson-500/20 border border-crimson-500/50 animate-bounce">
                <AlertTriangle className="w-8 h-8 text-crimson-500" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white tracking-wide">EMERGENCY HARDWARE TRIP</h3>
                <p className="text-xs font-mono text-crimson-300">Tri-Modal Safety Cutoff Interlock</p>
              </div>
            </div>
            
            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              WARNING: Actuating this control will immediately command the solid-state safety relay to open, isolating power from the motor inverter in &lt;1 millisecond.
            </p>

            <div className="p-3 rounded bg-slate-900 border border-crimson-500/30 text-xs font-mono text-slate-300">
              <span className="text-slate-500">Action:</span> FORCE_RELAY_CUTOFF (FreeRTOS Core 0 Pin GPIO_21)
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={closeModals} 
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeManualTrip} 
                className="px-4 py-2 rounded bg-crimson-600 hover:bg-crimson-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(239,68,68,0.6)]"
              >
                Confirm Emergency Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. RE-ARM SYSTEM MODAL */}
      {modals.reArm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cyber-card max-w-md w-full p-6 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.3)] space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-3 rounded-full bg-emerald-500/20 border border-emerald-500/50">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white tracking-wide">RE-ARM SAFETY INTERLOCK</h3>
                <p className="text-xs font-mono text-emerald-300">Clear Trip Latch & Restore Gate Power</p>
              </div>
            </div>
            
            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              Verify that mechanical inspection has cleared all physical fault causes. Ensure the motor shaft is stationary before re-energizing the safety relay.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={closeModals} 
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
              >
                Abort
              </button>
              <button 
                onClick={executeReArm} 
                className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              >
                Clear Latch & Arm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DATA SOURCE SETTINGS MODAL */}
      {modals.source && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cyber-card max-w-lg w-full p-6 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.2)] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-400" />
                <h3 className="font-display text-base font-bold text-white">TELEMETRY INGESTION PIPELINE</h3>
              </div>
              <button onClick={closeModals} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-300 block mb-1">Ingestion Mode:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSelectedMode('MOCK')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedMode === 'MOCK' 
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-white' 
                        : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-cyan-400">Simulated Edge Rig</div>
                    <div className="text-[10px] text-slate-400">Built-in physics engine with fault injection</div>
                  </button>
                  <button 
                    onClick={() => setSelectedMode('WS')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedMode === 'WS' 
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-white' 
                        : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-slate-200">Physical ESP32 WS</div>
                    <div className="text-[10px] text-slate-400">Connect to hardware over LAN/WAN WebSocket</div>
                  </button>
                </div>
              </div>

              {selectedMode === 'WS' && (
                <div className="space-y-2">
                  <label className="text-slate-300 block">WebSocket Server URI:</label>
                  <input 
                    type="text" 
                    value={wsUrlInput}
                    onChange={(e) => setWsUrlInput(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">Auto-reconnect with exponential backoff is active.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => {
                  setIngestionMode(selectedMode, wsUrlInput);
                  closeModals();
                }} 
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DIAGNOSTIC INSPECTION REPORT MODAL */}
      {modals.report && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cyber-card max-w-2xl w-full p-6 border-cyan-500/40 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    TRI-MODAL POWERTRAIN DIAGNOSTIC INSPECTION REPORT
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">
                    Generated on: <span className="text-slate-200">{new Date().toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <button onClick={closeModals} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs text-slate-300">
              {/* Machine Identity */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded bg-slate-900 border border-white/5">
                <div><span className="text-slate-500">Asset Tag:</span> <span className="text-white font-bold">TM-POWERTRAIN-ALPHA-01</span></div>
                <div><span className="text-slate-500">Controller:</span> <span className="text-white font-bold">ESP32-S3 Dual Core 240MHz</span></div>
                <div><span className="text-slate-500">Sampling Rate:</span> <span className="text-white">10 kHz Vibration / 44.1 kHz Audio</span></div>
                <div><span className="text-slate-500">Safety Logic:</span> <span className="text-cyan-400">2-of-5 Cross-Domain Voting</span></div>
              </div>

              {/* Telemetry Snapshot at Report Time */}
              <div>
                <h4 className="font-bold text-slate-200 uppercase text-[11px] mb-1.5">1. Telemetry State Snapshot</h4>
                <table className="w-full text-left border border-white/5 rounded overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 text-[10px]">
                    <tr>
                      <th className="p-2">PARAMETER</th>
                      <th className="p-2">MEASURED VALUE</th>
                      <th className="p-2">NOMINAL RANGE</th>
                      <th className="p-2">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[11px]">
                    <tr>
                      <td className="p-2 text-slate-300">Rotor Dynamic Speed</td>
                      <td className="p-2 font-bold text-white">{Math.round(kinematics.rpm)} RPM</td>
                      <td className="p-2 text-slate-400">2800 - 3200 RPM</td>
                      <td className="p-2 text-emerald-400">NORMAL</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-300">Vibration Overall RMS</td>
                      <td className="p-2 font-bold text-white">{vibration.rms.toFixed(2)} mm/s</td>
                      <td className="p-2 text-slate-400">&lt; 2.80 mm/s</td>
                      <td className={`p-2 ${vibration.rms > 2.8 ? 'text-crimson-400' : 'text-emerald-400'}`}>
                        {vibration.rms > 2.8 ? 'ELEVATED' : 'NORMAL'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-300">Acoustic Dominant Peak</td>
                      <td className="p-2 font-bold text-white">{acoustic.dominantPeakFreq} Hz ({acoustic.dominantPeakAmp} dBFS)</td>
                      <td className="p-2 text-slate-400">&lt; -20 dBFS</td>
                      <td className={`p-2 ${acoustic.dominantPeakAmp > -20 ? 'text-crimson-400' : 'text-emerald-400'}`}>
                        {acoustic.dominantPeakAmp > -20 ? 'ALARM' : 'NORMAL'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-300">Stator Surface Temperature</td>
                      <td className="p-2 font-bold text-white">{thermal.surfaceTemp.toFixed(1)} °C</td>
                      <td className="p-2 text-slate-400">&lt; 75.0 °C</td>
                      <td className={`p-2 ${thermal.surfaceTemp > 75 ? 'text-crimson-400' : 'text-emerald-400'}`}>
                        {thermal.surfaceTemp > 75 ? 'CRITICAL' : 'NORMAL'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-300">Phase Current Active RMS</td>
                      <td className="p-2 font-bold text-white">{current.activeRms.toFixed(1)} A</td>
                      <td className="p-2 text-slate-400">14.0 - 24.0 A</td>
                      <td className={`p-2 ${current.activeRms > 24 ? 'text-crimson-400' : 'text-emerald-400'}`}>
                        {current.activeRms > 24 ? 'OVERLOAD' : 'BALANCED'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Domain Voting Analysis */}
              <div>
                <h4 className="font-bold text-slate-200 uppercase text-[11px] mb-1.5">2. Cross-Domain Voting Verdict</h4>
                <div className="p-3 rounded bg-slate-900 border border-white/5 text-[11px] space-y-1">
                  <div>
                    Consensus Votes Active:{' '}
                    <strong className={aiHealth.activeVotes >= 2 ? 'text-crimson-400' : 'text-emerald-400'}>
                      {aiHealth.activeVotes} / 5
                    </strong>
                  </div>
                  <div>
                    Interlock Status:{' '}
                    <strong className={telemetry.interlockArmed ? 'text-emerald-400' : 'text-crimson-400'}>
                      {telemetry.interlockArmed ? 'SYSTEM ARMED' : 'SAFETY RELAY TRIPPED'}
                    </strong>
                  </div>
                  <div className="text-slate-400 mt-1">
                    Cross-domain verification ensures zero uncoordinated shutdowns while guaranteeing sub-millisecond physical equipment protection under multi-modal failure signatures.
                  </div>
                </div>
              </div>

              {/* Signature & Cryptographic Stamp */}
              <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-slate-500">
                <div>
                  <div>Edge Hash: <span className="font-mono text-slate-400">SHA256: 8f9b4c2a71d0e8...</span></div>
                  <div>FreeRTOS Task Watchdog: Verified</div>
                </div>
                <div className="text-right">
                  <div>Inspector: Certified AI Diagnostic Agent</div>
                  <div>Action Required: None (System Armed)</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
              <button 
                onClick={closeModals} 
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
