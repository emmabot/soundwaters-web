"use client";

import { useMemo } from "react";
import type { MetricData } from "@/lib/water-quality-data";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  if (years === 1) return "1 year ago";
  return `${years} years ago`;
}

export default function DataSummaryBar({ metrics }: { metrics: MetricData[] }) {
  const summary = useMemo(() => {
    let totalPoints = 0;
    let earliest = "";
    let latest = "";

    for (const m of metrics) {
      totalPoints += m.points.length;
      for (const p of m.points) {
        if (!earliest || p.date < earliest) earliest = p.date;
        if (!latest || p.date > latest) latest = p.date;
      }
    }

    return { totalPoints, earliest, latest };
  }, [metrics]);

  if (summary.totalPoints === 0) return null;

  return (
    <div className="glass rounded-xl px-4 py-2.5 text-xs text-ocean-600">
      <span>📅 </span>
      <span className="font-bold text-ocean-800">{summary.totalPoints} measurements</span>
      <span className="mx-1.5">·</span>
      <span>{formatMonthYear(summary.earliest)} → {formatMonthYear(summary.latest)}</span>
      <span className="mx-1.5">·</span>
      <span>Last sampled {relativeTime(summary.latest)}</span>
    </div>
  );
}

