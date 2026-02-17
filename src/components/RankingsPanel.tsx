"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Station } from "@/lib/stations";
import { formatStationName } from "@/lib/stations";
import { TYPE_COLORS, DEFAULT_COLOR } from "@/components/Map";
import {
  fetchRankingsData,
  rankStations,
  type RankingCategory,
  type StationRanking,
} from "@/lib/rankings";

const CATEGORIES: { key: RankingCategory; label: string; emoji: string }[] = [
  { key: "cleanest", label: "Cleanest Water", emoji: "🌊" },
  { key: "most-polluted", label: "Most Polluted", emoji: "🚱" },
  { key: "best-for-fish", label: "Best for Fish", emoji: "🐟" },
  { key: "safest-swimming", label: "Safest Swimming", emoji: "🏖️" },
  { key: "most-improved", label: "Most Improved", emoji: "📈" },
  { key: "needs-data", label: "Needs More Data", emoji: "⚠️" },
];

const GRADE_LETTERS: Record<number, string> = { 5: "A", 4: "B", 3: "C", 2: "D", 1: "F" };
const GRADE_COLORS: Record<string, string> = {
  A: "#22c55e", B: "#86efac", C: "#facc15", D: "#f97316", F: "#ef4444",
};

function gradeLabel(score: number): string {
  const rounded = Math.round(score);
  return GRADE_LETTERS[Math.min(5, Math.max(1, rounded))] ?? "?";
}

/* ── Ranking list item ── */

function RankingItem({
  ranking, rank, category, onClick, delay,
}: {
  ranking: StationRanking; rank: number; category: RankingCategory;
  onClick: () => void; delay: number;
}) {
  const color = TYPE_COLORS[ranking.stationType] ?? DEFAULT_COLOR;
  const letter = gradeLabel(ranking.overallGrade);
  const letterColor = GRADE_COLORS[letter] ?? "#6B7280";

  function renderScore() {
    switch (category) {
      case "cleanest":
      case "most-polluted":
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: letterColor }}>
            {letter}
          </span>
        );
      case "best-for-fish": {
        const doLetter = ranking.metricGrades.do
          ? gradeLabel(({ A: 5, B: 4, C: 3, D: 2, F: 1 } as Record<string, number>)[ranking.metricGrades.do])
          : "–";
        return <span className="text-xs font-semibold text-ocean-700">🐟 DO: {doLetter}</span>;
      }
      case "safest-swimming": {
        const bacLetter = ranking.metricGrades.bacteria
          ? gradeLabel(({ A: 5, B: 4, C: 3, D: 2, F: 1 } as Record<string, number>)[ranking.metricGrades.bacteria])
          : "–";
        const bacColor = ranking.metricGrades.bacteria ? GRADE_COLORS[bacLetter] ?? "#6B7280" : "#6B7280";
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: bacColor }}>
            {bacLetter}
          </span>
        );
      }
      case "most-improved": {
        const pct = Math.round(ranking.trendPercent);
        const arrow = pct > 0 ? "↑" : pct < 0 ? "↓" : "→";
        const trendColor = pct > 0 ? "text-green-500" : pct < 0 ? "text-red-500" : "text-ocean-500";
        return <span className={`text-sm font-bold ${trendColor}`}>{arrow} {Math.abs(pct)}%</span>;
      }
      case "needs-data":
        return <span className="text-xs text-ocean-500">{ranking.totalReadings} readings</span>;
      default:
        return null;
    }
  }

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-white/50 p-3 text-left transition-all hover:bg-white/80 hover:shadow-sm"
    >
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-700">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ocean-900">{ranking.stationName}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full" style={{ background: color }} />
          <span className="truncate text-xs text-ocean-500">{ranking.stationType || "Station"}</span>
        </div>
      </div>
      <div className="flex-shrink-0">{renderScore()}</div>
    </motion.button>
  );
}

/* ── Main panel ── */

interface RankingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStation: (stationId: string) => void;
  allStations: Station[];
}

