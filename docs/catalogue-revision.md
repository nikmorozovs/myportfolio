# Catalogue and content revision — 20 October 2026

This is an update to the existing portfolio, preserving its aircraft geometry, palette, native scroll camera, reading reserves, inward engine particles, vibration, fan rotation, header and Pages deployment.

## Source review and semantic mapping

- S0 is the opening competency composition. Previously `state=0` ended at progress 0.18, although the competency headings remained visible later; interaction visibility must follow the actual opening composition.
- S4 currently begins with the window zoom at **5.85**, becomes fully interactive at **8**, and ends at **10**. Its complete range is **4.15** scroll units. The new complete range is **3.735** (90%); preserve the entry zoom and move the end to **9.585**, leaving **1.585** stable units. Shift every downstream boundary by **−0.415** and derive Work from the updated ready interval.
- S7 begins only after the engine is completely absent. Its real About section and 0.75-viewport reading track remain separate from the aircraft timeline.
- The runway already has a shared world coordinate system, but the aircraft begins offscreen at the former takeoff boundary. Add a stationary miniature on the runway, an accelerating ground roll and a continuous liftoff that stays inside the viewport. Do not merely move the old timeline.
- The late fixed caption duplicates Ready for takeoff. Replace it with a real heading in a clear pocket between converging route branches, translated with the same world as the lines.
- `src/content.mjs` covers only projects; the build and runtime also contain copy. Consolidate all editorial values into **`src/content.json`**, retaining project slugs as stable IDs, and document its safe plain-text/line-break structure. Keep geometry/timing in implementation modules.

## Interaction decisions

- Project previews open by primary activation/Enter/Space only. Hover, pointer departure and focus do not toggle them. Keep one selected project ID; crossing S4 changes presentation visibility without clearing selection. Close by close button, outside activation or Escape. A real linked project heading replaces the Open case action.
- The carousel has exactly four accessible main project controls. Visual continuation copies are hidden from accessibility APIs and cannot open previews. Arrow/drag/swipe moves one periodic window pattern; project identity comes from the shared content record, never the original DOM position.
- Resolve horizontal intent before capturing touch movement, preserve native vertical scrolling, suppress post-drag clicks and release pointer capture on cancellation/section exit. Lock carousel controls while a preview is open.
- Carousel movement changes only window presentation. It never changes the camera, aircraft, engine or vibration transform. Preserve the periodic window phase through a boundary; normalize residual presentation only after the windows leave the crop.
- Competency explanations have their own local controller: hover region with a short leave delay, touch/keyboard toggle, one local panel, no backdrop or page-centering. Absolute panels do not change scene length and close when S0 leaves.
- Real whitespace is part of every multi-line heading and compound text. Configured line breaks are rendered with text separators, never trusted HTML.

## Verification plan

Add regressions for stationary/accelerating runway poses, continuous departure and viewport bounds; total S4 compression/Work; click-only preview selection versus visibility; looping identity and gesture cancellation; independent competency behaviour; safe config rendering and an edited-config build. Re-run existing geometry, particle, motion and navigation checks. Inspect desktop/mobile projection frames. Browser QA depends on the managed Sites preview supervisor; its current mailbox is unavailable. Do not replace that infrastructure with another server or claim real-device Safari checks.

## Implemented result

- Park at 12% of the shared runway length with a 24–40 CSS px miniature. Accelerate at progress 1.9 while the first quarter is in view, reach 84% at 2.5 and continue with a velocity-matched Hermite liftoff to the unchanged top pose at 3.75. The heading occupies the route's clear world-space pocket at 1.83–2.015 units.
- Full S4: **5.85–9.585**, stable **8–9.585**, Work normally **8.4755**. S5 pan/orbit ends at 14.085; S6 fade starts at 15.385 and finishes at **16.235**. S7's real About track retains its 0.75-viewport reserve.
- `carousel.mjs` owns manual window presentation: 7 px threshold, dominant-axis touch intent, 240 ms snap, one cyclic ID mapping and a post-drag click guard. It releases capture on exit/cancel/resize/blur and locks under a preview. Fractional residual cabin presentation survives a handoff until it is outside the crop; airframe/camera/engine coordinates are unchanged.
- `preview.mjs` now owns explicit project selection independently of section visibility. Native buttons activate with Enter/Space; hover, focus and departure do nothing. Linked copper headings navigate. Section exit suspends presentation; explicit close clears selection. Case return storage includes progress, ordering and selected ID. Static/reduced-motion document flow uses actual section visibility as well.
- `competencies.mjs` independently owns local hover/touch/keyboard explanations, 210 ms delayed departure, one open panel and width clamping. Its panels do not affect document/scene length.
- `src/content.json` is the single editable UTF-8 content source. `content.mjs` now provides only safe formatting/validation and fixed icon paths. The build generates all page text, preview templates and runtime records from that JSON. Structured lines keep ordinary separators; configured content cannot execute HTML. Optional CV/WhatsApp destinations are data fields, currently null; unapproved facts or URLs were not added.

All **71 tests**, build and **157 local-reference checks** pass. Desktop/phone takeoff/title projections were rasterised and inspected. A/B renders agree exactly in 20 comparisons (10 sizes × normal/fractional phase). The feature commit is `af71611bc3b740ee5b33e45b2cad28c0845505b5`; its workflow and Pages deployment succeeded, and 24 served resources matched the build. See [verification.md](verification.md) for evidence and the unavailable browser/device checks.
