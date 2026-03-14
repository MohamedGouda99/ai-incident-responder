import { useState } from "react";
import { Activity, BookOpen, Send } from "lucide-react";
import { StatsCards } from "./components/StatsCards";
import { IncidentList } from "./components/IncidentList";
import { IncidentDetail } from "./components/IncidentDetail";
import { RunbookManager } from "./components/RunbookManager";
import { useIncidents } from "./hooks/useIncidents";
import type { Incident } from "./types";
import { api } from "./lib/api";

type Tab = "incidents" | "runbooks";

export default function App() {
  const { incidents, stats, loading, error, refresh } = useIncidents();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [tab, setTab] = useState<Tab>("incidents");
  const [sending, setSending] = useState(false);

  const handleSendTestAlert = async () => {
    setSending(true);
    try {
      await api.sendTestAlert();
      refresh();
    } catch (err) {
      console.error("Failed to send test alert:", err);
    } finally {
      setSending(false);
    }
  };

  const currentIncident = selectedIncident
    ? incidents.find((i) => i.id === selectedIncident.id) || selectedIncident
    : null;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">AI Incident Responder</h1>
              <p className="text-xs text-gray-500">
                LangGraph + RAG powered incident analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendTestAlert}
              disabled={sending}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : "Test Alert"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <StatsCards stats={stats} />

        <div className="flex gap-1 bg-gray-900 p-1 rounded-lg w-fit">
          <button
            onClick={() => setTab("incidents")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "incidents"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4" />
            Incidents
          </button>
          <button
            onClick={() => setTab("runbooks")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "runbooks"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Runbooks
          </button>
        </div>

        {tab === "incidents" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncidentList
              incidents={incidents}
              onSelect={setSelectedIncident}
              selectedId={currentIncident?.id ?? null}
            />
            {currentIncident ? (
              <IncidentDetail
                incident={currentIncident}
                onClose={() => setSelectedIncident(null)}
                onUpdate={refresh}
              />
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex items-center justify-center text-gray-500">
                <p>Select an incident to view details and AI analysis</p>
              </div>
            )}
          </div>
        ) : (
          <RunbookManager />
        )}
      </main>
    </div>
  );
}
