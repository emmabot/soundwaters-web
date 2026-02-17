"use client";

import { motion } from "framer-motion";

export default function SearchHint({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  if (!visible) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onClick={onClick}
      className="pointer-events-auto glass absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium text-ocean-700 shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
      aria-label="Search stations near you"
    >
      🔍 Search stations near you
    </motion.button>
  );
}

