import { Clock, ChevronRight } from "lucide-react";
import type { Incident } from "../types";

interface IncidentListProps {
  incidents: Incident[];
  onSelect: (incident: Incident) => void;
  selectedId: string | null;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const statusColors: Record<string, string> = {
  firing: "bg-red-500",
  acknowledged: "bg-orange-500",
  investigating: "bg-yellow-500",
  remediating: "bg-blue-500",
  resolved: "bg-green-500",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function IncidentList({
  incidents,
  onSelect,
  selectedId,
}: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400">No incidents yet.</p>
        <p className="text-sm text-gray-500 mt-1">
          Send a test alert or connect Alertmanager to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="divide-y divide-gray-800">
        {incidents.map((incident) => (
          <button
            key={incident.id}
            onClick={() => onSelect(incident)}
            className={`w-full text-left p-4 hover:bg-gray-800/50 transition-colors flex items-center gap-4 ${
              selectedId === incident.id ? "bg-gray-800/70" : ""
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                statusColors[incident.status] || "bg-gray-500"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {incident.alert_name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    severityColors[incident.severity] || ""
                  }`}
                >
                  {incident.severity}
                </span>
              </div>
              <p className="text-sm text-gray-400 truncate mt-0.5">
                {incident.description}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(incident.created_at)}
                </span>
                {incident.instance && <span>{incident.instance}</span>}
                <span className="capitalize">{incident.status}</span>
              </div>
            </div>
            {incident.ai_analysis && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full flex-shrink-0">
                AI analyzed
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
