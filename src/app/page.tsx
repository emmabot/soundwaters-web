"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { AnimatePresence, motion } from "framer-motion";
import StationMap from "@/components/Map";
import StationDataPanel from "@/components/StationDataPanel";
import FilterPanel, { type Filters } from "@/components/FilterPanel";
import WelcomeHero from "@/components/WelcomeHero";
import ComparisonPanel from "@/components/ComparisonPanel";
import RankingsPanel from "@/components/RankingsPanel";
import GlossaryPanel from "@/components/GlossaryButton";
import SearchHint from "@/components/SearchHint";
import type { Station } from "@/lib/stations";
import { fetchStations, getStationsWithCoordinates, formatStationName } from "@/lib/stations";



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
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ocean-100 text-ocean-600 transition-all hover:bg-ocean-200 hover:scale-110"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-ocean-800">📊 About This Data</h3>
            <p className="mt-1 text-sm text-ocean-600 leading-relaxed">
              This app tracks five key water quality indicators: dissolved oxygen,
              pH, water temperature, nitrogen, and bacteria. Each gets a letter
              grade from A to F based on EPA standards.
            </p>
            <p className="mt-2 text-sm text-ocean-600 leading-relaxed">
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
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const raw = s.name.toLowerCase();
      const formatted = formatStationName(s.name).toLowerCase();
      if (!raw.includes(q) && !formatted.includes(q)) return false;
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

  /* Rankings panel */
  const [showRankings, setShowRankings] = useState(false);

  /* Glossary panel */
  const [showGlossary, setShowGlossary] = useState(false);

  /* Welcome hero */
  const [showWelcome, setShowWelcome] = useState(true);
  const [forceShowWelcome, setForceShowWelcome] = useState(false);

  /* Comparison mode */
  const [comparisonMode, setComparisonMode] = useState(false);
  const [stationA, setStationA] = useState<Station | null>(null);
  const [stationB, setStationB] = useState<Station | null>(null);

  /* Track pending station ID from URL (resolved after stations load) */
  const pendingStationIdRef = useRef<string | null>(null);

  /* Read ?station= param on mount */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const stationId = params.get("station");
    if (stationId) {
      pendingStationIdRef.current = stationId;
    }
  }, []);

  /* Load stations on mount */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await fetchStations();
        if (!cancelled) {
          const withCoords = getStationsWithCoordinates(all);
          setAllStations(withCoords);

          // Auto-select station from URL param
          if (pendingStationIdRef.current) {
            const match = withCoords.find((s) => s.id === pendingStationIdRef.current);
            if (match) {
              setSelectedStation(match);
              setShowWelcome(false);
            }
            pendingStationIdRef.current = null;
          }
        }
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
      // Update URL with station ID
      const url = new URL(window.location.href);
      url.searchParams.set("station", station.id);
      window.history.replaceState({}, "", url.toString());
    }
  }, [comparisonMode, stationA]);

  const handleDeselect = useCallback(() => {
    setSelectedStation(null);
    // Remove station param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("station");
    window.history.replaceState({}, "", url.toString());
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
            onClick={() => setShowRankings(true)}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-1 text-ocean-500 transition-all hover:bg-ocean-100 hover:text-ocean-700 hover:scale-110"
            aria-label="Station rankings"
          >
            <span className="text-lg leading-none">🏆</span>
            <span className="mt-0.5 text-[10px] font-medium leading-tight">Rankings</span>
          </button>
          <button
            onClick={() => setShowGlossary(true)}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-1 text-ocean-500 transition-all hover:bg-ocean-100 hover:text-ocean-700 hover:scale-110"
            aria-label="Glossary"
          >
            <span className="text-lg leading-none">📖</span>
            <span className="mt-0.5 text-[10px] font-medium leading-tight">Glossary</span>
          </button>
          <button
            onClick={() => setShowAbout(true)}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-1 text-ocean-500 transition-all hover:bg-ocean-100 hover:text-ocean-700 hover:scale-110"
            aria-label="About this app"
          >
            <span className="text-lg leading-none">ℹ️</span>
            <span className="mt-0.5 text-[10px] font-medium leading-tight">About</span>
          </button>
          <button
            onClick={() => {
              setForceShowWelcome(true);
              setShowWelcome(true);
            }}
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-1 text-ocean-500 transition-all hover:bg-ocean-100 hover:text-ocean-700 hover:scale-110"
            aria-label="Show help"
          >
            <span className="text-lg leading-none">❓</span>
            <span className="mt-0.5 text-[10px] font-medium leading-tight">Help</span>
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

      {/* Rankings Panel (left side) */}
      <RankingsPanel
        isOpen={showRankings}
        onClose={() => setShowRankings(false)}
        onSelectStation={(id) => {
          const station = allStations.find((s) => s.id === id);
          if (station) {
            setSelectedStation(station);
            setShowRankings(false);
          }
        }}
        allStations={allStations}
      />

      {/* Welcome — shown when no station selected and welcome not dismissed */}
      <AnimatePresence>
        {!selectedStation && !stationA && showWelcome && (
          <WelcomeHero stationCount={allStations.length} onDismiss={() => { setShowWelcome(false); setForceShowWelcome(false); }} forceShow={forceShowWelcome} />
        )}
      </AnimatePresence>

      {/* Search hint — floating chip to open filter panel */}
      <AnimatePresence>
        <SearchHint
          visible={!showWelcome && !selectedStation && !stationA && !isFilterOpen}
          onClick={() => setIsFilterOpen(true)}
        />
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
          <>
            {/* Backdrop — mobile only */}
            <motion.div
              className="absolute inset-0 bg-black/20 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDeselect}
            />
            <motion.div
              key="data-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-[var(--nav-mobile-offset)] z-20 h-[calc(100%-var(--nav-mobile-offset))] w-full sm:top-0 sm:h-full sm:w-[450px]"
            >
              <StationDataPanel
                station={selectedStation}
                onClose={handleDeselect}
                onCompare={handleCompare}
                onShare={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Comparison Panel */}
      <AnimatePresence>
        {stationA && stationB && (
          <>
            {/* Backdrop — mobile only */}
            <motion.div
              className="absolute inset-0 bg-black/20 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleExitComparison}
            />
            <motion.div
              key="comparison-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-[var(--nav-mobile-offset)] z-20 h-[calc(100%-var(--nav-mobile-offset))] w-full sm:top-0 sm:h-full sm:w-[520px]"
            >
              <ComparisonPanel stationA={stationA} stationB={stationB} onClose={handleExitComparison} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Glossary Panel (left side) */}
      <GlossaryPanel isOpen={showGlossary} onClose={() => setShowGlossary(false)} />

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      </AnimatePresence>
    </div>
  );
}