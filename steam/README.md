# Steam setup and uploads

Everything Steam-side, in order. Do the parts as they become possible.

## One-time: SteamCMD

1. Download SteamCMD for Windows from Valve (Steamworks → SDK docs → "SteamCMD"), unzip it into `steam/steamcmd/`, and run `steamcmd.exe` once so it updates itself.
2. Uploads ask for your Steam password and a Steam Guard code the first time; after that SteamCMD remembers the machine.
3. `steam/steamcmd/` holds your login files, so it's in `.gitignore`. Never commit it.

## 1. The full game (App ID from Steam Direct): coming-soon page

1. Put the App ID in `steam/ids.json` → `full.app`. The depot ID is under SteamPipe → Depots (usually App ID + 1) → `full.depot`.
2. **Store page** (Store Admin): paste the store text (Claude Docs "Steam store text"), upload capsules and library art from `art/store/png/`, the six screenshots (`art/screens`), the trailer (`Hunters-Folio-trailer.mp4`) and, in the description, the clips (`Hunters-Folio-store-clips.zip`). Release date: "Coming soon" or "2027". Fill in the content survey.
3. **Submit for review.** Valve reviews the store page (allow about a week). Once approved, publish it as Coming Soon. The page must be live at least two weeks before any release, and the community forum (where Send feedback points) only exists once it's public.
4. **Achievements** (Stats & Achievements → Achievements): enter the 16 from `art/achievements.csv` with their icons, on the **full game only**. Then Publish. Demo and Playtest builds don't send achievements (Valve advises none in demos); players keep earning them in the save, and the full game sends the whole list on its first launch.

## 2. Installation settings (same for each app: full, demo, Playtest)

- Installation → General → Launch Options: executable `Hunter's Folio.exe`, operating system Windows, 64-bit only.
- SteamPipe → Depots: one depot, Windows, all languages. Put its ID in `steam/ids.json`.
- SteamPipe → Builds: create a branch called `staging` (uploads land there; you set them live on `default` by hand, which Steam doesn't allow from a script).
- Publish the changes (Publish tab) after each settings change.

## 2b. Controller and Steam Deck (full game and demo)
The game reads controllers itself (the browser Gamepad API, standard Xbox layout), so Steam only has to pass the pad through.
- Steamworks > Application > Steam Input: **Default configuration: Gamepad** ("Uses Steam Input API: No"; "Supported controllers": Xbox, PlayStation, generic, Steam Deck). This makes Steam present every pad as an Xbox pad, which is what the game expects.
- Store page > Basic info > Controller support: **Full controller support** — but only tick it after testing a real pad (below).
- Steam Deck: after the first build is live, request a compatibility review (Steamworks > Steam Deck compatibility). What Valve checks, and where we stand: controller glyphs (A/B/X/Y/LB/RB/LT/RT shown while a pad is in use: done); everything reachable without mouse or keyboard (done: the d-pad moves focus, tested by playing a whole hunt with a simulated pad); readable at 1280×800 (compact layout, 14 px minimum); no text entry needed (the Shop quantity box also takes left/right on a pad); no launcher.
- Test on a real pad before ticking anything: plug an Xbox or PlayStation pad into the Windows PC, start the game, press any button. Hints switch to pad buttons; walk the Hunt Board, Forge, Shop, a full hunt, Settings and the help sheet with the d-pad, A and B.

## 3. Steam Cloud (full game only)

Auto-Cloud: root `WinAppDataRoaming`, subdirectory `Hunter's Folio/saves`, pattern `*.json`, quota 10 MB / 50 files.
Leave Cloud off on the demo and Playtest: all three share one save folder on the PC (that's how saves carry over), and three Clouds syncing one folder can overwrite each other.

## 4. The demo

1. Full game → "All associated packages, DLC, demos and tools" → **Add Demo**. Type: Demo, linked to the full game. No separate store page needed: it appears as a Download Demo button on the main page.
2. Library assets must say it's a demo (put "Demo" on the capsule).
3. IDs into `steam/ids.json` → `demo`. Then:
   ```
   npm run steam:build -- demo
   npm run steam:upload -- demo <your-steam-username>
   ```
4. Install it from your own Steam library (the demo shows up for your developer account), and test the checklist below.
5. When you release the demo ("Release Demo…"), **re-publish the full game's store page**, or the Download Demo button doesn't appear.

## 5. Steam Playtest (February 2027)

1. Full game → "All associated packages, DLC, demos and tools" → **Create Playtest**. It needs a library capsule and community icon; its name can't be changed after release.
2. IDs into `steam/ids.json` → `playtest`, then `npm run steam:build -- playtest` and `npm run steam:upload -- playtest <username>`.
3. Turn on the sign-up button: full game → Edit Store Page → Special Settings. Use **limited** sign-up and let people in in waves, so a crash in week one only reaches a few players.
4. To end it: hide the sign-up, then set the Playtest to Not Playable. Tell testers a few days before.

## Test before going public (on every new build)

- [ ] Launches from Steam; Shift+Tab opens the Steam overlay.
- [ ] Wishlist button opens the full game's store page.
- [ ] Send feedback opens the full game's discussion forum.
- [ ] Saves land in `%APPDATA%\Hunter's Folio\saves`; closing and reopening keeps progress.
- [ ] (Full game) An achievement unlocks in the overlay.
- [ ] Uninstall and reinstall: the save is still there.

## How the IDs reach the game

`npm run steam:build -- <target>` writes `electron/target.json` (`{target, app, store}`) from `steam/ids.json`, builds, and deletes it again. The packaged game reads it in `electron/steam.cjs`. A plain `npm run dist:win` has no target, so Steam stays off (good for testing outside Steam).
