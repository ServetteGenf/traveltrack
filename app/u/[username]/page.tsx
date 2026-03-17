import { createClient } from "@supabase/supabase-js";
import WorldMap from "@/components/WorldMap";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { Metadata } from "next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = params;
  return {
    title: `${username}'s Travel Map — TravelTrack`,
    description: `Check out ${username}'s visited countries on TravelTrack!`,
    openGraph: {
      title: `${username}'s Travel Map`,
      description: `See where ${username} has been on TravelTrack`,
      url: `https://traveltrack.me/u/${username}`,
    },
  };
}

export default async function PublicProfile({ params }: Props) {
  const { username } = params;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile not found</h1>
          <p className="text-gray-500 mb-6">No TravelTrack user with that username exists.</p>
          <a href="/" className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-colors">
            ← Back to TravelTrack
          </a>
        </div>
      </div>
    );
  }

  // Load their countries — returns country_code values
  const { data: countries } = await supabase
    .from("visited_countries")
    .select("country_code, mode")
    .eq("user_id", profile.id);

  const visitedCodes = (countries ?? [])
    .filter((r) => r.mode === "visited")
    .map((r) => r.country_code);

  const wishlistCodes = (countries ?? [])
    .filter((r) => r.mode === "wishlist")
    .map((r) => r.country_code);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{username}&apos;s Travel Map</h1>
          <p className="text-gray-500 text-sm">
            Visited <strong>{visitedCodes.length}</strong> countries ·{" "}
            <strong>{wishlistCodes.length}</strong> on the wishlist
          </p>
          <a href="/" className="inline-block mt-3 text-xs text-green-600 hover:text-green-700 underline">
            Build your own on TravelTrack →
          </a>
        </div>

        <ErrorBoundary>
          <WorldMap
            user={null}
            readOnly
            sharedVisited={visitedCodes}
            sharedWishlist={wishlistCodes}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
