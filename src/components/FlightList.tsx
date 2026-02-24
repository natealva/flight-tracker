"use client";

import { useState, useMemo } from "react";
import type { DisplayFlight, StatusFilterOption, SortOption } from "@/types/flights";
import {
  statusLabel,
  statusColor,
  formatTimeInTimezone,
  filterByUpcomingOrHistorical,
  filterByAirline,
  filterByPlace,
  filterByStatusOption,
  sortFlights,
} from "@/lib/flights";

const STATUS_OPTIONS: { value: StatusFilterOption; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "delayed", label: "Delayed" },
  { value: "on_time", label: "On time" },
  { value: "scheduled", label: "Scheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "in_flight", label: "In flight" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "scheduled", label: "Scheduled time" },
  { value: "estimated", label: "Estimated time" },
  { value: "status", label: "Status" },
];

type FlightListProps = {
  flights: DisplayFlight[];
  type: "departure" | "arrival";
  loading?: boolean;
  error?: string | null;
  showUpcoming: boolean;
  /** IANA timezone of the selected airport (e.g. America/Los_Angeles) for correct local time display */
  airportTimezone: string;
};

export function FlightList({
  flights,
  type,
  loading,
  error,
  showUpcoming,
  airportTimezone,
}: FlightListProps) {
  const [filterAirline, setFilterAirline] = useState("");
  const [filterPlace, setFilterPlace] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("scheduled");

  const isDeparture = type === "departure";

  const filteredByTime = useMemo(
    () => filterByUpcomingOrHistorical(flights, showUpcoming),
    [flights, showUpcoming]
  );

  const airlines = useMemo(() => {
    const set = new Set(filteredByTime.map((f) => f.airline));
    return Array.from(set).sort();
  }, [filteredByTime]);

  const places = useMemo(() => {
    const set = new Set(
      filteredByTime.map((f) =>
        isDeparture
          ? { iata: f.destinationIata, name: f.destination }
          : { iata: f.originIata, name: f.origin }
      )
    );
    return Array.from(set)
      .filter((p) => p.iata)
      .sort((a, b) => a.iata.localeCompare(b.iata))
      .map((p) => ({ value: p.iata, label: `${p.iata} — ${p.name}` }));
  }, [filteredByTime, isDeparture]);

  const filtered = useMemo(() => {
    let out = filterByAirline(filteredByTime, filterAirline);
    out = filterByPlace(out, filterPlace, isDeparture);
    out = filterByStatusOption(out, filterStatus);
    return sortFlights(out, sortBy, showUpcoming);
  }, [
    filteredByTime,
    filterAirline,
    filterPlace,
    filterStatus,
    sortBy,
    showUpcoming,
    isDeparture,
  ]);

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <h2
          className={`text-lg font-semibold flex items-center gap-2 ${
            isDeparture ? "text-cyan-700" : "text-amber-700"
          }`}
        >
          <span className="text-2xl" aria-hidden>
            {isDeparture ? "↑" : "↓"}
          </span>
          {isDeparture ? "Departures" : "Arrivals"}
        </h2>
        <p className="mt-3 text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <h2
          className={`text-lg font-semibold flex items-center gap-2 ${
            isDeparture ? "text-cyan-700" : "text-amber-700"
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
              className="h-16 rounded-xl bg-slate-200/60 animate-pulse"
              aria-hidden
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <h2
          className={`text-lg font-semibold flex items-center gap-2 ${
            isDeparture ? "text-cyan-700" : "text-amber-700"
          }`}
        >
          <span className="text-2xl" aria-hidden>
            {isDeparture ? "↑" : "↓"}
          </span>
          {isDeparture ? "Departures" : "Arrivals"}
          {filteredByTime.length > 0 && (
            <span className="text-slate-500 font-normal text-sm">
              ({filtered.length} of {filteredByTime.length})
            </span>
          )}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={filterAirline}
            onChange={(e) => setFilterAirline(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label="Filter by airline"
          >
            <option value="">All airlines</option>
            {airlines.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={filterPlace}
            onChange={(e) => setFilterPlace(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[180px] truncate"
            aria-label={isDeparture ? "Filter by destination" : "Filter by origin"}
          >
            <option value="">
              All {isDeparture ? "destinations" : "origins"}
            </option>
            {places.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilterOption)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-slate-500 text-sm self-center">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="divide-y divide-slate-200 max-h-[420px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-600 text-sm">
            No {type}s match the filters.
          </div>
        ) : (
          filtered.map((flight) => (
            <FlightRow
              key={`${flight.flightIata}-${flight.scheduledIso}`}
              flight={flight}
              showDestination={isDeparture}
              airportTimezone={airportTimezone}
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
  airportTimezone,
}: {
  flight: DisplayFlight;
  showDestination: boolean;
  airportTimezone: string;
}) {
  const place = showDestination
    ? { name: flight.destination, iata: flight.destinationIata }
    : { name: flight.origin, iata: flight.originIata };
  const tz = airportTimezone || flight.timezone || "UTC";
  const scheduledTime = formatTimeInTimezone(flight.scheduledIso, tz);
  const estimatedTime = flight.estimatedIso
    ? formatTimeInTimezone(flight.estimatedIso, tz)
    : null;

  return (
    <div className="px-5 py-3 bg-white hover:bg-slate-50/80 transition-colors">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold text-slate-900 tabular-nums">
          {flight.flightIata}
        </span>
        <span className="text-slate-600 text-sm">{flight.airline}</span>
        <span className="text-slate-700 text-sm truncate min-w-0 flex-1">
          {place.iata} — {place.name}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm">
        <span className="text-slate-600">
          Scheduled {scheduledTime}
          {estimatedTime && estimatedTime !== scheduledTime && (
            <span className="text-slate-500 ml-1">(est. {estimatedTime})</span>
          )}
        </span>
        {flight.delayMinutes != null && flight.delayMinutes > 0 && (
          <span className="text-amber-600 font-medium">+{flight.delayMinutes} min</span>
        )}
        <span className={statusColor(flight.status)}>
          {statusLabel(flight.status)}
        </span>
      </div>
    </div>
  );
}
