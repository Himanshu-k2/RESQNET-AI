/**
 * syncService.js
 * Handles automatic synchronisation of pending offline reports to the server.
 */

import axios from "axios";
import { getPendingReports, updateReport } from "./offlineStorage";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

let isSyncing = false;

export async function syncPendingReports(token, onProgress) {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const pending = await getPendingReports();
    if (pending.length === 0) { isSyncing = false; return; }

    for (const record of pending) {
      // Mark as UPLOADING
      await updateReport(record.id, {
        syncStatus: "UPLOADING",
        lastSyncAttempt: new Date().toISOString(),
      });
      if (onProgress) onProgress({ type: "uploading", record });

      try {
        const response = await axios.post(
          `${API_BASE}/api/incidents`,
          record.reportData,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000,
          }
        );

        const { duplicate, incidentId } = response.data;
        await updateReport(record.id, {
          syncStatus: "UPLOADED",
          serverId: incidentId,
          duplicate: duplicate || false,
          lastError: null,
        });
        if (onProgress) onProgress({ type: "uploaded", record, incidentId, duplicate });

      } catch (err) {
        const errMsg = err?.response?.data?.message || err.message || "Upload failed";
        await updateReport(record.id, {
          syncStatus: "UPLOAD_FAILED",
          lastError: errMsg,
          retryCount: (record.retryCount || 0) + 1,
        });
        if (onProgress) onProgress({ type: "failed", record, error: errMsg });
      }
    }
  } finally {
    isSyncing = false;
  }
}
