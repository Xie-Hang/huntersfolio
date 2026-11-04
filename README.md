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
    coach.svelte.ts  Tutorial tips: what each says, when it shows, when it's done
    settings.svelte.ts  Player settings (volumes, fullscreen, interface size, tips)
    keys.ts          Keyboard shortcuts in hunts
    audio.ts, sfx.ts Music player and synthesized sound effects
    display.ts       Fullscreen and interface size (desktop shell or browser)
    screens/         Hunt Board, Hunt, Forge, Shop
    parts/           Shared pieces: Coach (tip card), Elem (element marks), Plate (engravings), Modal
tests/           Rule checks and balance tests
electron/        The desktop wrapper: window, save files, Steam hookup
```

**Adding a monster** is mostly adding a file in `src/engine/data/monsters/` and listing it in the roster. The simulator and balance tests pick it up from the same data.

**A new monster also needs a plate:** a woodcut drawing in `src/ui/parts/plates/<Monster>.svelte`, listed in `src/ui/parts/Plate.svelte`. Plates are drawn facing left in a 1000 × 600 space (the same space as the store key art in `art/keyart.py`) and flipped to face the player. Poses come from the hunt (intent, airborne, underground, molten, ice layers, broken parts); one-shot moves (attack, flinch) come from `game.pulse` via `plates/motion.svelte.ts`. Whole-body motion uses translate, scale and skew around the ground line, never a body rotation, so feet stay on the ground (mark feet with `data-foot` to test it).

## Tutorial

There's no separate training fight: the first Gorehorn hunt is the tutorial. Tips in `src/ui/coach.svelte.ts` appear one at a time, in list order, the first time they're relevant, and point at the element tagged with the matching `data-coach="..."` attribute. A tip retires when the player does what it says (or does it before the tip ever shows), when its moment passes, or on Got it. Seen tips are stored in the save (`tips`). To add one, add an entry to `TIPS` and tag the element it points at.

The very first hunt opens on fixed dice for two turns (`TUTORIAL_SCRIPT` in `src/engine/combat.ts`) so the first lessons always work. To see the tutorial again: Settings → Tutorial tips off and on, or Reset save.

## Settings and controls

Player settings live apart from the save (key `settings`), so resetting progress keeps them. The desktop shell reads them at startup to open fullscreen if that was chosen. Interface size uses Electron's page zoom so layouts reflow; in the browser it falls back to CSS zoom.

Hunt shortcuts: 1–4 dice, Q/W/E moves, G guard, C charge, S swap, X capture, I item, R reroll, Space end turn, Ctrl+Z or U undo, Esc clear selection. F11 toggles fullscreen anywhere.

## Saves

Saves are versioned (`SAVE_VERSION` in `src/engine/save.ts`). When the save shape changes, bump the version and add a migration step so players never lose progress to an update.

- **Desktop:** one JSON file per key in `%APPDATA%\Hunter's Folio\saves\` (`save.json`, plus `hunt.json` while a hunt is in progress). Writes are atomic, and the previous good save is kept as `*.bak.json`. This folder is what Steam Cloud will sync.
- **Browser (`npm run dev`):** localStorage.

A hunt in progress is saved too, so closing the game mid-hunt doesn't lose the items you carried.

## Music

The game plays five files from `public/audio/music/`: `town`, `hunt`, `danger` (a layer that fades in over `hunt` on big telegraphs), `victory` and `defeat`, all `.ogg`.

The current ones are **placeholders** composed in code. Re-render them with `node scripts/compose-placeholder-music.mjs` (needs ffmpeg). To use real music, replace the files with the same names and note each track's source and licence for the credits (Settings → Credits). If the new tracks are louder or quieter than each other, adjust `TRIM` in `src/ui/audio.ts`.

## Steam

**Steam:** App and depot IDs go in `steam/ids.json`; `npm run steam:build -- demo|playtest|full` bakes the right one into the build and writes the SteamPipe script, `npm run steam:upload -- <target> <username>` uploads it with SteamCMD. The full Steamworks checklist is in `steam/README.md`. A plain `npm run dist:win` has no App ID, so Steam stays off. To test locally with Valve's public test app, run with `HF_STEAM_APP_ID=480` while Steam is open.

