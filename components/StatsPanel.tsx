"use client";

import { countryData, continentTotals } from "@/lib/countries";

interface StatsPanelProps {
  visited: string[];  // display names
  wishlist: string[]; // display names
}

export default function StatsPanel({ visited, wishlist }: StatsPanelProps) {
  const total = 195;

  const continentVisited: Record<string, number> = {};
  for (const name of visited) {
    const continent = countryData[name]?.continent;
    if (continent) {
      continentVisited[continent] = (continentVisited[continent] ?? 0) + 1;
    }
  }

  const continents = Object.entries(continentTotals).map(([name, ctotal]) => ({
    name,
    visited: continentVisited[name] ?? 0,
    total: ctotal,
    pct: Math.round(((continentVisited[name] ?? 0) / ctotal) * 100),
  })).sort((a, b) => b.pct - a.pct);

  const continentEmojis: Record<string, string> = {
    "Europe": "🇪🇺", "Asia": "🌏", "Africa": "🌍",
    "North America": "🌎", "South America": "🌎", "Oceania": "🌊",
  };

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-green-50 rounded-2xl p-5 text-center">
        <div className="text-4xl font-bold text-green-600">{visited.length}</div>
        <div className="text-sm text-gray-500 mt-1">Countries visited</div>
        <div className="text-xs text-gray-400 mt-0.5">{Math.round((visited.length / total) * 100)}% of the world</div>
      </div>
      <div className="bg-blue-50 rounded-2xl p-5 text-center">
        <div className="text-4xl font-bold text-blue-500">{total - visited.length}</div>
        <div className="text-sm text-gray-500 mt-1">Countries remaining</div>
        <div className="text-xs text-gray-400 mt-0.5">out of {total} total</div>
      </div>
      <div className="bg-amber-50 rounded-2xl p-5 text-center">
        <div className="text-4xl font-bold text-amber-500">{wishlist.length}</div>
        <div className="text-sm text-gray-500 mt-1">On your wishlist</div>
        <div className="text-xs text-gray-400 mt-0.5">places to explore</div>
      </div>

      {visited.length > 0 && (
        <div className="sm:col-span-3 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Breakdown by continent</h3>
          <div className="space-y-3">
            {continents.map(({ name, visited: v, total: t, pct }) => (
              <div key={name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{continentEmojis[name]} {name}</span>
                  <span className="text-xs text-gray-400">{v}/{t} · {pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-300 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
