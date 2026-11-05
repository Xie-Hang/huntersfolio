# Store screenshots

1. `npx tsx art/store/states.ts` plays each hunt with the sim bot up to the moment shown and writes `<name>.json`.
2. `node art/store/capture.cjs <built single-file game.html> <out dir>` loads each into the build and saves 1920x1080 PNGs (plus the Hunt Board and Forge).

Collateral rule (Mekkman, Nov 2026): no build version on any store art, screenshots or icons. Capture scripts inject `COLLATERAL_CSS`, which hides `.sub .build`; keep it in any new capture script.
