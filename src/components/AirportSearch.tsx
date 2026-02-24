"use client";

import { useState, useMemo, useRef, useEffect } from "react";

export type AirportOption = {
  name: string;
  code: string;
  city: string;
  /** IANA timezone (e.g. America/Los_Angeles) for local time display */
  timezone: string;
};

// Seed data with timezones for local time display
const AIRPORTS: AirportOption[] = [
  { name: "Los Angeles International", code: "LAX", city: "Los Angeles, CA", timezone: "America/Los_Angeles" },
  { name: "San Francisco International", code: "SFO", city: "San Francisco, CA", timezone: "America/Los_Angeles" },
  { name: "John F. Kennedy International", code: "JFK", city: "New York, NY", timezone: "America/New_York" },
  { name: "LaGuardia", code: "LGA", city: "New York, NY", timezone: "America/New_York" },
  { name: "O'Hare International", code: "ORD", city: "Chicago, IL", timezone: "America/Chicago" },
  { name: "Miami International", code: "MIA", city: "Miami, FL", timezone: "America/New_York" },
  { name: "Denver International", code: "DEN", city: "Denver, CO", timezone: "America/Denver" },
  { name: "Seattle-Tacoma International", code: "SEA", city: "Seattle, WA", timezone: "America/Los_Angeles" },
  { name: "Hartsfield-Jackson Atlanta International", code: "ATL", city: "Atlanta, GA", timezone: "America/New_York" },
  { name: "Dallas/Fort Worth International", code: "DFW", city: "Dallas, TX", timezone: "America/Chicago" },
  { name: "Phoenix Sky Harbor International", code: "PHX", city: "Phoenix, AZ", timezone: "America/Phoenix" },
  { name: "Boston Logan International", code: "BOS", city: "Boston, MA", timezone: "America/New_York" },
  { name: "London Heathrow", code: "LHR", city: "London, UK", timezone: "Europe/London" },
  { name: "London Gatwick", code: "LGW", city: "London, UK", timezone: "Europe/London" },
  { name: "Paris Charles de Gaulle", code: "CDG", city: "Paris, France", timezone: "Europe/Paris" },
  { name: "Tokyo Haneda", code: "HND", city: "Tokyo, Japan", timezone: "Asia/Tokyo" },
  { name: "Dubai International", code: "DXB", city: "Dubai, UAE", timezone: "Asia/Dubai" },
  { name: "Singapore Changi", code: "SIN", city: "Singapore", timezone: "Asia/Singapore" },
  { name: "Amsterdam Schiphol", code: "AMS", city: "Amsterdam, Netherlands", timezone: "Europe/Amsterdam" },
  { name: "Frankfurt am Main", code: "FRA", city: "Frankfurt, Germany", timezone: "Europe/Berlin" },
];

type AirportSearchProps = {
  onSelect: (airport: AirportOption) => void;
};

export function AirportSearch({ onSelect }: AirportSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    if (!query.trim()) return AIRPORTS.slice(0, 8);
    const q = query.trim().toLowerCase();
    return AIRPORTS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") setIsOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % matches.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + matches.length) % matches.length);
      return;
    }
    if (e.key === "Enter" && matches[highlightIndex]) {
      e.preventDefault();
      onSelect(matches[highlightIndex]);
      setQuery(matches[highlightIndex].name);
      setIsOpen(false);
    }
  }

  function handleSelect(airport: AirportOption) {
    onSelect(airport);
    setQuery(airport.name);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="search-glow rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="text-slate-400" aria-hidden>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search by airport name or code (e.g. LAX, San Francisco)"
            className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder-slate-500 text-base focus:outline-none"
            aria-label="Search airports"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls="airport-listbox"
            aria-activedescendant={isOpen && matches[highlightIndex] ? `option-${highlightIndex}` : undefined}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-slate-700 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {isOpen && (
          <ul
            id="airport-listbox"
            role="listbox"
            className="border-t border-slate-200 max-h-72 overflow-y-auto rounded-b-2xl py-2"
          >
            {matches.length === 0 ? (
              <li className="px-5 py-4 text-slate-600 text-sm">No airports found. Try a different search.</li>
            ) : (
              matches.map((airport, i) => (
                <li
                  key={`${airport.code}-${i}`}
                  id={`option-${i}`}
                  role="option"
                  aria-selected={i === highlightIndex}
                  onClick={() => handleSelect(airport)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`px-5 py-3 cursor-pointer transition-colors ${
                    i === highlightIndex
                      ? "bg-cyan-100 text-cyan-800"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="font-medium">{airport.name}</span>
                  <span className="text-slate-500 ml-2">({airport.code})</span>
                  <span className="block text-slate-600 text-sm mt-0.5">{airport.city}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
