"use client";

import { useState, useCallback, useEffect } from "react";
import { AirportSearch } from "@/components/AirportSearch";
import { FlightList } from "@/components/FlightList";
import type { DisplayFlight } from "@/types/flights";
import type { AviationStackResponse } from "@/types/flights";
import { normalizeFlight, normalizeArrival } from "@/lib/flights";

export default function HomePage() {
  const [selectedAirport, setSelectedAirport] = useState<{
    name: string;
    code: string;
    city: string;
  } | null>(null);

  const [departures, setDepartures] = useState<DisplayFlight[]>([]);
  const [arrivals, setArrivals] = useState<DisplayFlight[]>([]);
  const [loadingDep, setLoadingDep] = useState(false);
  const [loadingArr, setLoadingArr] = useState(false);
  const [errorDep, setErrorDep] = useState<string | null>(null);
  const [errorArr, setErrorArr] = useState<string | null>(null);

  const handleSelect = useCallback(
    (airport: { name: string; code: string; city: string }) => {
      setSelectedAirport(airport);
    },
    []
  );

  useEffect(() => {
    if (!selectedAirport) {
      setDepartures([]);
      setArrivals([]);
      setErrorDep(null);
      setErrorArr(null);
      return;
    }

    const code = selectedAirport.code;

    setLoadingDep(true);
    setErrorDep(null);
    fetch(`/api/flights?airport=${encodeURIComponent(code)}&type=departure`)
      .then((res) => res.json())
      .then((json: AviationStackResponse | { error: string }) => {
        if ("error" in json) {
          setErrorDep(json.error);
          setDepartures([]);
        } else {
          setErrorDep(null);
          setDepartures(
            (json.data ?? []).map(normalizeFlight)
          );
        }
      })
      .catch(() => {
        setErrorDep("Failed to load departures.");
        setDepartures([]);
      })
      .finally(() => setLoadingDep(false));

    setLoadingArr(true);
    setErrorArr(null);
    fetch(`/api/flights?airport=${encodeURIComponent(code)}&type=arrival`)
      .then((res) => res.json())
      .then((json: AviationStackResponse | { error: string }) => {
        if ("error" in json) {
          setErrorArr(json.error);
          setArrivals([]);
        } else {
          setErrorArr(null);
          setArrivals(
            (json.data ?? []).map(normalizeArrival)
          );
        }
      })
      .catch(() => {
        setErrorArr("Failed to load arrivals.");
        setArrivals([]);
      })
      .finally(() => setLoadingArr(false));
  }, [selectedAirport]);

  return (
    <main className="min-h-screen bg-grid-pattern flex flex-col">
      {/* Hero */}
      <header className="relative pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Flight Tracker
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-slate-400 max-w-xl mx-auto">
            Search by airport name or code to see live departures and arrivals.
          </p>
        </div>
      </header>

      {/* Search section */}
      <section className="flex-1 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <AirportSearch onSelect={handleSelect} />
        </div>

        {selectedAirport && (
          <div className="max-w-4xl mx-auto mt-12 space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur px-6 py-4">
              <p className="text-slate-400 text-sm">Selected airport</p>
              <p className="text-xl font-semibold text-white mt-0.5">
                {selectedAirport.name} ({selectedAirport.code})
              </p>
              <p className="text-slate-400">{selectedAirport.city}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <FlightList
                flights={departures}
                type="departure"
                loading={loadingDep}
                error={errorDep}
              />
              <FlightList
                flights={arrivals}
                type="arrival"
                loading={loadingArr}
                error={errorArr}
              />
            </div>
          </div>
        )}
      </section>

      <footer className="py-6 text-center text-slate-500 text-sm border-t border-slate-800/50">
        Flight Tracker — Search an airport to get started
      </footer>
    </main>
  );
}
