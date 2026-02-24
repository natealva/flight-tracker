"use client";

import type { DisplayFlight } from "@/types/flights";
import { statusLabel, statusColor } from "@/lib/flights";

type FlightListProps = {
  flights: DisplayFlight[];
  type: "departure" | "arrival";
  loading?: boolean;
  error?: string | null;
};

export function FlightList({ flights, type, loading, error }: FlightListProps) {
  const isDeparture = type === "departure";

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur p-6">
        <h2
          className={`text-lg font-semibold flex items-center gap-2 ${
            isDeparture ? "text-cyan-400" : "text-amber-400/90"
          }`}
        >
          <span className="text-2xl" aria-hidden>
            {isDeparture ? "↑" : "↓"}
          </span>
          {isDeparture ? "Departures" : "Arrivals"}
        </h2>
        <p className="mt-3 text-red-400/90 text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur p-6">
        <h2
          className={`text-lg font-semibold flex items-center gap-2 ${
            isDeparture ? "text-cyan-400" : "text-amber-400/90"
          }`}
        >
          <span className="text-2xl" aria-hidden>
            {isDeparture ? "↑" : "↓"}
          </span>
          {isDeparture ? "Departures" : "Arrivals"}
        </h2>
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-slate-800/50 animate-pulse"
              aria-hidden
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/50">
        <h2
          className={`text-lg font-semibold flex items-center gap-2 ${
            isDeparture ? "text-cyan-400" : "text-amber-400/90"
          }`}
        >
          <span className="text-2xl" aria-hidden>
            {isDeparture ? "↑" : "↓"}
          </span>
          {isDeparture ? "Departures" : "Arrivals"}
          {flights.length > 0 && (
            <span className="text-slate-500 font-normal text-sm">
              ({flights.length})
            </span>
          )}
        </h2>
      </div>
      <div className="divide-y divide-slate-700/50 max-h-[420px] overflow-y-auto">
        {flights.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">
            No {type}s found for this airport.
          </div>
        ) : (
          flights.map((flight) => (
            <FlightRow
              key={`${flight.flightIata}-${flight.scheduledTime}`}
              flight={flight}
              showDestination={isDeparture}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FlightRow({
  flight,
  showDestination,
}: {
  flight: DisplayFlight;
  showDestination: boolean;
}) {
  const place = showDestination
    ? { name: flight.destination, iata: flight.destinationIata }
    : { name: flight.origin, iata: flight.originIata };

  return (
    <div className="px-5 py-3 hover:bg-slate-800/30 transition-colors">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold text-white tabular-nums">
          {flight.flightIata}
        </span>
        <span className="text-slate-400 text-sm">{flight.airline}</span>
        <span className="text-slate-300 text-sm truncate min-w-0 flex-1">
          {place.iata} — {place.name}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm">
        <span className="text-slate-400">
          Scheduled {flight.scheduledTime}
          {flight.estimatedTime && flight.estimatedTime !== flight.scheduledTime && (
            <span className="text-slate-500 ml-1">
              (est. {flight.estimatedTime})
            </span>
          )}
        </span>
        {flight.delayMinutes != null && flight.delayMinutes > 0 && (
          <span className="text-amber-400/90">+{flight.delayMinutes} min</span>
        )}
        <span className={statusColor(flight.status)}>
          {statusLabel(flight.status)}
        </span>
      </div>
    </div>
  );
}
