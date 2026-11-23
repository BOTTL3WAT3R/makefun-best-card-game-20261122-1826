// Emberfall Duel's hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ - plain files a desktop
// browser opens offline, no build step and no network. This program hands
// it in: it copies game/ and screenshots/ from the repository (the grader
// mounts it at /bot, named by MAKEFUN_BOT_DIR; beside this file everywhere
// else) into the output directory (MAKEFUN_OUTPUT_DIR, /output in the
// grader) and writes dossier.json there with buildDossier from the
// vendored kit library, so the dossier is exactly the bytes the gate
// rebuilds and compares. The program reads nothing else and writes nothing
// else, so two runs over the same repository produce the same output.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const source = process.env.MAKEFUN_BOT_DIR ?? here;
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(source, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(source, 'screenshots'))) {
  cpSync(join(source, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps the gate holds a hand-in to: at most 4 screenshots of 256 KiB
// each, at most 993 files and 48 MiB under game/, no path under game/ over
// 1000 bytes, and the dossier's source text capped at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
