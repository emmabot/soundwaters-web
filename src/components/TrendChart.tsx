"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
  Brush,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { RANGE_BANDS, METRIC_INFO, getGrade, type MetricKey } from "@/lib/thresholds";
import type { DataPoint } from "@/lib/water-quality-data";
import { computeTrend } from "@/lib/trend-analysis";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
  metricKey,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
  metricKey: MetricKey;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const grade = getGrade(metricKey, value);
  return (
    <div className="glass rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-ocean-800">
        {label ? new Date(label).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }) : ""}
      </p>
      <p className="mt-1 text-sm font-bold text-ocean-700">
        {value}{unit ? ` ${unit}` : ""}
      </p>
      <p className="mt-0.5 text-xs text-ocean-600">
        Grade: {grade.grade} — {grade.label} {grade.emoji}
      </p>
    </div>
  );
}

export default function TrendChart({
  metricKey,
  points,
}: {
  metricKey: MetricKey;
  points: DataPoint[];
}) {
  const [showTrend, setShowTrend] = useState(false);
  const info = METRIC_INFO[metricKey];
  const bands = RANGE_BANDS[metricKey];

  const trend = useMemo(() => computeTrend(points), [points]);

  // Build trend line data: two-point line from regression start to end
  const trendLineData = useMemo(() => {
    if (!trend || points.length < 2) return null;
    return [
      { date: points[0].date, trend: Math.round(trend.startValue * 100) / 100 },
      { date: points[points.length - 1].date, trend: Math.round(trend.endValue * 100) / 100 },
    ];
  }, [trend, points]);

  const trendLabel = trend
    ? trend.direction === "improving"
      ? "↑ Improving"
      : trend.direction === "declining"
        ? "↓ Declining"
        : "→ Stable"
    : "";

  // Compute Y domain from data + bands
  const values = points.map((p) => p.value);
  const bandMaxes = bands.map((b) => b.y2);
  const bandMins = bands.map((b) => b.y1);
  const allVals = [...values, ...bandMaxes, ...bandMins];
  const yMin = Math.floor(Math.min(...allVals));
  const yMax = Math.ceil(Math.max(...allVals));
  const padding = Math.max((yMax - yMin) * 0.1, 1);

  const isSinglePoint = points.length === 1;

  // Merge trend data into points for the trend line
  const chartData = useMemo(() => {
    if (!showTrend || !trendLineData) return points;
    const trendMap = new Map(trendLineData.map((t) => [t.date, t.trend]));
    return points.map((p) => ({
      ...p,
      trend: trendMap.get(p.date) ?? undefined,
    }));
  }, [points, showTrend, trendLineData]);

  // Seasonal summer highlights (Jun-Aug)
  const summerBands = useMemo(() => {
    const bands: { x1: string; x2: string }[] = [];
    let start: string | null = null;
    let prev: string | null = null;
    for (const p of points) {
      const month = new Date(p.date).getMonth() + 1;
      if (month >= 6 && month <= 8) {
        if (!start) start = p.date;
        prev = p.date;
      } else {
        if (start && prev) bands.push({ x1: start, x2: prev });
        start = null;
        prev = null;
      }
    }
    if (start && prev) bands.push({ x1: start, x2: prev });
    return bands;
  }, [points]);

  // Min/max outlier annotations
  const { minPoint, maxPoint } = useMemo(() => {
    if (points.length === 0) return { minPoint: null, maxPoint: null };
    let min = points[0];
    let max = points[0];
    for (const p of points) {
      if (p.value < min.value) min = p;
      if (p.value > max.value) max = p;
    }
    // Only show annotations if there are at least 3 points and min !== max
    if (points.length < 3 || min.value === max.value) return { minPoint: null, maxPoint: null };
    return { minPoint: min, maxPoint: max };
  }, [points]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={metricKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="glass relative h-64 w-full rounded-xl p-3 sm:h-72 md:h-80"
      >
        {/* Trend toggle button */}
        {trend && points.length >= 3 && (
          <button
            onClick={() => setShowTrend((s) => !s)}
            className="absolute right-4 top-4 z-10 rounded-lg bg-ocean-50/80 px-2.5 py-1 text-xs font-medium text-ocean-600 shadow-sm backdrop-blur transition-all hover:bg-ocean-100 hover:text-ocean-800"
          >
            {showTrend ? "Hide trend" : "📈 Show trend"}
          </button>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id={`gradient-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
            {bands.map((band, i) => (
              <ReferenceArea
                key={i}
                y1={band.y1}
                y2={band.y2}
                fill={band.color}
                fillOpacity={1}
                ifOverflow="hidden"
              />
            ))}
            {/* Summer seasonal highlights */}
            {summerBands.map((sb, i) => (
              <ReferenceArea
                key={`summer-${i}`}
                x1={sb.x1}
                x2={sb.x2}
                fill="rgba(251, 191, 36, 0.08)"
                fillOpacity={1}
                ifOverflow="hidden"
                label={i === 0 ? { value: "☀️", position: "insideTopLeft", fontSize: 12 } : undefined}
              />
            ))}
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              domain={[yMin - padding, yMax + padding]}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              label={{
                value: info.unit,
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "#94a3b8" },
              }}
            />
            <Tooltip content={<CustomTooltip unit={info.unit} metricKey={metricKey} />} />
            <Area
              type="monotone"
              dataKey="value"
              fill={`url(#gradient-${metricKey})`}
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={isSinglePoint ? { r: 6, fill: "#0284c7" } : { r: 2.5 }}
              activeDot={{ r: 5, fill: "#0284c7", stroke: "#fff", strokeWidth: 2 }}
            />
            {showTrend && trendLineData && (
              <>
                <Line
                  type="linear"
                  dataKey="trend"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
                <ReferenceLine
                  y={trendLineData[1].trend}
                  stroke="none"
                  label={{
                    value: trendLabel,
                    position: "right",
                    fill: "#f97316",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
              </>
            )}
            {/* Min/max outlier annotations */}
            {maxPoint && (
              <ReferenceDot
                x={maxPoint.date}
                y={maxPoint.value}
                r={6}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={2}
                label={{ value: "📍 Highest", position: "top", fontSize: 10 }}
              />
            )}
            {minPoint && (
              <ReferenceDot
                x={minPoint.date}
                y={minPoint.value}
                r={6}
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth={2}
                label={{ value: "📍 Lowest", position: "bottom", fontSize: 10 }}
              />
            )}
            {/* Brushable date range selector */}
            <Brush
              dataKey="date"
              height={30}
              stroke="#0284c7"
              fill="#f0f9ff"
              tickFormatter={formatDate}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatePresence>
  );
}

