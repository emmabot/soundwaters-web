"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Challenge = {
  text: string;
  hint: string;
};

const CHALLENGES: Challenge[] = [
  {
    text: "🔎 Can you find a station where bacteria levels are unsafe for swimming?",
    hint: "Hint: Try checking a beach or estuary station near a city.",
  },
  {
    text: "🌡️ Which station has the warmest water?",
    hint: "Hint: Shallow estuaries tend to be warmer in summer.",
  },
  {
    text: "💨 Find a river with excellent dissolved oxygen (Grade A)",
    hint: "Hint: Fast-moving rivers usually have more oxygen.",
  },
  {
    text: "🏖️ Check a beach station — is it safe to swim?",
    hint: "Hint: Look for orange dots on the map — those are beaches.",
  },
  {
    text: "🌿 Find a station with high nitrogen — what causes it?",
    hint: "Hint: Fertilizer runoff and sewage can raise nitrogen levels.",
  },
  {
    text: "📈 Can you find a station where water quality is improving over time?",
    hint: "Hint: Check the trend chart — look for an upward trend in dissolved oxygen.",
  },
  {
    text: "🐟 Find a station with the best overall water quality",
    hint: "Hint: Look for a station with mostly A and B grades.",
  },
  {
    text: "🔬 Compare two stations — which one is healthier?",
    hint: "Hint: Open a station, click Compare, then pick a second station.",
  },
];

const ROTATE_INTERVAL = 8000;
const HINT_DELAY = 3000;

export default function ExplorationChallenges() {
  const [index, setIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Rotate challenges
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % CHALLENGES.length);
      setShowHint(false);
    }, ROTATE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // Show hint after delay
  useEffect(() => {
    setShowHint(false);
    const id = setTimeout(() => setShowHint(true), HINT_DELAY);
    return () => clearTimeout(id);
  }, [index]);

  const challenge = CHALLENGES[index];

  return (
    <div className="mt-4 rounded-xl bg-white/5 px-4 py-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ocean-300">
        🧭 Exploration Challenge
      </p>
      <div className="relative min-h-[3.5rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-sm font-medium text-white/90">{challenge.text}</p>
            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-1.5 text-xs text-ocean-300/80 italic"
                >
                  {challenge.hint}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

