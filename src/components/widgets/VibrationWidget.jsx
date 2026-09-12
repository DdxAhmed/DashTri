import React, { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export default function VibrationWidget() {
  const { telemetry, ringBuffersRef } = useTelemetry();
  const { vibration } = telemetry;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const plotWaveform = (ctx, buffer, w, h, strokeColor, lineWidth) => {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      const len = buffer.length;
      const step = w / (len - 1);
      const midY = h / 2;
      const scaleY = h * 0.45;

      for (let i = 0; i < len; i++) {
        const x = i * step;
        const y = midY - Math.max(-1, Math.min(1, buffer[i])) * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

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

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const xDivs = 8;
      const yDivs = 4;
      for (let i = 0; i <= xDivs; i++) {
        const gx = (w / xDivs) * i;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let i = 0; i <= yDivs; i++) {
        const gy = (h / yDivs) * i;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Center baseline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const buffers = ringBuffersRef.current;
      plotWaveform(ctx, buffers.vibX, w, h, '#06B6D4', 1.6);
      plotWaveform(ctx, buffers.vibY, w, h, '#3B82F6', 1.2);
      plotWaveform(ctx, buffers.vibZ, w, h, '#A855F7', 1.0);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [ringBuffersRef]);

  const isCrit = vibration.status === 'CRIT';

  return (
    <div className="cyber-card corner-bracket p-4 flex flex-col justify-between space-y-3">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-cyan-500/10 border border-cyan-500/30">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-white tracking-wide">
              MULTI-MODAL VIBRATION MATRIX
            </h2>
            <p className="text-[10px] font-mono text-slate-400">3-Axis Piezo Accelerometer (±16g / 10kHz Sampling)</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span 
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isCrit 
                ? 'bg-crimson-500/20 border-crimson-500/50 text-crimson-400 animate-pulse' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {isCrit ? 'VIB: CRITICAL' : 'VIB: OK'}
          </span>
        </div>
      </div>

      {/* Numeric Telemetry Badges */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono">
        <div className="p-2 rounded bg-slate-900/80 border border-white/5">
          <div className="text-[10px] text-cyan-400 font-semibold">X-AXIS (RADIAL)</div>
          <div className="text-base font-bold text-white tabular-nums">
            {vibration.x >= 0 ? '+' : ''}{vibration.x.toFixed(2)} <span className="text-[10px] text-slate-500">g</span>
          </div>
          <div className="text-[9px] text-slate-400">Peak: <span className="text-slate-300">{vibration.peakX.toFixed(2)}g</span></div>
        </div>
        <div className="p-2 rounded bg-slate-900/80 border border-white/5">
          <div className="text-[10px] text-blue-400 font-semibold">Y-AXIS (TANGENT)</div>
          <div className="text-base font-bold text-white tabular-nums">
            {vibration.y >= 0 ? '+' : ''}{vibration.y.toFixed(2)} <span className="text-[10px] text-slate-500">g</span>
          </div>
          <div className="text-[9px] text-slate-400">Peak: <span className="text-slate-300">{vibration.peakY.toFixed(2)}g</span></div>
        </div>
        <div className="p-2 rounded bg-slate-900/80 border border-white/5">
          <div className="text-[10px] text-purple-400 font-semibold">Z-AXIS (AXIAL)</div>
          <div className="text-base font-bold text-white tabular-nums">
            {vibration.z >= 0 ? '+' : ''}{vibration.z.toFixed(2)} <span className="text-[10px] text-slate-500">g</span>
          </div>
          <div className="text-[9px] text-slate-400">Peak: <span className="text-slate-300">{vibration.peakZ.toFixed(2)}g</span></div>
        </div>
      </div>

      {/* Dynamic Oscilloscope Canvas */}
      <div className="relative bg-slate-950/90 border border-white/10 rounded-lg p-1.5 h-44 overflow-hidden">
        <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-[10px] font-mono text-slate-400 pointer-events-none">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Ch-X</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Ch-Y</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400"></span> Ch-Z</span>
        </div>
        <div className="absolute top-2 right-3 z-10 text-[10px] font-mono text-slate-500 pointer-events-none">
          TIMEBASE: <span className="text-slate-300">25ms/div</span>
        </div>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Derived Vibration Energy Indicators */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 font-mono text-xs">
        <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 border border-white/5">
          <span className="text-[10px] text-slate-400">RMS VELOCITY</span>
          <span className="font-bold text-emerald-400 tabular-nums">{vibration.rms.toFixed(2)} mm/s</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 border border-white/5">
          <span className="text-[10px] text-slate-400">CREST FACTOR (CF)</span>
          <span className="font-bold text-slate-200 tabular-nums">{vibration.crestFactor.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
