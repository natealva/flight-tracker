// AviationStack API response types

export type FlightStatus =
  | "scheduled"
  | "active"
  | "landed"
  | "cancelled"
  | "incident"
  | "diverted";

export interface AviationStackDeparture {
  airport: string;
  timezone: string;
  iata: string;
  icao: string | null;
  terminal: string | null;
  gate: string | null;
  delay: number | null;
  scheduled: string;
  estimated: string | null;
  actual: string | null;
  estimated_runway: string | null;
  actual_runway: string | null;
}

export interface AviationStackArrival {
  airport: string;
  timezone: string;
  iata: string;
  icao: string | null;
  terminal: string | null;
  gate: string | null;
  baggage: string | null;
  delay: number | null;
  scheduled: string;
  estimated: string | null;
  actual: string | null;
  estimated_runway: string | null;
  actual_runway: string | null;
}

export interface AviationStackFlight {
  flight_date: string;
  flight_status: FlightStatus;
  departure: AviationStackDeparture;
  arrival: AviationStackArrival;
  airline: {
    name: string;
    iata: string | null;
    icao: string | null;
  };
  flight: {
    number: string;
    iata: string | null;
    icao: string | null;
    codeshared: unknown;
  };
}

export interface AviationStackResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: AviationStackFlight[];
}

// Normalized flight for UI (works for both departure and arrival views)
export interface DisplayFlight {
  flightNumber: string;
  flightIata: string;
  airline: string;
  airlineIata: string | null;
  origin: string;
  originIata: string;
  destination: string;
  destinationIata: string;
  /** ISO string for the scheduled time (departure or arrival depending on list) */
  scheduledIso: string;
  /** ISO string for estimated time, if any */
  estimatedIso: string | null;
  /** IANA timezone for the airport where scheduled/estimated apply (e.g. America/Los_Angeles) */
  timezone: string;
  status: FlightStatus;
  delayMinutes: number | null;
}

/** Filter by status category for UI */
export type StatusFilterOption =
  | "all"
  | "delayed"
  | "on_time"
  | "scheduled"
  | "cancelled"
  | "in_flight";

export type SortOption = "scheduled" | "estimated" | "status";
