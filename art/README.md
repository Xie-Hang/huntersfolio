# Store and library art

Placeholder store art built from the game's own engravings, as editable SVG. Final art is Mekkman's; these are a starting point.

- `python3 art/make_svgs.py` writes `art/svg/*.svg` (one per Steam asset, plus loose pieces: engravings and dice).
- `node art/render.cjs` renders them to exact-size images in `art/png/` (the app icon as JPG, as Steam asks).
- `node art/screens.cjs` takes six 3840×2160 store screenshots from the running game (`npm run build`, then `npx vite preview --port 4173`) into `art/screens/`.
- `art/preview.html` shows the capsules at the sizes Steam really uses (search rows, library shelf, icons).

`src/plate-*.svg` are the in-game engravings exported from `src/ui/parts/Plate.svelte`. If a plate changes there, re-export it.
The Windows app icon is `build/icon.png` (from `app_icon_1024x1024`); `public/favicon.png` is the same mark.
