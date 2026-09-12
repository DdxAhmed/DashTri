import React, { useRef, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export default function ThermalCurrentWidget() {
  const { telemetry, ringBuffersRef } = useTelemetry();
  const { current, thermal } = telemetry;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.floor(rect.width * dpr);
      const targetH = Math.floor(rect.height * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const buf = ringBuffersRef.current.currentWave;
      const len = buf.length;
      const step = w / (len - 1);

      ctx.strokeStyle = current.activeRms > 26 ? '#EF4444' : '#06B6D4';
      ctx.lineWidth = 1.6;
      ctx.beginPath();

      for (let i = 0; i < len; i++) {
        const x = i * step;
        const norm = Math.max(0, Math.min(1, buf[i] / 40));
        const y = h - (norm * h);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [ringBuffersRef, current.activeRms]);

  const isCurrentCrit = current.status === 'CRIT';
  const isThermalCrit = thermal.status === 'CRIT';

  return (
    <div className="cyber-card corner-bracket p-4 flex flex-col justify-between space-y-3">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30">
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-white tracking-wide">
              THERMAL & PHASE CURRENT PROFILING
            </h2>
            <p className="text-[10px] font-mono text-slate-400">IR Radiometer Array & Hall Current Sensors</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span 
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isCurrentCrit 
                ? 'bg-crimson-500/20 border-crimson-500/50 text-crimson-400 animate-pulse' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {isCurrentCrit ? 'CURRENT: CRIT' : 'CURRENT: OK'}
          </span>
          <span 
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isThermalCrit 
                ? 'bg-crimson-500/20 border-crimson-500/50 text-crimson-400 animate-pulse' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {isThermalCrit ? 'THERMAL: CRIT' : 'THERMAL: OK'}
          </span>
        </div>
      </div>

      {/* Temperature Bar & Hotspot Status */}
      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5 space-y-1.5 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">STATOR SURFACE RADIOMETRY</span>
          <span className="text-xs font-bold text-white tabular-nums">
            <span className="text-amber-400 text-sm">{thermal.surfaceTemp.toFixed(1)}</span> °C
          </span>
        </div>
        
        {/* Gradient Thermal Progress Bar */}
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden relative p-[1px]">
          <div 
            style={{ width: `${Math.min(100, Math.max(0, thermal.surfaceTemp))}%` }} 
            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-cyan-500 via-amber-500 to-crimson-500" 
          />
        </div>
        
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>Ambient: <span className="text-slate-200">{thermal.ambientTemp.toFixed(1)}°C</span></span>
          <span>Rise: <span className="text-slate-200">{thermal.rateOfRise >= 0 ? '+' : ''}{thermal.rateOfRise.toFixed(1)}°C/m</span></span>
          <span>Trip Limit: <span className="text-crimson-400">95.0°C</span></span>
        </div>
      </div>

      {/* Dual-Trace Phase Current Waveform */}
      <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 space-y-1.5 font-mono">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">PHASE CURRENT WAVEFORM (U / V / W)</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Active RMS
            </span>
            <span className="flex items-center gap-1 text-[9px] text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Inrush Surge
            </span>
          </div>
        </div>
        
        <div className="relative h-20 w-full bg-slate-950/80 rounded border border-white/5 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        <div className="grid grid-cols-3 gap-1 text-center text-[10px] pt-1">
          <div><span className="text-slate-500">Phase U:</span> <span className="text-white font-bold">{current.phaseU.toFixed(1)}A</span></div>
          <div><span className="text-slate-500">Phase V:</span> <span className="text-white font-bold">{current.phaseV.toFixed(1)}A</span></div>
          <div><span className="text-slate-500">Phase W:</span> <span className="text-white font-bold">{current.phaseW.toFixed(1)}A</span></div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 font-mono text-xs">
        <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 border border-white/5">
          <span className="text-[10px] text-slate-400">POWER FACTOR (cos φ)</span>
          <span className="font-bold text-emerald-400 tabular-nums">{current.powerFactor.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 border border-white/5">
          <span className="text-[10px] text-slate-400">PEAK SURGE</span>
          <span className="font-bold text-slate-200 tabular-nums">{current.surgeCurrent.toFixed(1)} A</span>
        </div>
      </div>
    </div>
  );
}
