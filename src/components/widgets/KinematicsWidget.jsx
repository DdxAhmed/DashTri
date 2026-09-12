import React, { useRef, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export default function KinematicsWidget() {
  const { telemetry, ringBuffersRef } = useTelemetry();
  const { kinematics } = telemetry;
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

      const buf = ringBuffersRef.current.alphaSpark;
      const len = buf.length;
      const step = w / (len - 1);

      ctx.strokeStyle = kinematics.torqueRipplePct > 8 ? '#F59E0B' : '#10B981';
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      for (let i = 0; i < len; i++) {
        const x = i * step;
        const norm = (buf[i] + 10) / 30;
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
  }, [ringBuffersRef, kinematics.torqueRipplePct]);

  const isWarn = kinematics.status === 'WARN';
  const rpmRatio = Math.max(0, Math.min(1, kinematics.rpm / 6000));
  const rpmDashOffset = 226 - (rpmRatio * 226);

  return (
    <div className="cyber-card corner-bracket p-4 flex flex-col justify-between space-y-3">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/30">
            <Gauge className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-white tracking-wide">
              KINEMATICS & ANGULAR DYNAMICS
            </h2>
            <p className="text-[10px] font-mono text-slate-400">High-Res Optical Encoder / FOC Observer</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span 
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isWarn 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {isWarn ? 'KINEMATICS: WARN' : 'KINEMATICS: OK'}
          </span>
        </div>
      </div>

      {/* Circular RPM Gauge + Sparkline Layout */}
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Custom SVG Radial RPM Gauge */}
        <div className="col-span-6 flex flex-col items-center justify-center relative">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background track */}
              <circle cx="60" cy="60" r="48" stroke="#1E293B" strokeWidth="8" fill="transparent" strokeDasharray="226" strokeDashoffset="0" strokeLinecap="round"/>
              {/* Warning / Trip segments */}
              <circle cx="60" cy="60" r="48" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="8" fill="transparent" strokeDasharray="50" strokeDashoffset="-150" strokeLinecap="round"/>
              <circle cx="60" cy="60" r="48" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="8" fill="transparent" strokeDasharray="26" strokeDashoffset="-200" strokeLinecap="round"/>
              {/* Dynamic value arc */}
              <circle 
                cx="60" 
                cy="60" 
                r="48" 
                stroke="url(#cyanBlueGrad)" 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray="226" 
                strokeDashoffset={rpmDashOffset} 
                strokeLinecap="round" 
                className="transition-all duration-100 ease-out"
              />
              
              <defs>
                <linearGradient id="cyanBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center Readout */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Rotor Speed</span>
              <span className="font-mono text-xl font-bold text-white tabular-nums tracking-tight">
                {Math.round(kinematics.rpm)}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold">RPM</span>
            </div>
          </div>
          
          <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
            <span>SETPOINT: <span className="text-slate-200">3000</span></span>
            <span className="text-slate-600">|</span>
            <span>SLIP: <span className="text-emerald-400">{kinematics.slipPct.toFixed(1)}%</span></span>
          </div>
        </div>

        {/* Instantaneous Angular Accel Sparkline (Torque Ripple) */}
        <div className="col-span-6 flex flex-col justify-between h-full space-y-2">
          <div className="p-2 rounded bg-slate-900/80 border border-white/5">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-slate-400">α_inst (dω/dt)</span>
              <span className="text-emerald-400 font-semibold">
                Ripple: {kinematics.torqueRipplePct.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-white tabular-nums">
              {kinematics.alphaAccel >= 0 ? '+' : ''}{kinematics.alphaAccel.toFixed(1)} <span className="text-[9px] text-slate-400 font-normal">rad/s²</span>
            </div>
            <div className="relative h-14 w-full mt-1.5 bg-slate-950/80 rounded border border-white/5 overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-white/5 text-[10px] font-mono flex items-center justify-between">
            <span className="text-slate-400">TORQUE HARMONIC:</span>
            <span className="text-emerald-400 font-semibold">6th Slot OK</span>
          </div>
        </div>
      </div>

      {/* Kinematics Bottom stats */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 font-mono text-xs">
        <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 border border-white/5">
          <span className="text-[10px] text-slate-400">RATE OF CHANGE</span>
          <span className="font-bold text-white tabular-nums">
            {kinematics.rateChangeRpm >= 0 ? '+' : ''}{kinematics.rateChangeRpm} RPM/s
          </span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 border border-white/5">
          <span className="text-[10px] text-slate-400">DIRECTION</span>
          <span className="font-bold text-cyan-400 tabular-nums">CW (FWD)</span>
        </div>
      </div>
    </div>
  );
}
