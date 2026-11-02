// Steam hookup (placeholder until the game has a Steam App ID).
//
// Today: does nothing unless an App ID is set, and never stops the game from starting.
// Once Steamworks gives us an App ID:
//   1. put it in STEAM_APP_ID below (480 is Valve's public test app "Spacewar", handy for local testing)
//   2. launch the game from Steam (or with Steam running) and the overlay + user name will work
//   3. achievements, cloud saves and rich presence get added here
const STEAM_APP_ID = Number(process.env.HF_STEAM_APP_ID || 0);

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

module.exports = { init, info, STEAM_APP_ID };
