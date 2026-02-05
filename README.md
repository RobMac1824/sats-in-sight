# Lingo Lingo: BTC Blaster

A swipe-friendly, Star Fox–inspired rail shooter with a Betaflight-style HUD. Blast incoming ₿ targets, dodge obstacles, and chase your high score in this mobile-first HTML5 canvas game.

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

Update `js/supabase.js` with your project values:

```js
export const SUPABASE_URL = "YOUR_SUPABASE_URL";
export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

If Supabase is not configured, the game automatically uses localStorage and shows a warning banner.

### 3) Deploy on GitHub Pages

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Build and deployment** to the `main` branch (root folder).
3. Save. Your game will be available at `https://<your-username>.github.io/<repo-name>/`.

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

## File Structure

```
index.html
styles.css
js/
  main.js
  audio.js
  supabase.js
```
