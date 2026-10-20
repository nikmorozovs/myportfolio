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
| `src/layout.mjs` | Header-aware Work target, About reading track and section alignment |
| `src/motion.mjs` | Shared filtered absolute scroll speed and bounded aircraft vibration |
| `src/navigation.mjs` | Interruptible page navigation, redirection and reduced-motion handling |
| `src/preview.mjs` | Click-only project selection, one centred portal and section visibility |
| `src/carousel.mjs` | Manual periodic window carousel, identity mapping and pointer gestures |
| `src/competencies.mjs` | Independent local S0 explanations and viewport bounds |
| `src/particles.mjs` | Time-driven particles, speed-compensated density and inward engine flow |
| `src/content.json` | Single UTF-8 source for every editorial value and accessible control label |
| `src/content.mjs` | Safe text/line-break formatting, config validation and fixed vector icons |
| `src/style.css`, `src/scene.css` | Responsive layout, constant-width contours, previews and reduced-motion fallback |
| `scripts/build.mjs` | Home/case templates; emits real pages and fallback views |
| `public/assets/fonts/` | Local font subsets and OFL licences |
| `tests/*.test.mjs` | Geometry, motion, navigation, particle lifecycle and preview controller checks |
| `scripts/export-scene-frames.mjs` | Reproducible SVG geometry frames and A/B handoff views |
| `docs/storyboard.svg` | Initial S0–S7 visual storyboard, committed before the prototype |
| `docs/storyboard.md` | Revised S0–S7 requirements, timings and resolved open parameters |
| `docs/scene-revision.md` | Initial code review and revision architecture |
| `docs/interaction-revision.md` | Semantic state mapping and latest scroll/flight calibration |
| `docs/catalogue-revision.md` | 20 October state mapping, carousel/preview rules and content migration |
| `docs/content-status.md` | Editorial replacements and factual boundaries |
| `docs/verification.md` | Check evidence and remaining browser acceptance pass |

`dist/`, source documents, private materials and local QA images are excluded from Git. The supplied banner informed the palette, converging lines and aircraft motif; its original file is not redistributed.

## Update content

**Edit `src/content.json`**, saved as UTF-8. It supplies navigation, scene labels/captions, identity, indicators, competencies/explanations, window labels, project previews/full case text, diagram captions, About, recommendation, contacts, footer, 404 and accessible control names. There is no second editable copy in components: the build renders HTML and embeds runtime records from this same file. Geometry, coordinates and animation timings stay in the implementation modules.

For example, edit the existing `work.title` heading, `about.paragraphs[0]` paragraph and `hero.facts[0].value` indicator. The following is a **partial example**, not a replacement for the full file:

```json
{
  "work": { "title": "Selected work" },
  "about": { "paragraphs": ["Write the approved personal introduction here."] },
  "hero": {
    "facts": [{ "id": "experience", "value": "7", "suffix": " years" }]
  }
}
```

Keep the other fields in those records. Use confirmed values for indicators. Plain strings wrap naturally; structured text such as `{ "lines": ["The person", "behind the", "process"] }` adds line breaks **with real spaces between words**. `"break": "desktop"` makes those breaks responsive. Keep existing field types: window names, preview summaries, metadata and labels are plain strings; the `lines` form is used for multi-line headings and can also format About/full-case paragraph entries. Strings are escaped; HTML is displayed as literal text. Links use supported URL fields rather than arbitrary HTML. SEO and accessible-name templates accept the documented tokens `{name}`, `{role}` or `{project}` where already used.

Keep the four project `id`/`slug` pairs and competency IDs stable. The carousel, preview templates and routes all refer to those same records; icons use the existing `chat`, `quality`, `data`, `tool` identifiers. The build emits `cases/<slug>/index.html`, so direct opening and refresh need no SPA fallback.

After editing, run `npm test`, `npm run build` and `npm run check`. A **new build and publication are required**. Pushing the JSON change to `main` runs that workflow and updates GitHub Pages automatically. Do not edit generated `dist/` files.

See `docs/content-status.md` before replacing placeholders. To add an approved CV, put its PDF in `public/assets/`, set `contact.cv.href` to `assets/your-cv.pdf`, set `contact.cv.download` to `true` and update its label. A null `href` keeps the current email-request action. No component edit is needed. Set `contact.whatsapp.href` only after receiving a verified phone-number/account share URL; null keeps the pending label.

For a different repository name, change `/myportfolio/` in the 404 template and local server. Normal pages/assets already use relative URLs.

## Animation decisions

The opening text, skills, Ready for takeoff heading and long static tangled route share one world layer, translated by native scroll travel. The heading occupies a deliberate clear pocket before convergence; there is no late duplicate caption. The route converges into a runway without shrinking. A fully opaque miniature is already parked on that runway before moving. Its world-space ground roll accelerates quadratically; a position/velocity-matched liftoff grows and brings it towards the centre while keeping the complete model inside the viewport. Reverse scroll restores the same relationship.

The aircraft uses fixed-dimension 3D lofts projected to SVG: smooth fuselage and cockpit glazing, attached airfoil wings, tail, two underwing engines and many passenger windows. Only four selected windows are interactive. Quaternion interpolation establishes the side view before zooming. A more finely sampled close-up model shares the same windows and engine anchors; the late-zoom crop hides differing geometry at the direct A/B switch. There is no model crossfade or changing physical dimensions.

