![CI](https://github.com/RobMac1824/sats-in-sight/actions/workflows/ci.yml/badge.svg)
https://robmac1824.github.io/sats-in-sight/

# Sats in Sight

A swipe-friendly, radar-HUD rail shooter with a tactical FPV vibe. Tag incoming sats, dodge obstacles, and chase your high score in this mobile-first HTML5 canvas game.

## Features

- Mobile-first swipe controls (touch + mouse for desktop testing)
- Canvas-based gameplay with safe-area support
- Auto-fire blaster with power-up boost
- Web Audio synth music + SFX (no external assets)
- Supabase-backed leaderboard with localStorage fallback
- Diagnostics toggle for FPS + touch vector

## Getting Started

### 1) Run locally

Open `index.html` with a local server. For example:

```bash
python3 -m http.server
```

Then visit `http://localhost:8000`.

### 2) Configure Supabase (optional)

Create a new Supabase project and table named `leaderboard`.

**SQL (table + policies)**

```sql
create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  score int not null,
  created_at timestamptz default now()
);

alter table leaderboard enable row level security;

create policy "public select" on leaderboard
  for select
  using (true);

create policy "public insert" on leaderboard
  for insert
  with check (true);
```

> Note: This setup is insert-only. Each play session adds a new row; the game queries the best score per username client-side. For stricter security, require authenticated users or move writes to an Edge Function.

Copy `.env.example` to `.env` and fill in your project values:

```bash
cp .env.example .env
```

Then edit `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

If Supabase is not configured, the game automatically uses localStorage and shows a warning banner.

### 3) Deploy on GitHub Pages

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Build and deployment** to the `main` branch (root folder).
3. Save. Your game will be available at `https://<your-username>.github.io/<repo-name>/`.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)

### Setup

```bash
npm install
```

### Local Development

Start the Vite dev server with hot reload:

```bash
npm run dev
```

The game will be available at `http://localhost:5173`.

### Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials. The dev server reads these automatically via Vite's `import.meta.env`:

```bash
cp .env.example .env
```

### Production Build

```bash
npm run build
```

The optimised output is written to the `dist/` directory. Preview it locally with:

```bash
npm run preview
```

## Controls

- **Touch / Swipe:** Move the drone ship.
- **Auto-fire:** Always firing.
- **Diagnostics button:** Show FPS + touch vector.
- **Mute button:** Toggle audio.

## Gameplay Notes

- Targets are ₿ symbols. Hit them for points.
- Obstacles reduce health.
- Signal Boost power-ups increase fire rate and score value for a short time.
- Difficulty ramps over time with faster spawns and higher speeds.

## Attributions

Drone icon sources:

- Cinewhoop + Freestyle: Tabler Icons (MIT) — https://tabler-icons.io/
- Racer + Heavy Lift: Iconoir (MIT) — https://iconoir.com/
- Delivery: Game-icons.net “delivery-drone” (CC BY 3.0) — https://game-icons.net/
- Mapper: SVGRepo (CC0) — https://www.svgrepo.com/

## File Structure

```
index.html
styles.css
js/
  main.js
  audio.js
  supabase.js
assets/
  drones/
    cinewhoop.svg
    racer.svg
    freestyle.svg
    mapper.svg
    delivery.svg
    heavy-lift.svg
```
