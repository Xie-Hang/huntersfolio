// Which game this build is: the free demo (Ashfall Ridge only, with the demo-end card and Wishlist prompts)
// or the full game. Set at build time with HF_EDITION=demo|full (vite.config.ts); dev and tests default to full.
// `npm run steam:build -- demo` and `-- playtest` build the demo edition; `-- full` the full game.
declare const __HF_EDITION__: string | undefined;
export type Edition = 'demo' | 'full';
export const EDITION: Edition = typeof __HF_EDITION__ !== 'undefined' && __HF_EDITION__ === 'demo' ? 'demo' : 'full';
/** the highest monster tier in this edition */
export const MAX_TIER = EDITION === 'demo' ? 1 : 4;
