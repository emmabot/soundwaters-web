"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MetricData } from "@/lib/water-quality-data";
import { generateInsights } from "@/lib/trend-analysis";

export default function TrendInsights({ metrics }: { metrics: MetricData[] }) {
  const [isOpen, setIsOpen] = useState(false);

  /* Gather insights across all metrics */
  const allInsights = useMemo(() => {
    const out: string[] = [];
    for (const m of metrics) {
      const ins = generateInsights(m.key, m.points);
      out.push(...ins);
    }
    // Deduplicate and cap at 4
    return [...new Set(out)].slice(0, 4);
  }, [metrics]);

  if (allInsights.length === 0) return null;

  return (
    <div className="glass rounded-xl">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-ocean-50/50"
      >
        <span className="text-sm font-semibold text-ocean-800">
          🔍 What&apos;s interesting about this station?
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-ocean-400"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-4 pb-4">
              {allInsights.map((insight, i) => (
                <motion.div
                  key={insight}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.25 }}
                  className="glass rounded-lg px-3 py-2.5 text-sm leading-relaxed text-ocean-700"
                >
                  {insight}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

