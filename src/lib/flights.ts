import type {
  AviationStackFlight,
  DisplayFlight,
  FlightStatus,
  SortOption,
  StatusFilterOption,
} from "@/types/flights";

/** Format an ISO time string in a given IANA timezone (e.g. America/Los_Angeles). */
export function formatTimeInTimezone(iso: string | null, timezone: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

export function normalizeFlight(raw: AviationStackFlight): DisplayFlight {
  const tz = raw.departure.timezone || "UTC";
  return {
    flightNumber: raw.flight.number,
    flightIata: raw.flight.iata ?? `${raw.airline.iata ?? ""}${raw.flight.number}`,
    airline: raw.airline.name,
    airlineIata: raw.airline.iata,
    origin: raw.departure.airport,
    originIata: raw.departure.iata,
    destination: raw.arrival.airport,
    destinationIata: raw.arrival.iata,
    scheduledIso: raw.departure.scheduled,
    estimatedIso: raw.departure.estimated,
    timezone: tz,
    status: raw.flight_status,
    delayMinutes: raw.departure.delay,
  };
}

export function normalizeArrival(raw: AviationStackFlight): DisplayFlight {
  const tz = raw.arrival.timezone || "UTC";
  return {
    flightNumber: raw.flight.number,
    flightIata: raw.flight.iata ?? `${raw.airline.iata ?? ""}${raw.flight.number}`,
    airline: raw.airline.name,
    airlineIata: raw.airline.iata,
    origin: raw.departure.airport,
    originIata: raw.departure.iata,
    destination: raw.arrival.airport,
    destinationIata: raw.arrival.iata,
    scheduledIso: raw.arrival.scheduled,
    estimatedIso: raw.arrival.estimated,
    timezone: tz,
    status: raw.flight_status,
    delayMinutes: raw.arrival.delay,
  };
}

export function statusLabel(status: FlightStatus): string {
  const labels: Record<FlightStatus, string> = {
    scheduled: "Scheduled",
    active: "In flight",
    landed: "Landed",
    cancelled: "Cancelled",
    incident: "Incident",
    diverted: "Diverted",
  };
  return labels[status] ?? status;
}

export function statusColor(status: FlightStatus): string {
  switch (status) {
    case "active":
      return "text-cyan-600";
    case "landed":
      return "text-emerald-600";
    case "scheduled":
      return "text-slate-600";
    case "cancelled":
      return "text-red-600";
    case "incident":
    case "diverted":
      return "text-amber-600";
    default:
      return "text-slate-500";
  }
}

/** Status order for sorting by status (active first, then scheduled, etc.). */
const STATUS_ORDER: Record<FlightStatus, number> = {
  active: 0,
  scheduled: 1,
  landed: 2,
  diverted: 3,
  incident: 4,
  cancelled: 5,
};

/** Filter flights by upcoming (scheduled >= now) or historical (scheduled < now). */
export function filterByUpcomingOrHistorical(
  flights: DisplayFlight[],
  upcoming: boolean
): DisplayFlight[] {
  const now = Date.now();
  return flights.filter((f) => {
    const t = new Date(f.scheduledIso).getTime();
    return upcoming ? t >= now : t < now;
  });
}

/** Apply airline filter (empty = all). */
export function filterByAirline(
  flights: DisplayFlight[],
  airline: string
): DisplayFlight[] {
  if (!airline) return flights;
  return flights.filter((f) => f.airline === airline);
}

/** Apply destination (for departures) or origin (for arrivals) filter. */
export function filterByPlace(
  flights: DisplayFlight[],
  placeIata: string,
  isDeparture: boolean
): DisplayFlight[] {
  if (!placeIata) return flights;
  return flights.filter((f) =>
    isDeparture ? f.destinationIata === placeIata : f.originIata === placeIata
  );
}

/** Apply status filter (delayed, on time, scheduled, cancelled, in flight). */
export function filterByStatusOption(
  flights: DisplayFlight[],
  option: StatusFilterOption
): DisplayFlight[] {
  if (option === "all") return flights;
  switch (option) {
    case "delayed":
      return flights.filter((f) => (f.delayMinutes ?? 0) > 0);
    case "on_time":
      return flights.filter(
        (f) => (f.delayMinutes ?? 0) === 0 && (f.status === "scheduled" || f.status === "landed")
      );
    case "scheduled":
      return flights.filter((f) => f.status === "scheduled");
    case "cancelled":
      return flights.filter((f) => f.status === "cancelled");
    case "in_flight":
      return flights.filter((f) => f.status === "active");
    default:
      return flights;
  }
}

/** Sort flights: by scheduled time (closest to now first), estimated time, or status. */
export function sortFlights(
  flights: DisplayFlight[],
  sortBy: SortOption,
  upcoming: boolean
): DisplayFlight[] {
  const sorted = [...flights];
  const now = Date.now();

  switch (sortBy) {
    case "scheduled": {
      sorted.sort((a, b) => {
        const ta = new Date(a.scheduledIso).getTime();
        const tb = new Date(b.scheduledIso).getTime();
        if (upcoming) return ta - tb; // soonest first
        return tb - ta; // most recent first for historical
      });
      break;
    }
    case "estimated": {
      sorted.sort((a, b) => {
        const ta = a.estimatedIso ? new Date(a.estimatedIso).getTime() : new Date(a.scheduledIso).getTime();
        const tb = b.estimatedIso ? new Date(b.estimatedIso).getTime() : new Date(b.scheduledIso).getTime();
        if (upcoming) return ta - tb;
        return tb - ta;
      });
      break;
    }
    case "status": {
      sorted.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      break;
    }
  }
  return sorted;
}
