import React, { useState } from 'react';
import { FileClock, Download, Printer, Check } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export default function EventLogSection() {
  const { logs, clearLogs, exportCSV, openReportModal } = useTelemetry();
  const [filter, setFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    if (filter === 'TRIP') return log.severity === 'TRIP';
    if (filter === 'WARN') return log.severity === 'WARN' || log.severity === 'CRIT';
    return true;
  });

  const handleCopy = (log) => {
    navigator.clipboard.writeText(`${log.timestamp} [${log.severity}] ${log.message}`);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <section className="cyber-card corner-bracket p-4 space-y-3">
      {/* Section Header with Filters and Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-800 border border-white/10">
            <FileClock className="w-4 h-4 text-slate-300" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-white tracking-wide">
              REAL-TIME INDUSTRIAL EVENT STREAM & RELAY AUDIT LOG
            </h3>
            <p className="text-[10px] font-mono text-slate-400">Timestamped edge telemetry snapshots and trip event forensics</p>
          </div>
        </div>

        {/* Filter Chips & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter pills */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-white/5 text-[11px] font-mono">
            {['ALL', 'TRIP', 'WARN'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filter === f 
                    ? 'bg-slate-700 text-white font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'All' : f === 'TRIP' ? 'Trips' : 'Warnings'}
              </button>
            ))}
          </div>

          {/* Export to CSV */}
          <button 
            onClick={exportCSV}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Snapshot CSV</span>
          </button>

          {/* Generate PDF Diagnostic Report */}
          <button 
            onClick={openReportModal}
            className="px-2.5 py-1 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Diagnostic Report</span>
          </button>
        </div>
      </div>

      {/* Scrollable Event Stream Table */}
      <div className="overflow-x-auto max-h-56 overflow-y-auto rounded-lg border border-white/5 bg-slate-950/70">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase sticky top-0 border-b border-white/5 z-10">
            <tr>
              <th className="py-2 px-3">TIMESTAMP</th>
              <th className="py-2 px-3">SEVERITY</th>
              <th className="py-2 px-3">EVENT CATEGORY</th>
              <th className="py-2 px-3">ACTIVE FAULT VOTES</th>
              <th className="py-2 px-3">DIAGNOSTIC DETAILS & PAYLOAD</th>
              <th className="py-2 px-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500 font-mono text-xs">
                  No event records match filter [{filter}].
                </td>
              </tr>
            ) : (
              filteredLogs.slice(0, 50).map(log => {
                let badgeColor = 'bg-slate-800 text-slate-300 border-white/10';
                if (log.severity === 'TRIP') badgeColor = 'bg-crimson-500/20 text-crimson-400 border-crimson-500/50 animate-pulse font-bold';
                else if (log.severity === 'CRIT') badgeColor = 'bg-crimson-500/20 text-crimson-400 border-crimson-500/30';
                else if (log.severity === 'WARN') badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                else if (log.severity === 'INFO') badgeColor = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';

                const hasPayload = log.payload && Object.keys(log.payload).length > 0;

                return (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] border ${badgeColor}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-200 font-medium">{log.category}</td>
                    <td className="py-2 px-3">
                      <span className={log.votes >= 2 ? 'text-crimson-400 font-bold' : (log.votes === 1 ? 'text-amber-400' : 'text-emerald-400')}>
                        {log.votes}/5
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {log.message}{' '}
                      {hasPayload && (
                        <span className="text-slate-500">
                          {`{${Object.entries(log.payload).map(([k, v]) => `${k}:${v}`).join(', ')}}`}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400 text-[10px]">
                      <button 
                        onClick={() => handleCopy(log)}
                        className="hover:text-cyan-400 inline-flex items-center gap-1"
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          'Copy'
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
        <span>Log Buffer Capacity: {logs.length} / 500 records</span>
        <button onClick={clearLogs} className="hover:text-slate-300 underline">
          Clear Terminal Buffer
        </button>
      </div>
    </section>
  );
}
