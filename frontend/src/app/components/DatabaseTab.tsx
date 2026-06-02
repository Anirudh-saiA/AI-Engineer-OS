import React from "react";

interface TelemetryRow {
  id: string;
  event: string;
  status: "success" | "warning" | "error";
  duration: number;
  timestamp: string;
}

interface DatabaseTabProps {
  telemetryTable: TelemetryRow[];
  dbChecking: boolean;
  triggerDbCheck: () => void;
  insertMockTelemetry: () => void;
}

export default function DatabaseTab({
  telemetryTable,
  dbChecking,
  triggerDbCheck,
  insertMockTelemetry,
}: DatabaseTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[var(--border)] shadow-sm">
        <div>
          <h3 className="text-base font-black">PostgreSQL Transaction Logs</h3>
          <p className="text-[11px] font-mono mt-0.5 text-slate-400">
            Pool engine on 127.0.0.1:5434 • Models synchronized.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={triggerDbCheck}
            disabled={dbChecking}
            className="btn-accent flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {dbChecking && <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-white animate-spin"></span>}
            Live DB Check
          </button>
          <button 
            onClick={insertMockTelemetry}
            className="btn-outline flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs cursor-pointer"
          >
            Insert Mock
          </button>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {telemetryTable.map((row) => (
          <div key={row.id} className="glass-card rounded-xl p-4 space-y-3 border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[11px] text-slate-400">
                ID: <span className="font-extrabold text-[var(--text-primary)]">{row.id}</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono`}
                style={{
                  background: row.status === "success" ? "rgba(34,197,94,0.1)" : row.status === "warning" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                  color: row.status === "success" ? "var(--success)" : row.status === "warning" ? "var(--warning)" : "var(--error)",
                  border: `1px solid ${row.status === "success" ? "rgba(34,197,94,0.2)" : row.status === "warning" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}`
                }}>
                {row.status.toUpperCase()}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono uppercase font-bold text-slate-400">Event</p>
              <p className="text-[12px] font-mono font-bold break-all text-[var(--accent-text)]">{row.event}</p>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[var(--border)] text-slate-400">
              <span>⏱️ {row.duration === 0 ? "timeout" : `${row.duration} ms`}</span>
              <span>📅 {row.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block glass-card rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-4 font-bold font-mono text-[10px] uppercase tracking-wider text-slate-400">Transaction ID</th>
                <th className="p-4 font-bold font-mono text-[10px] uppercase tracking-wider text-slate-400">Event Name</th>
                <th className="p-4 font-bold font-mono text-[10px] uppercase tracking-wider text-slate-400">Status</th>
                <th className="p-4 font-bold font-mono text-[10px] uppercase tracking-wider text-slate-400">Duration</th>
                <th className="p-4 font-bold font-mono text-[10px] uppercase tracking-wider text-slate-400">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {telemetryTable.map((row) => (
                <tr key={row.id} className="transition-colors border-b border-[var(--border)] hover:bg-[var(--accent-soft)]">
                  <td className="p-4 font-mono font-bold text-[var(--text-primary)]">{row.id}</td>
                  <td className="p-4 font-mono font-bold text-[var(--accent-text)]">{row.event}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono"
                      style={{
                        background: row.status === "success" ? "rgba(34,197,94,0.1)" : row.status === "warning" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                        color: row.status === "success" ? "var(--success)" : row.status === "warning" ? "var(--warning)" : "var(--error)",
                      }}>
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[var(--text-secondary)]">{row.duration === 0 ? "timeout" : `${row.duration} ms`}</td>
                  <td className="p-4 font-mono text-slate-400">{row.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
