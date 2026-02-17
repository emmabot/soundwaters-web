"use client";

import { motion } from "framer-motion";
import { getGrade, METRIC_INFO, type MetricKey } from "@/lib/thresholds";
import type { MetricData } from "@/lib/water-quality-data";
import GlossaryTooltip from "./GlossaryTooltip";

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
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
      {metrics.map((m, idx) => {
        const info = METRIC_INFO[m.key];
        const result = getGrade(m.key, m.latestValue);
        const isActive = m.key === activeMetric;

        return (
          <motion.button
            key={m.key}
            onClick={() => onSelect(m.key)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            whileHover={{ y: -2 }}
            className={`glass flex-shrink-0 snap-start rounded-xl border-2 p-3 text-left transition-shadow hover:shadow-lg ${
              isActive
                ? "border-ocean-400 shadow-md"
                : "border-white/30 hover:border-ocean-200"
            }`}
            style={{
              minWidth: 140,
              boxShadow: isActive
                ? `0 0 16px ${result.color}40, 0 4px 12px rgba(0,0,0,0.08)`
                : undefined,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{info.emoji}</span>
              <span className="text-xs font-semibold text-ocean-800">
                {info.name}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <motion.span
                key={`${m.key}-${result.grade}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-2xl font-bold"
                style={{ color: result.color }}
              >
                {result.grade}
              </motion.span>
              <span className="text-xs text-ocean-600">
                {m.latestValue}
                {info.unit ? <>{" "}<GlossaryTooltip term={info.unit}>{info.unit}</GlossaryTooltip></> : ""}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm">{result.emoji}</span>
              <span className="text-xs text-ocean-600">{result.label}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

