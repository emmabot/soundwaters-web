"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { findGlossaryEntry } from "@/lib/glossary";

/**
 * Wraps text in a dotted-underline span. On hover (desktop) or tap (mobile),
 * shows a glassmorphism tooltip with the glossary definition.
 */
export default function GlossaryTooltip({
  term,
  children,
}: {
  /** The glossary term to look up (case-insensitive). */
  term: string;
  /** The inline text to render. Defaults to `term` if omitted. */
  children?: React.ReactNode;
}) {
  const entry = findGlossaryEntry(term);
  const [show, setShow] = useState(false);
  const [above, setAbove] = useState(true);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Show above if there's enough room (>120px), otherwise below
    setAbove(rect.top > 120);
  }, []);

  // Close on outside click (for mobile tap-to-open)
  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [show]);

  // If no glossary entry found, just render children as-is
  if (!entry) return <>{children ?? term}</>;

  return (
    <span className="relative inline">
      <span
        ref={triggerRef}
        className="cursor-help border-b border-dotted border-ocean-400 text-ocean-700 transition-colors hover:border-ocean-600 hover:text-ocean-900"
        onMouseEnter={() => {
          reposition();
          setShow(true);
        }}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          // Toggle on tap for mobile
          e.stopPropagation();
          reposition();
          setShow((s) => !s);
        }}
        role="button"
        tabIndex={0}
        aria-label={`Definition of ${entry.term}`}
      >
        {children ?? term}
      </span>

      <AnimatePresence>
        {show && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: above ? 6 : -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: above ? 6 : -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-1/2 z-50 w-64 -translate-x-1/2 rounded-xl border border-white/30 bg-white/80 px-3 py-2.5 shadow-lg backdrop-blur-xl ${
              above ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            <p className="text-xs font-semibold text-ocean-800">
              {entry.emoji} {entry.term}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ocean-600">
              {entry.definition}
            </p>
            {/* Small arrow */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-white/30 bg-white/80 ${
                above
                  ? "top-full -mt-1 border-b border-r"
                  : "bottom-full -mb-1 border-l border-t"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

