"use client";

import { getGrade, METRIC_INFO, type MetricKey } from "@/lib/thresholds";
import type { MetricData } from "@/lib/water-quality-data";

export default function WaterQualityGradeCards({
  metrics,
  activeMetric,
  onSelect,
}: {
  metrics: MetricData[];
  activeMetric: MetricKey;
  onSelect: (key: MetricKey) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {metrics.map((m) => {
        const info = METRIC_INFO[m.key];
        const result = getGrade(m.key, m.latestValue);
        const isActive = m.key === activeMetric;

        return (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className={`flex-shrink-0 rounded-xl border-2 p-3 text-left transition-all ${
              isActive
                ? "border-ocean-500 shadow-md"
                : "border-transparent hover:border-ocean-200"
            }`}
            style={{ background: `${result.color}18`, minWidth: 140 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{info.emoji}</span>
              <span className="text-xs font-semibold text-ocean-800">
                {info.name}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-2xl font-bold"
                style={{ color: result.color }}
              >
                {result.grade}
              </span>
              <span className="text-xs text-ocean-600">
                {m.latestValue}
                {info.unit ? ` ${info.unit}` : ""}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm">{result.emoji}</span>
              <span className="text-xs text-ocean-600">{result.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

