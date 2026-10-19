# Verification

## Automated checks

`npm test` runs 22 tests. Geometry checks cover 320×568, 360×640, 390×844, 568×320, 640×900, 768×1024, 844×390, 1280×720, 1440×900 and 1920×1080, including two landscape phone layouts.

- Static route shape, shared scroll translation, fully opaque runway entry, monotonic takeoff travel and scale.
- Fixed aircraft dimensions, compact engine proportions, pylon intersections with both the wing and nacelle, two engines, numerous cabin windows and exactly four selected case windows.
- Matching A/B window curves and engine anchors, with differing geometry outside the switch crop.
- Continuous camera and projected anchors at every phase boundary; top nose-down, side nose-left, 90° engine orbit and circular frontal inlet.
- Deterministic reverse/fast scrubbing and stopping, stable S4 windows and complete S7 fade.
- Both ends of the cabin-to-engine connection remain visible during the intermediate framing; the full aircraft does not return.
- Centred preview bounds, proportions, padding and pointer-transfer corridors across all tested viewport sizes.
- Particle directions, S4 no-spawn with survivors retained, smooth restart, bounded counts, oscillation without bursts, end-of-scene drain and independence from camera progress.
- Preview controller resize, rapid close/reopen cancellation, delayed keyboard focus, Escape, first coarse-pointer activation, explicit navigation and pointer-leave intent.

The five preview controller tests use a minimal DOM contract with a deterministic clock. They verify state and timer behaviour, **not browser rendering, hit testing or native event dispatch**.

`npm run build` emits six real HTML pages: home, four case directories and 404. `npm run check` validates 144 local page/anchor/asset/font/module references. It also checks the built home hierarchy: intro, skills and route share one parent; the single preview portal is a body child outside the clipped stage; exactly four case entrances exist. All checks pass.

## Visual geometry and layout evidence

The actual SVG renderer was rasterised and inspected at desktop and phone dimensions, including tangled route/convergence, takeoff, three intermediate aircraft rotations, side view, window zoom, cabin-to-engine framing, intermediate orbit, inlet approach and fade. Corrected an overly broad convex wing mask after inspection; wing/tail masks now follow their actual projected boundaries.

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

1. Scroll normally, reverse, jump quickly and stop during every transition. S0 text and route must leave together; the aircraft follows the runway at full opacity.
2. Inspect nose/cockpit, attached wings and both engines throughout the top-to-side turn. Check constant line width and reversible A/B handoff.
3. Open every preview. Transfer the pointer to the centred card, leave it, reopen quickly, test Tab/Enter, Escape, first tap and explicit Open case. Check backdrop order, final text wrapping and safe padding.
4. Resize/orient the viewport with a preview open; keep it visible and correctly laid out. Scroll through the card without a scroll lock.
5. Observe particle directions and natural drain in S4; restart after S4 must be gradual. Verify no new particles in About.
6. Check the connected engine pan, 90° horizontal orbit, slight descent, inlet approach and fade. About/contact must scroll normally.
7. Direct-open/refresh every case, navigate sections/other cases and return to catalogue. Check Back/Forward and reduced motion/JavaScript-disabled fallbacks.
8. Recheck CV, About, recommendation and WhatsApp once approved inputs arrive.

## Publication

Live site: https://nikmorozovs.github.io/myportfolio/

The revised feature implementation passed [GitHub Actions and Pages deployment](https://github.com/nikmorozovs/myportfolio/actions/runs/39272680379). Later fixes and documentation use the same [test/build/check/deploy workflow](https://github.com/nikmorozovs/myportfolio/actions/workflows/pages.yml). Publication is automatic on `main`; no added token or external hosting service is required.
