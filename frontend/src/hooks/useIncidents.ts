import { useState, useEffect, useCallback } from "react";
import type { Incident, IncidentStats } from "../types";
import { api } from "../lib/api";

export function useIncidents(pollInterval = 5000) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats>({
    total: 0,
    firing: 0,
    investigating: 0,
    resolved: 0,
    critical: 0,
    warning: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [incidentData, statsData] = await Promise.all([
        api.getIncidents(),
        api.getStats(),
      ]);
      setIncidents(incidentData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval]);

  const refresh = useCallback(() => {
    setLoading(true);
    return fetchData();
  }, [fetchData]);

  return { incidents, stats, loading, error, refresh };
}
