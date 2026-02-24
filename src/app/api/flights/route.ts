import { NextRequest, NextResponse } from "next/server";

const AVIATIONSTACK_BASE = "https://api.aviationstack.com/v1/flights";

export async function GET(request: NextRequest) {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AVIATIONSTACK_API_KEY is not configured. Add it to .env.local." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const airport = searchParams.get("airport");
  const type = searchParams.get("type"); // "departure" | "arrival"

  if (!airport || !/^[A-Za-z]{3}$/.test(airport)) {
    return NextResponse.json(
      { error: "Valid airport IATA code (3 letters) is required." },
      { status: 400 }
    );
  }

  if (type !== "departure" && type !== "arrival") {
    return NextResponse.json(
      { error: "Query param 'type' must be 'departure' or 'arrival'." },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    access_key: apiKey,
    limit: "50",
    ...(type === "departure" ? { dep_iata: airport.toUpperCase() } : { arr_iata: airport.toUpperCase() }),
  });

  try {
    const res = await fetch(`${AVIATIONSTACK_BASE}?${params.toString()}`, {
      next: { revalidate: 60 },
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

    return NextResponse.json(json);
  } catch (err) {
    console.error("AviationStack fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch flight data" },
      { status: 502 }
    );
  }
}
