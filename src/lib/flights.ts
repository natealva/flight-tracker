import type {
  AviationStackFlight,
  DisplayFlight,
  FlightStatus,
  SortOption,
  StatusFilterOption,
} from "@/types/flights";

/**
 * Ensure an ISO string from the API is parsed as UTC.
 * AviationStack returns times in UTC; if the string has no timezone (no Z or +00:00),
 * the browser would parse it as local time, giving wrong times and wrong upcoming/historical split.
 */
function ensureUtcIso(iso: string | null): string | null {
  if (!iso || typeof iso !== "string") return null;
  const s = iso.trim();
  if (!s) return null;
  if (/[zZ]$/.test(s)) return s;
  if (/[+-]\d{2}:?\d{2}(?::?\d{2})?$/.test(s)) return s;
  return s + "Z";
}

/** Format an ISO time string (UTC) in a given IANA timezone (e.g. America/Los_Angeles). */
export function formatTimeInTimezone(iso: string | null, timezone: string): string {
  const utcIso = ensureUtcIso(iso);
  if (!utcIso) return "—";
  try {
    const d = new Date(utcIso);
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

/** Parse ISO as UTC and return timestamp for comparison (upcoming/historical). */
function parseUtcTime(iso: string | null): number {
  const utcIso = ensureUtcIso(iso);
  if (!utcIso) return 0;
  return new Date(utcIso).getTime();
}

/**
 * Return the UTC timestamp for midnight (00:00:00) "today" in the given IANA timezone.
 * Used so Upcoming = flights from start of today (in airport time) onward; Historical = before that.
 */
function getStartOfTodayInTimezone(timezone: string): number {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dateFormatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const y = parseInt(get("year"), 10);
  const m = parseInt(get("month"), 10) - 1;
  const d = parseInt(get("day"), 10);

  const dayFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const wantDate = `${get("year")}-${get("month")}-${get("day")}`;
  for (let hour = 0; hour < 24; hour++) {
    const candidate = Date.UTC(y, m, d, hour, 0, 0, 0);
    const dayParts = dayFormatter.formatToParts(candidate);
    const dayGet = (type: string) => dayParts.find((p) => p.type === type)?.value ?? "";
    const dayDate = `${dayGet("year")}-${dayGet("month")}-${dayGet("day")}`;
    const dayHour = dayGet("hour");
    const dayMin = dayGet("minute");
    if (dayDate === wantDate && dayHour === "00" && dayMin === "00") return candidate;
  }
  return Date.UTC(y, m, d, 0, 0, 0, 0);
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
    scheduledIso: ensureUtcIso(raw.departure.scheduled) ?? raw.departure.scheduled,
    estimatedIso: ensureUtcIso(raw.departure.estimated) ?? raw.departure.estimated,
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
    scheduledIso: ensureUtcIso(raw.arrival.scheduled) ?? raw.arrival.scheduled,
    estimatedIso: ensureUtcIso(raw.arrival.estimated) ?? raw.arrival.estimated,
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

/**
 * Filter flights by upcoming vs historical using the selected airport's local date.
 * Upcoming = scheduled time (in UTC) is on or after start of "today" in airportTimezone.
 * Historical = scheduled time is before start of today in airportTimezone.
 * This way when it's still 2/23 in LA, flights on 2/24 UTC that are still 2/23 in LA appear in Upcoming.
 */
export function filterByUpcomingOrHistorical(
  flights: DisplayFlight[],
  upcoming: boolean,
  airportTimezone: string
): DisplayFlight[] {
  const cutoff = getStartOfTodayInTimezone(airportTimezone);
  return flights.filter((f) => {
    const t = parseUtcTime(f.scheduledIso);
    return upcoming ? t >= cutoff : t < cutoff;
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

  switch (sortBy) {
    case "scheduled": {
      sorted.sort((a, b) => {
        const ta = parseUtcTime(a.scheduledIso);
        const tb = parseUtcTime(b.scheduledIso);
        if (upcoming) return ta - tb; // soonest first
        return tb - ta; // most recent first for historical
      });
      break;
    }
    case "estimated": {
      sorted.sort((a, b) => {
        const ta = a.estimatedIso ? parseUtcTime(a.estimatedIso) : parseUtcTime(a.scheduledIso);
        const tb = b.estimatedIso ? parseUtcTime(b.estimatedIso) : parseUtcTime(b.scheduledIso);
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
