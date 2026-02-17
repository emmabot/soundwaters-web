"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import type { Station } from "@/lib/stations";
import type { WaterQualityResult } from "@/lib/wqx-api";
import { fetchWaterQualityResults } from "@/lib/wqx-api";
import { processWaterQualityData, type MetricData } from "@/lib/water-quality-data";
import { getGrade, METRIC_INFO, type MetricKey } from "@/lib/thresholds";

type StationData =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ok"; metrics: MetricData[] };

const ALL_METRICS: MetricKey[] = ["do", "ph", "temperature", "nitrogen", "bacteria"];

const GRADE_ORDER = { A: 5, B: 4, C: 3, D: 2, F: 1 };

function gradeValue(grade: string): number {
  return GRADE_ORDER[grade as keyof typeof GRADE_ORDER] ?? 0;
}

type RowData = {
  key: MetricKey;
  gradeA: ReturnType<typeof getGrade> | null;
  gradeB: ReturnType<typeof getGrade> | null;
  winner: "a" | "b" | "tie" | "none";
  mA: MetricData | null;
  mB: MetricData | null;
};

function GradeCell({
  grade,
  isWinner,
}: {
  grade: ReturnType<typeof getGrade> | null;
  isWinner: boolean;
}) {
  if (!grade) {
    return (
      <div className="flex h-14 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
        No data
      </div>
    );
  }
  return (
    <div
      className={`flex h-14 items-center justify-center rounded-lg text-center transition-all ${
        isWinner ? "ring-2 ring-green-400 shadow-sm" : ""
      }`}
      style={{ backgroundColor: grade.color + "22" }}
    >
      <div>
        <span className="text-lg font-bold" style={{ color: grade.color }}>
          {grade.grade}
        </span>
        <p className="text-[10px] text-gray-600">{grade.label}</p>
      </div>
    </div>
  );
}

function MetricRow({ row }: { row: RowData }) {
  const info = METRIC_INFO[row.key];
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-ocean-700">
        {info.emoji} {info.name}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <GradeCell grade={row.gradeA} isWinner={row.winner === "a"} />
        <GradeCell grade={row.gradeB} isWinner={row.winner === "b"} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 py-8">
      <p className="text-center text-sm font-medium text-ocean-600">
        🔬 Loading data for both stations...
      </p>
      {[1, 2, 3].map((i) => (
        <div key={i} className="grid grid-cols-2 gap-3">
          <div className="shimmer h-14 rounded-lg" />
          <div className="shimmer h-14 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function ComparisonPanel({
  stationA,
  stationB,
  onClose,
}: {
  stationA: Station;
  stationB: Station;
  onClose: () => void;
}) {
  const [dataA, setDataA] = useState<StationData>({ status: "loading" });
  const [dataB, setDataB] = useState<StationData>({ status: "loading" });
  const cacheRef = useRef<Map<string, WaterQualityResult[]>>(new Map());

  const loadStation = useCallback(
    async (
      station: Station,
      setData: React.Dispatch<React.SetStateAction<StationData>>,
    ) => {
      setData({ status: "loading" });

      const cached = cacheRef.current.get(station.id);
      if (cached) {
        const metrics = processWaterQualityData(cached);
        setData(metrics.length === 0 ? { status: "empty" } : { status: "ok", metrics });
        return;
      }

      const res = await fetchWaterQualityResults(station.id);
      if (!res.ok) {
        if (res.error.type === "no-data") {
          setData({ status: "empty" });
        } else {
          setData({ status: "error", message: res.error.message });
        }
        return;
      }

      cacheRef.current.set(station.id, res.data);
      const metrics = processWaterQualityData(res.data);
      setData(metrics.length === 0 ? { status: "empty" } : { status: "ok", metrics });
    },
    [],
  );

  useEffect(() => {
    loadStation(stationA, setDataA);
    loadStation(stationB, setDataB);
  }, [stationA, stationB, loadStation]);

  const isLoading = dataA.status === "loading" || dataB.status === "loading";

  // Build comparison rows
  const metricsA = dataA.status === "ok" ? dataA.metrics : [];
  const metricsB = dataB.status === "ok" ? dataB.metrics : [];

  function findMetric(metrics: MetricData[], key: MetricKey) {
    return metrics.find((m) => m.key === key) ?? null;
  }

  let winsA = 0;
  let winsB = 0;

  const rows = ALL_METRICS.map((key) => {
    const mA = findMetric(metricsA, key);
    const mB = findMetric(metricsB, key);
    const gradeA = mA ? getGrade(key, mA.latestValue) : null;
    const gradeB = mB ? getGrade(key, mB.latestValue) : null;

    let winner: "a" | "b" | "tie" | "none" = "none";
    if (gradeA && gradeB) {
      const vA = gradeValue(gradeA.grade);
      const vB = gradeValue(gradeB.grade);
      if (vA > vB) { winner = "a"; winsA++; }
      else if (vB > vA) { winner = "b"; winsB++; }
      else { winner = "tie"; }
    }

    return { key, gradeA, gradeB, winner, mA, mB };
  });

  const overallWinner =
    winsA > winsB
      ? stationA.name
      : winsB > winsA
        ? stationB.name
        : null;

  return (
    <div className="glass-panel flex h-full flex-col overflow-hidden rounded-l-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-ocean-800 via-ocean-700 to-teal-600 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-white">📊 Station Comparison</h3>
          <p className="mt-0.5 truncate text-xs text-ocean-200">
            {stationA.name} vs {stationB.name}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white hover:scale-110"
          aria-label="Exit comparison"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {/* Station name headers */}
            <div className="grid grid-cols-2 gap-3 text-center text-xs font-semibold">
              <div className="rounded-lg bg-ocean-100 px-2 py-1.5 text-ocean-800 truncate">
                {stationA.name}
              </div>
              <div className="rounded-lg bg-teal-100 px-2 py-1.5 text-teal-800 truncate">
                {stationB.name}
              </div>
            </div>

            {/* Metric rows */}
            {rows.map((row) => (
              <MetricRow key={row.key} row={row} />
            ))}

            {/* Summary */}
            <div className="mt-4 rounded-xl bg-ocean-50 px-4 py-3 text-center">
              {overallWinner ? (
                <p className="text-sm font-medium text-ocean-800">
                  🏆 Overall, <span className="font-bold">{overallWinner}</span> has
                  better water quality ({winsA > winsB ? winsA : winsB} of{" "}
                  {winsA + winsB + rows.filter((r) => r.winner === "tie").length} metrics)
                </p>
              ) : (
                <p className="text-sm font-medium text-ocean-800">
                  🤝 It&apos;s a tie! Both stations have similar water quality.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

