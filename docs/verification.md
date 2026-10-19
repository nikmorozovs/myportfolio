# Verification

## Automated checks

`npm test` runs **44 tests**, all passing. Geometry/layout checks cover 320×568, 360×640, 390×844, 568×320, 640×900, 768×1024, 844×390, 1280×720, 1440×900 and 1920×1080, including two landscape phone layouts.

- Static route shape, shared scroll translation, fully opaque runway entry, monotonic takeoff travel and scale.
- Fixed aircraft dimensions, compact engine proportions, pylon intersections with both the wing and nacelle, two engines, numerous cabin windows and exactly four selected case windows.
- Matching A/B window curves and engine anchors, with differing geometry outside the switch crop.
- Continuous camera and projected anchors at every phase boundary; top nose-down, side nose-left, 90° engine orbit and circular frontal inlet.
- Deterministic reverse/fast scrubbing and stopping, fully revealed stable S4 windows throughout progress 8–10, preserved transition durations, and a completely absent engine at S7.
- Both ends of the cabin-to-engine connection remain visible during the intermediate framing; the full aircraft does not return.
- Centred preview bounds, proportions, padding and pointer-transfer corridors across all tested viewport sizes.
- Work targets inside the stable interval, header/safe-area-aware preview bounds, About's 0.75-viewport reserve for both short and long text, and enough native range for Contact alignment.
- Absolute time-based actual scroll speed, exponential attack/release, velocity cap, inertial decay, 30/120 Hz consistency and sign-independent response.
- Screen-bounded common aircraft vibration, continuous phase through the A/B switch, frequency-only acceleration, zero S4 amplitude and unchanged camera poses.
- Interruptible navigation, actual intermediate page positions, 220–820 ms duration, retargeting, manual-gesture cancellation and reduced-motion direct jumps.
- Inward S6 particles following the projected moving engine axis, S4 no-spawn with survivors retained, smooth restart, bounded counts, oscillation without bursts and end-of-scene drain. 30/120 FPS trajectories agree within the test tolerance.
- Immutable 2× particle calibration. Simulated visible population at the same viewport stays within 1.82–2.18× the former calibration at scroll speeds 0, 1200 and 4800 px/s, on desktop and phone. This is a model-space density comparison, not a perceptual browser measurement.
- Half-width/half-length runway, exact shared marking/clip bounds, tangent-matched thin-route expansion and unchanged global line width.
- Far-engine masks checked against reference wing-ray occlusion at 17 top-to-side angles while retaining visible portions. A common aircraft group contains geometry, masks and the opaque particle blocker.
- Clockwise fan-blade rotation from the front, inlet clipping, monotonic reversible scroll angle and continued rotation through the last visible fade frame; the rim stays fixed.
- Preview controller resize, rapid close/reopen cancellation, delayed keyboard focus, Escape, first coarse-pointer activation, explicit navigation and pointer-leave intent.

Preview/navigation controller tests use minimal DOM/scroll contracts and deterministic clocks. They verify state, cancellation and timer behaviour, **not browser rendering, hit testing, native event dispatch or real inertia**.

`npm run build` emits six real HTML pages: home, four case directories and 404, totalling **482 KiB** with assets. `npm run check` validates **150 local page/anchor/asset/font/module references**. It also checks the built hierarchy: shared intro/skills/route parent, a single body-level preview portal, exactly four case entrances, `viewport-fit=cover`, a body-level header with separate opaque surface/content, one About section in a real reading track, and Contact preceding the footer. All checks pass.

## Visual geometry and layout evidence

The actual SVG renderer was rasterised and inspected at desktop 1440×900 and phone 390×844 dimensions, including tangled route/convergence, the shortened filled runway/expansion, takeoff, three intermediate aircraft rotations, side view, window zoom, cabin-to-engine framing, intermediate orbit, inlet approach and fade. Wing/tail masks follow their actual projected boundaries; the far-engine mask now also enforces wing/fuselage occlusion throughout rotation. A separate inward-streak diagnostic checked opaque engine overlap. These are geometry projections, not browser page screenshots.

