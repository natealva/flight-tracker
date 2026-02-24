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
  scheduledTime: string;
  estimatedTime: string | null;
  status: FlightStatus;
  delayMinutes: number | null;
}
