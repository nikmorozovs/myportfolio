# Scroll storyboard

Specification v3.0 plus the 19 October scene and scroll-effects revisions. Later revisions take precedence where they change an earlier interpretation. Original documents and banner remain private input materials; the public repository contains website source and publishable assets only. `storyboard.svg` preserves the initial storyboard; the table below describes the current implementation. Decorative page chapter numbers are independent of these semantic state names.

## Approved requirements

Warm background, copper vector contours of constant visible width, English interface, native vertical scrolling, reversible S0–S7, four interactive case windows among many ordinary aircraft windows, individually addressable case pages, and ordinary About/contact scrolling after the engine disappears. No independent camera flight begins when scrolling stops.

| State | Revised composition | Transition and interaction |
| --- | --- | --- |
| S0 | Name, role, confirmed facts, competency labels and the start of the route belong to one world layer. | The entire layer translates upwards by native scroll distance. Text does not remain pinned or fade as a substitute for movement. |
| S1 | Eight static curved threads cross and vary in length, converge into a thin route, expand smoothly, then join a copper runway. | Scrolling traverses the fixed vector composition. The runway is half its previous body width and length; background-coloured markings are clipped inside it. Competencies are complementary skills, not mandatory process steps. |
| S2 | A fully opaque, initially offscreen/tiny aircraft follows the runway towards the centre, nose down. | Scroll controls translation and logarithmic enlargement with smooth entry and deceleration. No fade-in. |
| S3 | The overview aircraft has a lofted fuselage, attached airfoil wings, tail, two engines, surface-conforming cockpit glazing and numerous cabin windows. | Quaternion rotation continuously establishes the side view, nose left. There is no silhouette swap during rotation. |
| S4 | Zoom selects four adjacent windows above the forward engine area, then holds all four names and icons fully revealed. | Crop the outer aircraft and switch to the matching detailed model. The stable camera interval includes 0.75 extra scroll units for reading. A single centred portrait preview opens above a translucent, non-blocking backdrop. No particle spawning or aircraft vibration in this state. |
| S5 | Reframe the connected cabin/wing/pylon/engine fragment, close onto the near nacelle, then orbit 90° horizontally with a small descent. | A short wider framing preserves the physical connection during the pan; the complete aircraft does not return. Close previews before moving. The detailed geometry remains fixed during the orbit. |
| S6 | Face the circular inlet and its 24 curved fan blades, approach and fade the engine into the plain background. | Particles travel inward behind the engine towards its projected axis. Only the clipped fan blades rotate clockwise, by local scroll progress, throughout the enlargement and complete fade. Reverse scroll restores the same geometry and angle. |
| S7 | The engine is completely absent and About is readable. | About has 0.75 viewport of extra reading travel; long text scrolls normally before the last readable screen holds. No new particles appear; existing ones finish their paths. Contact then occupies its own available screen before the footer. |

## Interaction requirements

One preview at a time. Its final text column is laid out before the outer shell animates, with no letter scaling or intermediate width reflow. Content appears after the shell has sufficient space. Keep the final shape similar to a cabin window, provide safe padding and centre it inside the viewport. A pointer corridor connects the original window, moving shell and final destination. Support hover, focus/Tab, Escape, outside pointer press, first-tap preview and explicit Open case. Keep scrolling native and the card outside clipped scene containers. Resize recalculates final layout without hiding the active preview.

Particles use a separate time clock. Flow changes gradually with the view and converges into the engine during S6, regardless of scroll direction. Smoothed absolute actual scroll speed controls their bounded speed; a nonzero floor keeps survivors moving. Stop spawning throughout S4, preserve survivors' directions, ramp spawning afterwards and avoid boundary bursts. The same speed signal changes the frequency of subpixel whole-aircraft vibration, which is zero in S4. Navigation is short, interruptible and based on actual page positions.

## Working proposals retained

- Competency labels: Requirements analysis, Process analysis, Solution evaluation, Stakeholder alignment. These remain editorial design choices grounded in the supplied project summaries.
- Case order and symbols: Chat platform, Quality assessment, Data exchange, Internal tool.
- About copy, recommendation excerpt, current CV and verified WhatsApp destination remain pending; see `content-status.md`. No new professional facts or results were added.

## Open parameters resolved

- Keep the existing dependency-free ES modules, HTML/CSS and Node static build. Retain the existing GitHub Pages routes, palette and local fonts.
- Use fixed-dimension 3D loft geometry projected to SVG rather than adding a WebGL library. A depth-ordered surface renderer uses opaque masks, actual wing/tail boundaries and surface-normal feature visibility; hidden root and tessellation edges are omitted. A separate ray-tested reference is available offline.
- Overview A and detailed B share dimensions, window curves and engine anchors. Switch at progress **7.6**, during the late window zoom after different geometry leaves the crop. No crossfade.
- Use a **1.5 CSS px** non-scaling contour and **0.76** window/preview aspect ratio. Centre previews at up to **420 px** wide, with 20 px outer margins and header clearance; choose shorter copy on constrained viewports.
- Use eight static route threads and a short, smooth runway expansion. Particle density is fixed at 2× the former rate/speed calibration, not repeatedly multiplied on initialization. Use 0.38 copper opacity, speed-compensated emission, gentle restart and bounded counts. These settings remain subject to real-browser visual acceptance.
- Add 0.75 scroll units to S4 and 0.75 viewport to About. Place Work about 30% inside the stable interval, recalculating for the actual viewport/header. Use at most 820 ms for distant navigation, interrupted by a new gesture. Reduced motion uses direct jumps.
- Allocate a longer S5 pan with a cropped intermediate framing to avoid an empty frame between cabin and engine. Keep scale interpolation logarithmic and each camera phase smooth at its boundaries. Remove the former 140 ms camera settling tail entirely.

Progress is native scroll distance divided by the measured scroll basis (one viewport height, or 1.08 heights on narrow phones). Minor mobile toolbar resizes preserve this basis; major resize/orientation changes recalculate it:

| Progress | Camera phase |
| --- | --- |
| 0–2.35 | Traverse intro, tangled route and runway |
| 2.35–3.75 | Opaque runway departure, top view |
| 3.75–5.85 | Continuous top-to-side rotation |
| 5.85–8.0 | Window zoom; matched A/B switch at 7.6 |
| 8.0–10.0 | Stable S4 reading interval; Work normally targets 8.6 |
| 10.0–12.5 | S5 connected cabin-to-engine pan and reframing |
| 12.5–14.5 | S5 90° engine orbit with small descent |
| 14.5–15.8 | S6 frontal inlet approach and clockwise fan rotation |
| 15.8–16.65 | S6 final fade, with rotation continuing until invisible |
| From 16.65 | S7 engine clear; normal About entry, then a separate 0.75-viewport reading reserve |