Forced overview/detail renderings at the **same handoff pose** were rasterised at all ten tested viewport sizes. Every pair was pixel-identical: zero changed channels. This tests the model switch itself in both directions; neighbouring camera continuity is checked numerically.

An offline line-wrap estimate using the shipped Onest font metrics found spare vertical room for all four previews across those viewports, including compact landscape copy. This is a fit estimate, not a browser typography screenshot.

Export reproducible geometry frames with:

```sh
npm run frames -- 1440 900
npm run frames -- 390 844
```

Each command writes 22 SVG frames and a progress manifest under ignored `qa-output/scene-<width>x<height>/`, including forced A/B handoff frames. These omit HTML text, previews and time-driven particles by design.

## Browser verification limit

The Sites `control-browser` capability is absent. Under its preview instructions, no preview server or alternative browser automation was started. Desktop/mobile browser layout, CSS transitions, native mouse/touch/keyboard behaviour, real-device performance, BFCache and subjective perceived pace remain **unverified in a browser**. Source, controller and mathematical checks do not replace that acceptance pass.

## Remaining browser acceptance pass

1. Scroll slowly, quickly and with inertia in both directions; stop at intermediate poses. S0 text and route must leave together. Confirm the thin route, smooth expansion and copper runway are continuous, markings remain inside its half-length body, and the aircraft follows it at full opacity.
2. Inspect nose/cockpit, attached wings and both engines throughout the top-to-side turn. Check far-engine occlusion at intermediate angles, constant line width, common subpixel vibration and reversible A/B handoff. Faster scrolling should change vibration frequency without increasing displacement.
3. Open every preview. Transfer the pointer to the centred card, leave it, reopen quickly, test Tab/Enter, Escape, first tap and explicit Open case. Check backdrop order, final text wrapping and safe padding.
4. Resize/orient the viewport with a preview open; keep it visible and correctly laid out. Scroll through the card without a scroll lock.
5. Compare particle visibility/density at matching viewport/speeds. Check acceleration/deceleration, a nonzero stationary speed and natural S4 drain without a layer fade. Restart must be gradual. At S6 streaks must travel inward behind the moving engine, including during reverse scroll. Verify no new particles in About.
6. Check the connected engine pan, 90° horizontal orbit and slight descent. During frontal enlargement and fade, the clipped blades must rotate clockwise while the casing stays fixed, until every contour disappears. Stop/reverse scroll to test angle reversibility.
7. Check the extra fully interactive S4 reading range and the About reserve with short/long copy; no engine fragment may be held. Navigate Work/About/Contact from above, below and repeatedly. Interrupt a jump with a gesture and redirect it with another link. Work must enter the stable range with all four labels/icons visible without prior manual scene traversal.
8. Check the opaque header at viewport top with expanded/collapsed Safari bars, safe areas, bidirectional scroll and orientation change. Verify Contact aligns below the header, fills the available screen and has spare space before the footer, including at the page's maximum scroll.
9. Direct-open/refresh every case, navigate sections/other cases and return to catalogue. Check Back/Forward and reduced motion/JavaScript-disabled fallbacks.
10. Recheck CV, About, recommendation and WhatsApp once approved inputs arrive.

## Publication

Live site: https://nikmorozovs.github.io/myportfolio/

The latest flight/scroll implementation is commit `5b2d9442e386d517c1cfc93a46e37d0522087ffd`. Its [GitHub Actions run](https://github.com/nikmorozovs/myportfolio/actions/runs/39287896256) completed successfully, including tests, build, link checks and Pages deployment. Documentation updates use the same [workflow](https://github.com/nikmorozovs/myportfolio/actions/workflows/pages.yml). Publication is automatic on `main`; no added token or external hosting service is required.

Live HTTP checks on 19 October 2026 confirmed the home page, all four direct case routes and 15 scripts/styles/views/fonts: **20 resources returned 200 and matched the local build's SHA-256 hashes**. One temporary 503 on the internal-tool route returned 200 with the matching hash on retry. The case route without a trailing slash redirected to its directory URL; an unknown route returned 404. These checks confirm served files/routes, not JavaScript execution or visual browser behaviour.
