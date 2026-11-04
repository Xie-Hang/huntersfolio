// Save files: one JSON file per key in a folder (on Windows: %APPDATA%\Hunter's Folio\saves).
// Writes go to a temp file and are renamed into place, so a crash mid-write can't leave a half-written save.
// The previous good save is kept as <key>.bak.json and read if the main file is damaged.
// Removing a key removes its backup too: a finished hunt must not come back from its backup on the next launch.
const fs = require('fs');
const path = require('path');

const KEY = /^[a-z0-9-]{1,40}$/;

function saveFiles(dir) {
  const fileFor = (key, ext = '.json') => {
    if (!KEY.test(key)) throw new Error(`bad save key: ${key}`);
    return path.join(dir(), key + ext);
  };
  const readValid = file => {
    try { const text = fs.readFileSync(file, 'utf8'); JSON.parse(text); return text; } catch { return null; }
  };
  return {
    get(key) {
      try { return readValid(fileFor(key)) ?? readValid(fileFor(key, '.bak.json')); } catch { return null; }
    },
    set(key, value) {
      try {
        JSON.parse(value); // never write something we couldn't read back
        fs.mkdirSync(dir(), { recursive: true });
        const file = fileFor(key), tmp = fileFor(key, '.tmp');
        if (readValid(file)) fs.copyFileSync(file, fileFor(key, '.bak.json'));
        fs.writeFileSync(tmp, value, 'utf8');
        fs.renameSync(tmp, file);
        return true;
      } catch (err) { console.error('save failed', err); return false; }
    },
    remove(key) {
      try {
        for (const ext of ['.json', '.bak.json', '.tmp']) fs.rmSync(fileFor(key, ext), { force: true });
        return true;
      } catch { return false; }
    }
  };
}

module.exports = { saveFiles };
