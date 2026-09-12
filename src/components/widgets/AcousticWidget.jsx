import React, { useRef, useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export default function AcousticWidget() {
  const { telemetry, ringBuffersRef } = useTelemetry();
  const { acoustic } = telemetry;
  const canvasRef = useRef(null);

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    freqHz: 0,
    ampDbfs: 0,
    bandName: '',
    bandClass: ''
  });

  const hoverRef = useRef(null);

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

      const x500 = (500 / 22050) * w;
      const x5000 = (5000 / 22050) * w;
      const x10k = (10000 / 22050) * w;

      // Band overlays
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fillRect(0, 0, x500, h);

      ctx.fillStyle = 'rgba(245, 158, 11, 0.07)';
      ctx.fillRect(x500, 0, x5000 - x500, h);

      ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
      ctx.fillRect(x10k, 0, w - x10k, h);

      // Separator lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(x500, 0); ctx.lineTo(x500, h);
      ctx.moveTo(x5000, 0); ctx.lineTo(x5000, h);
      ctx.moveTo(x10k, 0); ctx.lineTo(x10k, h);
      ctx.stroke();

      // ISO alarm limit dashed line (-18 dBFS)
      const limitY = h * (18 / 80);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, limitY);
      ctx.lineTo(w, limitY);
      ctx.stroke();
      ctx.setLineDash([]);

      const fft = ringBuffersRef.current.fftData;
      const barCount = 128;
      const barW = w / barCount;
      const binsPerBar = 1024 / barCount;

      for (let b = 0; b < barCount; b++) {
        let maxVal = -100;
        for (let k = 0; k < binsPerBar; k++) {
          const idx = Math.floor(b * binsPerBar + k);
          if (fft[idx] > maxVal) maxVal = fft[idx];
        }

        const norm = Math.max(0, Math.min(1, (maxVal + 80) / 80));
        const barH = norm * h;
        const x = b * barW;
        const y = h - barH;

        const freq = (b / barCount) * 22050;
        if (maxVal > -18) {
          ctx.fillStyle = '#EF4444';
        } else if (freq <= 500) {
          ctx.fillStyle = '#06B6D4';
        } else if (freq <= 5000) {
          ctx.fillStyle = '#F59E0B';
        } else if (freq >= 10000) {
          ctx.fillStyle = '#8B5CF6';
        } else {
          ctx.fillStyle = '#3B82F6';
        }

        ctx.fillRect(x, y, barW - 1, barH);
      }

      // Crosshair if hovering
      if (hoverRef.current) {
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hoverRef.current.x, 0);
        ctx.lineTo(hoverRef.current.x, h);
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [ringBuffersRef]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const freqRatio = Math.max(0, Math.min(1, x / rect.width));
    const freqHz = Math.round(freqRatio * 22050);

    const binIndex = Math.min(1023, Math.floor(freqRatio * 1024));
    const ampDbfs = Math.round((ringBuffersRef.current.fftData[binIndex] || -70) * 10) / 10;

    let bandName = 'Broadband Audio';
    let bandClass = 'text-slate-300';
    if (freqHz <= 500) {
      bandName = 'Low Freq: Unbalance/Misalign';
      bandClass = 'text-cyan-400';
    } else if (freqHz <= 5000) {
      bandName = 'Mid Freq: Bearing Defect';
      bandClass = 'text-amber-400';
    } else if (freqHz >= 10000) {
      bandName = 'Ultrasonic: Arcing/Friction';
      bandClass = 'text-purple-400';
    }

    hoverRef.current = { x };

    setTooltip({
      visible: true,
      x: Math.min(rect.width - 160, Math.max(10, x + 10)),
      y: Math.max(10, y - 40),
      freqHz,
      ampDbfs,
      bandName,
      bandClass
    });
  };

  const handleMouseLeave = () => {
    hoverRef.current = null;
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const isCrit = acoustic.status === 'CRIT';

  return (
    <div className="cyber-card corner-bracket p-4 flex flex-col justify-between space-y-3">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-violet-500/10 border border-violet-500/30">
            <BarChart2 className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-white tracking-wide">
              WIDEBAND ACOUSTIC FFT SPECTRUM
            </h2>
            <p className="text-[10px] font-mono text-slate-400">1024-Pt I2S MEMS Audio (0 Hz – 22.05 kHz)</p>
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
            {isCrit ? 'ACOUSTIC: CRITICAL' : 'ACOUSTIC: OK'}
          </span>
        </div>
      </div>

      {/* Sub-band Indicators */}
      <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
        <div className="p-1.5 rounded bg-slate-900/80 border border-cyan-500/20 text-left">
          <span className="text-cyan-400 font-semibold block">10 - 500 Hz</span>
          <span className="text-slate-400">Unbalance / Misalign</span>
          <span className="block font-bold text-slate-200 mt-0.5">{Math.round(acoustic.subbands.low)} dBFS</span>
        </div>
        <div className="p-1.5 rounded bg-slate-900/80 border border-amber-500/20 text-left">
          <span className="text-amber-400 font-semibold block">500 - 5000 Hz</span>
          <span className="text-slate-400">Bearing Race Wear</span>
          <span className="block font-bold text-slate-200 mt-0.5">{Math.round(acoustic.subbands.mid)} dBFS</span>
        </div>
        <div className="p-1.5 rounded bg-slate-900/80 border border-purple-500/20 text-left">
          <span className="text-purple-400 font-semibold block">&gt; 10 kHz (Ultra)</span>
          <span className="text-slate-400">Arcing / Cavitation</span>
          <span className="block font-bold text-slate-200 mt-0.5">{Math.round(acoustic.subbands.high)} dBFS</span>
        </div>
      </div>

      {/* FFT Visualizer Canvas with Interactive Hover Tooltip */}
      <div className="relative bg-slate-950/90 border border-white/10 rounded-lg p-1.5 h-44 overflow-hidden group">
        <canvas 
          ref={canvasRef} 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave} 
          className="w-full h-full cursor-crosshair" 
        />
        
        {/* Dynamic Hover HUD Tooltip */}
        {tooltip.visible && (
          <div 
            style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }} 
            className="pointer-events-none absolute px-2 py-1 rounded bg-slate-900/90 border border-cyan-500/50 text-[10px] font-mono text-white shadow-lg"
          >
            <span className="text-cyan-300 font-bold">{tooltip.freqHz.toLocaleString()} Hz</span> |{' '}
            <span className="text-slate-300">{tooltip.ampDbfs} dBFS</span> |{' '}
            <span className={tooltip.bandClass}>{tooltip.bandName}</span>
          </div>
        )}

        {/* ISO Alarm Limit Line Label */}
        <div className="absolute right-2 top-4 pointer-events-none text-[9px] font-mono text-crimson-400/80 flex items-center gap-1">
          <span className="w-4 h-[1px] bg-crimson-500"></span> ISO Trip Limit (-18 dBFS)
        </div>
      </div>

      {/* FFT Summary stats */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5 font-mono text-xs">
        <div className="text-[10px] text-slate-400">
          DOMINANT PEAK: <span className="text-white font-semibold">{acoustic.dominantPeakFreq} Hz</span>{' '}
          (<span className="text-cyan-400">{acoustic.dominantPeakAmp} dBFS</span>)
        </div>
        <div className="text-[10px] text-slate-400">
          THD+N: <span className="text-emerald-400 font-semibold">{acoustic.thd}%</span>
        </div>
      </div>
    </div>
  );
}
