# Verification — 20 October 2026

## Automated checks

`npm test` runs **72 tests**, all passing. Existing geometry/layout coverage includes 320×568, 360×640, 390×844, 568×320, 640×900, 768×1024, 844×390, 1280×720, 1440×900 and 1920×1080. New checks cover:

- A stationary fully opaque miniature tied to the runway before the roll; its first quarter is visible when acceleration begins. Quadratic world-space roll, last-quarter liftoff and matched position/velocity at departure.
- Complete aircraft viewport bounds throughout accelerating departure/enlargement at desktop and phone sizes, deterministic reverse scrubbing and continuous camera boundaries.
- An empty heading pocket between every sampled route branch, above convergence; the real Ready for takeoff heading shares the translated route world and has no late caption duplicate.
- Complete S4 compression from 4.15 to 3.735 units (90%), preserved entry, stable 1.585-unit ready interval and header-aware Work targets in its interior. All downstream boundaries move by −0.415.
- Periodic carousel identity over positive/negative loops, four distinct main projects, inert inaccessible copies, partial neighbours at both viewport edges and matching names/icons after arrow movement.
- Dominant horizontal touch intent versus native vertical movement, drag threshold, pointer capture/release outside the source, cancellation, section exit, resize, interrupted snap and post-drag click suppression. Reduced-motion ordering, static-flow visibility and return-state restoration are covered.
- Click-only previews: hover/focus/departure do not toggle them; the opening click cannot outside-close itself. Correct content and destination follow a stable project ID after permutation. Selected ID persists while the S4 presentation is hidden, then restores on reverse entry.
- One preview, close button/outside click/Escape, carousel-arrow exclusion, lock state, fixed final text width, keyboard reveal/focus, resize and stale-timer cancellation.
- Independent competency hover region, 210 ms delayed leave, touch/keyboard toggles, outside tap, Escape, one open panel, horizontal viewport bounds and close-on-S0-exit.
- Single JSON validation, stable project/competency IDs, ordinary whitespace before adaptive breaks and literal HTML escaping. A test rebuilds with edited heading, paragraph, indicator, project/full-case copy, runtime caption, accessible name and configured contact/CV destinations. Components stay unchanged. Embedded JSON safely retains a literal `</script>` string.

Existing checks also pass for aircraft proportions/construction, many decorative windows and four case anchors, two engines, pylon attachment, A/B matching, far-engine occlusion at 17 intermediate angles, camera continuity, connected pan/orbit, clockwise inlet-clipped fan through the last visible fade, reading reserves, Contact alignment, interruptible navigation, bounded speed/vibration, immutable 2× inward particles and natural S4/end drain. 30/120 Hz motion/particle comparisons remain covered.

Controller tests use minimal DOM/event/scroll contracts and deterministic clocks. They exercise logic and event ordering, **not CSS hit testing, native keyboard default actions, real inertia or browser rendering**. Native button markup supplies Enter/Space semantics; the actual device interaction still requires browser acceptance.

`npm run build` emits six HTML pages: home, four real case directories and 404. `npm run check` validates **157 local links/assets** and **535 KiB** output. Built-DOM checks include shared route/heading coordinates, four fallback case links, one body-level preview portal, linked project titles with inseparable arrows, four competency controls/panels, carousel arrows, accessible ID references, safe-area header structure, About track and Contact/footer order. All line breaks in generated HTML retain real separators. The runtime project records match the published JSON config. Private input documents/fonts remain excluded; only an explicitly configured publishable CV PDF is allowed.

## Projection and typography evidence

Actual SVG views were rasterised and inspected at 1440×900 and 390×844: convergence with a title outline from the shipped Unbounded font, parked miniature, roll start/midpoint, liftoff and enlargement. The title sits between the branches; the aircraft remains above the runway and leaves while its last quarter is visible. These are **geometry/font diagnostics**, not browser screenshots.

Forced overview/detail renders at the same handoff pose were compared at all ten viewport sizes, both at normal cabin phase and a fractional interrupted-carousel phase of 0.37. All **20 pairs were pixel-identical**, with zero changed channels. Projected camera/engine coordinates are unchanged by carousel phase. Normalization is delayed until cabin curves are outside the crop. A final reverse-view check also keeps shifted cabin windows out of fixed door openings.

