# Scroll and flight effects revision

Follow-up to the existing 19 October implementation. Preserve the shared intro/route world, scroll-only camera, matched A/B aircraft, constant copper contours, four case entrances, preview portal and existing factual copy. This revision supersedes the former outward S6 particle flow.

## State mapping before implementation

The decorative stage labels were numbered 01–08 independently of the specification. Runtime `state=6` previously began with the engine orbit, while `state=7` began at the start of the fade rather than at About.

| Specification state | Current source phases before this update | Revised meaning |
| --- | --- | --- |
| S0 | Intro at progress 0 | Shared opening composition |
| S1 | Route traversal, before `takeoff=2.35` | Static tangled lines, thin route, expansion and runway |
| S2 | `takeoff=2.35` to `turn=3.75` | Opaque runway departure, top view |
| S3 | `turn=3.75` to `zoom=5.85`, then window approach | Continuous aircraft viewpoint and window framing |
| S4 | Window approach; fully interactive from `hold=8` to `pan=9.25` | Fully revealed stable case windows, with extra reading travel |
| S5 | Cabin pan `9.25–11.75`, orbit `11.75–13.75` | Connected engine framing and horizontal orbit |
| S6 | Frontal approach `13.75–15.05`, fade `15.05–15.9` | Frontal engine, inward particle flow, approach and reversible clockwise fan rotation through the fade |
| S7 | Aircraft clear at `15.9`, followed by normal About | Engine fully absent; About enters normally, then receives reading travel |

## Implementation decisions

- Add 0.75 viewport-height-equivalent progress to the existing S4 hold, shifting every downstream phase together. Calculate Work inside the updated stable interval rather than using a boundary or fixed pixel target.
- Give the real About section a 0.75-viewport reading track once its content is visible. If content fits below the header, hold that view; if it is longer, scroll it normally and reserve the last readable screen. Do not prolong the engine fade or hold a blank engine frame.
- Use a single bounded, time-smoothed absolute scroll-speed signal for particles and subpixel aircraft vibration. Keep the camera a function of actual page position. Keep vibration phase continuous, its amplitude bounded in CSS pixels and its S4 envelope zero.
- Fix particle density as an immutable 2× configuration relative to the previous rate/speed calibration. Compensate emission for actual particle speed, gently ramp spawning, preserve survivors in S4 and drain after the flight. Draw the layer behind opaque aircraft masks. Inward S6 particles target the projected engine axis, independent of scroll direction.
- Use one interruptible navigation controller, at most 0.82 seconds for distant targets; read actual scroll positions on the way. Wheel, touch, pointer and scroll keys interrupt it. Reduced motion uses instant navigation.
- Halve runway body width and length; share exact body/marking bounds. Join the static thin route to the copper fill through a short tangent-continuous expansion; clip background-coloured dashes to the runway body.
- Mask the far engine with the corresponding wing and fuselage surfaces across the top-to-side path. Apply vibration to the common aircraft group including every mask.
- Rotate only the internal fan blade geometry clockwise from the front, by local scroll progress through the complete approach/fade. Keep the inlet clip and housing fixed.
- Make the header an opaque viewport-top surface with a separately padded safe-area-aware content row. Keep it a body child outside transformed scene containers. Size Contact to at least the available viewport and leave its surplus space after the content, before the footer.

## Final calibration

The table above records the source mapping **before** the change. The final phase boundaries are: hold **8**, pan **10**, orbit **12.5**, frontal approach **14.5**, fade **15.8**, aircraft clear **16.65**. Work normally targets **8.6**. The existing 1.25-unit S4 interval now totals 2 units; downstream transition lengths are preserved. On narrow phones one unit is 1.08 viewport heights, so the added S4 reserve is about 0.81 heights. About's additional track is exactly 0.75 measured viewport, outside the aircraft timeline.

Particle calibration is immutable: density multiplier **2**, opacity **0.38**, speed **100–540 px/s** (phones **75–420**) before fixed per-particle variation, count cap **40/24** and gradual emission restart. A shared actual-scroll signal caps input at **4800 px/s**, smooths acceleration over **0.18 s** and deceleration over **0.42 s**. Its response saturates at **3600 px/s**. The same signal changes vibration frequency **2.2–5.4 Hz** while keeping displacement bounded at **0.38 × 0.22 CSS px**. The phase survives model replacement; the S4 envelope is zero.

Navigation lasts **220–820 ms**, with quintic easing and one active animation. It recalculates the target from current geometry, can be redirected and is interrupted by native gestures. Minor mobile visual-viewport changes redraw without shifting the scroll basis; orientation/major resize recalculates it. The header surface extends from viewport top through its safe inset and content row. Contact uses at least the actual scrollport height minus the measured header.

The runway body measures **8 CSS px** wide and **0.675 scroll units** long, half the former values. Its route expansion is **0.12 unit**, after a **0.06-unit** thin segment; shared exact body bounds clip all markings. The fan rotates by **3π radians** from frontal approach to complete disappearance, without angle wrapping or independent time playback.

## Verification result and limits

All **44 tests** pass. Numerical and controller regressions cover reading holds, Work targets, long About flow, Contact alignment, navigation interruption/redirection, bounded speed and continuous vibration, particle density/lifecycle/direction, runway bounds/tangents, far-engine occlusion at 17 intermediate angles and reversible fan rotation. The build emits six pages; all **150 local references** pass validation. Intermediate desktop/phone SVG views were rasterised and inspected, and A/B handoff renderings remain pixel-identical at ten viewport sizes.

The managed Sites browser capability is unavailable. There was no browser layout, native-event, real Safari toolbar, touch or device performance verification. See `verification.md` for the acceptance checklist and precise scope of the available evidence.
