import React from "react";
import { WifiOff, Wifi, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

/**
 * OfflineBanner
 * Global banner shown at top of app indicating connectivity and sync status.
 * Props:
 *   isOnline      {boolean}
 *   syncState     {"idle"|"syncing"|"success"|"error"}
 *   pendingCount  {number}
 */
export default function OfflineBanner({ isOnline, syncState = "idle", pendingCount = 0 }) {
  if (isOnline && syncState === "idle" && pendingCount === 0) return null;

  let bg = "bg-amber-500";
  let icon = <WifiOff className="w-4 h-4 shrink-0" />;
  let message = "You are offline. Reports will be saved locally and synced when connection is restored.";

  if (isOnline && syncState === "syncing") {
    bg = "bg-blue-600";
    icon = <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />;
    message = `Syncing ${pendingCount} saved report${pendingCount !== 1 ? "s" : ""}…`;
  } else if (isOnline && syncState === "success") {
    bg = "bg-emerald-600";
    icon = <CheckCircle className="w-4 h-4 shrink-0" />;
    message = "All offline reports have been uploaded successfully.";
  } else if (isOnline && syncState === "error") {
    bg = "bg-red-600";
    icon = <AlertCircle className="w-4 h-4 shrink-0" />;
    message = `Some reports could not be uploaded. ${pendingCount} pending. Retrying automatically.`;
  } else if (isOnline && pendingCount > 0 && syncState === "idle") {
    bg = "bg-blue-500";
    icon = <Wifi className="w-4 h-4 shrink-0" />;
    message = `${pendingCount} offline report${pendingCount !== 1 ? "s" : ""} ready to sync.`;
  }

  return (
    <div className={`${bg} text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 z-50`}>
      {icon}
      <span>{message}</span>
    </div>
  );
}
