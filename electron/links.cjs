// Where players send feedback. This is the ONLY web address the game itself may open
// (the page can't open arbitrary links: it can only ask the shell to open this one).
// Put the link here before a Playtest build: a Discord invite, the Steam community forum,
// a form, or a mailto: address. Empty = the feedback buttons stay hidden.
const FEEDBACK_URL = process.env.HF_FEEDBACK_URL || '';
// Short name shown on the button, e.g. 'Discord', 'the Steam forum', 'email'.
const FEEDBACK_LABEL = process.env.HF_FEEDBACK_LABEL || '';

module.exports = { FEEDBACK_URL, FEEDBACK_LABEL };
