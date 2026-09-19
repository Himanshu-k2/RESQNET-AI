import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldCheck, Clock, FileText, AlertCircle, RefreshCw, User } from 'lucide-react';

export default function AuditLogViewer({ targetId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = targetId ? `/audit?targetId=${targetId}&limit=25` : `/audit?limit=50`;
      const res = await api.get(url);
      if (res.data?.logs) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Audit log fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [targetId]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary-700" />
          <h3 className="text-sm font-bold text-navy-900">Coordinator Audit Log</h3>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1 font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-slate-400">Loading audit history...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">No audit log records found.</div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log._id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary-800 text-[11px] px-2 py-0.5 rounded bg-primary-50 border border-primary-200">
                  {log.action}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(log.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="text-[11px] text-slate-700 font-medium">
                Performed by: <span className="font-bold text-navy-900">{log.userName}</span> ({log.userRole})
              </div>

              {log.reason && (
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60 mt-1">
                  Reason/Detail: {log.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
