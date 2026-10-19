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

## Verification scope

Numerical and controller regressions will cover phase shifts/holds, Work targets, About track geometry, navigation interruption/redirection, bounded speed and continuous vibration, particle density/lifecycle/direction, runway bounds/tangents, engine occlusion and reversible fan angles. Rasterise real SVG intermediate views. The managed Sites browser capability is still unavailable; do not claim actual Safari toolbar, touch or browser-layout verification.
