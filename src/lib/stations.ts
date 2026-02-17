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