**The demo's Wishlist button** opens the full game's store page, which has its own App ID (a Steam demo is a separate app). It comes from `full.app` in `steam/ids.json` (or `HF_STORE_APP_ID` to test); until then the button stays hidden. **Demo saves carry over** to the full game on the same PC: `electron/main.cjs` pins the save folder to `%APPDATA%\Hunter's Folio` whatever the build is called, so a demo build must keep the same save keys and the full game must keep migrating them (`SAVE_VERSION`). Steam Cloud stays on the full game only (see `steam/README.md`), since the apps share one save folder. If balance changes after Playtest make old saves too strong, add a migration step that adjusts them rather than wiping them.

The "That's the demo" card shows once, the first time every monster in the build has been beaten (`contentComplete` in the engine), so the full game never shows it.

Steam doesn't use installers: upload the contents of `release/win-unpacked/` as the Windows depot.

## Not done yet

- Final store art and app icon: Mekkman is making these. Placeholders built from the engravings are in `art/` (see `art/README.md`); the current icon is `build/icon.png`
- Controller and Steam Deck support: planned after Steam Playtest
- Code signing (Windows SmartScreen will warn on the zip; Steam builds are fine without it)

## Feedback, hunt log and crashes

For Steam Playtest there are no testers to watch, so the game keeps a small local **hunt log** (`src/ui/playlog.ts`, save key `log`): per hunt the monster, loadout, result (win, capture, lose, abandon), active time per turn (turns over 3 minutes count as idle), damage, parts broken, rerolls, what killed the player, and which tutorial tips appeared; plus sessions and errors. It is capped (400 hunts) and never sent anywhere. **Settings → Feedback → Export report** writes it, with a summary of the save and the settings, to a JSON file the player can send.

**Feedback goes to the full game's Steam community forum.** `electron/links.cjs` builds the address from `STORE_APP_ID` (`https://steamcommunity.com/app/<id>/discussions/`) and opens it through the Steam client when it's running, so players are already signed in. Until the store App ID is set, the Send feedback buttons (Settings → Feedback, the crash screen, the demo-end card) stay hidden. To point at a specific subforum instead, set `FEEDBACK_URL` there; it must start with `https://` or `mailto:`, and it's the only address the game can open.

Uncaught errors show a **crash screen** (`src/ui/crash.ts`, plain DOM so it works even if the UI broke) with Reload and Export report. If the page process itself dies, the desktop shell notes it in `saves/crash.log` and reloads the window.

## Achievements

Defined in `src/engine/achievements.ts` (16 for the demo). The ids are the Steam API names: enter each one in Steamworks exactly as written (`art/achievements.csv` lists id, display name, description and icon files; placeholder icons are rendered to `art/png/achievements/`). Earned ids are stored in the save (`achievements`) and the whole list is sent to Steam on startup and whenever a new one is earned, so anything earned while Steam wasn't running, or before the App ID existed, catches up. Moments inside a hunt (a daze, a stopped attack, grounding the Galeshrike, unearthing the Cinderback, shattering the Rimetail's ice) are recorded as `feats` on the hunt by the engine.

## QA scripts (`qa/`)

Run with the preview server up (`npm run build && npx vite preview --port 4173`); results go to `qa/out/` (gitignored).

- `npx tsx qa/playthrough.ts 1366 768` plays the whole demo from a fresh save to the demo-end card through the real UI (tutorial on, Forge clicked through, hunts played with the keyboard), and reports errors, crash screens, sideways scrolling, turn times and memory.
- `node qa/screens.cjs` opens every screen at 1280×720, 1280×800, 1366×768, 1920×1080 and 2560×1440, at 100% and 130% interface size (emulated as real page zoom), and reports cut-off text and overflow; screenshots too.
- `node qa/saves.cjs` checks save safety: a save from a newer build is never overwritten, reloading mid-turn resumes, a broken save file doesn't crash.
- `node qa/idle.cjs` measures CPU use while the player just looks at each screen.
