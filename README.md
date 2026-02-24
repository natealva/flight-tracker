# Flight Tracker

A Next.js web app to search airports by name or code and view upcoming departures and arrivals.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React 18**

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the search bar to find an airport by name (e.g. "San Francisco") or code (e.g. "SFO"). Selecting an airport shows a placeholder for departures and arrivals; you can connect a flight data API later to load real data.

## Project structure

- `src/app/` — App Router pages and layout
- `src/app/page.tsx` — Homepage with airport search
- `src/app/globals.css` — Global styles and Tailwind
- `src/components/` — Reusable UI (e.g. `AirportSearch`)
- `tailwind.config.ts` — Tailwind theme and custom colors

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint