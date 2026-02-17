"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { AnimatePresence, motion } from "framer-motion";
import StationMap from "@/components/Map";
import StationDataPanel from "@/components/StationDataPanel";
import FilterPanel, { type Filters } from "@/components/FilterPanel";
import WelcomeHero from "@/components/WelcomeHero";
import ComparisonPanel from "@/components/ComparisonPanel";
import type { Station } from "@/lib/stations";
import { fetchStations, getStationsWithCoordinates } from "@/lib/stations";



function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold text-ocean-900">About SoundWaters</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-100 text-ocean-600 transition-all hover:bg-ocean-200 hover:scale-110"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-ocean-800">📊 About This Data</h3>
            <p className="mt-1 text-sm text-ocean-600 leading-relaxed">
              All water quality data comes from the{" "}
              <span className="font-semibold text-ocean-700">EPA Water Quality Portal</span>,
              a national database of water monitoring results collected by federal, state, and
              tribal agencies across the United States.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-ocean-800">🧭 How to Use</h3>
            <ol className="mt-1 space-y-1.5 text-sm text-ocean-600 leading-relaxed">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-700">1</span>
                <span>Use the <strong>search &amp; filters</strong> on the left to find stations by name, type, or organization.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-700">2</span>
                <span><strong>Click a station</strong> on the map or in the list to see its water quality data.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-700">3</span>
                <span>Explore <strong>grade cards, charts, and explanations</strong> to understand what the data means for the environment.</span>
              </li>
            </ol>
          </div>

          <div className="rounded-xl bg-ocean-50 px-4 py-3 text-xs text-ocean-500">
            <strong>Credits:</strong> Data from EPA Water Quality Portal · Built with Next.js, Google Maps &amp; Recharts
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


/* ── Filter logic ── */

function applyFilters(stations: Station[], filters: Filters): Station[] {
  return stations.filter((s) => {
    if (filters.search && !s.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.types.length > 0 && !filters.types.includes(s.type)) {
      return false;
    }
    if (filters.org && s.orgName !== filters.org) {
      return false;
    }
    return true;
  });
}

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  /* Station state — lifted from Map.tsx */
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  /* Filter state */
  const [filters, setFilters] = useState<Filters>({ search: "", types: [], org: "" });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  /* About modal */
  const [showAbout, setShowAbout] = useState(false);

  /* Welcome hero */
  const [showWelcome, setShowWelcome] = useState(true);

  /* Comparison mode */
  const [comparisonMode, setComparisonMode] = useState(false);
  const [stationA, setStationA] = useState<Station | null>(null);
  const [stationB, setStationB] = useState<Station | null>(null);

  /* Load stations on mount */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await fetchStations();
        if (!cancelled) setAllStations(getStationsWithCoordinates(all));
      } catch {
        // Stations will remain empty — map shows no markers
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* Compute filtered stations */
  const filteredStations = useMemo(
    () => applyFilters(allStations, filters),
    [allStations, filters],
  );

  const handleStationSelect = useCallback((station: Station) => {
    if (comparisonMode && stationA) {
      // In comparison mode with station A already selected — this is station B
      setStationB(station);
      setComparisonMode(false);
    } else {
      setSelectedStation(station);
    }
  }, [comparisonMode, stationA]);

  const handleDeselect = useCallback(() => {
    setSelectedStation(null);
  }, []);

  const handleCompare = useCallback(() => {
    if (selectedStation) {
      setStationA(selectedStation);
      setStationB(null);
      setComparisonMode(true);
      setSelectedStation(null); // Close the single panel
    }
  }, [selectedStation]);

  const handleExitComparison = useCallback(() => {
    setStationA(null);
    setStationB(null);
    setComparisonMode(false);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Floating Glass Nav */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-4">
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
          <div className="ml-2 h-6 w-px bg-ocean-200" />
          <button
            onClick={() => setShowAbout(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ocean-500 transition-all hover:bg-ocean-100 hover:text-ocean-700 hover:scale-110"
            aria-label="About this app"
          >
            ℹ️
          </button>
        </nav>
      </div>

      {/* Full-viewport Map */}
      <div className="h-full w-full">
        {apiKey ? (
          <APIProvider apiKey={apiKey}>
            <StationMap
              stations={filteredStations}
              loading={isLoading}
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

      {/* Filter Panel (left side) */}
      <FilterPanel
        stations={allStations}
        filteredStations={filteredStations}
        selectedStation={selectedStation}
        onStationSelect={handleStationSelect}
        onFiltersChange={setFilters}
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen((o) => !o)}
      />

      {/* Welcome — shown when no station selected and welcome not dismissed */}
      <AnimatePresence>
        {!selectedStation && !stationA && showWelcome && (
          <WelcomeHero stationCount={allStations.length} onDismiss={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>

      {/* Comparison mode banner */}
      <AnimatePresence>
        {comparisonMode && stationA && !stationB && (
          <motion.div
            key="comparison-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-center px-6 pt-24 sm:pt-28"
          >
            <div className="pointer-events-auto glass-dark rounded-xl px-5 py-3 text-center text-sm text-white">
              📊 Click another station to compare with <span className="font-semibold">{stationA.name}</span>...
              <button
                onClick={handleExitComparison}
                className="ml-3 rounded-lg bg-white/10 px-2 py-1 text-xs hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sliding Data Panel (right side) */}
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
              onCompare={handleCompare}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Panel */}
      <AnimatePresence>
        {stationA && stationB && (
          <motion.div
            key="comparison-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 z-20 h-full w-full sm:w-[520px]"
          >
            <ComparisonPanel stationA={stationA} stationB={stationB} onClose={handleExitComparison} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      </AnimatePresence>
    </div>
  );
}