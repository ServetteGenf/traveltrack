"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { supabase } from "@/lib/supabase";
import { getFlag, nameToCode, codeToName } from "@/lib/countries";
import StatsPanel from "@/components/StatsPanel";
import type { User } from "@supabase/supabase-js";

// ⚠️ Download https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
// save as /public/world-atlas.json and change this to "/world-atlas.json"
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const TOTAL_COUNTRIES = 195;

type Mode = "visited" | "wishlist";

interface WorldMapProps {
  user: User | null;
  readOnly?: boolean;
  sharedVisited?: string[]; // array of country_codes
  sharedWishlist?: string[]; // array of country_codes
}

export default function WorldMap({
  user,
  readOnly = false,
  sharedVisited,
  sharedWishlist,
}: WorldMapProps) {
  // Internal state stores country_codes (e.g. "DE", "FR")
  const [visitedCodes, setVisitedCodes] = useState<string[]>(sharedVisited ?? []);
  const [wishlistCodes, setWishlistCodes] = useState<string[]>(sharedWishlist ?? []);
  const [mode, setMode] = useState<Mode>("visited");
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [showList, setShowList] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  // Load data from Supabase (country_code) or localStorage
  useEffect(() => {
    if (readOnly) return;
    const load = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("visited_countries")
          .select("country_code, mode")
          .eq("user_id", user.id);
        if (!error && data) {
          setVisitedCodes(data.filter((r) => r.mode === "visited").map((r) => r.country_code));
          setWishlistCodes(data.filter((r) => r.mode === "wishlist").map((r) => r.country_code));
        }
      } else {
        const v = localStorage.getItem("visitedCountries");
        const w = localStorage.getItem("wishlistCountries");
        if (v) setVisitedCodes(JSON.parse(v));
        if (w) setWishlistCodes(JSON.parse(w));
      }
    };
    load();
  }, [user, readOnly]);

  // Debounced localStorage save (stores codes)
  const saveToLocalStorage = useCallback((v: string[], w: string[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem("visitedCountries", JSON.stringify(v));
      localStorage.setItem("wishlistCountries", JSON.stringify(w));
    }, 300);
  }, []);

  const toggleCountry = async (countryName: string) => {
    if (!countryName || readOnly) return;
    const code = nameToCode(countryName);
    if (!code) return; // unmapped territory, skip

    const currentCodes = mode === "visited" ? visitedCodes : wishlistCodes;
    const setCodes = mode === "visited" ? setVisitedCodes : setWishlistCodes;
    const isIn = currentCodes.includes(code);

    if (user) {
      setSaving(true);
      if (isIn) {
        await supabase
          .from("visited_countries")
          .delete()
          .eq("user_id", user.id)
          .eq("country_code", code)
          .eq("mode", mode);
        setCodes((prev) => prev.filter((c) => c !== code));
      } else {
        await supabase
          .from("visited_countries")
          .insert({ user_id: user.id, country_code: code, mode });
        setCodes((prev) => [...prev, code]);
      }
      setSaving(false);
    } else {
      const updated = isIn
        ? currentCodes.filter((c) => c !== code)
        : [...currentCodes, code];
      if (mode === "visited") {
        setVisitedCodes(updated);
        saveToLocalStorage(updated, wishlistCodes);
      } else {
        setWishlistCodes(updated);
        saveToLocalStorage(visitedCodes, updated);
      }
    }
  };

  const handleReset = async () => {
    const label = mode === "visited" ? "visited" : "wishlist";
    const count = mode === "visited" ? visitedCodes.length : wishlistCodes.length;
    if (!window.confirm(`Reset all ${count} ${label} countries? This cannot be undone.`)) return;

    if (user) {
      setSaving(true);
      await supabase
        .from("visited_countries")
        .delete()
        .eq("user_id", user.id)
        .eq("mode", mode);
      setSaving(false);
    } else {
      localStorage.removeItem(mode === "visited" ? "visitedCountries" : "wishlistCountries");
    }
    if (mode === "visited") setVisitedCodes([]);
    else setWishlistCodes([]);
  };

  // For display: convert codes → names
  const visitedNames = visitedCodes.map((c) => codeToName[c]).filter(Boolean);
  const wishlistNames = wishlistCodes.map((c) => codeToName[c]).filter(Boolean);
  const currentNames = mode === "visited" ? visitedNames : wishlistNames;

  const shareText = `I've visited ${visitedCodes.length} countries 🌍 — check out my TravelTrack map!`;

  const getCountryFill = (countryName: string) => {
    const code = nameToCode(countryName);
    if (!code) return "#e5e7eb";
    if (visitedCodes.includes(code)) return "url(#gradVisited)";
    if (wishlistCodes.includes(code)) return "#93c5fd";
    return "#e5e7eb";
  };

  const getHoverFill = (countryName: string) => {
    const code = nameToCode(countryName);
    if (!code) return "#d1d5db";
    if (visitedCodes.includes(code)) return "#16a34a";
    if (wishlistCodes.includes(code)) return "#60a5fa";
    return mode === "visited" ? "#bbf7d0" : "#bfdbfe";
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-8 relative">

      {saving && (
        <div className="absolute top-4 right-5 text-xs text-green-500 font-medium animate-pulse">
          Saving...
        </div>
      )}

      {/* Tooltip */}
      {hoveredCountry && hoverPosition && (
        <div
          className="fixed z-50 px-3 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-lg shadow-lg pointer-events-none"
          style={{ top: hoverPosition.y + 15, left: hoverPosition.x + 15 }}
        >
          {getFlag(hoveredCountry)} {hoveredCountry}
          {nameToCode(hoveredCountry) && visitedCodes.includes(nameToCode(hoveredCountry)!) && " ✅"}
          {nameToCode(hoveredCountry) && wishlistCodes.includes(nameToCode(hoveredCountry)!) && " 💙"}
        </div>
      )}

      {/* Mode toggle */}
      {!readOnly && (
        <div className="flex justify-center mb-5">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(["visited", "wishlist"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "visited" ? "✅ Visited" : "💙 Wishlist"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      <h2 className="text-xl font-semibold text-gray-900 text-center">
        {readOnly
          ? `Visited ${visitedCodes.length} / ${TOTAL_COUNTRIES} countries`
          : mode === "visited"
          ? `Visited ${visitedCodes.length} / ${TOTAL_COUNTRIES} countries (${Math.round((visitedCodes.length / TOTAL_COUNTRIES) * 100)}%)`
          : `${wishlistCodes.length} countries on your wishlist`}
      </h2>

      {mode === "visited" && (
        <div className="w-3/5 h-4 bg-gray-200 mx-auto mt-3 mb-5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-300 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${(visitedCodes.length / TOTAL_COUNTRIES) * 100}%` }}
          />
        </div>
      )}

      {/* Social share */}
      {!readOnly && visitedCodes.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold hover:brightness-110 transition-all"
            style={{ backgroundColor: "#1DA1F2" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white"><path d="M24 4.557a9.828 9.828 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724 9.864 9.864 0 0 1-3.127 1.195 4.916 4.916 0 0 0-8.379 4.482A13.94 13.94 0 0 1 1.671 3.149 4.916 4.916 0 0 0 3.195 9.72a4.902 4.902 0 0 1-2.228-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.935 4.935 0 0 1-2.224.084 4.918 4.918 0 0 0 4.59 3.417A9.867 9.867 0 0 1 0 19.54 13.924 13.924 0 0 0 7.548 22c9.142 0 14.307-7.721 13.995-14.646A9.935 9.935 0 0 0 24 4.557z" /></svg>
            Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold hover:brightness-110 transition-all"
            style={{ backgroundColor: "#1877F2" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white"><path d="M22.675 0h-21.35C.596 0 0 .593 0 1.326v21.348C0 23.405.596 24 1.326 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.794.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.312h3.588l-.467 3.622h-3.121V24h6.116c.73 0 1.326-.595 1.326-1.326V1.326C24 .593 23.404 0 22.675 0z" /></svg>
            Facebook
          </a>
          <button
            onClick={() => { navigator.clipboard.writeText(`${shareText} ${currentUrl}`); alert("Copied!"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white"><path d="M3.9 12a3.9 3.9 0 0 1 3.9-3.9h4.2a.75.75 0 0 1 0 1.5H7.8a2.4 2.4 0 1 0 0 4.8h4.2a.75.75 0 0 1 0 1.5H7.8A3.9 3.9 0 0 1 3.9 12zm6-1.65a.75.75 0 0 1 .75-.75h8.4a3.9 3.9 0 1 1 0 7.8h-8.4a.75.75 0 0 1 0-1.5h8.4a2.4 2.4 0 1 0 0-4.8h-8.4a.75.75 0 0 1-.75-.75z" /></svg>
            Copy Link
          </button>
        </div>
      )}

      {/* Empty state */}
      {!readOnly && (mode === "visited" ? visitedCodes : wishlistCodes).length === 0 && (
        <p className="text-center text-sm text-gray-400 mb-2">
          {mode === "visited"
            ? "👆 Click any country to mark it as visited!"
            : "💙 Click any country to add it to your wishlist!"}
        </p>
      )}

      {/* Map */}
      <div className="relative">
        {mapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading map...</span>
            </div>
          </div>
        )}
        <ComposableMap style={{ margin: "0 auto", maxWidth: "100%", cursor: readOnly ? "default" : "pointer" }}>
          <Geographies geography={geoUrl}>
            {({ geographies }: any) => {
               return geographies.map((geo: any) => {
                const countryName = geo.properties.name;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => toggleCountry(countryName)}
                    onMouseEnter={(e: React.MouseEvent) => {
                      setHoveredCountry(countryName);
                      setHoverPosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e: React.MouseEvent) =>
                      setHoverPosition({ x: e.clientX, y: e.clientY })
                    }
                    onMouseLeave={() => {
                      setHoveredCountry(null);
                      setHoverPosition(null);
                    }}
                    style={{
                      default: { fill: getCountryFill(countryName), outline: "none", transition: "fill 0.15s" },
                      hover: { fill: getHoverFill(countryName), outline: "none" },
                      pressed: { fill: "#15803d", outline: "none" },
                    }}
                  />
                );
              });
            }}
          </Geographies>
          <defs>
            <linearGradient id="gradVisited" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-5 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-green-400" /> Visited</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-blue-300" /> Wishlist</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-gray-200" /> Not visited</span>
      </div>

      {/* Stats */}
      <StatsPanel visited={visitedNames} wishlist={wishlistNames} />

      {/* Reset + list */}
      {!readOnly && currentNames.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
            >
              Reset {mode === "visited" ? "visited" : "wishlist"}
            </button>
            <button
              onClick={() => setShowList((s) => !s)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm font-semibold transition-colors"
            >
              {showList ? "Hide list ▲" : "Show list ▼"}
            </button>
          </div>
          {showList && (
            <ul className="grid gap-1.5 text-sm text-gray-700"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {currentNames.sort().map((name) => (
                <li key={name} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <span>{getFlag(name)}</span>
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Guest prompt */}
      {!user && !readOnly && (visitedCodes.length > 0 || wishlistCodes.length > 0) && (
        <p className="mt-5 text-center text-xs text-gray-400">
          💡{" "}
          <a href="/login" className="text-green-500 underline hover:text-green-600">Sign in</a>
          {" "}to save your countries across all devices
        </p>
      )}
    </div>
  );
}
