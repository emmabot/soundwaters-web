"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import ExplorationChallenges from "./ExplorationChallenges";

const STORAGE_KEY = "soundwaters-welcomed";

const STATION_TYPES = [
  { label: "River/Stream", color: "#3B82F6" },
  { label: "Estuary", color: "#14B8A6" },
  { label: "Beach", color: "#F97316" },
  { label: "Lake/Reservoir", color: "#A855F7" },
];

const STEPS = [
  { icon: "🔍", text: "Search or click a station on the map" },
  { icon: "📊", text: "See water quality grades and charts" },
  { icon: "🧠", text: "Read what the data means for the environment" },
];

export default function WelcomeHero({
  stationCount,
  onDismiss,
}: {
  stationCount: number;
  onDismiss: () => void;
}) {
  // Auto-dismiss if already welcomed
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      onDismiss();
    }
  }, [onDismiss]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-center px-6 pt-24 sm:px-10 sm:pt-28"
    >
      <div className="pointer-events-auto glass-dark w-full max-w-xl rounded-2xl px-5 py-6 sm:px-6 sm:py-7">
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl"
        >
          Explore Water Quality in{" "}
          <span className="bg-gradient-to-r from-ocean-300 via-teal-400 to-ocean-400 bg-clip-text text-transparent">
            Long Island Sound
          </span>
        </motion.h2>

        {/* What is this? */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-4 text-center text-sm leading-relaxed text-ocean-200"
        >
          SoundWaters shows real water quality data from{" "}
          <span className="font-semibold text-white">{stationCount || 367}</span>{" "}
          monitoring stations around Long Island Sound. Explore five key
          measurements — dissolved oxygen, pH, water temperature, nitrogen, and
          bacteria — to discover how healthy the Sound is.
        </motion.p>

        {/* Mini-legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-ocean-200"
        >
          {STATION_TYPES.map((t) => (
            <span key={t.label} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              {t.label}
            </span>
          ))}
        </motion.div>

        {/* How to explore */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-5 space-y-2"
        >
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2"
            >
              <span className="text-lg">{step.icon}</span>
              <span className="text-sm text-white/90">{step.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Exploration Challenges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <ExplorationChallenges />
        </motion.div>

        {/* Start Exploring button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mt-5 text-center"
        >
          <button
            onClick={handleDismiss}
            className="rounded-full bg-gradient-to-r from-ocean-500 to-teal-500 px-8 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-ocean-400 hover:to-teal-400 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            🌊 Start Exploring
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

