import { useState } from "react";
import {
  X,
  Brain,
  Terminal,
  Shield,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { Incident, AlertStatus } from "../types";
import { api } from "../lib/api";

interface IncidentDetailProps {
  incident: Incident;
  onClose: () => void;
  onUpdate: () => void;
}

const riskColors: Record<string, string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
};

export function IncidentDetail({
  incident,
  onClose,
  onUpdate,
}: IncidentDetailProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await api.analyzeIncident(incident.id);
      onUpdate();
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (status: AlertStatus) => {
    setUpdating(true);
    try {
      await api.updateIncident(incident.id, { status });
      onUpdate();
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setUpdating(false);
    }
  };

  const analysis = incident.ai_analysis;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">{incident.alert_name}</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <span className="text-gray-400">Severity</span>
            <p className="font-medium capitalize mt-0.5">
              {incident.severity}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <span className="text-gray-400">Status</span>
            <p className="font-medium capitalize mt-0.5">{incident.status}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 col-span-2">
            <span className="text-gray-400">Instance</span>
            <p className="font-mono text-sm mt-0.5">
              {incident.instance || "N/A"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Description</p>
          <p className="text-sm">{incident.description}</p>
        </div>

        <div className="flex gap-2">
          {incident.status !== "resolved" && (
            <>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                {analyzing ? "Analyzing..." : "Run AI Analysis"}
              </button>
              <button
                onClick={() => handleStatusChange("resolved")}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Resolve
              </button>
            </>
          )}
          {incident.status === "resolved" && (
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Resolved
            </span>
          )}
        </div>

        {analysis && (
          <div className="space-y-4 border-t border-gray-800 pt-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">AI Analysis</h3>
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                {Math.round(analysis.confidence * 100)}% confidence
              </span>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">
                  Root Cause
                </span>
              </div>
              <p className="text-sm">{analysis.root_cause}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Explanation</p>
              <p className="text-sm leading-relaxed">{analysis.explanation}</p>
            </div>

            {analysis.estimated_impact && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <span className="text-sm font-medium text-yellow-400">
                  Impact Assessment
                </span>
                <p className="text-sm mt-1">{analysis.estimated_impact}</p>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Remediation Steps</span>
              </div>
              <div className="space-y-2">
                {analysis.remediation_steps.map((step) => (
                  <div
                    key={step.step_number}
                    className="bg-gray-800/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                        Step {step.step_number}
                      </span>
                      <span
                        className={`text-xs flex items-center gap-1 ${
                          riskColors[step.risk_level] || "text-gray-400"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {step.risk_level} risk
                      </span>
                    </div>
                    <p className="text-sm">{step.description}</p>
                    {step.command && (
                      <code className="block mt-2 text-xs bg-black/40 text-green-400 p-2 rounded font-mono overflow-x-auto">
                        $ {step.command}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {analysis.sources.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Sources</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.sources.map((source, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
