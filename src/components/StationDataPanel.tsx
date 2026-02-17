"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Station } from "@/lib/stations";
import type { WaterQualityResult } from "@/lib/wqx-api";
import { fetchWaterQualityResults } from "@/lib/wqx-api";
import { processWaterQualityData, type MetricData } from "@/lib/water-quality-data";
import type { MetricKey } from "@/lib/thresholds";
import WaterQualityGradeCards from "./WaterQualityGradeCard";
import MetricTabs from "./MetricTabs";
import TrendChart from "./TrendChart";
import MetricExplanation from "./MetricExplanation";
import DataSummaryBar from "./DataSummaryBar";
import TrendInsights from "./TrendInsights";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ok"; metrics: MetricData[] };

const LOADING_TIPS = [
  "🔬 Analyzing water samples...",
  "🌊 Diving into the data...",
  "🧪 Running lab tests...",
  "📡 Connecting to monitoring stations...",
  "🐟 Asking the fish how they feel...",
];

function LoadingSkeleton() {
  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTipIdx((i) => (i + 1) % LOADING_TIPS.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4 p-6">
      <p className="text-center text-sm font-medium text-ocean-300">
        {LOADING_TIPS[tipIdx]}
      </p>
      {[1, 2, 3].map((i) => (
        <div key={i} className="shimmer h-20 rounded-xl" />
      ))}
      <div className="shimmer h-48 rounded-xl" />
    </div>
  );
}

export default function StationDataPanel({
  station,
  onClose,
}: {
  station: Station;
  onClose: () => void;
}) {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [activeMetric, setActiveMetric] = useState<MetricKey | null>(null);
  const cacheRef = useRef<Map<string, WaterQualityResult[]>>(new Map());

  const loadData = useCallback(async (stationId: string) => {
    setState({ status: "loading" });

    // Check cache
    const cached = cacheRef.current.get(stationId);
    if (cached) {
      const metrics = processWaterQualityData(cached);
      if (metrics.length === 0) {
        setState({ status: "empty" });
      } else {
        setState({ status: "ok", metrics });
        setActiveMetric(metrics[0].key);
      }
      return;
    }

    const res = await fetchWaterQualityResults(stationId);
    if (!res.ok) {
      if (res.error.type === "no-data") {
        setState({ status: "empty" });
      } else {
        setState({ status: "error", message: res.error.message });
      }
      return;
    }

    // Cache the results
    cacheRef.current.set(stationId, res.data);
    const metrics = processWaterQualityData(res.data);
    if (metrics.length === 0) {
      setState({ status: "empty" });
    } else {
      setState({ status: "ok", metrics });
      setActiveMetric(metrics[0].key);
    }
  }, []);

  useEffect(() => {
    loadData(station.id);
  }, [station.id, loadData]);

  const activeData =
    state.status === "ok"
      ? state.metrics.find((m) => m.key === activeMetric) ?? null
      : null;

  return (
    <div className="glass-panel flex h-full flex-col overflow-hidden rounded-l-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-ocean-800 via-ocean-700 to-teal-600 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-white">{station.name}</h3>
          <p className="truncate text-xs text-ocean-200">{station.type} · {station.orgName}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white hover:scale-110"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {state.status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LoadingSkeleton />
            </motion.div>
          )}

          {state.status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center"
            >
              <p className="text-lg">😕</p>
              <p className="mt-2 text-sm text-ocean-700">
                Something went wrong loading data for this station.
              </p>
              <p className="mt-1 text-xs text-ocean-500">{state.message}</p>
              <button
                onClick={() => loadData(station.id)}
                className="mt-4 rounded-lg bg-ocean-600 px-4 py-2 text-sm font-medium text-white hover:bg-ocean-700 transition-colors"
              >
                🔄 Try Again
              </button>
            </motion.div>
          )}

          {state.status === "empty" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center"
            >
              <p className="text-lg">🔍</p>
              <p className="mt-2 text-sm text-ocean-700">
                No measurements found for this station yet.
              </p>
              <p className="mt-1 text-xs text-ocean-500">
                Try clicking a USGS station — they usually have the most data! 📊
              </p>
            </motion.div>
          )}

          {state.status === "ok" && activeMetric && activeData && (
            <motion.div
              key={`ok-${station.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 p-4"
            >
              <DataSummaryBar metrics={state.metrics} />
              <TrendInsights metrics={state.metrics} />
              <WaterQualityGradeCards
                metrics={state.metrics}
                activeMetric={activeMetric}
                onSelect={setActiveMetric}
              />
              <MetricTabs
                availableMetrics={state.metrics.map((m) => m.key)}
                activeMetric={activeMetric}
                onSelect={setActiveMetric}
              />
              <TrendChart metricKey={activeData.key} points={activeData.points} />
              <MetricExplanation metricKey={activeMetric} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