export default function RankingsPanel({ isOpen, onClose, onSelectStation, allStations }: RankingsPanelProps) {
  const [category, setCategory] = useState<RankingCategory>("cleanest");
  const [rankings, setRankings] = useState<StationRanking[] | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<StationRanking[] | null>(null);

  // Build a lookup map for resolving station names/types
  const stationMap = useRef<Map<string, Station>>(new Map());
  useEffect(() => {
    const m = new Map<string, Station>();
    for (const s of allStations) m.set(s.id, s);
    stationMap.current = m;
  }, [allStations]);

  function resolveStationInfo(data: StationRanking[]) {
    for (const r of data) {
      const match = stationMap.current.get(r.stationId);
      if (match) { r.stationName = formatStationName(match.name); r.stationType = match.type; }
    }
  }

  const loadRankings = useCallback(async () => {
    if (cacheRef.current) { setRankings(cacheRef.current); return; }
    const ids = allStations.map((s) => s.id);
    if (ids.length === 0) return;
    setIsLoading(true);
    setProgress({ completed: 0, total: ids.length });
    const data = await fetchRankingsData(
      ids,
      (c, t) => setProgress({ completed: c, total: t }),
      (partial) => {
        // Show progressive results as stations complete
        resolveStationInfo(partial);
        setRankings([...partial]);
      },
    );
    resolveStationInfo(data);
    cacheRef.current = data;
    setRankings(data);
    setIsLoading(false);
  }, [allStations]);

  useEffect(() => {
    if (isOpen && !rankings && !isLoading) loadRankings();
  }, [isOpen, rankings, isLoading, loadRankings]);

  const ranked = rankings ? rankStations(rankings, category) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — mobile only */}
          <motion.div
            className="absolute inset-0 bg-black/20 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="rankings-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="pointer-events-auto absolute left-0 top-[var(--nav-mobile-offset)] z-20 flex h-[calc(100%-var(--nav-mobile-offset))] max-h-[85vh] sm:max-h-full sm:top-0 sm:h-full w-full flex-col overflow-hidden rounded-r-2xl shadow-2xl sm:w-[380px]"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) onClose();
            }}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center py-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-ocean-300" />
            </div>
            <div className="glass-panel flex h-full flex-col">
              {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-ocean-800 via-ocean-700 to-teal-600 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <div>
                <h2 className="text-lg font-bold text-white">🏆 Station Rankings</h2>
                <p className="text-xs text-ocean-200">{rankings ? `${rankings.length} stations with data` : "Loading..."}</p>
              </div>
              <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white hover:scale-110" aria-label="Close rankings">✕</button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
              {CATEGORIES.map((c) => (
                <button key={c.key} onClick={() => setCategory(c.key)} className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${category === c.key ? "bg-ocean-600 text-white shadow-md" : "bg-ocean-100 text-ocean-700 hover:bg-ocean-200"}`}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {isLoading && (
                <div className="mb-3 px-1">
                  <p className="mb-2 text-center text-sm font-medium text-ocean-600">Loading station data... {progress.completed}/{progress.total}</p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ocean-100">
                    <motion.div className="h-full rounded-full bg-ocean-500" initial={{ width: 0 }} animate={{ width: progress.total > 0 ? `${(progress.completed / progress.total) * 100}%` : 0 }} transition={{ duration: 0.3 }} />
                  </div>
                </div>
              )}

              {ranked.length === 0 && !isLoading && rankings && (
                <div className="py-8 text-center">
                  <p className="text-sm text-ocean-500">{category === "safest-swimming" ? "No bacteria data available for these stations 🏖️" : "No data available for this category"}</p>
                </div>
              )}

              {ranked.length > 0 && (
                <div className="space-y-1.5">
                  {category === "needs-data" && (
                    <p className="mb-2 rounded-lg bg-ocean-50 px-3 py-2 text-xs text-ocean-600">These stations could use more monitoring! 🔬</p>
                  )}
                  {ranked.map((r, idx) => (
                    <RankingItem key={r.stationId} ranking={r} rank={idx + 1} category={category} onClick={() => onSelectStation(r.stationId)} delay={Math.min(idx * 0.02, 0.6)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

