# Week in Hanoi: Carbon Quest

**A 5‑day eco-choice browser game set in a compact Hanoi city map.** Navigate the city, make daily choices across transport, food, coffee, home energy, and venues, earn coins, and invest in city improvements to offset your footprint. Everything runs client‑side with no backend.

## Overview
Week in Hanoi: Carbon Quest is a lightweight, client-only web game where you play through five in‑game days. Each day, you move around a simplified Hanoi‑style grid, visit points of interest (home, food stalls, café, school, company, bus stops), and make choices that add or reduce your CO2 for the day. Random events and daily weather modify outcomes. Earn coins by making smarter choices, then spend them at the end on investments like trees, solar, and bike‑sharing to reduce your overall impact.

The experience emphasizes approachable learning: quick choices, visible CO2 deltas, daily summaries with tips, and a final report with a simple Eco Index ranking. It is accessible on desktop and mobile, supports keyboard and on‑screen controls, and saves progress locally so you can continue where you left off.

## Features
- Five‑day simulation with dynamic weather (sunny, rainy, cloudy, smoggy) that affects outcomes and shows a banner each day.
- Hanoi city grid with accessible points of interest: Home, School, Company, Food Stalls A/B/C, Café, Fine Dining, and Bus Stops.
- Movement via arrow keys/WASD or on‑screen D‑pad; click adjacent tiles to step; pathfinding animates vehicle travel.
- Transport choices with modifiers: Walk, Bike, Motorbike, Bus. Sunny days reward walk/bike with extra coins; rainy days add a motorbike CO2 penalty.
- Home actions (bedroom, kitchen, living) and home climate (Fan/AC) with CO2 and coin trade‑offs; Sleep to end the day.
- Venue menus with clear impacts: food stalls, café (auto AC load on dine‑in), fine dining (ambience load), and reusable toggles for extra savings/coins.
- Random daily events (traffic jam, power cut, discounts, campaigns, sick day) that alter CO2/coins.
- Daily quiz (once per day) grants bonus coins and a short fact.
- End‑of‑day summary with top emitter category, coins gained, and a helpful tip.
- Final “Investments” phase to spend coins on reductions (Plant Tree, Solar, Bike‑sharing, Reusable Bottle) and see trees planted.
- Final Report calculates Net CO2, total coins spent, and an Eco Index with rank (Eco Hero, Conscious Citizen, Urban Polluter).
- Persistent local save (localStorage), a Continue option on the menu, audio mute toggle, and simple profile editing (name + emoji).
- Client‑only implementation: HTML/CSS/JS ES modules, no build step or backend; runs in any modern browser.

## Instructions to run the game
- Step 1: Open a modern browser and serve the `game_app` folder as a static site (recommended). For example:
  - Python: `cd game_app && python -m http.server 8000` then visit `http://localhost:8000/index.html`.
  - Node: `npx serve game_app -p 5173` then visit `http://localhost:5173`.
  - Or open `game_app/index.html` directly, though a server avoids media/autoplay restrictions.
- Step 2: From the menu, click `Play` to start a new run, or `Continue` to load a saved run. Use Arrow keys/WASD or tap the D‑pad to move; press `Edit` to update your name and emoji; use the HUD `End Day` button after at least 3 actions.
- Step 3: After 5 days, spend coins on `Investments`, then click `Finalize` to view the Final Report and optionally replay.

## Contributing
Contributions are welcome. This project is intentionally small and client‑only to stay hackathon‑friendly:
- Keep gameplay data in `game_app/js/config.js` (weather, transport, venues, quizzes, investments) and UI/game logic in `game_app/js/game.js`.
- Maintain accessibility patterns (ARIA roles, focus trap modals) and keyboard+D‑pad controls.
- Favor lightweight assets and fast, readable code; no external runtime dependencies.
- Test in current Chrome/Firefox/Safari (desktop and mobile). Ensure localStorage saves still work and the menu Continue button behaves as expected.
- Open a PR describing the change and rationale; include any UI notes or balancing considerations.

---

Folders of interest:
- `game_app/index.html`, `game_app/game.html`, `game_app/about.html`
- `game_app/js/` (`main.js`, `menu.js`, `game.js`, `config.js`, `utils.js`)
- `game_app/css/` (`style.css`, `game.css`)
- `game_app/assets/images/` (POI and vehicle art)

