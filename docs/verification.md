# Verification

## Automated checks

`npm test` covers 320×568, 360×640, 390×844, 568×320, 640×900, 768×1024, 844×390, 1280×720, 1440×900 and 1920×1080, including two landscape phone layouts.

- S2 nose-down, S3 nose-left and S6 90° spatial orbit; frontal inlet is circular.
- Continuous camera, projected points and scale at all phase boundaries.
- Four windows remain within the viewport and stationary throughout the S4 reading interval.
- Preview ratio and relative corner radius match the window; previews fit the safe viewport.
- Reversing or jumping progress gives the same deterministic state.
- Complete S7 fade-out; finite coordinates and one non-scaling contour width.

After building, `npm run check` validates all local pages, anchors, routes, fonts and module references. Six HTML pages are generated: home, four cases and 404. Cases are real static directories.

## Visual geometry review

Actual SVG projection output was rasterised and inspected at desktop and phone dimensions, including intermediate orbit/approach frames. This covers geometry and cropping, not browser layout or event dispatch.

## Browser verification limit

The Sites `control-browser` capability is absent. Under its preview instructions, no preview server or alternative browser automation was started. Desktop/mobile browser rendering, event behaviour, real-device performance, BFCache and subjective perceived pace are **unverified in a browser**. Mathematical/source checks do not substitute for them.

## Manual acceptance pass

1. Inspect the first screen at desktop/phone sizes. Scroll S0–S7 normally, stop within each transition, reverse and jump quickly.
2. Inspect continuous viewpoint changes and constant contours. S4 should contain windows only. Check every preview, transfer the pointer to it, and test Tab/Enter, Escape and first-tap/explicit-open behaviour.
3. Scroll out of S4 with a preview open. It closes before the engine. Check spatial orbit, slight descent, circular inlet, close-up and fade-out.
4. About/contact scroll normally with no engine overlay. Test all navigation anchors from different positions.
5. Direct-open and refresh each case, use section links and other-case cards, then return to the catalogue. Check back/forward and orientation/resize changes.
6. Enable reduced motion and disable JavaScript separately; every case/contact link must remain usable.
7. Recheck CV, About, recommendation and WhatsApp when approved inputs arrive.

## Deployment

The first [Actions run](https://github.com/nikmorozovs/myportfolio/actions/runs/39254959351) passed geometry tests, build, route checks and artifact upload. Deployment stopped at **Read Pages configuration** because this repository does not yet have Pages enabled. The GitHub repository API also reported `has_pages: false`.

The owner needs the one-time **Settings → Pages → Source → GitHub Actions** selection, then a workflow rerun or another push. The connector supports source/workflow writes but exposes no Pages administration action. A successful deploy job is required before treating the target as live.
