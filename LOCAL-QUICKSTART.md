# Run The Last Offering locally

Extract the ZIP first. Open a terminal inside the extracted `the-last-offering` folder.

## Option 1: Play the included build

Requires Python 3, but no Node.js or package installation:

```sh
python -m http.server 8080 --bind 127.0.0.1 --directory dist
```

If your system uses `python3`, use that instead of `python`. On Windows, `py -3` also works.

Open **http://localhost:8080** in your browser. Keep the terminal running; press Ctrl+C to stop the server. Do not open `dist/index.html` directly by double-clicking it.

## Option 2: Run or edit the source

Install Node.js 22.12+ (Node 24 recommended), then run:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the address printed by Vite, normally **http://localhost:5173**. The initial `npm ci` needs internet access to download development dependencies. Playing the game requires no accounts, API keys, external services, or asset generation.

To test the rules and rebuild:

```sh
npm test
npm run build
```

The browser automation suite is optional and requires a Chromium installation; see `README.md` and `docs/VALIDATION.md`. All generated assets are already included. Python, Pillow, and ffmpeg are only needed if you choose to regenerate/export assets using the tools.

## Included

- Editable React source, exact authored content, and a dependency lockfile.
- `dist/`: the complete prebuilt game.
- `public/assets/`: runtime art, audio, fonts, and the asset manifest.
- `assets-source/`: generated original images, prompts, audio masters, and provenance. The concept image is reference material only.
- `tests/`, `tools/`, and `docs/`: rule tests, optional browser checks, build tools, validation evidence, and screenshots.
- `specifications/`: the supplied MVP design package, preserved as reference material.

Dependencies (`node_modules`), Git metadata, caches, and transient test outputs are intentionally excluded. `npm ci` restores the exact JavaScript dependencies from the lockfile.

## Saves and sound

Progress saves automatically in this browser at this address. Keep using the same hostname and port to resume it; switching between ports or between `localhost` and `127.0.0.1` creates a separate save location. Private browsing or clearing site data may remove saves. Settings can reset the game deliberately.

Sound starts after interaction with the game. Check the in-game settings and your browser's sound permissions if you hear nothing.
