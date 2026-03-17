"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleAuth = async () => {
    if (!email || !password) {
      setMessage({ text: "Please enter your email and password.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ text: error.message, type: "error" });
      else window.location.href = "/";
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage({ text: error.message, type: "error" });
      else setMessage({ text: "Account created! Check your email to confirm your signup.", type: "success" });
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setMessage({ text: error.message, type: "error" });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-5 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">

        {/* Logo */}
        <div className="mb-8">
          <div className="text-5xl mb-2">🌍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">TravelTrack</h1>
          <p className="text-sm text-gray-500">
            {isLogin ? "Welcome back! Sign in to continue." : "Create an account to start tracking."}
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors mb-5 disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Toggle tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5 gap-1">
          {["Login", "Sign Up"].map((tab) => {
            const active = (tab === "Login") === isLogin;
            return (
              <button
                key={tab}
                onClick={() => { setIsLogin(tab === "Login"); setMessage(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  active ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3 mb-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 transition-colors"
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`px-4 py-3 rounded-xl mb-4 text-sm text-left ${
            message.type === "error"
              ? "bg-red-50 text-red-600 border border-red-100"
              : "bg-green-50 text-green-700 border border-green-100"
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold text-sm transition-colors mb-5"
        >
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </button>

        <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Back to TravelTrack
        </a>
      </div>
    </div>
  );
}
