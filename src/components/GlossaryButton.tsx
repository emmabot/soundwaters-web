"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GLOSSARY from "@/lib/glossary";

function GlossaryPanelInner({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
  const filtered = search
    ? sorted.filter(
        (e) =>
          e.term.toLowerCase().includes(search.toLowerCase()) ||
          e.definition.toLowerCase().includes(search.toLowerCase()),
      )
    : sorted;

  return (
    <>
      {/* Backdrop — mobile only */}
      <motion.div
        className="absolute inset-0 bg-black/20 sm:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="glossary-panel"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="pointer-events-auto absolute left-0 top-[120px] z-40 flex h-[calc(100%-120px)] max-h-[85vh] sm:max-h-full sm:top-0 sm:h-full w-full flex-col overflow-hidden rounded-r-2xl shadow-2xl sm:w-[360px]"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -100) onClose();
        }}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center py-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-ocean-300" />
        </div>
        <div className="glass-panel flex h-full flex-col">
          {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-ocean-800 via-ocean-700 to-teal-600 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div>
            <h2 className="text-lg font-bold text-white">📖 Glossary</h2>
            <p className="text-xs text-ocean-200">{filtered.length} terms</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white hover:scale-110"
            aria-label="Close glossary"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-ocean-100 px-4 py-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search terms..."
            className="w-full rounded-lg bg-ocean-50 px-3 py-2 text-sm text-ocean-800 placeholder-ocean-400 outline-none focus:ring-2 focus:ring-ocean-300"
          />
        </div>

        {/* Term list */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-ocean-400">
              No terms match &ldquo;{search}&rdquo;
            </p>
          )}
          <div className="space-y-1">
            {filtered.map((entry) => {
              const isOpen = expanded === entry.term;
              return (
                <div key={entry.term} className="rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : entry.term)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-ocean-50"
                  >
                    <span className="text-base flex-shrink-0">{entry.emoji}</span>
                    <span className="font-medium text-ocean-800 flex-1">{entry.term}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-ocean-400 text-xs flex-shrink-0"
                    >
                      ▼
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-3 pb-3 pl-10 text-xs leading-relaxed text-ocean-600">
                          {entry.definition}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
}

export default function GlossaryPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && <GlossaryPanelInner onClose={onClose} />}
    </AnimatePresence>
  );
}

