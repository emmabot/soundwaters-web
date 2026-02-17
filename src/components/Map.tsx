"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
  MapControl,
  ControlPosition,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Station } from "@/lib/stations";
import { formatStationName } from "@/lib/stations";

export const TYPE_COLORS: Record<string, string> = {
  "River/Stream": "#3B82F6",
  Estuary: "#14B8A6",
  "BEACH Program Site-Estuary": "#F97316",
  "Lake, Reservoir, Impoundment": "#A855F7",
};
export const DEFAULT_COLOR = "#6B7280";
const LIS_CENTER = { lat: 41.15, lng: -73.35 };
const DEFAULT_ZOOM = 10;

function colorForType(t: string) {
  return TYPE_COLORS[t] ?? DEFAULT_COLOR;
}

export function labelForType(t: string) {
  if (t === "BEACH Program Site-Estuary") return "Beach";
  if (t === "Lake, Reservoir, Impoundment") return "Lake/Reservoir";
  return t;
}

/* ── Sub-components ── */

function StationMarker({
  station,
  setMarkerRef,
  onClick,
}: {
  station: Station;
  setMarkerRef: (
    s: Station,
    m: google.maps.marker.AdvancedMarkerElement | null,
  ) => void;
  onClick: (
    s: Station,
    m: google.maps.marker.AdvancedMarkerElement | null,
  ) => void;
}) {
  const [marker, setMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  const ref = useCallback(
    (m: google.maps.marker.AdvancedMarkerElement | null) => {
      setMarker(m);
      setMarkerRef(station, m);
    },
    [station, setMarkerRef],
  );

  const color = colorForType(station.type);

  return (
    <AdvancedMarker
      position={{ lat: station.lat, lng: station.lng }}
      ref={ref}
      onClick={() => onClick(station, marker)}
      title={formatStationName(station.name)}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: color,
          border: "2px solid white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          cursor: "pointer",
        }}
      />
    </AdvancedMarker>
  );
}

function StationInfoWindow({
  station,
  anchor,
  onClose,
}: {
  station: Station;
  anchor: google.maps.marker.AdvancedMarkerElement;
  onClose: () => void;
}) {
  const color = colorForType(station.type);
  return (
    <InfoWindow anchor={anchor} onCloseClick={onClose}>
      <div style={{ maxWidth: 260, fontFamily: "sans-serif" }}>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: 16,
            fontWeight: 700,
            color: "#075985",
          }}
        >
          {formatStationName(station.name)}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, color: "#334155" }}>
            {labelForType(station.type)}
          </span>
        </div>
        <p style={{ margin: "4px 0", fontSize: 12, color: "#64748b" }}>
          {station.orgName}
        </p>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 13,
            fontWeight: 600,
            color: "#0284c7",
          }}
        >
          Explore water quality data →
        </p>
      </div>
    </InfoWindow>
  );
}

function LoadingOverlay() {
  return (
    <MapControl position={ControlPosition.TOP_CENTER}>
      <div
        style={{
          marginTop: 12,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 12,
          padding: "8px 16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          border: "1px solid rgba(255,255,255,0.3)",
          fontSize: 14,
          fontWeight: 500,
          color: "#0369a1",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span className="animate-spin" style={{ display: "inline-block" }}>
          🌊
        </span>
        Loading stations…
      </div>
    </MapControl>
  );
}

function Legend({ typeCounts }: { typeCounts: Record<string, number> }) {
  const entries = [
    ...Object.keys(TYPE_COLORS).map((type) => ({
      label: labelForType(type),
      color: TYPE_COLORS[type],
      count: typeCounts[type] ?? 0,
    })),
    { label: "Other", color: DEFAULT_COLOR, count: typeCounts["Other"] ?? 0 },
  ].filter((e) => e.count > 0);

  return (
    <div
      style={{
        margin: "0 0 24px 10px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        border: "1px solid rgba(255,255,255,0.3)",
        fontSize: 12,
        lineHeight: 1.6,
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 11,
          marginBottom: 6,
          color: "#0f4c6e",
        }}
      >
        Station Types
      </div>
      {entries.map((e) => (
        <div
          key={e.label}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: e.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "#334155" }}>
            {e.label}{" "}
            <span style={{ color: "#94a3b8" }}>({e.count})</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ── */

export default function StationMap({
  stations,
  loading = false,
  onStationSelect,
  onDeselect,
}: {
  stations: Station[];
  loading?: boolean;
  onStationSelect?: (station: Station) => void;
  onDeselect?: () => void;
}) {
  const map = useMap();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedMarker, setSelectedMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<
    Map<string, google.maps.marker.AdvancedMarkerElement>
  >(new Map());

  /* initialise clusterer */
  useEffect(() => {
    if (!map || clustererRef.current) return;
    clustererRef.current = new MarkerClusterer({ map, markers: [] });
  }, [map]);

  /* sync markers into clusterer */
  useEffect(() => {
    const c = clustererRef.current;
    if (!c) return;
    c.clearMarkers(true);
    c.addMarkers(Array.from(markerRefs.current.values()));
  }, [stations]);

  const setMarkerRef = useCallback(
    (
      station: Station,
      marker: google.maps.marker.AdvancedMarkerElement | null,
    ) => {
      if (marker) markerRefs.current.set(station.id, marker);
      else markerRefs.current.delete(station.id);
    },
    [],
  );

  const handleMarkerClick = useCallback(
    (
      station: Station,
      marker: google.maps.marker.AdvancedMarkerElement | null,
    ) => {
      setSelectedStation(station);
      setSelectedMarker(marker);
      onStationSelect?.(station);
    },
    [onStationSelect],
  );

  /* count stations per type for legend */
  const typeCounts = stations.reduce<Record<string, number>>((acc, s) => {
    const key = TYPE_COLORS[s.type] ? s.type : "Other";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <GoogleMap
      defaultCenter={LIS_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      gestureHandling="greedy"
      mapId="ac323095a9ef6b841ee36dfb"
      className="h-full w-full"
      onClick={() => {
        setSelectedStation(null);
        setSelectedMarker(null);
        onDeselect?.();
      }}
    >
      {loading && <LoadingOverlay />}

      {stations.map((s) => (
        <StationMarker
          key={s.id}
          station={s}
          setMarkerRef={setMarkerRef}
          onClick={handleMarkerClick}
        />
      ))}

      {selectedStation && selectedMarker && (
        <StationInfoWindow
          station={selectedStation}
          anchor={selectedMarker}
          onClose={() => {
            setSelectedStation(null);
            setSelectedMarker(null);
            onDeselect?.();
          }}
        />
      )}

      <MapControl position={ControlPosition.LEFT_BOTTOM}>
        <Legend typeCounts={typeCounts} />
      </MapControl>
    </GoogleMap>
  );
}
