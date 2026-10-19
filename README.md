# myportfolio

Business Analyst portfolio — Nikolajs Morozovs.

Static, English-language site with a reversible scroll-controlled aircraft scene and four individually addressable case pages.

Live site: **https://nikmorozovs.github.io/myportfolio/**

## Run locally

Use Node.js 22 or later. No package dependencies need installation.

```sh
npm test
npm run build
npm run check
npm run dev
```

Open `http://localhost:4173/myportfolio/`. Rebuild after source edits; the development server serves `dist/`. Stop it with Ctrl+C. Both repository-subpath and root hosting work, including real directory routes and trailing-slash redirects.

## Publish with GitHub Pages

`.github/workflows/pages.yml` tests geometry, builds, checks routes/assets, uploads the Pages artifact and deploys it. Pushes to `main` publish the current source; a manual **Run workflow** action is also available.

One-time setting, if Pages is not yet enabled:

1. Open **Settings → Pages → Build and deployment**.
2. Set **Source → GitHub Actions**.
3. Open **Actions → Build and publish portfolio → Run workflow**.

The ordinary workflow `GITHUB_TOKEN` cannot enable a new Pages site. The connected GitHub file tools do not expose Pages administration. No personal token needs to be added to the project. The workflow’s `github-pages` environment links to the actual deployed URL; a failed configuration step is a deployment blocker.

## Source map

| Path | Purpose |
| --- | --- |
| `src/geometry.mjs` | Pure scroll-to-geometry model, spatial camera and preview bounds |
| `src/app.mjs` | Native scroll, brief smoothing, navigation, pointer/focus/touch previews and return position |
| `src/content.mjs` | Four project summaries and decision outlines |
| `src/style.css` | Responsive layouts, constant-width contours and reduced-motion fallback |
| `scripts/build.mjs` | Home/case templates; emits real pages and fallback views |
| `public/assets/fonts/` | Local font subsets and OFL licences |
| `tests/geometry.test.mjs` | Directions, continuity, bounds, similarity and deterministic scrubbing |
| `docs/storyboard.svg` | Initial S0–S7 visual storyboard, committed before the prototype |
| `docs/storyboard.md` | Fixed requirements, working rules and selected open parameters |
| `docs/content-status.md` | Editorial replacements and factual boundaries |
| `docs/verification.md` | Check evidence and remaining browser acceptance pass |

`dist/`, source documents, private materials and local QA images are excluded from Git. The supplied banner informed the palette, converging lines and aircraft motif; its original file is not redistributed.

## Update content

Edit project prose in `src/content.mjs`. Keep slugs stable: the build emits `cases/<slug>/index.html`, so direct opening and refresh need no SPA fallback. Home, About, recommendation, navigation and contact text live in `scripts/build.mjs`.

See `docs/content-status.md` before replacing placeholders. To add the approved CV, put its PDF in `public/assets/` and replace the CV anchors with a relative file link at each page depth. Add `download`. Add WhatsApp only after receiving a verified phone-number or account share link.

For a different repository name, change `/myportfolio/` in the 404 template and local server. Normal pages/assets already use relative URLs.

## Animation decisions

A single vector projection goes from top-down nose-down to side-on nose-left, windows, engine, 90° horizontal orbit, frontal inlet approach and fade-out. Aircraft rotation uses quaternion interpolation. Engine rings, nacelle and blades are projected in space. All graphic coordinates are computed in CSS pixels; contours use **1.5 px** and `vector-effect: non-scaling-stroke`.

Window previews animate dimensions without scaling a border. Window and preview ratio is **0.76**, with proportional corner curvature. The conditional airframe gently reframes during the close-up so outer contours leave the viewport while all four windows remain available. It does not reproduce a specific aircraft model.

Scroll distances are in viewport heights; large movements receive more distance and zoom uses logarithmic scale interpolation. The S4 reading interval stays still. Smoothing settles within **140 ms** of the last scroll event; large jumps snap to the corresponding state. Native wheel/touch scrolling is never cancelled and there is no automatic camera playback.

Reduced motion and JavaScript failure expose ordinary flow, case links and static top/side/front views. Returning from a case restores catalogue progress when session storage is available; `#work` remains a direct fallback.

## Fonts

Onest and Unbounded are local WOFF subsets with English text, Latin extensions, punctuation and arrows. Sources: official [Onest](https://github.com/google/fonts/tree/main/ofl/onest) and [Unbounded](https://github.com/google/fonts/tree/main/ofl/unbounded) families. Original SIL OFL 1.1 licences are shipped beside them. The site has no external font, tracking or script requests.
