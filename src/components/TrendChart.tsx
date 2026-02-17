"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
  Brush,
} from "recharts";
import type { Payload, ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

type ChartTooltipPayloadItem = Payload<ValueType, NameType>;
import { motion, AnimatePresence } from "framer-motion";
import { RANGE_BANDS, METRIC_INFO, getGrade, type MetricKey } from "@/lib/thresholds";
import type { DataPoint } from "@/lib/water-quality-data";
import { computeTrend } from "@/lib/trend-analysis";
import { fetchWeatherData, type DailyWeather } from "@/lib/weather-api";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

type WeatherTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<ChartTooltipPayloadItem>;
  label?: string;
  unit: string;
  metricKey: MetricKey;
  showWeather: boolean;
};

function WeatherTooltip({
  active,
  payload,
  label,
  unit,
  metricKey,
  showWeather,
}: WeatherTooltipProps) {
  if (!active || !payload?.length) return null;
  const valuePl = payload.find((p: ChartTooltipPayloadItem) => p.dataKey === "value");
  const airTempPl = payload.find((p: ChartTooltipPayloadItem) => p.dataKey === "airTemp");
  const precipPl = payload.find((p: ChartTooltipPayloadItem) => p.dataKey === "precip");
  const value = valuePl?.value as number | undefined;
  const grade = value != null ? getGrade(metricKey, value) : null;
  const airTemp = airTempPl?.value as number | undefined;
  const precip = precipPl?.value as number | undefined;

  return (
    <div className="glass rounded-lg px-3 py-2 shadow-lg max-w-[220px]">
      <p className="text-xs font-semibold text-ocean-800">
        {label
          ? new Date(label).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : ""}
      </p>
      {value != null && (
        <>
          <p className="mt-1 text-sm font-bold text-ocean-700">
            {value}
            {unit ? ` ${unit}` : ""}
          </p>
          {grade && (
            <p className="mt-0.5 text-xs text-ocean-600">
              Grade: {grade.grade} — {grade.label} {grade.emoji}
            </p>
          )}
        </>
      )}
      {showWeather && (airTemp != null || precip != null) && (
        <div className="mt-1.5 border-t border-ocean-200 pt-1.5">
          {airTemp != null && (
            <p className="text-xs text-amber-700">
              🌡️ Air: {airTemp.toFixed(1)}°C
            </p>
          )}
          {precip != null && precip > 0 && (
            <p className="text-xs text-blue-600">
              🌧️ Rain: {precip.toFixed(1)} mm
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrendChart({
  metricKey,
  points,
  lat,
  lng,
}: {
  metricKey: MetricKey;
  points: DataPoint[];
  lat?: number;
  lng?: number;
}) {
  const [showTrend, setShowTrend] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [weatherDaily, setWeatherDaily] = useState<DailyWeather[] | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'1y' | '5y' | 'all'>('all');

  const info = METRIC_INFO[metricKey];
  const bands = RANGE_BANDS[metricKey];

  // Filter points by selected time period
  const filteredPoints = useMemo(() => {
    if (timePeriod === 'all') return points;
    const now = new Date();
    const cutoff = new Date();
    if (timePeriod === '1y') cutoff.setFullYear(now.getFullYear() - 1);
    if (timePeriod === '5y') cutoff.setFullYear(now.getFullYear() - 5);
    return points.filter(p => new Date(p.date) >= cutoff);
  }, [points, timePeriod]);

  const canShowWeather = lat != null && lng != null && filteredPoints.length >= 2;

  // Fetch weather when toggled on
  useEffect(() => {
    if (!showWeather || !canShowWeather || weatherDaily) return;
    let cancelled = false;
    (async () => {
      setWeatherLoading(true);
      const sorted = [...filteredPoints].sort((a, b) => a.date.localeCompare(b.date));
      const startDate = sorted[0].date.slice(0, 10);
      const endDate = sorted[sorted.length - 1].date.slice(0, 10);
      const data = await fetchWeatherData(lat!, lng!, startDate, endDate);
      if (!cancelled) {
        setWeatherDaily(data?.daily ?? null);
        setWeatherLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showWeather, canShowWeather, weatherDaily, filteredPoints, lat, lng]);

  // Reset weather cache when station/metric changes or time period changes
  useEffect(() => {
    setWeatherDaily(null);
    setShowWeather(false);
  }, [lat, lng, timePeriod]);

  const trend = useMemo(() => computeTrend(filteredPoints), [filteredPoints]);

  const trendLineData = useMemo(() => {
    if (!trend || filteredPoints.length < 2) return null;
    return [
      { date: filteredPoints[0].date, trend: Math.round(trend.startValue * 100) / 100 },
      { date: filteredPoints[filteredPoints.length - 1].date, trend: Math.round(trend.endValue * 100) / 100 },
    ];
  }, [trend, filteredPoints]);

  const trendLabel = trend
    ? trend.direction === "improving"
      ? "↑ Improving"
      : trend.direction === "declining"
        ? "↓ Declining"
        : "→ Stable"
    : "";

  // Compute Y domain from data + bands
  const values = filteredPoints.map((p) => p.value);
  const bandMaxes = bands.map((b) => b.y2);
  const bandMins = bands.map((b) => b.y1);
  const allVals = [...values, ...bandMaxes, ...bandMins];
  const yMin = Math.floor(Math.min(...allVals));
  const yMax = Math.ceil(Math.max(...allVals));
  const padding = Math.max((yMax - yMin) * 0.1, 1);

  const isSinglePoint = filteredPoints.length === 1;

  // Merge chart data: water quality + optional trend + optional weather
  const chartData = useMemo(() => {
    const trendMap = showTrend && trendLineData
      ? new Map(trendLineData.map((t) => [t.date, t.trend]))
      : null;
    const weatherMap = showWeather && weatherDaily
      ? new Map(weatherDaily.map((w) => [w.date, w]))
      : null;

    return filteredPoints.map((p) => {
      const dateKey = p.date.slice(0, 10);
      const entry: Record<string, unknown> = { ...p };
      if (trendMap) {
        entry.trend = trendMap.get(p.date) ?? undefined;
      }
      if (weatherMap) {
        const w = weatherMap.get(dateKey);
        if (w) {
          entry.airTemp = w.tempMean;
          entry.precip = w.precipitation;
        }
      }
      return entry;
    });
  }, [filteredPoints, showTrend, trendLineData, showWeather, weatherDaily]);

  // Seasonal summer highlights (Jun-Aug)
  const summerBands = useMemo(() => {
    const result: { x1: string; x2: string }[] = [];
    let start: string | null = null;
    let prev: string | null = null;
    for (const p of filteredPoints) {
      const month = new Date(p.date).getMonth() + 1;
      if (month >= 6 && month <= 8) {
        if (!start) start = p.date;
        prev = p.date;
      } else {
        if (start && prev) result.push({ x1: start, x2: prev });
        start = null;
        prev = null;
      }
    }
    if (start && prev) result.push({ x1: start, x2: prev });
    return result;
  }, [filteredPoints]);

  // Min/max outlier annotations
  const { minPoint, maxPoint } = useMemo(() => {
    if (filteredPoints.length === 0) return { minPoint: null, maxPoint: null };
    let min = filteredPoints[0];
    let max = filteredPoints[0];
    for (const p of filteredPoints) {
      if (p.value < min.value) min = p;
      if (p.value > max.value) max = p;
    }
    if (filteredPoints.length < 3 || min.value === max.value) return { minPoint: null, maxPoint: null };
    return { minPoint: min, maxPoint: max };
  }, [filteredPoints]);

  // Weather Y-axis domain
  const weatherYDomain = useMemo(() => {
    if (!showWeather || !weatherDaily) return undefined;
    const matched = chartData.filter((d) => (d as Record<string, unknown>).airTemp != null);
    if (matched.length === 0) return undefined;
    const temps = matched.map((d) => (d as Record<string, unknown>).airTemp as number);
    const precips = matched.map((d) => ((d as Record<string, unknown>).precip as number) ?? 0);
    const lo = Math.floor(Math.min(...temps, ...precips));
    const hi = Math.ceil(Math.max(...temps, ...precips));
    return [lo - 2, hi + 2] as [number, number];
  }, [showWeather, weatherDaily, chartData]);

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
        {/* Toggle buttons */}
        <div className="absolute right-4 top-4 z-10 flex gap-1.5">
          <div className="flex gap-1">
            {(['1y', '5y', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`rounded-md px-3 py-2 text-xs font-medium transition-all ${
                  timePeriod === period
                    ? 'bg-ocean-600 text-white'
                    : 'bg-ocean-50/80 text-ocean-600 hover:bg-ocean-100'
                }`}
              >
                {period === '1y' ? '1Y' : period === '5y' ? '5Y' : 'All'}
              </button>
            ))}
          </div>
          {canShowWeather && (
            <button
              onClick={() => setShowWeather((s) => !s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur transition-all ${
                showWeather
                  ? "bg-amber-100/90 text-amber-700 hover:bg-amber-200"
                  : "bg-ocean-50/80 text-ocean-600 hover:bg-ocean-100 hover:text-ocean-800"
              }`}
            >
              {weatherLoading ? "⏳ Loading..." : showWeather ? "🌤️ Hide weather" : "🌤️ Weather"}
            </button>
          )}
          {trend && filteredPoints.length >= 3 && (
            <button
              onClick={() => setShowTrend((s) => !s)}
              className="rounded-lg bg-ocean-50/80 px-2.5 py-1 text-xs font-medium text-ocean-600 shadow-sm backdrop-blur transition-all hover:bg-ocean-100 hover:text-ocean-800"
            >
              {showTrend ? "Hide trend" : "📈 Trend"}
            </button>
          )}
        </div>

        {filteredPoints.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-ocean-500">No data in this time period</p>
          </div>
        ) : (
        <>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: showWeather && weatherDaily ? 50 : 20, left: 10, bottom: 5 }}
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
              yAxisId="left"
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
            {showWeather && weatherYDomain && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={weatherYDomain}
                tick={{ fontSize: 10, fill: "#d97706" }}
                tickLine={false}
                axisLine={{ stroke: "#fbbf24", strokeDasharray: "3 3" }}
                label={{
                  value: "°C / mm",
                  angle: 90,
                  position: "insideRight",
                  style: { fontSize: 10, fill: "#d97706" },
                }}
              />
            )}
            <Tooltip
              content={
                <WeatherTooltip
                  unit={info.unit}
                  metricKey={metricKey}
                  showWeather={showWeather}
                />
              }
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="value"
              fill={`url(#gradient-${metricKey})`}
              stroke="none"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="value"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={isSinglePoint ? { r: 6, fill: "#0284c7" } : { r: 2.5 }}
              activeDot={{ r: 5, fill: "#0284c7", stroke: "#fff", strokeWidth: 2 }}
            />
            {/* Weather overlay */}
            {showWeather && weatherDaily && (
              <>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="airTemp"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={{ r: 2, fill: "#f59e0b" }}
                  connectNulls
                  isAnimationActive={false}
                  name="Air Temp"
                />
                <Bar
                  yAxisId="right"
                  dataKey="precip"
                  fill="rgba(59, 130, 246, 0.25)"
                  stroke="rgba(59, 130, 246, 0.4)"
                  barSize={6}
                  isAnimationActive={false}
                  name="Precipitation"
                />
              </>
            )}
            {showTrend && trendLineData && (
              <>
                <Line
                  yAxisId="left"
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
                  yAxisId="left"
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
                yAxisId="left"
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
                yAxisId="left"
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

        {/* Weather legend */}
        {showWeather && weatherDaily && !weatherLoading && (
          <div className="absolute bottom-12 left-4 flex gap-3 rounded-lg bg-white/80 px-2.5 py-1 text-[10px] shadow-sm backdrop-blur">
            <span className="flex items-center gap-1 text-amber-700">
              <span className="inline-block h-0.5 w-3 border-b border-dashed border-amber-500" />
              Air temp
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <span className="inline-block h-2.5 w-2 rounded-sm bg-blue-400/40" />
              Rain
            </span>
          </div>
        )}
        </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
