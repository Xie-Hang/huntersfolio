# Hunter's Folio

*Read the monster. Roll the dice. Break it apart.*

A turn-based, 1v1 monster-hunting RPG for Steam. Each turn you read the monster's telegraphed move, roll four dice, and spend them on attacks, guarding or setting up. Break parts to earn the materials that forge your next weapon.

## Running the game on your computer

You need **Node.js (LTS)** installed. Check with `node -v` in PowerShell.

1. Open this folder in **Visual Studio Code**.
2. Open the terminal (**Terminal → New Terminal**).
3. The first time only, install the project's tools:
   ```
   npm install
   ```
4. Start the game:
   ```
   npm run dev
   ```
   Then open the address it prints (usually http://localhost:5173) in your browser. The page reloads by itself when files change.

### Other commands

| Command | What it does |
| --- | --- |
| `npm test` | Runs the rule checks and the balance tests (simulated hunts against our tuning targets) |
| `npm run sim` | Runs the balance simulator and prints a report |
| `npm run desktop` | Builds the game and opens it as a desktop app (Electron). F11 = fullscreen, F12 = dev tools |
| `npm run dist:win` | Builds the Windows game into `release/`: a `win-unpacked` folder (what gets uploaded to Steam) and a zip for sharing playtest builds |
| `npm run check` | Type-checks the code |

## How the project is organised

```
src/
  engine/        The rules of the game. No UI code here.
    data/        Monsters, weapons, armor, items, materials — plain data
  sim/           The balance simulator: bots that play the real engine
  ui/            Svelte screens and components
    game.svelte.ts   The one place UI state lives (save, hunt, Undo, effects)
    screens/         Hunt Board, Hunt, Forge, Shop
tests/           Rule checks and balance tests
electron/        The desktop wrapper: window, save files, Steam hookup
```

**Adding a monster** is mostly adding a file in `src/engine/data/monsters/` and listing it in the roster. The simulator and balance tests pick it up from the same data.

**A new monster also needs a plate:** its engraving lives in `src/ui/parts/Plate.svelte` until real art arrives.

## Saves

Saves are versioned (`SAVE_VERSION` in `src/engine/save.ts`). When the save shape changes, bump the version and add a migration step so players never lose progress to an update.

- **Desktop:** one JSON file per key in `%APPDATA%\Hunter's Folio\saves\` (`save.json`, plus `hunt.json` while a hunt is in progress). Writes are atomic, and the previous good save is kept as `*.bak.json`. This folder is what Steam Cloud will sync.
- **Browser (`npm run dev`):** localStorage.

A hunt in progress is saved too, so closing the game mid-hunt doesn't lose the items you carried.

## Music

The game plays five files from `public/audio/music/`: `town`, `hunt`, `danger` (a layer that fades in over `hunt` on big telegraphs), `victory` and `defeat`, all `.ogg`.

The current ones are **placeholders** composed in code. Re-render them with `node scripts/compose-placeholder-music.mjs` (needs ffmpeg). To use real music, replace the files with the same names and note each track's source and licence for the credits (Settings → Credits). If the new tracks are louder or quieter than each other, adjust `TRIM` in `src/ui/audio.ts`.

## Steam

`electron/steam.cjs` is a placeholder: it does nothing until the game has a Steam App ID. To test locally with Valve's public test app, run with `HF_STEAM_APP_ID=480` while Steam is open. Once Steamworks gives us an App ID, it goes in that file, and achievements, cloud saves and the overlay are added there.

Steam doesn't use installers: upload the contents of `release/win-unpacked/` as the Windows depot.

## Not done yet

- App icon (the default Electron icon is used)
- Code signing (Windows SmartScreen will warn on the zip; Steam builds are fine without it)
