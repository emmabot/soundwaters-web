"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MetricKey } from "@/lib/thresholds";

type ExplanationContent = {
  what: string;
  why: string;
};

const EXPLANATIONS: Record<MetricKey, ExplanationContent> = {
  do: {
    what: "Dissolved oxygen is the amount of oxygen in the water. Fish, crabs, and other animals need it to breathe — just like we need oxygen in the air! Healthy water has at least 5 mg/L. When it drops below that, animals start to struggle.",
    why: "Long Island Sound sometimes has low oxygen levels in summer, especially in deeper water. This is called \"hypoxia\" and it can create dead zones where fish and shellfish can't survive. Scientists track dissolved oxygen closely because it's one of the best indicators of overall water health.",
  },
  ph: {
    what: "pH tells us how acidic or basic water is, on a scale from 0 to 14. Pure water is 7 (neutral). Ocean water is usually around 8.1. Most aquatic life needs pH between 6.5 and 8.5.",
    why: "As the ocean absorbs more CO₂ from the atmosphere, the water becomes more acidic — this is called ocean acidification. Even small changes in pH can make it harder for shellfish like oysters and clams to build their shells. In Long Island Sound, monitoring pH helps us understand how climate change is affecting marine life.",
  },
  temperature: {
    what: "Water temperature affects everything in the ecosystem. Cold water holds more oxygen than warm water. When water gets too warm (above 28°C), it stresses fish and other animals.",
    why: "Long Island Sound's water temperature has been rising over the decades due to climate change. Warmer water means less dissolved oxygen, more algae blooms, and changes in which species can live here. Some cold-water fish like winter flounder are already declining because the Sound is getting too warm for them.",
  },
  nitrogen: {
    what: "Nitrogen is a nutrient that plants need to grow. But too much nitrogen in water causes algae blooms — huge green growths that use up all the oxygen when they die. This is a big problem in Long Island Sound!",
    why: "Most excess nitrogen in Long Island Sound comes from wastewater treatment plants, fertilizer runoff, and septic systems. Connecticut and New York have been working for decades to reduce nitrogen pollution, and it's working — but there's still more to do. When you see high nitrogen levels, it often means there's too much pollution entering the water nearby.",
  },
  bacteria: {
    what: "Enterococci are bacteria that come from human and animal waste. Scientists measure them to know if water is safe for swimming. If levels are above 104 per 100mL, there's usually a swimming advisory.",
    why: "High bacteria levels at beaches usually mean stormwater runoff is carrying pollution into the water. After heavy rain, bacteria counts often spike because water washes pet waste, fertilizer, and sewage overflows into the Sound. That's why beaches sometimes close after big storms — it's to keep swimmers safe!",
  },
};

export default function MetricExplanation({ metricKey }: { metricKey: MetricKey }) {
  const [isOpen, setIsOpen] = useState(false);
  const content = EXPLANATIONS[metricKey];

  return (
    <div className="glass mt-3 overflow-hidden rounded-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ocean-700 hover:bg-white/40 transition-colors rounded-xl"
      >
        <span>📚 What does this mean?</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-block"
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-4 text-sm text-ocean-800">
              <p>{content.what}</p>
              <div>
                <p className="font-semibold text-ocean-700">
                  🌊 Why does it matter for Long Island Sound?
                </p>
                <p className="mt-1">{content.why}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

