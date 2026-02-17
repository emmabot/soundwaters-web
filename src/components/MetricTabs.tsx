"use client";

import { METRIC_INFO, type MetricKey } from "@/lib/thresholds";

export default function MetricTabs({
  availableMetrics,
  activeMetric,
  onSelect,
}: {
  availableMetrics: MetricKey[];
  activeMetric: MetricKey;
  onSelect: (key: MetricKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {availableMetrics.map((key) => {
        const info = METRIC_INFO[key];
        const isActive = key === activeMetric;

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? "bg-ocean-600 text-white shadow-md"
                : "bg-ocean-100 text-ocean-700 hover:bg-ocean-200"
            }`}
          >
            <span className="mr-1">{info.emoji}</span>
            {info.name}
          </button>
        );
      })}
    </div>
  );
}

