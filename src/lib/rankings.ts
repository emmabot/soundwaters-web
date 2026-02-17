import { fetchWaterQualityResults } from "@/lib/wqx-api";
import { processWaterQualityData, type MetricData } from "@/lib/water-quality-data";
import { getGrade, type MetricKey, type Grade } from "@/lib/thresholds";
import { computeTrend } from "@/lib/trend-analysis";

/* ── Curated station list (~40 stations with geographic spread & type diversity) ── */

export const CURATED_STATIONS: string[] = [
  // USGS — Rivers/Streams (western to eastern)
  "USGS-01201487",   // Still River, Brookfield
  "USGS-01208925",   // Mill River, Fairfield
  "USGS-01208873",   // Rooster River, Fairfield
  "USGS-01209500",   // Saugatuck River, Westport
  "USGS-01209710",   // Norwalk River, Winnipauk
  "USGS-01210310",   // E Branch Mianus River, Stamford
  "USGS-01211106",   // Greenwich Creek, Cos Cob
  // USGS — Estuaries
  "USGS-01208822",   // Housatonic River, Stratford (tidal)
  "USGS-01209510",   // Saugatuck River, Westport (tidal)
  "USGS-410502073236000", // Norwalk Harbor
  "USGS-410606073245700", // Norwalk River at Aquarium
  "USGS-410729073171701", // Mill River, Southport Harbor
  // CT DEP — Rivers
  "CT_DEP01_WQX-14360",  // Norwalk River
  "CT_DEP01_WQX-14444",  // Saugatuck River
  "CT_DEP01_WQX-14458",  // Still River
  "CT_DEP01_WQX-15857",  // Mill River
  "CT_DEP01_WQX-16958",  // Pequonnock River
  "CT_DEP01_WQX-16649",  // Farmill River
  // CT DEP — Estuaries (Long Island Sound transect)
  "CT_DEP01_WQX-17217",  // Station 01 (western Sound)
  "CT_DEP01_WQX-17221",  // Station 05
  "CT_DEP01_WQX-17224",  // Station 08
  "CT_DEP01_WQX-17226",  // Station 12
  "CT_DEP01_WQX-17230",  // Station 18
  "CT_DEP01_WQX-17234",  // Station 22 (eastern Sound)
  // CT DEP — Lakes/Reservoirs
  "CT_DEP01_WQX-15943",  // Squantz Pond
  "CT_DEP01_WQX-18148",  // Ball Pond
  "CT_DEP01_WQX-19337",  // Mamanasco Lake
  "CT_DEP01_WQX-15627",  // Lake Kenosia
  // Beach stations (spread along coast)
  "1CTDPHBM-500",   // Greenwich Point Beach
  "1CTDPHBM-1000",  // Byram Beach
  "1CTDPHBM-1800",  // East (Cove Island) Beach, Stamford
  "1CTDPHBM-3100",  // Calf Pasture Beach, Norwalk
  "1CTDPHBM-3800",  // Compo Beach, Westport
  "1CTDPHBM-13400", // Sherwood Island State Park
  "1CTDPHBM-5000",  // Jennings Beach, Fairfield
  "1CTDPHBM-5700",  // Long Beach, Stratford
  "1CTDPHBM-6000",  // Short Beach, Stratford
  // Community / Harbor monitoring
  "STS-NWH-I-01",   // Norwalk Harbor
  "STS-COV-01",     // Cove Harbor, Stamford
  "STS-HOU-O-03",   // Housatonic River estuary
  "ASHCREEKCONSERVATIONASSOC-Bridgeport-Harbor-Inner-1", // Pequonnock River
];

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


/* ── Ranking function ── */

export function rankStations(
  stations: StationRanking[],
  category: RankingCategory,
): StationRanking[] {
  const copy = [...stations];

  switch (category) {
    case "cleanest":
      return copy.sort((a, b) => b.overallGrade - a.overallGrade);
    case "most-polluted":
      return copy.sort((a, b) => a.overallGrade - b.overallGrade);
    case "best-for-fish": {
      return copy.sort((a, b) => {
        const sa = computeFishScore(a.metricGrades) ?? -1;
        const sb = computeFishScore(b.metricGrades) ?? -1;
        return sb - sa;
      });
    }
    case "safest-swimming": {
      return copy.sort((a, b) => {
        const sa = computeSwimmingScore(a.metricGrades) ?? -1;
        const sb = computeSwimmingScore(b.metricGrades) ?? -1;
        return sb - sa;
      });
    }
    case "most-improved":
      return copy.sort((a, b) => b.trendPercent - a.trendPercent);
    case "needs-data":
      return copy.sort((a, b) => a.totalReadings - b.totalReadings);
    default:
      return copy;
  }
}

/* ── Batch fetch with concurrency limit ── */

export async function fetchRankingsData(
  stationIds: string[],
  onProgress: (completed: number, total: number) => void,
): Promise<StationRanking[]> {
  const results: StationRanking[] = [];
  let completed = 0;
  const total = stationIds.length;

  // Simple semaphore for concurrency limit of 5
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
      while (running < 5 && queue.length > 0) {
        const id = queue.shift()!;
        running++;
        processStation(id)
          .then((ranking) => {
            if (ranking) results.push(ranking);
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