Shipped-font advance measurements checked the title pocket, small competency chevrons and the linked title's word/arrow groups. A compact linked-title size was reduced after finding a small overflow. Very narrow columns can wrap long words while the final character stays attached to the arrow, preserving the window proportions and readable letter size. This verifies measured text widths, **not browser line boxes, copied clipboard text or CSS clipping**. Real spaces are asserted in generated text; About's text reads `The person behind the process` when line breaks are removed.

Reproduce projection frames with:

```sh
npm run frames -- 1440 900
npm run frames -- 390 844
```

Each command writes **25 SVGs** and a phase manifest to ignored `qa-output/scene-<width>x<height>/`. They omit HTML controls/previews and time-driven particles by design. Additional temporary diagnostics and comparison results are also excluded from Git.

## Browser verification limit

The managed Sites preview could not start: `sites-previewd mailbox is unavailable at /tmp/sites-previewd/requests`. `sites-preview status` returned the same infrastructure error. The prescribed preview supervisor is unavailable; no alternative server or browser automation was substituted.

Desktop/mobile browser layout, actual mouse/touch/keyboard default behaviour, scroll inertia, clipboard copying, Safari safe areas/toolbars, real-device performance, BFCache and perceived animation pace remain **unverified in a browser**. Passing numerical/controller checks and HTTP responses do not replace that acceptance pass.

## Remaining browser acceptance pass

1. Slowly/quickly scroll both ways and stop at intermediate states. Confirm the already parked miniature, accelerating visible roll, last-quarter departure, continuous reverse relationship and full opacity. Check route/aircraft layer order.
2. Inspect the world-bound Ready for takeoff heading on wide/narrow screens, before departure; no branch should cross letters. Check all original aircraft/engine transitions and constant contours.
3. In S4, hover/focus without activation: no preview should open. Click or Enter/Space: open one preview without navigation. Pointer departure must not close it. Test close button, outside click, Escape and heading-link navigation/focus. Confirm dimming, padding and stable text wrapping.
4. Loop arrows in both directions; drag with mouse and swipe horizontally. Release outside a window, cancel, resize, interrupt a snap and try a vertical swipe. There must be no post-drag opening. Side copies remain inert; exactly four different projects remain accessible. Check each linked destination after several loops.
5. Keep a preview selected and scroll out of S4: the layer/backdrop must disappear; reverse entry must restore the same project. Repeat through Work navigation from above/below and after a case return. Arrows must not move or outside-close an open card.
6. Exit/re-enter while dragging or snapping. Inspect the periodic cabin handoff, including reverse S3 entry; no camera/engine movement or visible window reset may occur.
7. Test each S0 explanation with hover, pointer transfer, delayed leave, tap, outside tap, Tab and Enter/Space. Panels stay below their own headings, inside the horizontal viewport and do not shift lines/scene length. Short screens may scroll panel content. Leave S0 and confirm every explanation closes.
8. Resize About on phones, copy its heading and inspect real word separators. Repeat for multi-line headings/compound text. Verify the S7 reading reserve, no engine remnant and normal long-text scrolling.
9. Retest inward particles, speed response, zero S4 spawning/vibration, natural drain, fan rotation through disappearance, header with expanded/collapsed Safari bars and Contact's full available screen. Preserve manual navigation interruption and reduced motion.
10. Direct-open/refresh all four cases, test Back/Forward, no-JavaScript fallback links and error fallback catalogue. Replace editorial placeholders only with approved materials.

## Publication

Live site: https://nikmorozovs.github.io/myportfolio/

The feature commit `af71611bc3b740ee5b33e45b2cad28c0845505b5` passed [GitHub Actions and Pages deployment](https://github.com/nikmorozovs/myportfolio/actions/runs/39388516460). Live checks on 20 October confirmed **24 resources returned 200 with matching build SHA-256 hashes**: home, four direct cases and 19 modules/config/styles/views/fonts. The no-trailing-slash case route redirected correctly; an unknown route returned 404. Final editorial/config documentation uses the same automatic workflow on `main`.
