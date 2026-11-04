import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const { saveFiles } = createRequire(import.meta.url)('../electron/savefiles.cjs');

describe('desktop save files', () => {
  let dir: string, f: ReturnType<typeof saveFiles>;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'hf-saves-')); f = saveFiles(() => dir); });

  it('keeps the previous good save as a backup and reads it if the main file is damaged', () => {
    f.set('save', '{"coin":1}'); f.set('save', '{"coin":2}');
    writeFileSync(join(dir, 'save.json'), '{"coin":3', 'utf8'); // damaged
    expect(f.get('save')).toBe('{"coin":1}');
  });
  it('a removed hunt stays removed: its backup goes too (no replaying a finished hunt)', () => {
    f.set('hunt', '{"turn":7}'); f.set('hunt', '{"turn":8}');
    f.remove('hunt');
    expect(f.get('hunt')).toBeNull();
    expect(readdirSync(dir).filter(n => n.startsWith('hunt'))).toEqual([]);
  });
  it('refuses to write what it could not read back, and bad key names', () => {
    expect(f.set('save', '{broken')).toBe(false);
    expect(f.set('../evil', '{}')).toBe(false);
    expect(existsSync(join(dir, 'save.json'))).toBe(false);
  });
});
