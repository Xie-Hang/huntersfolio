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
| `npm run desktop` | Builds the game and opens it as a desktop app (Electron) |
| `npm run dist:win` | Builds the Windows installer into `release/` |
| `npm run check` | Type-checks the code |

## How the project is organised

```
src/
  engine/        The rules of the game. No UI code here.
    data/        Monsters, weapons, armor, items, materials — plain data
  sim/           The balance simulator: bots that play the real engine
  ui/            Svelte screens and components
tests/           Rule checks and balance tests
electron/        The desktop wrapper (and later, Steam hookup)
```

**Adding a monster** is mostly adding a file in `src/engine/data/monsters/` and listing it in the roster. The simulator and balance tests pick it up from the same data.
