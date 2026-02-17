"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Station } from "@/lib/stations";
import type { WaterQualityResult } from "@/lib/wqx-api";
import { fetchWaterQualityResults } from "@/lib/wqx-api";
import { processWaterQualityData, type MetricData } from "@/lib/water-quality-data";
import type { MetricKey } from "@/lib/thresholds";
import WaterQualityGradeCards from "./WaterQualityGradeCard";
import MetricTabs from "./MetricTabs";
import TrendChart from "./TrendChart";
import MetricExplanation from "./MetricExplanation";

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
      <p className="text-center text-sm font-medium text-ocean-600 animate-pulse">
        {LOADING_TIPS[tipIdx]}
      </p>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-ocean-100" />
      ))}
      <div className="h-48 animate-pulse rounded-xl bg-ocean-100" />
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
    <div className="rounded-xl bg-white shadow-lg border border-ocean-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-ocean-600 to-teal-600 px-4 py-3">
        <div>
          <h3 className="text-base font-bold text-white">{station.name}</h3>
          <p className="text-xs text-ocean-200">{station.type} · {station.orgName}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      {state.status === "loading" && <LoadingSkeleton />}

      {state.status === "error" && (
        <div className="p-6 text-center">
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
        </div>
      )}

      {state.status === "empty" && (
        <div className="p-6 text-center">
          <p className="text-lg">🔍</p>
          <p className="mt-2 text-sm text-ocean-700">
            No measurements found for this station yet.
          </p>
          <p className="mt-1 text-xs text-ocean-500">
            Try clicking a USGS station — they usually have the most data! 📊
          </p>
        </div>
      )}

      {state.status === "ok" && activeMetric && activeData && (
        <div className="space-y-4 p-4">
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
        </div>
      )}
    </div>
  );
}

