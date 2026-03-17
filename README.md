# 🌍 TravelTrack

Track and share every country you've visited on an interactive world map.

**Live site:** [traveltrack.me](https://traveltrack.me)

## Features

- 🗺️ Interactive world map — click any country to mark it as visited
- 📊 Progress tracker — see how many countries you've covered
- 💾 Persistent data — sign in to save your countries across all devices
- 🔗 Shareable profile — share your map with friends via `/u/[username]`
- 🌟 Wishlist mode — track countries you want to visit
- 📱 PWA — installable on mobile as a home screen app
- 🔐 Auth — email/password or Google sign-in via Supabase

## Tech Stack

- [Next.js 16](https://nextjs.org/) — React framework
- [Supabase](https://supabase.com/) — Auth + database
- [react-simple-maps](https://www.react-simple-maps.io/) — SVG world map
- [Tailwind CSS v4](https://tailwindcss.com/) — Styling
- [Vercel](https://vercel.com/) — Deployment

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

## Supabase Setup

Run this SQL in your Supabase SQL editor:

```sql
-- Visited countries
create table visited_countries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  country_name text not null,
  mode text not null default 'visited', -- 'visited' or 'wishlist'
  created_at timestamp default now(),
  unique(user_id, country_name, mode)
);

alter table visited_countries enable row level security;

create policy "Users can manage their own countries"
on visited_countries for all
using (auth.uid() = user_id);

-- Public profiles
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  created_at timestamp default now()
);

alter table profiles enable row level security;

create policy "Profiles are publicly readable"
on profiles for select using (true);

create policy "Users can update their own profile"
on profiles for all using (auth.uid() = id);
```
