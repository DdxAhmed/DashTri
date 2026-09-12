import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';

const TelemetryContext = createContext(null);

const THRESHOLDS = {
  vibrationLoss: 0.050,
  acousticLoss: 0.055,
  kinematicsLoss: 0.045,
  currentLoss: 0.045,
  thermalLoss: 0.040
};

export function TelemetryProvider({ children }) {
  // Core Interlock and Fault bench
  const [interlockArmed, setInterlockArmed] = useState(true);
  const [lastTripTime, setLastTripTime] = useState(null);
  const [lastTripReason, setLastTripReason] = useState('');
  const [activeFault, setActiveFault] = useState('NONE');
  const [muted, setMuted] = useState(false);

  // Modals visibility
  const [modals, setModals] = useState({
    tripConfirm: false,
    reArm: false,
    source: false,
    report: false
  });

  // Telemetry metrics state for DOM display
  const [telemetry, setTelemetry] = useState({
    vibration: {
      x: 0.12, y: -0.08, z: 0.04,
      peakX: 0.32, peakY: 0.28, peakZ: 0.18,
      rms: 1.42,
      crestFactor: 3.18,
      status: 'OK',
      anomalyLoss: 0.014
    },
    acoustic: {
      subbands: { low: -48, mid: -54, high: -62 },
      dominantPeakFreq: 120,
      dominantPeakAmp: -32.1,
      thd: 0.48,
      status: 'OK',
      anomalyLoss: 0.021
    },
    kinematics: {
      rpm: 2840,
      setpointRpm: 3000,
      slipPct: 1.2,
      alphaAccel: 4.2,
      torqueRipplePct: 1.8,
      rateChangeRpm: 12,
      direction: 'CW',
      status: 'OK',
      anomalyLoss: 0.019
    },
    current: {
      activeRms: 18.4,
      surgeCurrent: 22.1,
      phaseU: 18.4,
      phaseV: 18.2,
      phaseW: 18.5,
      powerFactor: 0.94,
      status: 'OK',
      anomalyLoss: 0.012
    },
    thermal: {
      surfaceTemp: 54.2,
      ambientTemp: 24.5,
      rateOfRise: 0.3,
      status: 'OK',
      anomalyLoss: 0.008
    },
    aiHealth: {
      overallScore: 98,
      activeVotes: 0,
      ttfHours: 12500,
      domainVotes: {
        vibration: false,
        acoustic: false,
        kinematics: false,
        current: false,
        thermal: false
      }
    },
    connection: {
      mode: 'MOCK',
      connected: true,
      pingMs: 1.4,
      dropRatePct: 0.00,
      fps: 60,
      wsUrl: 'ws://192.168.1.100:8765/telemetry'
    }
  });

  // Ring buffers for high-speed canvas rendering
  const ringBuffersRef = useRef({
    vibX: new Float32Array(256),
    vibY: new Float32Array(256),
    vibZ: new Float32Array(256),
    alphaSpark: new Float32Array(64),
    currentWave: new Float32Array(128),
    fftData: new Float32Array(1024)
  });

  // Initial buffer filling
  useEffect(() => {
    const b = ringBuffersRef.current;
    for (let i = 0; i < 256; i++) {
      b.vibX[i] = Math.sin(i * 0.15) * 0.2 + (Math.random() - 0.5) * 0.05;
      b.vibY[i] = Math.cos(i * 0.15) * 0.15 + (Math.random() - 0.5) * 0.04;
      b.vibZ[i] = Math.sin(i * 0.3) * 0.1 + (Math.random() - 0.5) * 0.02;
    }
    for (let i = 0; i < 64; i++) {
      b.alphaSpark[i] = 4.0 + Math.sin(i * 0.4) * 0.8 + (Math.random() - 0.5) * 0.3;
    }
    for (let i = 0; i < 128; i++) {
      b.currentWave[i] = Math.sin(i * 0.2) * 18.4 + (Math.random() - 0.5) * 0.6;
    }
    for (let i = 0; i < 1024; i++) {
      b.fftData[i] = -72 + (Math.random() - 0.5) * 6 - (i / 1024) * 8;
    }
  }, []);

  // Event Logs state
  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: new Date().toTimeString().split(' ')[0] + '.012',
      rawDate: new Date(),
      severity: 'INFO',
      category: 'SYSTEM',
      message: 'Tri-Modal Edge Runtime v4.2 (React Edition) Initialized on Core 0/1',
      payload: {},
      votes: 0
    },
    {
      id: 2,
      timestamp: new Date().toTimeString().split(' ')[0] + '.024',
      rawDate: new Date(),
      severity: 'INFO',
      category: 'INTERLOCK',
      message: 'Hardware Safety Relay Armed. Cutoff latency benchmark: 0.82ms',
      payload: {},
      votes: 0
    },
    {
      id: 3,
      timestamp: new Date().toTimeString().split(' ')[0] + '.036',
      rawDate: new Date(),
      severity: 'INFO',
      category: 'BENCH',
      message: 'Simulated Edge Rig Active in Baseline Nominal Mode',
      payload: {},
      votes: 0
    }
  ]);

  const addLog = useCallback((severity, category, message, payload = {}, votes = 0) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const newEntry = {
      id: Date.now() + Math.random(),
      timestamp: timeStr,
      rawDate: now,
      severity,
      category,
      message,
      payload,
      votes
    };
    setLogs(prev => [newEntry, ...prev.slice(0, 499)]);
  }, []);

  // Internal mutable simulation values
  const simStateRef = useRef({
    stepCount: 0,
    phaseTime: 0,
    rpm: 2840,
    activeRms: 18.4,
    surfaceTemp: 54.2,
    fpsCounter: 0,
    lastFpsTime: performance.now(),
    fps: 60,
    activeFault: 'NONE',
    interlockArmed: true
  });

  // Keep ref sync with state
  useEffect(() => {
    simStateRef.current.activeFault = activeFault;
  }, [activeFault]);

  useEffect(() => {
    simStateRef.current.interlockArmed = interlockArmed;
  }, [interlockArmed]);

  // WebSocket ref
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Ingestion Mode switch
  const setIngestionMode = useCallback((mode, customWsUrl) => {
    const wsUrl = customWsUrl || telemetry.connection.wsUrl;
    setTelemetry(prev => ({
      ...prev,
      connection: {
        ...prev.connection,
        mode,
        wsUrl,
        connected: mode === 'MOCK' ? true : false
      }
    }));

    if (mode === 'MOCK') {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      clearTimeout(reconnectTimeoutRef.current);
      addLog('INFO', 'CONFIG', 'Ingestion mode switched to: Built-in Simulation Rig');
    } else {
      addLog('INFO', 'WEBSOCKET', `Connecting to Hardware WS: ${wsUrl}`);
      // Connect WebSocket
      const connectWS = () => {
        try {
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onopen = () => {
            setTelemetry(prev => ({
              ...prev,
              connection: { ...prev.connection, connected: true }
            }));
            addLog('INFO', 'WEBSOCKET', `Connected to Hardware Edge WS: ${wsUrl}`);
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'TELEMETRY') {
                // Ingest telemetry payload
              }
            } catch {}
          };

          ws.onclose = () => {
            setTelemetry(prev => ({
              ...prev,
              connection: { ...prev.connection, connected: false }
            }));
            reconnectTimeoutRef.current = setTimeout(connectWS, 4000);
          };

          ws.onerror = () => {
            try { ws.close(); } catch {}
          };
        } catch {
          reconnectTimeoutRef.current = setTimeout(connectWS, 4000);
        }
      };
      connectWS();
    }
  }, [addLog, telemetry.connection.wsUrl]);

  // Actions
  const injectFault = useCallback((faultKey) => {
    setActiveFault(faultKey);
    addLog(
      faultKey === 'NONE' ? 'INFO' : 'WARN',
      'BENCH_INJECTION',
      `Injected Fault Scenario: [${faultKey}]`,
      { mode: faultKey }
    );
    audioEngine.playBeep(faultKey === 'NONE' ? 660 : 440, 0.08, 'triangle', 0.1);
  }, [addLog]);

  const promptManualTrip = useCallback(() => {
    audioEngine.init();
    setModals(prev => ({ ...prev, tripConfirm: true }));
  }, []);

  const executeManualTrip = useCallback(() => {
    setModals(prev => ({ ...prev, tripConfirm: false }));
    setInterlockArmed(false);
    setLastTripTime(new Date());
    setLastTripReason('EMERGENCY OPERATOR MANUAL CUTOFF');
    addLog('TRIP', 'MANUAL_OVERRIDE', 'EMERGENCY MANUAL CUTOFF INITIATED BY OPERATOR', { source: 'WEB_CONSOLE' }, 5);
    audioEngine.playTripAlarm();
  }, [addLog]);

  const openResetModal = useCallback(() => {
    setModals(prev => ({ ...prev, reArm: true }));
  }, []);

  const executeReArm = useCallback(() => {
    setModals(prev => ({ ...prev, reArm: false }));
    setInterlockArmed(true);
    setActiveFault('NONE');
    addLog('INFO', 'INTERLOCK', 'Safety interlock cleared and re-armed. High voltage bus energized.');
    audioEngine.playBeep(880, 0.1, 'sine', 0.15);
  }, [addLog]);

  const toggleSourceModal = useCallback(() => {
    setModals(prev => ({ ...prev, source: !prev.source }));
  }, []);

  const openReportModal = useCallback(() => {
    setModals(prev => ({ ...prev, report: true }));
  }, []);

  const closeModals = useCallback(() => {
    setModals({ tripConfirm: false, reArm: false, source: false, report: false });
  }, []);

  const toggleMute = useCallback(() => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  }, [muted]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const exportCSV = useCallback(() => {
    const now = new Date().toISOString();
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Timestamp,InterlockState,HealthScore,RPM,TorqueRipplePct,VibRMS_mms,VibCrestFactor,AcousticPeakHz,AcousticPeakdBFS,TempC,PhaseCurrentRMS_A,ActiveVotes\n';
    
    const row = [
      now,
      interlockArmed ? 'ARMED' : 'TRIPPED',
      telemetry.aiHealth.overallScore,
      telemetry.kinematics.rpm.toFixed(1),
      telemetry.kinematics.torqueRipplePct.toFixed(2),
      telemetry.vibration.rms.toFixed(3),
      telemetry.vibration.crestFactor.toFixed(2),
      telemetry.acoustic.dominantPeakFreq,
      telemetry.acoustic.dominantPeakAmp,
      telemetry.thermal.surfaceTemp.toFixed(1),
      telemetry.current.activeRms.toFixed(2),
      telemetry.aiHealth.activeVotes
    ].join(',');
    csvContent += row + '\n';

    csvContent += '\n# EVENT AUDIT TRAIL LOGS\n';
    csvContent += 'Timestamp,Severity,Category,FaultVotes,Message\n';
    logs.forEach(l => {
      csvContent += `"${l.timestamp}","${l.severity}","${l.category}",${l.votes},"${l.message.replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trimodal_telemetry_snapshot_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLog('INFO', 'EXPORT', 'Exported comprehensive telemetry CSV snapshot.');
  }, [interlockArmed, telemetry, logs, addLog]);

  // Main 60 FPS animation & physics loop
  useEffect(() => {
    let animId;
    let lastTime = performance.now();
    let lastDomUpdate = performance.now();

    const shiftRingBuffer = (buffer, newVal) => {
      const len = buffer.length;
      for (let i = 0; i < len - 1; i++) {
        buffer[i] = buffer[i + 1];
      }
      buffer[len - 1] = newVal;
    };

    const loop = (currentTime) => {
      const dt = Math.min(100, currentTime - lastTime);
      lastTime = currentTime;
      const sim = simStateRef.current;
      sim.stepCount++;
      sim.phaseTime += dt * 0.001;
      const t = sim.phaseTime;

      // FPS tracking
      sim.fpsCounter++;
      if (currentTime - sim.lastFpsTime >= 1000) {
        sim.fps = sim.fpsCounter;
        sim.fpsCounter = 0;
        sim.lastFpsTime = currentTime;
      }

      const isArmed = sim.interlockArmed;
      const fault = sim.activeFault;

      // Kinematics spin up / spin down
      if (!isArmed) {
        sim.rpm = Math.max(0, sim.rpm - dt * 2.5);
        sim.activeRms = Math.max(0, sim.activeRms - dt * 0.05);
        sim.surfaceTemp = Math.max(24.5, sim.surfaceTemp - dt * 0.005);
      } else {
        const baseTargetRpm = 2840 + Math.sin(t * 0.5) * 15;
        sim.rpm += (baseTargetRpm - sim.rpm) * 0.05;
      }

      // Anomaly losses & multiplier
      let vibLoss = 0.012 + Math.random() * 0.004;
      let acoLoss = 0.018 + Math.random() * 0.004;
      let kinLoss = 0.015 + Math.random() * 0.004;
      let curLoss = 0.011 + Math.random() * 0.003;
      let thmLoss = 0.008 + Math.random() * 0.002;

      let vibMultiplier = 1.0;
      let acousticMidSpike = false;
      let acousticHighSpike = false;
      let torqueRippleSpike = false;
      let thermalSpike = false;
      let currentSurgeSpike = false;

      switch (fault) {
        case 'BEARING_RACE':
          vibMultiplier = 4.8;
          vibLoss = 0.082;
          acousticMidSpike = true;
          acoLoss = 0.094;
          break;
        case 'TORQUE_RIPPLE':
          torqueRippleSpike = true;
          kinLoss = 0.078;
          break;
        case 'ARCING_SURGE':
          acousticHighSpike = true;
          acoLoss = 0.112;
          currentSurgeSpike = true;
          curLoss = 0.098;
          thermalSpike = true;
          thmLoss = 0.085;
          break;
        case 'THERMAL_RUNAWAY':
          thermalSpike = true;
          thmLoss = 0.089;
          break;
        default:
          break;
      }

      // 1. Vibration
      const vx = (Math.sin(t * 30) * 0.18 + Math.sin(t * 120) * 0.08 + (Math.random() - 0.5) * 0.06) * vibMultiplier;
      const vy = (Math.cos(t * 30) * 0.14 + (Math.random() - 0.5) * 0.05) * vibMultiplier;
      const vz = (Math.sin(t * 60) * 0.08 + (Math.random() - 0.5) * 0.03) * vibMultiplier;
      const peakX = Math.max(0.1, Math.abs(vx) * 1.6);
      const peakY = Math.max(0.1, Math.abs(vy) * 1.5);
      const peakZ = Math.max(0.1, Math.abs(vz) * 1.4);
      const rms = Math.sqrt((vx * vx + vy * vy + vz * vz) / 3) * 9.81;
      const crestFactor = peakX / Math.max(0.01, rms / 9.81);

      const buffers = ringBuffersRef.current;
      shiftRingBuffer(buffers.vibX, vx);
      shiftRingBuffer(buffers.vibY, vy);
      shiftRingBuffer(buffers.vibZ, vz);

      // 2. Acoustic FFT
      const fft = buffers.fftData;
      const motorFreqBin = Math.floor((sim.rpm / 60) * (1024 / 22050));
      for (let i = 0; i < 1024; i++) {
        let amp = -72 + (Math.random() - 0.5) * 6 - (i / 1024) * 8;
        if (Math.abs(i - motorFreqBin) <= 2) amp = -32 + (Math.random() - 0.5) * 3;
        if (Math.abs(i - motorFreqBin * 2) <= 2) amp = -42 + (Math.random() - 0.5) * 3;
        if (Math.abs(i - motorFreqBin * 3) <= 2) amp = -49 + (Math.random() - 0.5) * 3;

        if (acousticMidSpike) {
          const bpfoBin = Math.floor(1850 * (1024 / 22050));
          if (Math.abs(i - bpfoBin) <= 8) amp = -15 + (Math.random() - 0.5) * 5;
          if (Math.abs(i - bpfoBin * 2) <= 6) amp = -22 + (Math.random() - 0.5) * 4;
        }
        if (acousticHighSpike && i > 550) {
          amp = Math.max(amp, -18 + (Math.random() - 0.5) * 8);
        }
        fft[i] = (fft[i] || -70) * 0.7 + amp * 0.3;
      }

      const acoLow = fft[motorFreqBin] || -48;
      const acoMid = acousticMidSpike ? -16.4 : -54.2 + (Math.random() - 0.5) * 2;
      const acoHigh = acousticHighSpike ? -17.8 : -62.1 + (Math.random() - 0.5) * 2;
      const dominantFreq = acousticMidSpike ? 1850 : Math.round(sim.rpm / 60);
      const dominantAmp = acousticMidSpike ? -15.2 : -32.1;

      // 3. Kinematics
      const baseAlpha = (Math.random() - 0.5) * 2.0;
      const alpha = torqueRippleSpike ? (Math.sin(t * 40) * 18.5 + (Math.random() - 0.5) * 4) : baseAlpha;
      const torqueRipplePct = torqueRippleSpike ? 14.8 : 1.8 + Math.random() * 0.4;
      const rateChangeRpm = Math.round(alpha * 2.8);
      shiftRingBuffer(buffers.alphaSpark, alpha);

      // 4. Current & Thermal
      let phaseU = 18.4, phaseV = 18.2, phaseW = 18.5;
      let powerFactor = 0.94;
      let surgeCurrent = 22.1;
      if (currentSurgeSpike) {
        sim.activeRms = 34.2 + Math.sin(t * 10) * 4;
        surgeCurrent = 48.6;
        phaseU = 36.1; phaseV = 24.2; phaseW = 34.8;
        powerFactor = 0.76;
      } else {
        sim.activeRms = isArmed ? 18.4 + (Math.random() - 0.5) * 0.4 : 0;
      }
      shiftRingBuffer(buffers.currentWave, sim.activeRms + (Math.random() - 0.5));

      let rateOfRise = +0.3;
      if (thermalSpike) {
        sim.surfaceTemp = Math.min(99.4, sim.surfaceTemp + dt * 0.02);
        rateOfRise = +8.4;
      } else if (isArmed) {
        sim.surfaceTemp = 54.2 + Math.sin(t * 0.1) * 1.5;
      }

      // 5. 2-of-5 Consensus Voting
      const voteVib = vibLoss >= THRESHOLDS.vibrationLoss || rms > 3.8;
      const voteAco = acoLoss >= THRESHOLDS.acousticLoss || acoMid > -20 || acoHigh > -25;
      const voteKin = kinLoss >= THRESHOLDS.kinematicsLoss || torqueRipplePct > 8.0;
      const voteCur = curLoss >= THRESHOLDS.currentLoss || sim.activeRms > 28.0;
      const voteThm = thmLoss >= THRESHOLDS.thermalLoss || sim.surfaceTemp > 75.0;

      let totalVotes = 0;
      if (voteVib) totalVotes++;
      if (voteAco) totalVotes++;
      if (voteKin) totalVotes++;
      if (voteCur) totalVotes++;
      if (voteThm) totalVotes++;

      let health = 100 - (totalVotes * 22) - (Math.random() * 2);
      if (totalVotes === 0) health = 98 - (Math.random() * 2);
      if (!isArmed) health = Math.min(health, 24);
      const overallScore = Math.max(5, Math.min(100, Math.round(health)));

      // Trigger automatic trip if 2-of-5 threshold met
      if (isArmed && totalVotes >= 2) {
        sim.interlockArmed = false;
        setInterlockArmed(false);
        const tripDate = new Date();
        setLastTripTime(tripDate);

        const faultDomains = [];
        if (voteVib) faultDomains.push('VIBRATION');
        if (voteAco) faultDomains.push('ACOUSTIC');
        if (voteKin) faultDomains.push('KINEMATICS');
        if (voteCur) faultDomains.push('CURRENT');
        if (voteThm) faultDomains.push('THERMAL');

        const reason = `Cross-Domain 2-of-5 Consensus Exceeded: [${faultDomains.join(' + ')}]`;
        setLastTripReason(reason);

        addLog(
          'TRIP',
          'INTERLOCK_CUTOFF',
          `AUTOMATIC HARDWARE TRIP EXECUTED (<1ms): ${reason}`,
          { domains: faultDomains.join(','), votes: totalVotes },
          totalVotes
        );
        audioEngine.playTripAlarm();
      }

      // Throttle React state update to ~30 FPS for silky DOM rendering without overhead
      if (currentTime - lastDomUpdate >= 32) {
        lastDomUpdate = currentTime;
        setTelemetry(prev => ({
          ...prev,
          vibration: {
            x: vx, y: vy, z: vz,
            peakX, peakY, peakZ,
            rms, crestFactor,
            status: voteVib ? 'CRIT' : 'OK',
            anomalyLoss: vibLoss
          },
          acoustic: {
            subbands: { low: acoLow, mid: acoMid, high: acoHigh },
            dominantPeakFreq: dominantFreq,
            dominantPeakAmp: dominantAmp,
            thd: 0.48,
            status: voteAco ? 'CRIT' : 'OK',
            anomalyLoss: acoLoss
          },
          kinematics: {
            rpm: sim.rpm,
            setpointRpm: 3000,
            slipPct: 1.2,
            alphaAccel: alpha,
            torqueRipplePct,
            rateChangeRpm,
            direction: 'CW',
            status: voteKin ? 'WARN' : 'OK',
            anomalyLoss: kinLoss
          },
          current: {
            activeRms: sim.activeRms,
            surgeCurrent,
            phaseU, phaseV, phaseW,
            powerFactor,
            status: voteCur ? 'CRIT' : 'OK',
            anomalyLoss: curLoss
          },
          thermal: {
            surfaceTemp: sim.surfaceTemp,
            ambientTemp: 24.5,
            rateOfRise,
            status: voteThm ? 'CRIT' : 'OK',
            anomalyLoss: thmLoss
          },
          aiHealth: {
            overallScore,
            activeVotes: totalVotes,
            ttfHours: 12500,
            domainVotes: {
              vibration: voteVib,
              acoustic: voteAco,
              kinematics: voteKin,
              current: voteCur,
              thermal: voteThm
            }
          },
          connection: {
            ...prev.connection,
            fps: sim.fps
          }
        }));
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addLog]);

  const value = {
    interlockArmed,
    lastTripTime,
    lastTripReason,
    activeFault,
    muted,
    modals,
    telemetry,
    logs,
    ringBuffersRef,
    injectFault,
    promptManualTrip,
    executeManualTrip,
    openResetModal,
    executeReArm,
    toggleSourceModal,
    openReportModal,
    closeModals,
    toggleMute,
    setIngestionMode,
    addLog,
    clearLogs,
    exportCSV
  };

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
