"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import StationMap from "@/components/Map";

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <div className="flex flex-col gap-6">
      {/* Intro section */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-ocean-800">
          Welcome, Explorer! 🔬
        </h2>
        <p className="mt-2 text-ocean-700">
          Dive into real water quality data from{" "}
          <strong>Long Island Sound</strong>. Click on a monitoring station to
          see what scientists are measuring — from dissolved oxygen to
          temperature and beyond.
        </p>
      </section>

      {/* Map area */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="h-[500px] w-full md:h-[600px] lg:h-[700px]">
          {apiKey ? (
            <APIProvider apiKey={apiKey}>
              <StationMap />
            </APIProvider>
          ) : (
            <div className="flex h-full items-center justify-center bg-ocean-100 text-ocean-600">
              <div className="text-center">
                <p className="text-lg font-semibold">🗺️ Map Loading Area</p>
                <p className="mt-1 text-sm">
                  Set <code className="rounded bg-ocean-200 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in{" "}
                  <code className="rounded bg-ocean-200 px-1">.env.local</code> to enable the map.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
