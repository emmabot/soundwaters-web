"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { METRIC_INFO, type MetricKey } from "@/lib/thresholds";
import { computeTrend } from "@/lib/trend-analysis";
import type { MetricData } from "@/lib/water-quality-data";

function TrendArrow({ direction }: { direction: "improving" | "declining" | "stable" }) {
  if (direction === "improving") return <span className="ml-1 text-green-500">↑</span>;
  if (direction === "declining") return <span className="ml-1 text-red-500">↓</span>;
  return <span className="ml-1 text-gray-400">→</span>;
}

export default function MetricTabs({
  availableMetrics,
  activeMetric,
  onSelect,
  metricsData,
}: {
  availableMetrics: MetricKey[];
  activeMetric: MetricKey;
  onSelect: (key: MetricKey) => void;
  metricsData?: MetricData[];
}) {
  // Compute trend directions for each metric
  const trendMap = useMemo(() => {
    if (!metricsData) return new Map<MetricKey, "improving" | "declining" | "stable">();
    const map = new Map<MetricKey, "improving" | "declining" | "stable">();
    for (const m of metricsData) {
      const trend = computeTrend(m.points);
      if (trend) map.set(m.key, trend.direction);
    }
    return map;
  }, [metricsData]);

  return (
    <div className="glass flex flex-wrap gap-1.5 rounded-xl p-1.5">
      {availableMetrics.map((key) => {
        const info = METRIC_INFO[key];
        const isActive = key === activeMetric;
        const trendDir = trendMap.get(key);

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="relative rounded-full px-4 py-2 text-sm font-medium transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-full bg-ocean-600 shadow-md"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? "text-white" : "text-ocean-700 hover:text-ocean-900"}`}>
              <span className="mr-1">{info.emoji}</span>
              {info.name}
              {trendDir && <TrendArrow direction={trendDir} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

