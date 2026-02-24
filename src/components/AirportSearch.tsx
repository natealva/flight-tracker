"use client";

import { useState, useMemo, useRef, useEffect } from "react";

export type AirportOption = {
  name: string;
  code: string;
  city: string;
};

// Seed data for demo — replace with API later
const AIRPORTS: AirportOption[] = [
  { name: "Los Angeles International", code: "LAX", city: "Los Angeles, CA" },
  { name: "San Francisco International", code: "SFO", city: "San Francisco, CA" },
  { name: "John F. Kennedy International", code: "JFK", city: "New York, NY" },
  { name: "LaGuardia", code: "LGA", city: "New York, NY" },
  { name: "O'Hare International", code: "ORD", city: "Chicago, IL" },
  { name: "Miami International", code: "MIA", city: "Miami, FL" },
  { name: "Denver International", code: "DEN", city: "Denver, CO" },
  { name: "Seattle-Tacoma International", code: "SEA", city: "Seattle, WA" },
  { name: "Hartsfield-Jackson Atlanta International", code: "ATL", city: "Atlanta, GA" },
  { name: "Dallas/Fort Worth International", code: "DFW", city: "Dallas, TX" },
  { name: "Phoenix Sky Harbor International", code: "PHX", city: "Phoenix, AZ" },
  { name: "Boston Logan International", code: "BOS", city: "Boston, MA" },
  { name: "London Heathrow", code: "LHR", city: "London, UK" },
  { name: "London Gatwick", code: "LGW", city: "London, UK" },
  { name: "Paris Charles de Gaulle", code: "CDG", city: "Paris, France" },
  { name: "Tokyo Haneda", code: "HND", city: "Tokyo, Japan" },
  { name: "Dubai International", code: "DXB", city: "Dubai, UAE" },
  { name: "Singapore Changi", code: "SIN", city: "Singapore" },
  { name: "Amsterdam Schiphol", code: "AMS", city: "Amsterdam, Netherlands" },
  { name: "Frankfurt am Main", code: "FRA", city: "Frankfurt, Germany" },
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
        className="search-glow rounded-2xl border border-slate-600/50 bg-slate-900/80 backdrop-blur transition-all duration-200"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="text-slate-500" aria-hidden>
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
            className="flex-1 min-w-0 bg-transparent text-white placeholder-slate-500 text-base focus:outline-none"
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
              className="text-slate-500 hover:text-slate-300 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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
            className="border-t border-slate-700/50 max-h-72 overflow-y-auto rounded-b-2xl py-2"
          >
            {matches.length === 0 ? (
              <li className="px-5 py-4 text-slate-500 text-sm">No airports found. Try a different search.</li>
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
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <span className="font-medium">{airport.name}</span>
                  <span className="text-slate-500 ml-2">({airport.code})</span>
                  <span className="block text-slate-500 text-sm mt-0.5">{airport.city}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
