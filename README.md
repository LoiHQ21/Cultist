# The Last Offering

A complete local, single-player browser ritual game. Five days, ten authored petitions, thirty base miracles with three aspect interpretations, three awakening decisions, and six endings. No accounts, backend, runtime AI, or network calls to resolve gameplay.

## Run

Requires Node.js 20.19+ or 22.12+ (validated with Node 24.19).

```bash
npm ci
npm run dev
```

Open the local address printed by Vite. To serve the production build:

```bash
npm run build
npm run preview -- --port 4173
```

The entire `dist/` directory can be hosted on a static web server. No environment variables or credentials are required. Serve over HTTP/HTTPS; opening `index.html` directly from the filesystem is not supported.

## Play

Hear one visitor each day. Choose Chain, Seed, or Knife; optionally add a keepsake. Read the omen, then ring the bell. Miracles leave remnants that can become tomorrow's offering. The old aspect answers today's prayer; the new lessons shape the next one. The unanswered visitor costs 1 Trust after the miracle.

After five rituals, make three final requests. Finish with **6 Defence** to stop the army and **4 Trust** to keep the community intact. Reaching zero during the five days does not end the run.

Click/tap or use Tab, Shift+Tab, Enter/Space. Dragging is optional. Escape closes dialogs. Settings include separate music/effects volume, mute, and reduced motion. The first seed is `FIRST-EMBER`; replays offer seeds and three starting instincts. Seeds change gifts, not the petition schedule.

## Saves

Progress, discoveries, and settings use separate versioned localStorage keys. Commit is synchronous and precedes animation; a reload shows the committed aftermath. Storage denial falls back to the current in-memory session. Data is specific to the browser and origin. New-run replacement and clearing all data require confirmation.

## Validation

```bash
npm test
npm run build
# Start a server separately, then:
npm run test:browser
node tests/resilience.mjs
```

Browser tests use `/usr/bin/chromium` by default (`CHROMIUM_PATH` can override it in the main browser suite). Set `TEST_URL` to test another local server, including the production preview. Test artifacts go into `test-results/`. See [validation notes](docs/VALIDATION.md) for actual results and limits.

## Contents

- `content/game.json`: unchanged authored content, version 1.0.0.
- `src/game/rules.js`: pure deterministic calculations, guarded reducer, seed gifts and save validation.
- `src/main.jsx`, `src/style.css`: layered scene and real accessible browser controls.
- `public/assets/manifest.json`: runtime image/audio paths, original sources, prompts, references, dimensions, anchors and generation provenance.
- `assets-source/images/`, `assets-source/prompts/`: generated originals and exact prompts. The concept is reference-only, never runtime art.
- `tools/export_art.py`: WebP conversion/compression, no painting or sprite extraction.
- `tools/generate_audio.py`: original deterministic synthesis; WAV masters in `assets-source/audio`, Ogg runtime exports. Requires Python and ffmpeg. Image export additionally requires Pillow.
- `tests/oracle.json`: 720 expected calculations from the package's independent Python reference; tests exercise the JavaScript implementation.
- `tests/witnesses.json`: legal reproducible authored routes; tests replay acquired/consumed/discarded inventory.

Fonts are bundled DejaVu Serif regular/bold under their redistribution license; see `public/assets/fonts/LICENSE.txt`. Art was produced with the available image-generation tool. No stock game art, stock music, emoji substitutes, or concept-sheet runtime backgrounds are used.

## Scope and hosting

One shrine, one approaching army, fixed authored petitions, deterministic gift variation, finite outcomes. Three ending paintings intentionally serve six ending categories. No multiplayer, combat, village construction, or management dashboard.

No Sites publishing capability or authenticated hosting destination is available in this session. The local game and static production bundle are the deliverables; publication needs a connected hosting destination. Human playtesting remains separate from automated acceptance; no human playtest sessions or enjoyment metrics are claimed.
