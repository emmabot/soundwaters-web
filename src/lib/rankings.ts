import { fetchWaterQualityResults } from "@/lib/wqx-api";
import { processWaterQualityData, type MetricData } from "@/lib/water-quality-data";
import { getGrade, type MetricKey, type Grade } from "@/lib/thresholds";
import { computeTrend } from "@/lib/trend-analysis";

/* ── Types ── */

export type RankingCategory =
  | "cleanest"
  | "most-polluted"
  | "best-for-fish"
  | "safest-swimming"
  | "most-improved"
  | "needs-data";

export interface StationRanking {
  stationId: string;
  stationName: string;
  stationType: string;
  overallGrade: number;
  metricGrades: Partial<Record<MetricKey, Grade>>;
  metricsAvailable: number;
  totalReadings: number;
  lastSampleDate: Date | null;
  trendPercent: number;
  consistencyLevel: "excellent" | "good" | "limited";
  consistencyDetail: string;
}

/* ── Grade mapping ── */

const GRADE_TO_NUM: Record<Grade, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };

/* ── Scoring functions ── */

export function computeOverallGrade(metricGrades: Partial<Record<MetricKey, Grade>>): number {
  const vals = Object.values(metricGrades).map((g) => GRADE_TO_NUM[g]);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function computeFishScore(metricGrades: Partial<Record<MetricKey, Grade>>): number | null {
  const doGrade = metricGrades.do ? GRADE_TO_NUM[metricGrades.do] : null;
  const tempGrade = metricGrades.temperature ? GRADE_TO_NUM[metricGrades.temperature] : null;
  if (doGrade != null && tempGrade != null) return doGrade * 2 + tempGrade;
  if (doGrade != null) return doGrade * 2;
  if (tempGrade != null) return tempGrade;
  return null;
}

export function computeSwimmingScore(metricGrades: Partial<Record<MetricKey, Grade>>): number | null {
  return metricGrades.bacteria ? GRADE_TO_NUM[metricGrades.bacteria] : null;
}

export function computeImprovementScore(metrics: MetricData[]): number {
  const trends: number[] = [];
  for (const m of metrics) {
    if (m.points.length > 3) {
      const t = computeTrend(m.points);
      if (t) trends.push(t.percentChange);
    }
  }
  if (trends.length === 0) return 0;
  return trends.reduce((a, b) => a + b, 0) / trends.length;
}


/* ── 2-year recency filter ── */

function isRecent(lastSampleDate: Date | null): boolean {
  if (\!lastSampleDate) return false;
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  return lastSampleDate >= twoYearsAgo;
}

/* ── Ranking function ── */

export function rankStations(
  stations: StationRanking[],
  category: RankingCategory,
): StationRanking[] {
  // For "needs-data", show stale/sparse stations; for all other tabs, only recent (2-year) stations
  if (category === "needs-data") {
    const stale = stations.filter((s) => \!isRecent(s.lastSampleDate) || s.metricsAvailable <= 2 || s.totalReadings < 10);
    return stale.sort((a, b) => a.totalReadings - b.totalReadings);
  }

  const recent = stations.filter((s) => isRecent(s.lastSampleDate));

  switch (category) {
    case "cleanest":
      return recent.sort((a, b) => b.overallGrade - a.overallGrade);
    case "most-polluted":
      return recent.sort((a, b) => a.overallGrade - b.overallGrade);
    case "best-for-fish":
      return recent.sort((a, b) => {
        const sa = computeFishScore(a.metricGrades) ?? -1;
        const sb = computeFishScore(b.metricGrades) ?? -1;
        return sb - sa;
      });
    case "safest-swimming":
      return recent.sort((a, b) => {
        const sa = computeSwimmingScore(a.metricGrades) ?? -1;
        const sb = computeSwimmingScore(b.metricGrades) ?? -1;
        return sb - sa;
      });
    case "most-improved":
      return recent.sort((a, b) => b.trendPercent - a.trendPercent);
    default:
      return recent;
  }
}

/* ── Batch fetch with concurrency limit ── */

export async function fetchRankingsData(
  stationIds: string[],
  onProgress: (completed: number, total: number) => void,
  onPartialResults?: (results: StationRanking[]) => void,
): Promise<StationRanking[]> {
  const results: StationRanking[] = [];
  let completed = 0;
  const total = stationIds.length;

  // Simple semaphore for concurrency limit of 10
  let running = 0;
  const queue = [...stationIds];

  async function processStation(stationId: string): Promise<StationRanking | null> {
    const res = await fetchWaterQualityResults(stationId);
    if (!res.ok) return null;

    const metrics = processWaterQualityData(res.data);
    if (metrics.length === 0) return null;

    const metricGrades: Partial<Record<MetricKey, Grade>> = {};
    let totalReadings = 0;
    let lastDate: Date | null = null;

    for (const m of metrics) {
      metricGrades[m.key] = getGrade(m.key, m.latestValue).grade;
      totalReadings += m.points.length;
      const d = new Date(m.latestDate);
      if (!lastDate || d > lastDate) lastDate = d;
    }

    const overallGrade = computeOverallGrade(metricGrades);
    const trendPercent = computeImprovementScore(metrics);
    const { level, detail } = computeConsistency(metrics.length, totalReadings, lastDate);

    return {
      stationId,
      stationName: stationId, // Will be resolved from allStations in the component
      stationType: "",
      overallGrade,
      metricGrades,
      metricsAvailable: metrics.length,
      totalReadings,
      lastSampleDate: lastDate,
      trendPercent,
      consistencyLevel: level,
      consistencyDetail: detail,
    };
  }

  return new Promise((resolve) => {
    function next() {
      while (running < 10 && queue.length > 0) {
        const id = queue.shift()!;
        running++;
        processStation(id)
          .then((ranking) => {
            if (ranking) results.push(ranking);
            onPartialResults?.(results);
          })
          .catch(() => {
            // Skip failed stations
          })
          .finally(() => {
            running--;
            completed++;
            onProgress(completed, total);
            if (queue.length === 0 && running === 0) {
              resolve(results);
            } else {
              next();
            }
          });
      }
    }
    next();
  });
}
export function computeConsistency(
  metricsAvailable: number,
  totalReadings: number,
  lastSampleDate: Date | null,
): { level: "excellent" | "good" | "limited"; detail: string } {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  const lastStr = lastSampleDate
    ? lastSampleDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Unknown";
  const detail = `${metricsAvailable} of 5 metrics · ${totalReadings} readings · Last sampled ${lastStr}`;

  if (
    metricsAvailable >= 4 &&
    totalReadings >= 50 &&
    lastSampleDate &&
    lastSampleDate >= oneYearAgo
  ) {
    return { level: "excellent", detail };
  }
  if (
    metricsAvailable >= 3 &&
    totalReadings >= 20 &&
    lastSampleDate &&
    lastSampleDate >= twoYearsAgo
  ) {
    return { level: "good", detail };
  }
  return { level: "limited", detail };
}

