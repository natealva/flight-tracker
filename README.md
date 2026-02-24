# Flight Tracker

A Next.js web app to search airports by name or code and view upcoming departures and arrivals.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React 18**

## Getting started

1. **API key** — Get a free key at [aviationstack.com](https://aviationstack.com/signup/free). Create `.env.local` in the project root and add:

   ```
   AVIATIONSTACK_API_KEY=your_api_key_here
   ```

   (See `.env.example` for the variable name.)

2. **Run the app:**

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Search for an airport by name or code (e.g. "LAX", "San Francisco"); after selecting one, the app fetches real departures and arrivals from AviationStack and shows flight numbers, airlines, destinations/origins, scheduled and estimated times, and status.

## Project structure

- `src/app/` — App Router pages and layout
- `src/app/page.tsx` — Homepage with airport search and flight lists
- `src/app/api/flights/route.ts` — API route that proxies AviationStack (keeps API key server-side)
- `src/app/globals.css` — Global styles and Tailwind
- `src/components/` — `AirportSearch`, `FlightList`
- `src/lib/flights.ts` — Helpers to normalize and format flight data
- `src/types/flights.ts` — TypeScript types for AviationStack and UI
- `tailwind.config.ts` — Tailwind theme and custom colors

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint