import Papa from "papaparse";

export type Station = {
  id: string; // MonitoringLocationIdentifier
  name: string; // MonitoringLocationName
  type: string; // MonitoringLocationTypeName
  orgId: string; // OrganizationIdentifier
  orgName: string; // OrganizationFormalName
  description: string; // MonitoringLocationDescriptionText
  hucCode: string; // HUCEightDigitCode
  lat: number; // LatitudeMeasure
  lng: number; // LongitudeMeasure
  provider: string; // ProviderName
};

interface StationRow {
  OrganizationIdentifier: string;
  OrganizationFormalName: string;
  MonitoringLocationIdentifier: string;
  MonitoringLocationName: string;
  MonitoringLocationTypeName: string;
  MonitoringLocationDescriptionText: string;
  HUCEightDigitCode: string;
  LatitudeMeasure: string;
  LongitudeMeasure: string;
  ProviderName: string;
}

function parseRow(row: StationRow): Station {
  return {
    id: row.MonitoringLocationIdentifier ?? "",
    name: row.MonitoringLocationName ?? "",
    type: row.MonitoringLocationTypeName ?? "",
    orgId: row.OrganizationIdentifier ?? "",
    orgName: row.OrganizationFormalName ?? "",
    description: row.MonitoringLocationDescriptionText ?? "",
    hucCode: row.HUCEightDigitCode ?? "",
    lat: parseFloat(row.LatitudeMeasure) || 0,
    lng: parseFloat(row.LongitudeMeasure) || 0,
    provider: row.ProviderName ?? "",
  };
}

/**
 * Parse station CSV text into typed Station objects.
 */
export function parseStationsCsv(csvText: string): Station[] {
  const result = Papa.parse<StationRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map(parseRow);
}

/**
 * Return all stations from parsed CSV data.
 */
export function getAllStations(stations: Station[]): Station[] {
  return stations;
}

/**
 * Return only stations with valid (non-zero, parseable) latitude and longitude.
 */
export function getStationsWithCoordinates(stations: Station[]): Station[] {
  return stations.filter(
    (s) => s.lat !== 0 && s.lng !== 0 && !isNaN(s.lat) && !isNaN(s.lng)
  );
}

/**
 * Fetch and parse station.csv from the public directory (client-side).
 */
export async function fetchStations(): Promise<Station[]> {
  const response = await fetch("/data/station.csv");
  if (!response.ok) {
    throw new Error(`Failed to fetch station data: ${response.statusText}`);
  }
  const csvText = await response.text();
  return parseStationsCsv(csvText);
}

/* ── Station name formatting ── */

/** Common USGS abbreviations → expanded forms (applied before title-casing). */
const USGS_ABBREVS: Record<string, string> = {
  "R.": "River",
  "BK": "Brook",
  "BR": "Branch",
  "CR": "Creek",
  "LK": "Lake",
  "PD": "Pond",
  "PT": "Point",
  "RTE": "Route",
  "TPKE": "Turnpike",
  "RD": "Road",
  "ST": "Street",
  "AVE": "Avenue",
  "HWY": "Highway",
  "NR": "Near",
  "ABV": "Above",
  "BLW": "Below",
  "US": "Upstream",
  "DS": "Downstream",
  "SP": "State Park",
};

/** Words that should stay lowercase in title case (unless first word). */
const LOWERCASE_WORDS = new Set(["at", "of", "the", "in", "on", "near", "and", "vs"]);

/**
 * Check whether a name is ALL CAPS (USGS-style).
 * Returns false for mixed-case names and identifier strings.
 */
function isAllCaps(name: string): boolean {
  // Must have at least one letter
  if (!/[A-Z]/.test(name)) return false;
  // If it contains any lowercase letter, it's already mixed-case
  if (/[a-z]/.test(name)) return false;
  return true;
}

/**
 * Check whether a name looks like an identifier (e.g. "BRH-I-01", "01", "Rippowam 10").
 * These should not be transformed.
 */
function isIdentifier(name: string): boolean {
  // Pure numbers
  if (/^[0-9]+$/.test(name)) return true;
  // Contains underscores or hyphens with alphanumeric segments (code-like identifiers)
  if (/^[A-Z0-9]+[-_][A-Z0-9-_]+$/i.test(name)) return true;
  return false;
}

/**
 * Title-case a single word, respecting lowercase words and state abbreviations.
 */
function titleCaseWord(word: string, isFirst: boolean): string {
  const lower = word.toLowerCase();
  // Two-letter state abbreviations (e.g. CT, NY) stay uppercase
  if (word.length === 2 && /^[A-Z]{2}$/.test(word)) return word;
  if (!isFirst && LOWERCASE_WORDS.has(lower)) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Format a station name for display.
 *
 * - ALL CAPS USGS names: expand abbreviations, convert to title case.
 * - Already mixed-case names: returned unchanged.
 * - Identifier strings (with underscores/hyphens, pure numbers): returned unchanged.
 */
export function formatStationName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  // Leave identifiers unchanged
  if (isIdentifier(trimmed)) return trimmed;

  // Leave already-mixed-case names unchanged
  if (!isAllCaps(trimmed)) return trimmed;

  // Expand USGS abbreviations (match whole words only)
  let expanded = trimmed;
  for (const [abbr, full] of Object.entries(USGS_ABBREVS)) {
    // Escape dots for regex
    const escaped = abbr.replace(/\./g, "\\.");
    const re = new RegExp(`\\b${escaped}\\b`, "g");
    expanded = expanded.replace(re, full.toUpperCase());
  }

  // Title-case each word
  const words = expanded.split(/\s+/);
  const titled = words.map((w, i) => {
    // Preserve apostrophes within words (e.g. CAPTAIN'S → Captain's)
    if (w.includes("'")) {
      const parts = w.split("'");
      return parts.map((p, j) => titleCaseWord(p, i === 0 && j === 0)).join("'");
    }
    return titleCaseWord(w, i === 0);
  });

  return titled.join(" ");
}

