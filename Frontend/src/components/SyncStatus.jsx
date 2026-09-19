import React from 'react';
import { Clock, RefreshCw, CheckCircle2, AlertTriangle, CloudOff } from 'lucide-react';

/**
 * SyncStatus
 * Visual badge for offline storage and synchronization states.
 * States:
 *   - SAVED_OFFLINE: Locally stored, awaiting upload
 *   - UPLOADING: In-flight HTTP request
 *   - UPLOADED: Successfully synced to MongoDB backend
 *   - UPLOAD_FAILED: Error during sync, retryable
 */
export default function SyncStatus({ status, className = "" }) {
  switch (status) {
    case 'SAVED_OFFLINE':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          <CloudOff className="w-3.5 h-3.5 text-slate-500" />
          Saved Locally (Offline)
        </span>
      );
    case 'UPLOADING':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse ${className}`}>
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          Uploading to Network…
        </span>
      );
    case 'UPLOADED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Uploaded & Synced
        </span>
      );
    case 'UPLOAD_FAILED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          Sync Failed (Retryable)
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ${className}`}>
          <Clock className="w-3.5 h-3.5" />
          {status}
        </span>
      );
  }
}
