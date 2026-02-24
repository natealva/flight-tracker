import { NextRequest, NextResponse } from "next/server";

const AVIATIONSTACK_BASE = "https://api.aviationstack.com/v1/flights";

export async function GET(request: NextRequest) {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AVIATIONSTACK_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const flight = searchParams.get("flight")?.trim();
  if (!flight) {
    return NextResponse.json(
      { error: "Query param 'flight' is required (e.g. flight=AA1004)." },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    access_key: apiKey,
    limit: "5",
    flight_iata: flight.toUpperCase(),
  });

  try {
    const res = await fetch(`${AVIATIONSTACK_BASE}?${params.toString()}`, {
      next: { revalidate: 120 },
    });
    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: json.error?.message || "AviationStack request failed" },
        { status: res.status >= 500 ? 502 : 400 }
      );
    }

    if (json.error) {
      return NextResponse.json(
        { error: json.error.message || "API error" },
        { status: 401 }
      );
    }

    const data = json.data ?? [];
    const arrival = data.find(
      (f: { flight_status: string; arrival?: { scheduled?: string } }) =>
        f.flight_status !== "cancelled" && f.arrival?.scheduled
    ) ?? data[0];
    if (!arrival) {
      return NextResponse.json(
        { error: "Flight not found or no arrival data." },
        { status: 404 }
      );
    }

    return NextResponse.json({ flight: arrival, all: data });
  } catch (err) {
    console.error("AviationStack lookup error:", err);
    return NextResponse.json(
      { error: "Failed to lookup flight" },
      { status: 502 }
    );
  }
}
