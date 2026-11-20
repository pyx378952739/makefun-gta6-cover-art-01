# Vice Coast Cover Lab — Make GTA 6 Cover Art (`gta6-cover-art-01`)

An offline web app that turns your own photos and a caption into
GTA-poster-style cover art: a multi-panel poster with bold title lettering
and a Vice City sunset / neon grade, exported as a PNG to share.

Everything is original: the layout, grades and lettering are drawn by this
app; the fonts are Anton and Pacifico under the SIL Open Font License (files
in `app/fonts/`); the bundled sample art is an AI-made illustration of a
fictional person plus two kit sample photos that are free to use. No Rockstar
Games logo, wordmark, official artwork, character or font is used anywhere.

## Use it

1. Open `app/index.html` in desktop Chrome — or serve the folder:
   `node serve.ts`, then open http://localhost:8080.
   The app works with no network request; every script, font and image is a
   file under `app/`.
2. **Add your photos** (File API — photos stay on your machine), or use the
   three bundled samples. Click a photo thumbnail, then a panel, to place it.
   Click a panel in the preview to select it, drag to pan, scroll (or the
   Zoom slider) to zoom, or **Fill all panels with this photo** for a
   one-photo cover.
3. Pick a **layout** (Hero + 3, Four Square, Three Strips, Full Bleed), a
   **sunset grade** (Vice Sunset, Neon Nights, Palm Gold, Teal Dusk, Noir)
   and its strength.
4. Edit the **title** (Anton bold capitals) and **subtitle** (Pacifico neon
   script), pick a title style, toggle the poster frame and film grain.
5. Choose a size — **1080 x 1080, 1080 x 1350 or 1920 x 1080** — and
   **Export PNG** (or **Export all 3 sizes**).

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/cover.js` — the cover engine: panel layouts, per-panel crop /
  position, grades, Anton + Pacifico lettering, frame, grain, vignette.
- `app/src/main.js` — editor wiring: photo tray, panel picking, drag-pan,
  zoom, export.
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots
  (`?shot=editor` shows the editor with a photo loaded; `?shot=cover`
  draws the cover alone at `size`, `photo`, `caption`, `grade`, `layout`).
- `app/fonts/` — Anton-Regular.ttf, Pacifico-Regular.ttf (OFL, see OFL.txt).
- `app/samples/` — `vice-hero.jpg` (AI-made illustration of a fictional
  person), `boulevard.jpg`, `pier.jpg` (kit samples, free to use).
- `main.ts` — the entry program (Node 22): copies `app/` and `screenshots/`
  to `/output` and writes `/output/dossier.json` with
  `vendor/makefun-app.ts` (the kit's copy, unchanged).
- `screenshots/` — 4 screenshots: the exported cover first, the editor with
  a photo loaded, and covers in the other two post sizes.
- `shots.json` — the screenshot scenes (query, viewport size) used to take
  `screenshots/`.

## Verify locally

```sh
mkdir -p /tmp/vice-coast-out
MAKEFUN_OUTPUT_DIR=/tmp/vice-coast-out node main.ts
# /tmp/vice-coast-out now holds app/, screenshots/ and dossier.json
```

## License

MIT — see `LICENSE`. Fonts under the SIL Open Font License (`app/fonts/OFL.txt`).