Surface masks hide far components, while wing/tail masks follow their actual silhouette boundaries. An explicit far-engine wing/fuselage mask applies throughout the top-to-side transition. All coordinates are computed in CSS pixels and contours use **1.5 px** with non-scaling stroke. A separate ray-tested renderer is available for offline reference, not used in the animation loop. Models are prepared during idle time; unused ray records are lazy.

Project previews open by **click, Enter or Space**. Hover, pointer departure and focus alone do not toggle them. One stable project ID is selected at a time. A linked copper project heading, with its arrow attached to the end of the name, navigates to the real case page. The close button, outside click and Escape close the selection. Leaving S4 hides the portal/backdrop while retaining the selection; returning restores it. Case return state also preserves carousel ordering and selected project.

The body-level portal leaves native scrolling available. The **0.76** window/preview ratio and proportional rounding are retained. Final size is calculated per viewport, up to **420 px** wide with safe padding and a **44 px** close target. Text uses its final width throughout opening and appears after the shell opens; letters are not scaled. Very short previews can scroll internally; long words may wrap in compact columns while the arrow stays attached to the name. Resize and quick reopening cancel stale callbacks.

When a preview is closed, a manual looping carousel shows four full project windows and partial neighbours. Arrows move one slot; mouse drag and horizontal touch gestures snap to the nearest slot. Vertical touch scrolling remains native. Exactly four main controls are accessible; continuation copies are inert and hidden from screen readers. A movement threshold suppresses the post-drag click. Open previews lock the carousel. A fractional interrupted window phase is carried by cabin presentation through the boundary and normalized only when the cabin is outside the crop; it never changes the camera, wings or engine.

S0 competency explanations use a separate local controller: mouse hover opens below the heading, a **210 ms** leave delay bridges the panel, and touch/keyboard activation toggles it. Only one local explanation opens; there is no backdrop. Panels are absolutely positioned, clamped to the viewport width and closed when S0 leaves. Their Lorem ipsum copy is editable in the same JSON file.

The camera is a pure function of scroll progress, with no settling tail or time-driven flight after scrolling stops. Long moves receive more scroll distance; scale changes use logarithmic interpolation. The **complete S4 range is 90%** of its former length: progress **5.85–9.585**, with the same entry and a **1.585-unit stable interval from 8**. Work normally targets **8.4755**, where all windows/names/icons are ready. Small mobile browser-height changes keep the scroll basis stable; orientation changes recalculate it. A cropped cabin/wing/pylon view connects the windows to a 90° horizontal engine orbit, small descent, frontal approach and final fade. During approach and fade, only the inlet-clipped fan blades rotate, by **1.5 clockwise turns** tied to scroll progress. See `docs/storyboard.md` for timings and semantic S0–S7 names.

The runway body is half its former width and length, filled copper with background-coloured markings clipped to its exact bounds. A short tangent-matched expansion joins the thin route to the runway without a gap.

Particles have their own time-driven lifecycle. The immutable `PARTICLES` configuration fixes density at **2×** the previous calibration, with **0.38 opacity** and emission compensated for speed. Actual scroll velocity is measured in pixels/second, smoothed, limited and shared with aircraft vibration. Particle speed ranges from **100–540 px/s** on desktop and **75–420 px/s** on phones, before each particle's fixed variation. S6 flows from the viewport perimeter towards the moving engine axis, behind opaque aircraft masks. S4 stops spawning while survivors continue moving; spawning resumes gradually. No new particles appear after the aviation scene or in About.

The entire aircraft, including its masks, shares one continuous vibration phase. Maximum displacement remains **0.38 × 0.22 CSS px**, independent of zoom. Scroll speed changes frequency from **2.2–5.4 Hz**, not amplitude; S4 is stationary. Camera position and fan rotation remain scroll-only.

Work, About and Contact use one cancelable scroll controller, at most **820 ms** for distant targets. A new wheel, touch, pointer or scroll-key gesture interrupts it; another link retargets it from the actual page position. Reduced motion jumps directly. About receives a separate **0.75 viewport** reading reserve after the engine is gone. Longer text scrolls normally before the final readable screen holds. Contact fills at least the viewport below the header, with spare space inside the section before the footer. The header has a full opaque top surface and a separate safe-area-aware content row.

Reduced motion and JavaScript failure expose ordinary flow, case links and static top/side/front views. Returning from a case restores catalogue progress when session storage is available; `#work` remains a direct fallback.

For geometry inspection without a browser:

```sh
npm run frames -- 1440 900
npm run frames -- 390 844
```

The ignored `qa-output/` contains 25 SVG frames per viewport, including parked/rolling/liftoff poses and matched A/B views. These are geometry diagnostics. Browser interaction, CSS layout, touch behaviour, device performance and perceived animation pace still require the manual acceptance pass in `docs/verification.md`.

## Fonts

Onest and Unbounded are local WOFF subsets with English text, Latin extensions, punctuation and arrows. Sources: official [Onest](https://github.com/google/fonts/tree/main/ofl/onest) and [Unbounded](https://github.com/google/fonts/tree/main/ofl/unbounded) families. Original SIL OFL 1.1 licences are shipped beside them. The site has no external font, tracking or script requests.
