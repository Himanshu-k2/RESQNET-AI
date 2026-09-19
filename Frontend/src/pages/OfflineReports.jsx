import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getAllReports, 
  deleteReport, 
  saveReport 
} from '../services/offlineStorage';
import { syncPendingReports } from '../services/syncService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import SyncStatus from '../components/SyncStatus';
import { 
  CloudOff, 
  RefreshCw, 
  Trash2, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Database,
  Send,
  ShieldAlert,
  MapPin,
  Flame,
  Droplets,
  HeartPulse,
  PackageCheck
} from 'lucide-react';

export default function OfflineReports() {
  const isOnline = useOnlineStatus();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllReports();
      // Sort newest first
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(data);
    } catch (err) {
      console.error('Failed to load offline reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      setSyncMsg({ type: 'error', text: 'Cannot sync while offline. Please connect to the internet first.' });
      return;
    }
    setSyncing(true);
    setSyncMsg({ type: 'info', text: 'Syncing pending reports with server...' });
    
    const token = localStorage.getItem('token');
    try {
      await syncPendingReports(token, (event) => {
        // progress callback
        if (event.type === 'uploaded') {
          console.log('Synced record:', event.record.id);
        }
      });
      await loadData();
      setSyncMsg({ type: 'success', text: 'Synchronization process completed!' });
    } catch (err) {
      console.error('Manual sync error:', err);
      setSyncMsg({ type: 'error', text: 'Some reports failed to upload. Check status below.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this local draft?')) {
      await deleteReport(id);
      await loadData();
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toUpperCase()) {
      case 'FIRE': return <Flame className="w-4 h-4 text-rose-500" />;
      case 'FLOOD': return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'MEDICAL': return <HeartPulse className="w-4 h-4 text-red-500" />;
      default: return <ShieldAlert className="w-4 h-4 text-amber-500" />;
    }
  };

  const pendingCount = reports.filter(r => r.syncStatus === 'SAVED_OFFLINE' || r.syncStatus === 'UPLOAD_FAILED').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header breadcrumb & controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link to="/need-help" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Emergency Form
          </Link>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">Offline Emergency Reports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browser IndexedDB store ensuring zero data loss during network disruptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualSync}
            disabled={syncing || pendingCount === 0 || !isOnline}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition shadow-soft ${
              !isOnline || pendingCount === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : `Sync All Pending (${pendingCount})`}
          </button>
        </div>
      </div>

      {/* Sync feedback notification */}
      {syncMsg && (
        <div className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${
          syncMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          syncMsg.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {syncMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4" />}
            <span>{syncMsg.text}</span>
          </div>
          <button onClick={() => setSyncMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Storage Architecture Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-200 text-slate-700 shadow-xs">
            <CloudOff className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Local Storage</div>
            <div className="text-sm font-bold text-navy-900">{reports.length} Total Records</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-200 text-slate-700 shadow-xs">
            <RefreshCw className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Pending Sync</div>
            <div className="text-sm font-bold text-amber-600">{pendingCount} Waiting Connection</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-200 text-slate-700 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Uploaded to Network</div>
            <div className="text-sm font-bold text-emerald-600">
              {reports.filter(r => r.syncStatus === 'UPLOADED').length} Reports Confirmed
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading local storage reports...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <CloudOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Offline Reports Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When you submit an emergency report while disconnected or during poor network conditions, it will safely appear here.
          </p>
          <div className="mt-4">
            <Link
              to="/need-help"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
            >
              <Send className="w-3.5 h-3.5" /> Create Emergency Report
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((item) => {
            const data = item.reportData || {};
            return (
              <div 
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SyncStatus status={item.syncStatus} />
                    
                    {item.duplicate && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        Idempotent / Deduplicated
                      </span>
                    )}

                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1.5 border border-slate-200">
                      {getCategoryIcon(data.category)}
                      {data.category || 'GENERAL'}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      data.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      data.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {data.severity || 'MEDIUM'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-navy-900 leading-snug">
                    {data.title || 'Untitled Emergency Report'}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {data.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                    {data.location?.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {data.location.address}
                      </span>
                    )}

                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Created: {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {item.lastError && (
                      <span className="text-rose-600 font-medium">
                        Error: {item.lastError}
                      </span>
                    )}

                    <span className="font-mono text-[10px] text-slate-400">
                      Client ID: {item.clientId?.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {item.syncStatus === 'UPLOAD_FAILED' && (
                    <button
                      onClick={handleManualSync}
                      disabled={!isOnline || syncing}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Delete local draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
