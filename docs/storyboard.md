# Scroll storyboard

Specification v3.0 plus the 19 October scene/scroll-effects revisions and 20 October catalogue/content revision. Later revisions take precedence where they change an earlier interpretation. Original documents and banner remain private input materials; the public repository contains website source and publishable assets only. `storyboard.svg` preserves the initial storyboard; the table below describes the current implementation. Decorative page chapter numbers are independent of these semantic state names.

## Approved requirements

Warm background, copper vector contours of constant visible width, English interface, native vertical scrolling, reversible S0–S7, four interactive case windows among many ordinary aircraft windows, individually addressable case pages, and ordinary About/contact scrolling after the engine disappears. No independent camera flight begins when scrolling stops.

| State | Revised composition | Transition and interaction |
| --- | --- | --- |
| S0 | Name, role, confirmed facts, competency controls and the start of the route belong to one world layer. | The entire layer translates by native scroll distance. Local explanations open downwards on hover or touch/keyboard activation, with a short leave delay. Close them when S0 leaves. |
| S1 | Eight static curved threads enclose a clear Ready for takeoff heading, then converge into a thin route, expansion and copper runway. A miniature is already parked on the runway. | The heading leaves with the composition; it is not duplicated later. The aircraft is stationary in runway/world coordinates before its ground roll. Background-coloured markings remain clipped inside the half-size runway. |
| S2 | The opaque miniature accelerates down the runway and lifts off near its last quarter, then grows towards the centre, nose down. | World-space roll distance is quadratic in local scroll progress. A Hermite liftoff matches screen position and velocity. The full aircraft stays in the viewport throughout acceleration/enlargement; reverse scroll restores the same relationship. No fade-in. |
| S3 | The overview aircraft has a lofted fuselage, attached airfoil wings, tail, two engines, surface-conforming cockpit glazing and numerous cabin windows. | Quaternion rotation continuously establishes the side view, nose left. There is no silhouette swap during rotation. |
| S4 | Zoom selects four full project windows and partial neighbours, then holds the camera still. The whole range is 90% of its previous length. | The manual looping carousel uses arrows, drag and horizontal swipe. Only four main controls are accessible. Click/Enter/Space selects a project preview above the non-blocking backdrop; hover does nothing. Selection survives leaving the section, while its presentation is hidden. No particle spawning or aircraft vibration. |
| S5 | Reframe the connected cabin/wing/pylon/engine fragment, close onto the near nacelle, then orbit 90° horizontally with a small descent. | A short wider framing preserves the physical connection during the pan; the complete aircraft does not return. Close previews before moving. The detailed geometry remains fixed during the orbit. |
| S6 | Face the circular inlet and its 24 curved fan blades, approach and fade the engine into the plain background. | Particles travel inward behind the engine towards its projected axis. Only the clipped fan blades rotate clockwise, by local scroll progress, throughout the enlargement and complete fade. Reverse scroll restores the same geometry and angle. |
| S7 | The engine is completely absent and About is readable. | About has 0.75 viewport of extra reading travel; long text scrolls normally before the last readable screen holds. No new particles appear; existing ones finish their paths. Contact then occupies its own available screen before the footer. |

## Interaction requirements

One project preview at a time, opened by click or native button activation with Enter/Space. Hover, pointer departure and focus alone never toggle it. Its final text column is laid out before the shell animates, with no letter scaling or intermediate width reflow. Keep the enlarged window shape, safe padding and centred portal. A copper linked project heading replaces the Open case action; its arrow remains attached to the end of the name, with word wrapping allowed in compact columns. Close by close button, outside click or Escape. S4 exit hides the presentation without clearing the selected ID. Resize recalculates layout; returning from a case restores its order and selection.

Carousel project records come from stable IDs in `src/content.json`, with four distinct main positions and inert visual continuation copies. Use a 7 px gesture threshold, dominant horizontal intent and 240 ms snap; native vertical touch scrolling remains available. Release capture on pointer cancellation, section exit and resize. Open previews lock carousel movement. Carry any interrupted fractional cabin presentation until it is outside the crop; never translate the camera, aircraft or engine with the carousel. The matched A/B handoff remains direct.

Competency explanations use an independent controller, local absolute panels and 210 ms delayed departure. Mouse hover opens; touch and keyboard toggle. Keep one open, clamp width/position, preserve scene length and close outside S0. All multi-line content includes ordinary spaces before line breaks, including About's mobile heading.

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
- Reduce the former complete S4 range (5.85–10) by 10%, preserving its entry. Its end becomes 9.585 and the stable interval remains 1.585 units. Place Work about 30% inside that interval, recalculating for viewport/header. Preserve About's 0.75-viewport reserve, interruptible navigation of at most 820 ms and direct reduced-motion navigation.
- Use a 24–40 CSS px parked miniature at 12% of runway length. Start accelerating at progress 1.9 while the first quarter is visible, reach 84% at progress 2.5 with the last quarter still visible, then grow smoothly into the unchanged top-view pose at 3.75.
- Use one UTF-8 JSON source for all editorial copy/data and accessible names. Structured lines are escaped and retain real separators; implementation code owns geometry/timing. Existing project IDs/slugs and factual copy are retained.
- Allocate a longer S5 pan with a cropped intermediate framing to avoid an empty frame between cabin and engine. Keep scale interpolation logarithmic and each camera phase smooth at its boundaries. Remove the former 140 ms camera settling tail entirely.

Progress is native scroll distance divided by the measured scroll basis (one viewport height, or 1.08 heights on narrow phones). Minor mobile toolbar resizes preserve this basis; major resize/orientation changes recalculate it:

| Progress | Camera phase |
| --- | --- |
| 0–1.05 | S0 opening/competencies; their layer continues travelling with the route |
| 1.05–1.9 | S1 convergence heading and runway; parked miniature becomes visible before roll |
| 1.9–2.5 | S2 accelerating world-space ground roll |
| 2.5–3.75 | S2 continuous liftoff and enlargement to the top-view pose |
| 3.75–5.85 | Continuous top-to-side rotation |
| 5.85–8.0 | Window zoom; matched A/B switch at 7.6 |
| 8.0–9.585 | Stable S4 reading/carousel interval; Work normally targets 8.4755 |
| 9.585–12.085 | S5 connected cabin-to-engine pan and reframing |
| 12.085–14.085 | S5 90° engine orbit with small descent |
| 14.085–15.385 | S6 frontal inlet approach and clockwise fan rotation |
| 15.385–16.235 | S6 final fade, with rotation continuing until invisible |
| From 16.235 | S7 engine clear; normal About entry, then a separate 0.75-viewport reading reserve |
