![CI](https://github.com/RobMac1824/sats-in-sight/actions/workflows/ci.yml/badge.svg)

https://robmac1824.github.io/sats-in-sight/

# Sats in Sight

A swipe-friendly, radar-HUD rail shooter with a tactical FPV vibe. Tag incoming sats, dodge obstacles, and chase your high score in this mobile-first HTML5 canvas game.

## Features

- Mobile-first swipe controls (touch + mouse + keyboard for desktop)
- - Canvas-based gameplay with safe-area support
  - - Auto-fire blaster with combo scoring
    - - Web Audio synth music + SFX (no external assets)
      - - Supabase-backed leaderboard with localStorage fallback
        - - Diagnostics toggle for FPS + touch vector
          - - 6 selectable drone skins with unique flight characteristics
           
            - ## Getting Started
           
            - ### Prerequisites
           
            - - [Node.js](https://nodejs.org/) (v18 or later recommended)
             
              - ### 1) Install and run locally
             
              - ```bash
                npm install
                npm run dev
                ```

                The game will be available at `http://localhost:5173`.

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
                create policy "public select" on leaderboard for select using (true);
                create policy "public insert" on leaderboard for insert with check (true);
                ```

                > Note: This setup is insert-only. Each play session adds a new row; the game queries the best score per username client-side. For stricter security, require authenticated users or move writes to an Edge Function.
                >
                > Copy `.env.example` to `.env` and fill in your project values:
                >
                > ```bash
                > cp .env.example .env
                > ```
                >
                > Then edit `.env`:
                >
                > ```
                > VITE_SUPABASE_URL=https://your-project.supabase.co
                > VITE_SUPABASE_ANON_KEY=your-anon-key
                > ```
                >
                > If Supabase is not configured, the game automatically uses localStorage and shows a warning banner.
                >
                > ### 3) Deploy on GitHub Pages
                >
                > The repo includes a GitHub Actions workflow (`deploy.yml`) that builds the project with Vite and deploys the `dist/` output to GitHub Pages automatically on push to `main`.
                >
                > To enable it:
                >
                > 1. Push this repo to GitHub.
                > 2. 2. In **Settings > Pages**, set **Source** to **GitHub Actions**.
                >    3. 3. The workflow will build and deploy on each push to `main`.
                >      
                >       4. Your game will be available at `https://<your-username>.github.io/<repo-name>/`.
                >      
                >       5. ## Development
                >      
                >       6. ### Local Development
                > 
                Start the Vite dev server with hot reload:

                ```bash
                npm run dev
                ```

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

                ### Testing

                ```bash
                npm test
                ```

                Runs 77 tests across 8 test suites covering all core modules.

                ### Linting & Formatting

                ```bash
                npm run lint
                npm run format:check
                ```

                ## Controls

                - **Touch / Swipe:** Move the drone ship (mobile).
                - - **WASD / Arrow keys:** Move the drone ship (desktop).
                  - - **Auto-fire:** Always firing.
                    - - **Diagnostics button:** Show FPS + touch vector.
                      - - **Mute button:** Toggle audio.
                       
                        - ## Gameplay Notes
                       
                        - - Targets are bitcoin symbols. Hit them for points.
                          - - Obstacles reduce health.
                            - - Combo multiplier builds when you hit targets in quick succession.
                              - - Difficulty ramps over time with faster spawns and higher speeds.
                               
                                - ## Attributions
                               
                                - Drone icon sources:
                               
                                - - Cinewhoop + Freestyle: Tabler Icons (MIT)
                                  - - Racer + Heavy Lift: Iconoir (MIT)
                                    - - Delivery: Game-icons.net "delivery-drone" (CC BY 3.0)
                                      - - Mapper: SVGRepo (CC0)
                                       
                                        - ## File Structure
                                       
                                        - ```
                                          .github/
                                            workflows/
                                              ci.yml
                                              deploy.yml
                                          js/
                                            __tests__/
                                              audio.test.js
                                              config.test.js
                                              entities.test.js
                                              input.test.js
                                              player.test.js
                                              setup.js
                                              state.test.js
                                              supabase.test.js
                                              utils.test.js
                                            audio.js
                                            config.js
                                            entities.js
                                            hud.js
                                            input.js
                                            logger.js
                                            main.js
                                            player.js
                                            renderer.js
                                            state.js
                                            supabase.js
                                            utils.js
                                          public/
                                            assets/
                                              drones/
                                                cinewhoop.svg
                                                delivery.svg
                                                freestyle.svg
                                                heavy-lift.svg
                                                mapper.svg
                                                racer.svg
                                          .env.example
                                          .gitignore
                                          .prettierignore
                                          .prettierrc
                                          eslint.config.js
                                          index.html
                                          package.json
                                          package-lock.json
                                          README.md
                                          styles.css
                                          vite.config.js
                                          vitest.config.js
                                          ```
