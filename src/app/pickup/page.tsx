"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import { formatDateTimeInTimezone } from "@/lib/flights";

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: { types?: string[]; fields?: string[] }
          ) => {
            addListener: (event: string, fn: () => void) => void;
            getPlace: () => { formatted_address?: string };
          };
        };
      };
    };
  }
}

const BAGGAGE_BASE_MIN = 20;
const BAGGAGE_EXTRA_PER_3_FLIGHTS = 5;
const LANDING_WINDOW_MIN = 30;

type FlightData = {
  flight: {
    flight_date: string;
    flight_status: string;
    departure: { airport: string; iata: string; scheduled: string; estimated: string | null };
    arrival: { airport: string; iata: string; scheduled: string; estimated: string | null; timezone: string };
    airline: { name: string };
    flight: { number: string; iata: string | null };
  };
};

function ensureUtcIso(iso: string | null): string | null {
  if (!iso || typeof iso !== "string") return null;
  const s = iso.trim();
  if (!s) return null;
  if (/[zZ]$/.test(s)) return s;
  if (/\+00:00$/.test(s)) return s.slice(0, -6) + "Z";
  if (/\+0000$/.test(s)) return s.slice(0, -5) + "Z";
  if (/[+-]\d{2}:?\d{2}(?::?\d{2})?$/.test(s)) return s;
  return s + "Z";
}

function parseUtcTime(iso: string | null): number {
  const utcIso = ensureUtcIso(iso);
  if (!utcIso) return 0;
  return new Date(utcIso).getTime();
}

