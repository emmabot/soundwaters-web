export type Grade = "A" | "B" | "C" | "D" | "F";

export type GradeResult = {
  grade: Grade;
  label: string;
  color: string;
  emoji: string;
};

export type RangeBand = {
  label: string;
  y1: number;
  y2: number;
  color: string;
};

const GRADE_META: Record<Grade, { label: string; color: string; emoji: string }> = {
  A: { label: "Excellent", color: "#22c55e", emoji: "✅" },
  B: { label: "Good", color: "#86efac", emoji: "👍" },
  C: { label: "Fair", color: "#facc15", emoji: "🟡" },
  D: { label: "Poor", color: "#f97316", emoji: "⚠️" },
  F: { label: "Failing", color: "#ef4444", emoji: "🔴" },
};

function gradeResult(grade: Grade): GradeResult {
  const m = GRADE_META[grade];
  return { grade, ...m };
}

/* ── Dissolved Oxygen (mg/L) ── */
function gradeDO(v: number): Grade {
  if (v > 8) return "A";
  if (v >= 6) return "B";
  if (v >= 4) return "C";
  if (v >= 2) return "D";
  return "F";
}

/* ── pH ── */
function gradePH(v: number): Grade {
  if (v >= 6.5 && v <= 8.5) return "A";
  if ((v >= 6.0 && v < 6.5) || (v > 8.5 && v <= 9.0)) return "B";
  if ((v >= 5.5 && v < 6.0) || (v > 9.0 && v <= 9.5)) return "C";
  if ((v >= 5.0 && v < 5.5) || (v > 9.5 && v <= 10.0)) return "D";
  return "F";
}

/* ── Water Temperature (°C) ── */
function gradeTemp(v: number): Grade {
  if (v < 20) return "A";
  if (v <= 25) return "B";
  if (v <= 28) return "C";
  if (v <= 32) return "D";
  return "F";
}

/* ── Nitrogen / Nitrate (mg/L) ── */
function gradeNitrogen(v: number): Grade {
  if (v < 1) return "A";
  if (v <= 3) return "B";
  if (v <= 5) return "C";
  if (v <= 10) return "D";
  return "F";
}

/* ── Bacteria indicators: Enterococcus, Fecal Coliform, E. coli (CFU/100mL) ── */
function gradeBacteria(v: number): Grade {
  if (v < 35) return "A";
  if (v <= 104) return "B";
  if (v <= 200) return "C";
  if (v <= 500) return "D";
  return "F";
}

export type MetricKey = "do" | "ph" | "temperature" | "nitrogen" | "bacteria";

const GRADERS: Record<MetricKey, (v: number) => Grade> = {
  do: gradeDO,
  ph: gradePH,
  temperature: gradeTemp,
  nitrogen: gradeNitrogen,
  bacteria: gradeBacteria,
};

export function getGrade(metric: MetricKey, value: number): GradeResult {
  const grade = GRADERS[metric](value);
  return gradeResult(grade);
}

/** Healthy-range reference bands for chart overlays. */
export const RANGE_BANDS: Record<MetricKey, RangeBand[]> = {
  do: [
    { label: "Good", y1: 6, y2: 20, color: "rgba(34,197,94,0.12)" },
    { label: "Fair", y1: 4, y2: 6, color: "rgba(250,204,21,0.12)" },
    { label: "Poor", y1: 0, y2: 4, color: "rgba(239,68,68,0.10)" },
  ],
  ph: [
    { label: "Good", y1: 6.5, y2: 8.5, color: "rgba(34,197,94,0.12)" },
    { label: "Fair", y1: 5.5, y2: 6.5, color: "rgba(250,204,21,0.12)" },
    { label: "Fair", y1: 8.5, y2: 9.5, color: "rgba(250,204,21,0.12)" },
    { label: "Poor", y1: 0, y2: 5.5, color: "rgba(239,68,68,0.10)" },
    { label: "Poor", y1: 9.5, y2: 14, color: "rgba(239,68,68,0.10)" },
  ],
  temperature: [
    { label: "Good", y1: 0, y2: 25, color: "rgba(34,197,94,0.12)" },
    { label: "Fair", y1: 25, y2: 28, color: "rgba(250,204,21,0.12)" },
    { label: "Poor", y1: 28, y2: 45, color: "rgba(239,68,68,0.10)" },
  ],
  nitrogen: [
    { label: "Good", y1: 0, y2: 3, color: "rgba(34,197,94,0.12)" },
    { label: "Fair", y1: 3, y2: 5, color: "rgba(250,204,21,0.12)" },
    { label: "Poor", y1: 5, y2: 50, color: "rgba(239,68,68,0.10)" },
  ],
  bacteria: [
    { label: "Good", y1: 0, y2: 104, color: "rgba(34,197,94,0.12)" },
    { label: "Fair", y1: 104, y2: 200, color: "rgba(250,204,21,0.12)" },
    { label: "Poor", y1: 200, y2: 1000, color: "rgba(239,68,68,0.10)" },
  ],
};

export const METRIC_INFO: Record<MetricKey, { name: string; unit: string; emoji: string }> = {
  do: { name: "Dissolved Oxygen", unit: "mg/L", emoji: "💨" },
  ph: { name: "pH", unit: "", emoji: "⚗️" },
  temperature: { name: "Water Temperature", unit: "°C", emoji: "🌡️" },
  nitrogen: { name: "Nitrogen", unit: "mg/L", emoji: "🌿" },
  bacteria: { name: "Bacteria", unit: "CFU/100mL", emoji: "🦠" },
};

