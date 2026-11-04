// Steam hookup. Does nothing unless this build has an App ID, and never stops the game from starting.
//
// Which App ID a build runs as is baked in at build time: `npm run steam:build -- demo` (or playtest, full)
// writes electron/target.json from steam/ids.json. A plain `npm run dist:win` has no target: Steam stays off.
// For local testing, HF_STEAM_APP_ID / HF_STORE_APP_ID override it (480 is Valve's public test app "Spacewar").
let target = {};
try { target = require('./target.json'); } catch { /* no target: not a Steam build */ }
const STEAM_APP_ID = Number(process.env.HF_STEAM_APP_ID || target.app || 0);
// The FULL game's App ID, for the Wishlist button and the feedback forum link. A demo or Playtest has its own
// App ID, so this is a separate number from STEAM_APP_ID. 0 = no store page yet: those buttons stay hidden.
const STORE_APP_ID = Number(process.env.HF_STORE_APP_ID || target.store || 0);
/** 'demo' | 'playtest' | 'full' | null */
const TARGET = target.target || null;

let steamworks = null;

function init() {
  if (!STEAM_APP_ID) return null;
  try {
    steamworks = require('steamworks.js');
    const client = steamworks.init(STEAM_APP_ID);
    // The overlay in Electron needs this before any window is created.
    steamworks.electronEnableSteamOverlay();
    return client;
  } catch (err) {
    // Steam not running, or not launched through Steam: play on without it.
    console.warn('Steam unavailable:', err && err.message);
    return null;
  }
}

/** What the game page may know: whether Steam is on, and the player's name. */
function info(client) {
  if (!client) return { name: null };
  try {
    return { name: client.localplayer.getName() };
  } catch {
    return { name: null };
  }
}

/** Unlock achievements by API name. Safe to repeat: Steam ignores ones already unlocked. */
function unlock(client, ids) {
  // Achievements live on the full game only (Valve advises none in demos). The demo and Playtest still record them
  // in the save, and the full game sends the whole list on its first launch, so nothing earned is lost.
  if (!client || !Array.isArray(ids) || (TARGET && TARGET !== 'full')) return;
  for (const id of ids) {
    try { if (typeof id === 'string' && !client.achievement.isActivated(id)) client.achievement.activate(id); }
    catch (err) { console.warn('achievement failed', id, err && err.message); }
  }
}

module.exports = { init, info, unlock, STEAM_APP_ID, STORE_APP_ID, TARGET };
