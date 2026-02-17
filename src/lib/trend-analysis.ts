import type { DataPoint } from "./water-quality-data";
import type { MetricKey } from "./thresholds";
import { METRIC_INFO, getGrade } from "./thresholds";

/* ── Types ── */

export type TrendDirection = "improving" | "declining" | "stable";

export type TrendResult = {
  direction: TrendDirection;
  slope: number;
  percentChange: number;
  period: string;
  startValue: number;
  endValue: number;
};

export type SeasonalResult = {
  hasSeasonal: boolean;
  peakSeason: string;
  troughSeason: string;
};

export type StatsResult = {
  min: number;
  max: number;
  avg: number;
  stdDev: number;
  count: number;
};

/* ── Linear regression (least-squares) ── */

export function computeTrend(points: DataPoint[]): TrendResult | null {
  if (points.length < 2) return null;

  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.value);
  const n = xs.length;

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const startValue = intercept;
  const endValue = intercept + slope * (n - 1);
  const avgValue = sumY / n;
  const percentChange = avgValue !== 0 ? ((endValue - startValue) / Math.abs(avgValue)) * 100 : 0;

  // Threshold: slope must be meaningful relative to data range
  const range = Math.max(...ys) - Math.min(...ys);
  const slopeThreshold = range > 0 ? range * 0.02 : 0.01;

  let direction: TrendDirection = "stable";
  if (Math.abs(slope) > slopeThreshold) {
    direction = slope > 0 ? "improving" : "declining";
  }

  const firstDate = points[0].date.slice(0, 4);
  const lastDate = points[points.length - 1].date.slice(0, 4);
  const period = firstDate === lastDate ? firstDate : `${firstDate}–${lastDate}`;

  return { direction, slope, percentChange, period, startValue, endValue };
}

/* ── Seasonal detection ── */

const SEASON_NAMES: Record<string, string> = {
  winter: "winter (Dec–Feb)",
  spring: "spring (Mar–May)",
  summer: "summer (Jun–Aug)",
  fall: "fall (Sep–Nov)",
};

function monthToSeason(month: number): string {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

export function detectSeasonalPattern(points: DataPoint[]): SeasonalResult {
  const buckets: Record<string, number[]> = { winter: [], spring: [], summer: [], fall: [] };

  for (const p of points) {
    const month = new Date(p.date).getMonth() + 1;
    const season = monthToSeason(month);
    buckets[season].push(p.value);
  }

  const avgs: Record<string, number> = {};
  let hasSufficientData = false;
  for (const [s, vals] of Object.entries(buckets)) {
    if (vals.length >= 2) hasSufficientData = true;
    avgs[s] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
  }

  if (!hasSufficientData) return { hasSeasonal: false, peakSeason: "", troughSeason: "" };

  const valid = Object.entries(avgs).filter(([, v]) => !isNaN(v));
  if (valid.length < 2) return { hasSeasonal: false, peakSeason: "", troughSeason: "" };

  valid.sort((a, b) => b[1] - a[1]);
  const peak = valid[0];
  const trough = valid[valid.length - 1];

  const diff = peak[1] - trough[1];
  const overall = valid.reduce((a, [, v]) => a + v, 0) / valid.length;
  const hasSeasonal = overall > 0 ? diff / overall > 0.15 : false;

  return {
    hasSeasonal,
    peakSeason: SEASON_NAMES[peak[0]] ?? peak[0],
    troughSeason: SEASON_NAMES[trough[0]] ?? trough[0],
  };
}

/* ── Basic statistics ── */

export function computeStats(points: DataPoint[]): StatsResult {
  if (points.length === 0) return { min: 0, max: 0, avg: 0, stdDev: 0, count: 0 };

  const vals = points.map((p) => p.value);
  const count = vals.length;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / count;
  const variance = vals.reduce((a, v) => a + (v - avg) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);

  return { min, max, avg, stdDev, count };
}

/* ── Insight generation ── */

/** Metrics where higher = worse (declining = improving) */
const LOWER_IS_BETTER: MetricKey[] = ["nitrogen", "bacteria", "temperature"];

function flipDirection(dir: TrendDirection, metric: MetricKey): TrendDirection {
  if (dir === "stable") return "stable";
  if (LOWER_IS_BETTER.includes(metric)) {
    return dir === "declining" ? "improving" : "declining";
  }
  return dir;
}

export function generateInsights(metricKey: MetricKey, points: DataPoint[]): string[] {
  if (points.length === 0) return [];

  const info = METRIC_INFO[metricKey];
  const insights: string[] = [];
  const stats = computeStats(points);
  const trend = computeTrend(points);
  const seasonal = detectSeasonalPattern(points);

  // 1. Trend insight
  if (trend) {
    const healthDir = flipDirection(trend.direction, metricKey);
    const pct = Math.abs(Math.round(trend.percentChange));
    if (healthDir === "improving" && pct > 3) {
      const word = LOWER_IS_BETTER.includes(metricKey) ? "down" : "up";
      insights.push(`📈 ${info.name} is improving — ${word} about ${pct}% since ${trend.period.split("–")[0] ?? trend.period}`);
    } else if (healthDir === "declining" && pct > 3) {
      const word = LOWER_IS_BETTER.includes(metricKey) ? "up" : "down";
      insights.push(`📉 ${info.name} has been declining — ${word} about ${pct}% since ${trend.period.split("–")[0] ?? trend.period}`);
    } else {
      insights.push(`➡️ ${info.name} has stayed pretty stable over ${trend.period}`);
    }
  }

  // 2. Seasonal insight
  if (seasonal.hasSeasonal) {
    insights.push(`🌡️ ${info.name} tends to be highest in ${seasonal.peakSeason} and lowest in ${seasonal.troughSeason}`);
  }

  // 3. Grade-based insight — how many readings exceeded safe limits
  const gradeResults = points.map((p) => getGrade(metricKey, p.value));
  const poorCount = gradeResults.filter((g) => g.grade === "D" || g.grade === "F").length;
  if (poorCount > 0 && points.length >= 3) {
    const pctPoor = Math.round((poorCount / points.length) * 100);
    insights.push(`⚠️ ${poorCount} out of ${points.length} readings (${pctPoor}%) were in the poor or failing range`);
  }

  // 4. Data coverage insight
  const firstYear = points[0].date.slice(0, 4);
  const lastYear = points[points.length - 1].date.slice(0, 4);
  const years = parseInt(lastYear) - parseInt(firstYear);
  if (years > 0) {
    insights.push(`📊 This station has ${years} years of ${info.name.toLowerCase()} data with ${stats.count} measurements`);
  } else {
    insights.push(`📊 This station has ${stats.count} ${info.name.toLowerCase()} measurements`);
  }

  return insights.slice(0, 4);
}

