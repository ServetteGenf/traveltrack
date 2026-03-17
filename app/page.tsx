"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import WorldMap from "@/components/WorldMap";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.username) setUsername(data.username);
      });
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-4">🌍</div>
          <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">TravelTrack 🌍</h1>
          <p className="text-gray-500 text-base">
            Track countries you&apos;ve visited and places you want to go
          </p>
        </div>

        {/* Auth bar */}
        <div className="flex justify-center mb-8">
          {user ? (
            <div className="flex items-center gap-3 flex-wrap justify-center text-sm">
              <span className="text-gray-600">
                Signed in as <strong>{username ?? user.email}</strong>
              </span>
              {username ? (
                <a href={`/u/${username}`} className="text-green-600 underline hover:text-green-700">
                  My public profile →
                </a>
              ) : (
                <a href="/setup-profile" className="text-green-600 underline hover:text-green-700">
                  Set up public profile →
                </a>
              )}
              <a href="/setup-profile" className="text-gray-400 hover:text-gray-600 underline text-xs">
                {username ? "Change username" : ""}
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-sm text-gray-500">Sign in to save your progress and get a shareable profile</span>
              <a
                href="/login"
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
              >
                Sign In / Sign Up
              </a>
            </div>
          )}
        </div>

        {/* Map */}
        <ErrorBoundary>
          <WorldMap user={user} />
        </ErrorBoundary>

      </div>
    </div>
  );
}
