// Where players send feedback: the full game's Steam community forum (decided 4 Nov 2026).
// The address is built from the store App ID (STORE_APP_ID in steam.cjs), so there's nothing to fill in
// here: the buttons appear as soon as that ID is set. This is the only web page the game itself may open.
// To point somewhere else instead (e.g. a "Playtest feedback" subforum), set FEEDBACK_URL to its https:// address.
const steam = require('./steam.cjs');

const FEEDBACK_URL = process.env.HF_FEEDBACK_URL
  || (steam.STORE_APP_ID ? `https://steamcommunity.com/app/${steam.STORE_APP_ID}/discussions/` : '');
const FEEDBACK_LABEL = process.env.HF_FEEDBACK_LABEL || 'the Steam forum';

module.exports = { FEEDBACK_URL, FEEDBACK_LABEL };
