import type { AviationStackFlight, DisplayFlight } from "@/types/flights";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

export function normalizeFlight(raw: AviationStackFlight): DisplayFlight {
  return {
    flightNumber: raw.flight.number,
    flightIata: raw.flight.iata ?? `${raw.airline.iata ?? ""}${raw.flight.number}`,
    airline: raw.airline.name,
    airlineIata: raw.airline.iata,
    origin: raw.departure.airport,
    originIata: raw.departure.iata,
    destination: raw.arrival.airport,
    destinationIata: raw.arrival.iata,
    scheduledTime: formatTime(raw.departure.scheduled),
    estimatedTime: raw.departure.estimated
      ? formatTime(raw.departure.estimated)
      : null,
    status: raw.flight_status,
    delayMinutes: raw.departure.delay,
  };
}

export function normalizeArrival(raw: AviationStackFlight): DisplayFlight {
  return {
    flightNumber: raw.flight.number,
    flightIata: raw.flight.iata ?? `${raw.airline.iata ?? ""}${raw.flight.number}`,
    airline: raw.airline.name,
    airlineIata: raw.airline.iata,
    origin: raw.departure.airport,
    originIata: raw.departure.iata,
    destination: raw.arrival.airport,
    destinationIata: raw.arrival.iata,
    scheduledTime: formatTime(raw.arrival.scheduled),
    estimatedTime: raw.arrival.estimated
      ? formatTime(raw.arrival.estimated)
      : null,
    status: raw.flight_status,
    delayMinutes: raw.arrival.delay,
  };
}

export function statusLabel(status: DisplayFlight["status"]): string {
  const labels: Record<DisplayFlight["status"], string> = {
    scheduled: "Scheduled",
    active: "In flight",
    landed: "Landed",
    cancelled: "Cancelled",
    incident: "Incident",
    diverted: "Diverted",
  };
  return labels[status] ?? status;
}

export function statusColor(status: DisplayFlight["status"]): string {
  switch (status) {
    case "active":
      return "text-cyan-400";
    case "landed":
      return "text-emerald-400";
    case "scheduled":
      return "text-slate-300";
    case "cancelled":
      return "text-red-400";
    case "incident":
    case "diverted":
      return "text-amber-400";
    default:
      return "text-slate-400";
  }
}