export default function PickupPage() {
  const [flightParam, setFlightParam] = useState<string | null>(null);
  const [passengerInput, setPassengerInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const [driverAddress, setDriverAddress] = useState("");
  const [driveMinutes, setDriveMinutes] = useState<number | null>(null);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [baggageMinutes, setBaggageMinutes] = useState<number>(BAGGAGE_BASE_MIN);
  const [otherFlightsCount, setOtherFlightsCount] = useState(0);
  const [leaveAt, setLeaveAt] = useState<number | null>(null);
  const [leaveTimeFormatted, setLeaveTimeFormatted] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<{
    getPlace: () => { formatted_address?: string };
    addListener: (event: string, fn: () => void) => void;
  } | null>(null);

  const isDriverMode = flightParam != null && flightParam.trim() !== "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const f = params.get("flight");
    setFlightParam(f);
    if (f) setPassengerInput(f);
  }, []);

  useEffect(() => {
    if (!isDriverMode || !flightParam) return;
    setLookupLoading(true);
    setLookupError(null);
    fetch(`/api/flights/lookup?flight=${encodeURIComponent(flightParam)}`)
      .then((res) => res.json())
      .then((data: FlightData | { error: string }) => {
        if ("error" in data) {
          setLookupError(data.error);
          setFlightData(null);
        } else {
          setLookupError(null);
          setFlightData(data);
        }
      })
      .catch(() => {
        setLookupError("Failed to load flight.");
        setFlightData(null);
      })
      .finally(() => setLookupLoading(false));
  }, [isDriverMode, flightParam]);

  useEffect(() => {
    if (!flightData?.flight?.arrival?.iata) return;
    const arrIata = flightData.flight.arrival.iata;
    fetch(`/api/flights?airport=${encodeURIComponent(arrIata)}&type=arrival`)
      .then((res) => res.json())
      .then((json: { data?: Array<{ arrival: { scheduled: string; estimated: string | null } }> }) => {
        const list = json.data ?? [];
        const ourEstimated = flightData.flight.arrival.estimated || flightData.flight.arrival.scheduled;
        const ourTs = parseUtcTime(ourEstimated);
        const windowMs = LANDING_WINDOW_MIN * 60 * 1000;
        const other = list.filter((item: { arrival: { scheduled: string; estimated: string | null } }) => {
          const est = item.arrival.estimated || item.arrival.scheduled;
          const ts = parseUtcTime(est);
          return Math.abs(ts - ourTs) <= windowMs;
        });
        setOtherFlightsCount(Math.max(0, other.length - 1));
        const extra = Math.floor((other.length - 1) / 3) * BAGGAGE_EXTRA_PER_3_FLIGHTS;
        setBaggageMinutes(BAGGAGE_BASE_MIN + extra);
      })
      .catch(() => setBaggageMinutes(BAGGAGE_BASE_MIN));
  }, [flightData]);

  const landingTs = flightData
    ? parseUtcTime(flightData.flight.arrival.estimated || flightData.flight.arrival.scheduled)
    : 0;
  const tz = flightData?.flight.arrival.timezone || "UTC";

  useEffect(() => {
    if (!flightData || driveMinutes == null || driveMinutes < 0) {
      setLeaveAt(null);
      setLeaveTimeFormatted(null);
      return;
    }
    const baggageMs = baggageMinutes * 60 * 1000;
    const driveMs = driveMinutes * 60 * 1000;
    const leave = landingTs + baggageMs - driveMs;
    setLeaveAt(leave);
    const d = new Date(leave);
    setLeaveTimeFormatted(
      d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, [flightData, landingTs, baggageMinutes, driveMinutes]);

  const handlePlacesReady = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    const Autocomplete = window.google.maps.places.Autocomplete;
    autocompleteRef.current = new Autocomplete(inputRef.current, {
      types: ["address"],
      fields: ["formatted_address", "geometry"],
    });
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      const addr = place?.formatted_address;
      if (addr) setDriverAddress(addr);
    });
  }, []);

  useEffect(() => {
    if (!driverAddress || !flightData?.flight?.arrival?.airport) return;
    const destination = `${flightData.flight.arrival.airport} Airport`;
    const timer = setTimeout(() => {
      setDriveLoading(true);
      setDriveError(null);
      fetch("/api/distance-matrix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: driverAddress, destination }),
    })
      .then((res) => res.json())
      .then((data: { durationSeconds?: number; error?: string }) => {
        if (data.error) {
          setDriveError(data.error);
          setDriveMinutes(null);
        } else if (typeof data.durationSeconds === "number") {
          setDriveError(null);
          setDriveMinutes(Math.ceil(data.durationSeconds / 60));
        }
      })
      .catch(() => {
        setDriveError("Failed to get drive time.");
        setDriveMinutes(null);
      })
      .finally(() => setDriveLoading(false));
    }, 600);
    return () => clearTimeout(timer);
  }, [driverAddress, flightData?.flight?.arrival?.airport]);

  const handlePassengerLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const code = passengerInput.trim().toUpperCase();
    if (!code) return;
    setLookupLoading(true);
    setLookupError(null);
    setFlightData(null);
    fetch(`/api/flights/lookup?flight=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((data: FlightData | { error: string }) => {
        if ("error" in data) {
          setLookupError(data.error);
          setFlightData(null);
          setShareUrl(null);
        } else {
          setLookupError(null);
          setFlightData(data);
          const url = `${window.location.origin}/pickup?flight=${encodeURIComponent(code)}`;
          setShareUrl(url);
        }
      })
      .catch(() => {
        setLookupError("Failed to lookup flight.");
        setFlightData(null);
        setShareUrl(null);
      })
      .finally(() => setLookupLoading(false));
  };

  const copyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard!");
  };

  const handleNotifyMe = () => {
    const msg = leaveTimeFormatted
      ? `Leave at ${leaveTimeFormatted}`
      : "Set your address to see leave time.";
    alert(msg);
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Pickup reminder", { body: msg });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((p) => {
          if (p === "granted") new Notification("Pickup reminder", { body: msg });
        });
      }
    }
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&libraries=places`}
        onLoad={handlePlacesReady}
        strategy="afterInteractive"
      />
      <main className="min-h-screen bg-grid-pattern flex flex-col">
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Pickup timing</h1>
          <p className="text-slate-600 text-sm mb-6">
            {isDriverMode
              ? "Driver mode: enter your address to see when to leave."
              : "Passenger mode: enter a flight number to get a shareable link for your driver."}
          </p>

          {!isDriverMode && (
            <section className="mb-8">
              <form onSubmit={handlePassengerLookup} className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={passengerInput}
                  onChange={(e) => setPassengerInput(e.target.value)}
                  placeholder="Flight number (e.g. AA1004 or VS4593)"
                  className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="rounded-lg bg-cyan-600 text-white px-4 py-2 font-medium disabled:opacity-60"
                >
                  {lookupLoading ? "Looking up…" : "Look up flight"}
                </button>
              </form>
              {lookupError && <p className="mt-2 text-red-600 text-sm">{lookupError}</p>}
              {flightData && (
                <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="font-semibold text-slate-900">{flightData.flight.flight.iata ?? flightData.flight.flight.number}</p>
                  <p className="text-slate-600 text-sm">{flightData.flight.airline.name}</p>
                  <p className="text-slate-600 text-sm mt-1">
                    Arrives {formatDateTimeInTimezone(flightData.flight.arrival.estimated || flightData.flight.arrival.scheduled, tz)} at {flightData.flight.arrival.airport} ({flightData.flight.arrival.iata})
                  </p>
                  {shareUrl && (
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <input readOnly value={shareUrl} className="flex-1 min-w-0 rounded border border-slate-200 px-3 py-2 text-sm text-slate-600" />
                      <button type="button" onClick={copyShareLink} className="rounded-lg bg-slate-200 text-slate-800 px-3 py-2 text-sm font-medium">
                        Copy link
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {isDriverMode && (
            <>
              {lookupLoading && <p className="text-slate-600">Loading flight…</p>}
              {lookupError && <p className="text-red-600 text-sm">{lookupError}</p>}
              {flightData && (
                <>
                  <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white">
                    <p className="font-semibold text-slate-900">{flightData.flight.flight.iata ?? flightData.flight.flight.number}</p>
                    <p className="text-slate-600 text-sm">{flightData.flight.airline.name}</p>
                    <p className="text-slate-600 text-sm mt-1">
                      Est. landing {formatDateTimeInTimezone(flightData.flight.arrival.estimated || flightData.flight.arrival.scheduled, tz)} at {flightData.flight.arrival.airport}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                      Baggage estimate: {baggageMinutes} min ({otherFlightsCount} other flights within {LANDING_WINDOW_MIN} min)
                    </p>
                  </div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">Your address (driver)</label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={driverAddress}
                    onChange={(e) => setDriverAddress(e.target.value)}
                    placeholder="Start typing your address…"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 mb-2"
                  />
                  {driveLoading && <p className="text-slate-500 text-sm">Getting drive time…</p>}
                  {driveError && <p className="text-red-600 text-sm">{driveError}</p>}
                  {driveMinutes != null && !driveLoading && <p className="text-slate-600 text-sm">Drive time: ~{driveMinutes} min</p>}

                  {leaveAt != null && leaveTimeFormatted && (
                    <div className="mt-6 p-4 rounded-xl border-2 border-cyan-200 bg-cyan-50/50">
                      <p className="text-sm text-slate-600 mb-1">Leave by</p>
                      <p className="text-xl font-bold text-slate-900">{leaveTimeFormatted}</p>
                      <Countdown targetMs={leaveAt} />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleNotifyMe}
                    className="mt-6 rounded-lg bg-amber-500 text-white px-4 py-2 font-medium"
                  >
                    Notify Me
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Countdown({ targetMs }: { targetMs: number }) {
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setDiff(Math.max(0, Math.floor((targetMs - now) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (diff === null) return null;
  if (diff <= 0) return <p className="text-amber-700 font-medium mt-2">Leave now</p>;
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return (
    <p className="text-slate-600 text-sm mt-2">
      Time until leave: {m}m {s}s
    </p>
  );
}
