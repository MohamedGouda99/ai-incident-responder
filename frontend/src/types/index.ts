export type AlertStatus =
  | "firing"
  | "acknowledged"
  | "investigating"
  | "remediating"
  | "resolved";

export type AlertSeverity = "critical" | "warning" | "info";

export interface RemediationStep {
  step_number: number;
  description: string;
  command: string | null;
  is_automated: boolean;
  risk_level: string;
}

export interface AIAnalysis {
  root_cause: string;
  explanation: string;
  remediation_steps: RemediationStep[];
  confidence: number;
  sources: string[];
  estimated_impact: string;
}

export interface Incident {
  id: string;
  alert_name: string;
  severity: AlertSeverity;
  status: AlertStatus;
  description: string;
  instance: string;
  labels: Record<string, string>;
  ai_analysis: AIAnalysis | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface IncidentStats {
  total: number;
  firing: number;
  investigating: number;
  resolved: number;
  critical: number;
  warning: number;
}

export interface RunbookMetadata {
  id: string;
  title: string;
  category: string;
  tags: string[];
  chunk_count: number;
  created_at: string;
}
