import type { Incident, IncidentStats, RunbookMetadata } from "../types";

const API_BASE = "/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  getIncidents: (params?: {
    status?: string;
    severity?: string;
  }): Promise<Incident[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.severity) query.set("severity", params.severity);
    const qs = query.toString();
    return request(`/incidents${qs ? `?${qs}` : ""}`);
  },

  getIncident: (id: string): Promise<Incident> =>
    request(`/incidents/${id}`),

  getStats: (): Promise<IncidentStats> =>
    request("/incidents/stats"),

  updateIncident: (
    id: string,
    update: { status?: string }
  ): Promise<Incident> =>
    request(`/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    }),

  analyzeIncident: (id: string): Promise<Incident> =>
    request(`/incidents/${id}/analyze`, { method: "POST" }),

  getRunbooks: (): Promise<RunbookMetadata[]> =>
    request("/runbooks"),

  uploadRunbook: (data: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }): Promise<RunbookMetadata> =>
    request("/runbooks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteRunbook: (id: string): Promise<void> =>
    request(`/runbooks/${id}`, { method: "DELETE" }),

  sendTestAlert: (): Promise<Incident[]> =>
    request("/webhook/alertmanager", {
      method: "POST",
      body: JSON.stringify({
        version: "4",
        status: "firing",
        alerts: [
          {
            status: "firing",
            labels: {
              alertname: "HighCPUUsage",
              instance: "web-server-01:9090",
              job: "node-exporter",
              severity: "critical",
            },
            annotations: {
              summary: "CPU usage above 90% for 5 minutes",
              description:
                "Instance web-server-01 has CPU usage of 95.2% which is above the 90% threshold for more than 5 minutes.",
            },
            startsAt: new Date().toISOString(),
            endsAt: "0001-01-01T00:00:00Z",
            generatorURL: "http://prometheus:9090/graph",
          },
        ],
      }),
    }),
};
