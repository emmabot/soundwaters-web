"use client";

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
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { RANGE_BANDS, METRIC_INFO, type MetricKey } from "@/lib/thresholds";
import type { DataPoint } from "@/lib/water-quality-data";

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
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
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
        {payload[0].value}{unit ? ` ${unit}` : ""}
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
  const info = METRIC_INFO[metricKey];
  const bands = RANGE_BANDS[metricKey];

  // Compute Y domain from data + bands
  const values = points.map((p) => p.value);
  const bandMaxes = bands.map((b) => b.y2);
  const bandMins = bands.map((b) => b.y1);
  const allVals = [...values, ...bandMaxes, ...bandMins];
  const yMin = Math.floor(Math.min(...allVals));
  const yMax = Math.ceil(Math.max(...allVals));
  const padding = Math.max((yMax - yMin) * 0.1, 1);

  const isSinglePoint = points.length === 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={metricKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="glass h-64 w-full rounded-xl p-3 sm:h-72 md:h-80"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
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
            <Tooltip content={<CustomTooltip unit={info.unit} />} />
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
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatePresence>
  );
}

