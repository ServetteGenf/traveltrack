"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function SetupProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [existing, setExisting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { window.location.href = "/login"; return; }
      setUser(session.user);
      // Check for existing username
      supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.username) setExisting(data.username);
        });
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (clean.length < 3) {
      setMessage({ text: "Username must be at least 3 characters (letters, numbers, _ or -).", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username: clean });
    if (error) {
      setMessage({ text: error.message.includes("unique") ? "That username is taken." : error.message, type: "error" });
    } else {
      setExisting(clean);
      setMessage({ text: `Your profile is live at traveltrack.me/u/${clean}`, type: "success" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-5 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">
        <div className="text-4xl mb-3">✏️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Set your username</h1>
        <p className="text-sm text-gray-500 mb-6">
          This will be your shareable profile URL: <br />
          <span className="font-mono text-green-600">traveltrack.me/u/yourname</span>
        </p>

        {existing && (
          <div className="mb-4 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
            Current username: <strong className="text-green-600">{existing}</strong>
          </div>
        )}

        <input
          type="text"
          placeholder="yourname"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 transition-colors mb-4"
        />

        {message && (
          <div className={`px-4 py-3 rounded-xl mb-4 text-sm text-left ${
            message.type === "error"
              ? "bg-red-50 text-red-600 border border-red-100"
              : "bg-green-50 text-green-700 border border-green-100"
          }`}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold text-sm transition-colors mb-4"
        >
          {loading ? "Saving..." : "Save Username"}
        </button>

        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <a href="/" className="hover:text-gray-600 transition-colors">← Back to map</a>
          {existing && (
            <a href={`/u/${existing}`} className="text-green-500 hover:text-green-600 transition-colors">
              View my profile →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
