"use client";

import { useState, useCallback } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { AnimatePresence, motion } from "framer-motion";
import StationMap from "@/components/Map";
import StationDataPanel from "@/components/StationDataPanel";
import type { Station } from "@/lib/stations";

function AnimatedCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white sm:text-3xl">{value}</div>
      <div className="text-xs text-ocean-200 sm:text-sm">{label}</div>
    </div>
  );
}

function HeroOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-center p-6 pb-12 sm:p-10 sm:pb-16"
    >
      <div className="pointer-events-auto glass-dark w-full max-w-xl rounded-2xl px-6 py-8 text-center sm:px-10 sm:py-10">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl"
        >
          Explore Water Quality in
          <br />
          <span className="bg-gradient-to-r from-ocean-300 via-teal-400 to-ocean-400 bg-clip-text text-transparent">
            Long Island Sound
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 flex items-center justify-center gap-6 sm:gap-10"
        >
          <AnimatedCounter value="367" label="Monitoring Stations" />
          <div className="h-8 w-px bg-white/20" />
          <AnimatedCounter value="5" label="Water Quality Metrics" />
          <div className="h-8 w-px bg-white/20" />
          <AnimatedCounter value="EPA" label="Real Data" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-6 text-sm text-ocean-200 sm:text-base"
        >
          <span className="inline-block pulse-glow rounded-full bg-white/10 px-5 py-2 font-medium text-white">
            Click a station to begin exploring →
          </span>
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const handleStationSelect = useCallback((station: Station) => {
    setSelectedStation(station);
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedStation(null);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Floating Glass Nav */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-4">
        <nav className="pointer-events-auto glass mx-auto flex max-w-max items-center gap-3 rounded-2xl px-5 py-3 shadow-lg">
          <span className="text-2xl" role="img" aria-label="wave">
            🌊
          </span>
          <div>
            <h1 className="text-base font-bold tracking-tight text-ocean-900 sm:text-lg">
              SoundWaters
            </h1>
            <p className="text-xs text-ocean-600">
              Long Island Sound Water Quality
            </p>
          </div>
        </nav>
      </div>

      {/* Full-viewport Map */}
      <div className="h-full w-full">
        {apiKey ? (
          <APIProvider apiKey={apiKey}>
            <StationMap
              onStationSelect={handleStationSelect}
              onDeselect={handleDeselect}
            />
          </APIProvider>
        ) : (
          <div className="flex h-full items-center justify-center bg-ocean-100 text-ocean-600">
            <div className="text-center">
              <p className="text-lg font-semibold">🗺️ Map Loading Area</p>
              <p className="mt-1 text-sm">
                Set{" "}
                <code className="rounded bg-ocean-200 px-1">
                  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                </code>{" "}
                in <code className="rounded bg-ocean-200 px-1">.env.local</code>{" "}
                to enable the map.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hero Overlay — shown when no station selected */}
      <AnimatePresence>
        {!selectedStation && <HeroOverlay />}
      </AnimatePresence>

      {/* Sliding Data Panel */}
      <AnimatePresence>
        {selectedStation && (
          <motion.div
            key="data-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 z-20 h-full w-full sm:w-[450px]"
          >
            <StationDataPanel
              station={selectedStation}
              onClose={handleDeselect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
