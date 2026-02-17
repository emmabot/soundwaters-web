"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Station } from "@/lib/stations";
import { formatStationName } from "@/lib/stations";
import { TYPE_COLORS, labelForType } from "./Map";

export type Filters = { search: string; types: string[]; org: string };

const TYPE_ENTRIES = Object.entries(TYPE_COLORS).map(([raw, color]) => ({
  raw,
  label: labelForType(raw),
  color,
}));

export default function FilterPanel({
  stations,
  filteredStations,
  selectedStation,
  onStationSelect,
  onFiltersChange,
  isOpen,
  onToggle,
}: {
  stations: Station[];
  filteredStations: Station[];
  selectedStation: Station | null;
  onStationSelect: (s: Station) => void;
  onFiltersChange: (f: Filters) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [org, setOrg] = useState("");

  const orgOptions = useMemo(() => {
    const names = Array.from(new Set(stations.map((s) => s.orgName))).filter(Boolean);
    names.sort((a, b) => a.localeCompare(b));
    return names;
  }, [stations]);

  function emit(s: string, t: string[], o: string) {
    onFiltersChange({ search: s, types: t, org: o });
  }

  function handleSearch(val: string) {
    setSearch(val);
    emit(val, activeTypes, org);
  }

  function toggleType(raw: string) {
    const next = activeTypes.includes(raw)
      ? activeTypes.filter((t) => t !== raw)
      : [...activeTypes, raw];
    setActiveTypes(next);
    emit(search, next, org);
  }

  function handleOrg(val: string) {
    setOrg(val);
    emit(search, activeTypes, val);
  }

  function clearAll() {
    setSearch("");
    setActiveTypes([]);
    setOrg("");
    emit("", [], "");
  }

  const hasFilters = search || activeTypes.length > 0 || org;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="glass pointer-events-auto fixed left-4 top-20 z-30 flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:left-5 sm:top-[76px]"
        aria-label={isOpen ? "Close filter panel" : "Open filter panel"}
      >
        <span className="text-lg">{isOpen ? "✕" : "🔍"}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="filter-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="pointer-events-auto absolute left-0 top-0 z-20 flex h-full w-full flex-col overflow-hidden rounded-r-2xl shadow-2xl sm:w-[350px]"
          >
            <div className="glass-panel flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-ocean-800 via-ocean-700 to-teal-600 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
                <div>
                  <h2 className="text-lg font-bold text-white">Explore Stations</h2>
                  <p className="text-xs text-ocean-200">
                    Showing {filteredStations.length} of {stations.length} stations
                  </p>
                </div>
                <button
                  onClick={onToggle}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white hover:scale-110"
                  aria-label="Close filter panel"
                >
                  ✕
                </button>
              </div>

              {/* Filters */}
              <div className="space-y-3 border-b border-ocean-100 p-4">
                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400">🔍</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search stations..."
                    className="w-full rounded-xl border border-ocean-200 bg-white/60 py-2.5 pl-10 pr-3 text-sm text-ocean-900 placeholder:text-ocean-400 outline-none transition-all focus:border-ocean-400 focus:ring-2 focus:ring-ocean-200"
                  />
                </div>

                {/* Type pills */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-ocean-600 uppercase tracking-wide">Station Type</p>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_ENTRIES.map((t) => {
                      const active = activeTypes.includes(t.raw);
                      return (
                        <button
                          key={t.raw}
                          onClick={() => toggleType(t.raw)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${active ? "bg-ocean-700 text-white shadow-md" : "bg-white/70 text-ocean-700 hover:bg-ocean-100"}`}
                        >
                          <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Organization dropdown */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-ocean-600 uppercase tracking-wide">Organization</p>
                  <select
                    value={org}
                    onChange={(e) => handleOrg(e.target.value)}
                    className="w-full rounded-xl border border-ocean-200 bg-white/60 px-3 py-2.5 text-sm text-ocean-900 outline-none transition-all focus:border-ocean-400 focus:ring-2 focus:ring-ocean-200"
                  >
                    <option value="">All organizations</option>
                    {orgOptions.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Clear all */}
                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="w-full rounded-xl bg-ocean-100 py-2 text-xs font-semibold text-ocean-700 transition-all hover:bg-ocean-200"
                  >
                    ✕ Clear all filters
                  </button>
                )}
              </div>

              {/* Station list */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-1.5">
                  {filteredStations.map((s) => {
                    const isSelected = selectedStation?.id === s.id;
                    const color = TYPE_COLORS[s.type] ?? "#6B7280";
                    return (
                      <button
                        key={s.id}
                        onClick={() => onStationSelect(s)}
                        className={`w-full rounded-xl p-3 text-left transition-all ${
                          isSelected
                            ? "bg-ocean-100 ring-2 ring-ocean-400 shadow-md"
                            : "bg-white/50 hover:bg-white/80 hover:shadow-sm"
                        }`}
                      >
                        <p className="truncate text-sm font-semibold text-ocean-900">{formatStationName(s.name)}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                            style={{ background: color }}
                          />
                          <span className="truncate text-xs text-ocean-600">
                            {labelForType(s.type)}
                          </span>
                          <span className="text-ocean-300">·</span>
                          <span className="truncate text-xs text-ocean-500">{s.orgName}</span>
                        </div>
                      </button>
                    );
                  })}
                  {filteredStations.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-lg">🔍</p>
                      <p className="mt-2 text-sm text-ocean-500">No stations match your filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

