import { AlertTriangle, CheckCircle, Search, Flame } from "lucide-react";
import type { IncidentStats } from "../types";

interface StatsCardsProps {
  stats: IncidentStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Incidents",
      value: stats.total,
      icon: AlertTriangle,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Firing",
      value: stats.firing,
      icon: Flame,
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
    {
      label: "Investigating",
      value: stats.investigating,
      icon: Search,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`${card.bg} p-3 rounded-lg`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
