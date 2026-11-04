// Build and upload to Steam.
//
//   npm run steam:build -- demo            build the Windows game as the demo (or: playtest, full)
//   npm run steam:upload -- demo yourname  upload that build with SteamCMD (asks for your password and Steam Guard code)
//   add --preview to upload to check what WOULD be uploaded, without uploading
//
// App and depot IDs come from steam/ids.json. The build is set live on the branch named there
// ("staging" by default); you then make it the default build by hand in Steamworks (SteamPipe → Builds).
// SteamCMD: set STEAMCMD to steamcmd.exe, or unzip it into steam/steamcmd/, or have it on your PATH.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const TARGETS = ['demo', 'playtest', 'full'];
const [cmd, target, user] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const preview = process.argv.includes('--preview');
const fail = msg => { console.error(`\n✗ ${msg}\n`); process.exit(1); };

if (!['build', 'upload'].includes(cmd) || !TARGETS.includes(target)) fail('usage: steam.mjs build|upload demo|playtest|full [steam-username] [--preview]');
const ids = JSON.parse(readFileSync(join(ROOT, 'steam', 'ids.json'), 'utf8'));
const t = ids[target];
if (!t?.app || !t?.depot) fail(`steam/ids.json has no App ID or depot ID for "${target}" yet. Copy them from Steamworks first.`);
if (!ids.full?.app) console.warn('! steam/ids.json has no full-game App ID: the Wishlist and feedback buttons will stay hidden in this build.');

const out = join(ROOT, 'steam', 'out', target);
const content = join(ROOT, 'release', 'win-unpacked');
const vdf = join(out, `app_build_${t.app}.vdf`);

if (cmd === 'build') {
  const tj = join(ROOT, 'electron', 'target.json');
  writeFileSync(tj, JSON.stringify({ target, app: t.app, store: ids.full?.app || 0 }, null, 2));
  try {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    // the demo and the Playtest are the demo edition (Ashfall Ridge only); the full game is everything
    const env = { ...process.env, HF_EDITION: target === 'full' ? 'full' : 'demo' };
    const r = spawnSync(npm, ['run', 'dist:win'], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', env });
    if (r.status !== 0) fail('the Windows build failed (see above).');
  } finally { rmSync(tj, { force: true }); } // so `npm run desktop` doesn't quietly run as a Steam app afterwards
  if (!existsSync(join(content, "Hunter's Folio.exe"))) fail(`no game exe in ${content}`);
  mkdirSync(join(out, 'output'), { recursive: true });
  const q = s => s.replace(/\\/g, '\\\\');
  writeFileSync(vdf, `"AppBuild"
{
\t"AppID" "${t.app}"
\t"Desc" "${target} build ${new Date().toISOString().slice(0, 16)}"
\t"Preview" "${preview ? 1 : 0}"
\t"SetLive" "${ids.branch || ''}"
\t"ContentRoot" "${q(content)}"
\t"BuildOutput" "${q(join(out, 'output'))}"
\t"Depots"
\t{
\t\t"${t.depot}"
\t\t{
\t\t\t"FileMapping"
\t\t\t{
\t\t\t\t"LocalPath" "*"
\t\t\t\t"DepotPath" "."
\t\t\t\t"recursive" "1"
\t\t\t}
\t\t\t"FileExclusion" "*.pdb"
\t\t}
\t}
}
`);
  console.log(`\n✓ Built the ${target} (App ${t.app}). Upload with:  npm run steam:upload -- ${target} <your-steam-username>\n`);
}

if (cmd === 'upload') {
  if (!user) fail('give the Steam username that has upload rights: npm run steam:upload -- demo yourname');
  if (!existsSync(vdf)) fail(`no build for "${target}" yet: run npm run steam:build -- ${target} first.`);
  const local = join(ROOT, 'steam', 'steamcmd', process.platform === 'win32' ? 'steamcmd.exe' : 'steamcmd.sh');
  const steamcmd = process.env.STEAMCMD || (existsSync(local) ? local : 'steamcmd');
  console.log(`Uploading ${target} (App ${t.app}, depot ${t.depot}) → branch "${ids.branch}"${preview ? ' [preview only]' : ''}`);
  const r = spawnSync(steamcmd, ['+login', user, '+run_app_build', vdf, '+quit'], { stdio: 'inherit' });
  if (r.error) fail(`couldn't run SteamCMD (${r.error.message}). Set STEAMCMD or unzip steamcmd into steam/steamcmd/.`);
  if (r.status !== 0) fail('SteamCMD reported an error (see above). The log is in ' + join(out, 'output'));
  console.log(`\n✓ Uploaded. In Steamworks → SteamPipe → Builds, the new build is on "${ids.branch}". Set it live on "default" when you're happy.\n`);
}
