"use client";

import { motion } from "framer-motion";
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
    <div className="glass flex flex-wrap gap-1.5 rounded-xl p-1.5">
      {availableMetrics.map((key) => {
        const info = METRIC_INFO[key];
        const isActive = key === activeMetric;

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
            </span>
          </button>
        );
      })}
    </div>
  );
}

