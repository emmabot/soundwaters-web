"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MetricKey } from "@/lib/thresholds";
import GlossaryTooltip from "./GlossaryTooltip";

type ExplanationContent = {
  what: ReactNode;
  why: ReactNode;
};

const EXPLANATIONS: Record<MetricKey, ExplanationContent> = {
  do: {
    what: <><GlossaryTooltip term="Dissolved Oxygen">Dissolved oxygen</GlossaryTooltip> is the amount of oxygen in the water. Fish, crabs, and other animals need it to breathe — just like we need oxygen in the air! Water above 6 <GlossaryTooltip term="mg/L">mg/L</GlossaryTooltip> is good, and above 8 mg/L is excellent. Below 4 mg/L is dangerous — most animals can&apos;t survive.</>,
    why: <>Long Island Sound sometimes has low oxygen levels in summer, especially in deeper water. This is called &quot;<GlossaryTooltip term="Hypoxia">hypoxia</GlossaryTooltip>&quot; and it can create <GlossaryTooltip term="Dead Zone">dead zones</GlossaryTooltip> where fish and shellfish can&apos;t survive. Scientists track dissolved oxygen closely because it&apos;s one of the best indicators of overall water health.</>,
  },
  ph: {
    what: <><GlossaryTooltip term="pH">pH</GlossaryTooltip> tells us how acidic or basic water is, on a scale from 0 to 14. Pure water is 7 (neutral). Ocean water is usually around 8.1. Most aquatic life needs pH between 6.5 and 8.5.</>,
    why: <>As the ocean absorbs more CO₂ from the atmosphere, the water becomes more acidic — this is called <GlossaryTooltip term="Ocean Acidification">ocean acidification</GlossaryTooltip>. Even small changes in pH can make it harder for shellfish like oysters and clams to build their shells. In Long Island Sound, monitoring pH helps us understand how climate change is affecting marine life.</>,
  },
  temperature: {
    what: <><GlossaryTooltip term="Water Temperature">Water temperature</GlossaryTooltip> affects everything in the ecosystem. Cold water holds more oxygen than warm water. When water gets too warm (above 28°C), it stresses fish and other animals.</>,
    why: <>Long Island Sound&apos;s water temperature has been rising over the decades due to climate change. Warmer water means less <GlossaryTooltip term="Dissolved Oxygen">dissolved oxygen</GlossaryTooltip>, more <GlossaryTooltip term="Algae Bloom">algae blooms</GlossaryTooltip>, and changes in which species can live here. Some cold-water fish like winter flounder are already declining because the Sound is getting too warm for them.</>,
  },
  nitrogen: {
    what: <><GlossaryTooltip term="Nitrogen">Nitrogen</GlossaryTooltip> shows up in water in different forms. <GlossaryTooltip term="Nitrate">Nitrate</GlossaryTooltip> often comes from fertilizer, ammonia comes from waste, and organic nitrogen comes from decaying plants and animals. All of these forms feed algae. Too much nitrogen causes <GlossaryTooltip term="Algae Bloom">algae blooms</GlossaryTooltip> — huge green growths that use up all the oxygen when they die and decompose. This chain reaction is a big problem in Long Island Sound!</>,
    why: <>Most excess nitrogen in Long Island Sound comes from wastewater treatment plants, fertilizer runoff, and septic systems. Connecticut and New York have been working for decades to reduce <GlossaryTooltip term="Nutrient Pollution">nitrogen pollution</GlossaryTooltip>, and it&apos;s working — but there&apos;s still more to do. When you see high nitrogen levels, it often means there&apos;s too much pollution entering the water nearby.</>,
  },
  bacteria: {
    what: <>Scientists use several types of indicator <GlossaryTooltip term="Bacteria">bacteria</GlossaryTooltip> to test if water is safe for swimming. The most common are <GlossaryTooltip term="Enterococcus">Enterococcus</GlossaryTooltip>, <GlossaryTooltip term="Fecal Coliform">Fecal Coliform</GlossaryTooltip>, and E. coli. These bacteria come from human and animal waste. If levels go above 104 per 100 mL, there&apos;s usually a swimming advisory.</>,
    why: <>High bacteria levels at beaches usually mean <GlossaryTooltip term="Stormwater Runoff">stormwater runoff</GlossaryTooltip> is carrying pollution into the water. After heavy rain, bacteria counts often spike because water washes pet waste, fertilizer, and sewage overflows into the Sound. Different beaches may test for different bacteria types, but they all tell the same story — whether the water is clean enough to swim in. That&apos;s why beaches sometimes close after big storms — it&apos;s to keep swimmers safe!</>,
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

