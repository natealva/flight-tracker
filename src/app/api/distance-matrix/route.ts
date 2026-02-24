import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY is not configured." },
      { status: 500 }
    );
  }

  let body: { origin?: string; destination?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const origin = body.origin?.trim();
  const destination = body.destination?.trim();
  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Body must include 'origin' and 'destination' strings." },
      { status: 400 }
    );
  }

  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("origins", origin);
  url.searchParams.set("destinations", destination);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("departure_time", String(Math.floor(Date.now() / 1000)));
  url.searchParams.set("traffic_model", "best_guess");

  try {
    const res = await fetch(url.toString());
    const json = await res.json();

    if (json.status !== "OK") {
      return NextResponse.json(
        { error: json.error_message || json.status || "Distance Matrix request failed" },
        { status: 400 }
      );
    }

    const element = json.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      return NextResponse.json(
        { error: "No route found or invalid addresses." },
        { status: 400 }
      );
    }

    const duration = element.duration_in_traffic ?? element.duration;
    const seconds = duration?.value;
    if (typeof seconds !== "number") {
      return NextResponse.json(
        { error: "Could not get duration." },
        { status: 400 }
      );
    }

    return NextResponse.json({ durationSeconds: seconds });
  } catch (err) {
    console.error("Distance Matrix error:", err);
    return NextResponse.json(
      { error: "Failed to get drive time" },
      { status: 502 }
    );
  }
}
