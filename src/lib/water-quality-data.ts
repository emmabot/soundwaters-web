import type { WaterQualityResult } from "./wqx-api";
import type { MetricKey } from "./thresholds";

export type DataPoint = { date: string; value: number };

export type MetricData = {
  key: MetricKey;
  points: DataPoint[];
  latestValue: number;
  latestDate: string;
};

/**
 * Map WQX characteristic names to our canonical metric keys.
 * Case-insensitive matching.
 */
const CHARACTERISTIC_MAP: [RegExp, MetricKey][] = [
  [/^dissolved oxygen/i, "do"],
  [/^do$/i, "do"],
  [/^ph$/i, "ph"],
  [/^temperature,?\s*water/i, "temperature"],
  [/^nitrate/i, "nitrogen"],
  [/^nitrogen/i, "nitrogen"],
  [/^inorganic nitrogen/i, "nitrogen"],
  [/^enterococc/i, "bacteria"],
  [/^escherichia coli/i, "bacteria"],
  [/^e\.\s*coli/i, "bacteria"],
  [/^fecal coliform/i, "bacteria"],
  [/^coliform/i, "bacteria"],
];

function matchMetric(characteristicName: string): MetricKey | null {
  for (const [re, key] of CHARACTERISTIC_MAP) {
    if (re.test(characteristicName.trim())) return key;
  }
  return null;
}

/**
 * Convert Fahrenheit to Celsius if the unit indicates °F.
 */
function maybeConvertTemp(value: number, unit: string): number {
  const u = unit.toLowerCase().trim();
  if (u === "deg f" || u === "°f" || u === "fahrenheit" || u === "degf") {
    return (value - 32) * (5 / 9);
  }
  return value;
}

/**
 * Process raw WQX results into grouped, sorted metric data.
 * Only returns metrics that have at least 1 valid data point.
 */
export function processWaterQualityData(
  results: WaterQualityResult[],
): MetricData[] {
  const grouped = new Map<MetricKey, DataPoint[]>();

  for (const r of results) {
    const key = matchMetric(r.characteristicName);
    if (!key) continue;

    const raw = parseFloat(r.resultValue);
    if (isNaN(raw)) continue;

    const date = r.activityStartDate;
    if (!date) continue;

    let value = raw;
    if (key === "temperature") {
      value = maybeConvertTemp(raw, r.resultUnit);
    }

    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push({ date, value: Math.round(value * 100) / 100 });
  }

  const metrics: MetricData[] = [];

  for (const [key, points] of grouped) {
    // Sort by date ascending
    points.sort((a, b) => a.date.localeCompare(b.date));

    const last = points[points.length - 1];
    metrics.push({
      key,
      points,
      latestValue: last.value,
      latestDate: last.date,
    });
  }

  // Stable order: do, ph, temperature, nitrogen, bacteria
  const ORDER: MetricKey[] = ["do", "ph", "temperature", "nitrogen", "bacteria"];
  metrics.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));

  return metrics;
}

