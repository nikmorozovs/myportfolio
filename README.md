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
| `src/geometry.mjs` | Pure scroll camera, static route, phase timings and final preview bounds |
| `src/aircraft.mjs` | Fixed 3D lofts, matched overview/detail models and SVG surface projection |
| `src/app.mjs` | Exact native scroll mapping, common intro world, navigation and return position |
| `src/preview.mjs` | One centred portal, fixed text layout, pointer corridor and keyboard/touch behaviour |
| `src/particles.mjs` | Independent time-driven particle lifecycle and scroll-controlled emission |
| `src/content.mjs` | Four project summaries and decision outlines |
| `src/style.css`, `src/scene.css` | Responsive layout, constant-width contours, previews and reduced-motion fallback |
| `scripts/build.mjs` | Home/case templates; emits real pages and fallback views |
| `public/assets/fonts/` | Local font subsets and OFL licences |
| `tests/*.test.mjs` | Geometry, particle lifecycle and preview controller regression checks |
| `scripts/export-scene-frames.mjs` | Reproducible SVG geometry frames and A/B handoff views |
| `docs/storyboard.svg` | Initial S0–S7 visual storyboard, committed before the prototype |
| `docs/storyboard.md` | Revised S0–S7 requirements, timings and resolved open parameters |
| `docs/scene-revision.md` | Initial code review and revision architecture |
| `docs/content-status.md` | Editorial replacements and factual boundaries |
| `docs/verification.md` | Check evidence and remaining browser acceptance pass |

`dist/`, source documents, private materials and local QA images are excluded from Git. The supplied banner informed the palette, converging lines and aircraft motif; its original file is not redistributed.

## Update content

Edit project prose in `src/content.mjs`. Keep slugs stable: the build emits `cases/<slug>/index.html`, so direct opening and refresh need no SPA fallback. Home, About, recommendation, navigation and contact text live in `scripts/build.mjs`.

See `docs/content-status.md` before replacing placeholders. To add the approved CV, put its PDF in `public/assets/` and replace the CV anchors with a relative file link at each page depth. Add `download`. Add WhatsApp only after receiving a verified phone-number or account share link.

For a different repository name, change `/myportfolio/` in the 404 template and local server. Normal pages/assets already use relative URLs.

## Animation decisions

The opening text, skills and a long static tangled route share one world layer, translated by native scroll travel. The route converges into a runway without shrinking. An already opaque aircraft flies along its continuation, grows and settles in the frame.

The aircraft uses fixed-dimension 3D lofts projected to SVG: smooth fuselage and cockpit glazing, attached airfoil wings, tail, two underwing engines and many passenger windows. Only four selected windows are interactive. Quaternion interpolation establishes the side view before zooming. A more finely sampled close-up model shares the same windows and engine anchors; the late-zoom crop hides differing geometry at the direct A/B switch. There is no model crossfade or changing physical dimensions.

Surface masks hide far components, while wing/tail masks follow their actual silhouette boundaries. All coordinates are computed in CSS pixels and contours use **1.5 px** with non-scaling stroke. A separate ray-tested renderer is available for offline reference, not used in the animation loop. Models are prepared during idle time; unused ray records are lazy.

Previews open as one body-level portal above a translucent backdrop that leaves native scrolling available. The **0.76** window/preview ratio and proportional rounding are retained. Final size is calculated per viewport, up to **420 px** wide with safe padding. Text is laid out immediately at that final width, then revealed after the shell opens; letters are not scaled. A pointer corridor connects the source window and centred card. Resize, quick reopening, keyboard focus, Escape and touch activation have controller regression checks.

The camera is a pure function of scroll progress, with no settling tail or time-driven flight after scrolling stops. Long moves receive more scroll distance; scale changes use logarithmic interpolation. S4 has a stable reading interval. A cropped cabin/wing/pylon view connects the window area to the engine before the 90° horizontal orbit, small descent, frontal approach and final fade. See `docs/storyboard.md` for phase timings.

Particles have their own time-driven lifecycle. Scroll controls their emission and initial direction. S4 disables new particles but lets existing ones leave naturally; emission resumes gradually after it. No new particles spawn after the aviation scene or in About.

Reduced motion and JavaScript failure expose ordinary flow, case links and static top/side/front views. Returning from a case restores catalogue progress when session storage is available; `#work` remains a direct fallback.

For geometry inspection without a browser:

```sh
npm run frames -- 1440 900
npm run frames -- 390 844
```

The ignored `qa-output/` contains 22 SVG frames per viewport, including matched A/B views. These are geometry diagnostics. Browser interaction, CSS layout, touch behaviour, device performance and perceived animation pace still require the manual acceptance pass in `docs/verification.md`.

## Fonts

Onest and Unbounded are local WOFF subsets with English text, Latin extensions, punctuation and arrows. Sources: official [Onest](https://github.com/google/fonts/tree/main/ofl/onest) and [Unbounded](https://github.com/google/fonts/tree/main/ofl/unbounded) families. Original SIL OFL 1.1 licences are shipped beside them. The site has no external font, tracking or script requests.
