# Store and library art

**Rule for all collateral (Mekkman, 6 Nov 2026): no build version.** The header's version sits in `.sub .build`; every capture script (screens, clips, trailer, store, achievement captures) hides it with an init script or `COLLATERAL_CSS`. Keep that in any new script.

Placeholder store art built from the game's own engravings, as editable SVG. Final art is Mekkman's; these are a starting point.

- `python3 art/make_svgs.py` writes `art/svg/*.svg` (one per Steam asset, plus loose pieces: engravings and dice).
- `node art/render.cjs` renders them to exact-size images in `art/png/` (the app icon as JPG, as Steam asks).
- `node art/screens.cjs` (1–6, Ashfall Ridge) and `node art/screens-mire.cjs` (7–10, the Mirewood and bounties) take 3840×2160 store screenshots from the running game (`npm run build`, then `npx vite preview --port 4173`) into `art/screens/`. Shots 11–13 (Gorhydra, the apex, the Rotcap) come from `art/store/` (`states.ts` plays the hunts, `capture.cjs <built game.html> <out> 4-gorhydra 5-sovereign 6-rotcap`). Last re-take: 6 Nov 2026.
- `art/preview.html` shows the capsules at the sizes Steam really uses (search rows, library shelf, icons).

`src/plate-*.svg` are the in-game engravings exported from `src/ui/parts/Plate.svelte`. If a plate changes there, re-export it.
The Windows app icon is `build/icon.png` (from `app_icon_1024x1024`); `public/favicon.png` is the same mark.

## Store art (v2, 4 Nov 2026)

The current store and library set is built from `keyart.py` (the charging Gorehorn in a woodcut style, the engraved logo, the thrown die) by `make_store.py`; `node art/render_store.cjs` renders `art/store/png/` at Steam's exact sizes. The logo uses IM Fell English and IM Fell English SC (SIL Open Font License, files and licence in `art/fonts/`), so it is free to use commercially. `make_svgs.py` (the first placeholder set) and `make_templates.py` (layout templates) are kept for reference.

## Store clips
`clips.cjs` records three staged gameplay moments (Gorehorn charge read and guarded, Cinderback driven up with a Blunt hit, Rimetail ice shattered by a Cut). Cut commands and the crop for the current layout are in the file header. Output is gitignored. Re-recorded 6 Nov 2026.

## Achievement icons v2 (woodcut)
`ach2/capture.cjs` captures the in-game plates in chosen poses (preview server on :4173), `ach2/make_achievements.py` draws the 16 icons (monster ones from those poses, the rest drawn: crossed blade and maul, the ridge, net, folio, shield, gem, anvil, tempered blade, charms), `ach2/render.cjs` renders 256x256 JPGs, achieved + locked (grey, dim), into `ach2/out/`. Same API names and files as `achievements.csv`.

## The nine monsters beyond Ashfall Ridge (concepts)
`monsters/make_monsters.py` draws Bogjaw, Duskheron, Emberwhelk, Mistglass, Monolith Warden, Stormcrown Roc, Slagwyrm, Gorhydra and the Wanderer Sovereign in the plate style (1000x600, facing left, exported mirrored to face right as in the game); `monsters/render.cjs` makes transparent PNGs and a contact sheet. One pose each: telegraph poses and animation wait until each monster is designed (after Playtest). The SVG paths are written so they can be moved into `src/ui/parts/plates/` as Svelte plates later.
