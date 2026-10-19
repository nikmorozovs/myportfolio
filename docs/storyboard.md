# Scroll storyboard

Specification v3.0 plus the 19 October scene revision. The revision takes precedence where it changes an earlier interpretation. Original documents and banner remain private input materials; the public repository contains website source and publishable assets only. `storyboard.svg` preserves the initial storyboard; the table below describes the revised implementation.

## Approved requirements

Warm background, copper vector contours of constant visible width, English interface, native vertical scrolling, reversible S0–S7, four interactive case windows among many ordinary aircraft windows, individually addressable case pages, and ordinary About/contact scrolling after the engine disappears. No independent camera flight begins when scrolling stops.

| State | Revised composition | Transition and interaction |
| --- | --- | --- |
| S0 | Name, role, confirmed facts, competency labels and the start of the route belong to one world layer. | The entire layer translates upwards by native scroll distance. Text does not remain pinned or fade as a substitute for movement. |
| S1 | Eight static curved threads cross and vary in length, then converge into a narrow runway. | Scrolling traverses the long vector composition; its scale and shape stay fixed. Competencies are complementary skills, not mandatory process steps. |
| S2 | A fully opaque, initially offscreen/tiny aircraft follows the runway towards the centre, nose down. | Scroll controls translation and logarithmic enlargement with smooth entry and deceleration. No fade-in. |
| S3 | The overview aircraft has a lofted fuselage, attached airfoil wings, tail, two engines, surface-conforming cockpit glazing and numerous cabin windows. | Quaternion rotation continuously establishes the side view, nose left. There is no silhouette swap during rotation. |
| S4 | Zoom selects four adjacent windows above the forward engine area. | Once the side view is established, crop the outer aircraft and switch to the matching detailed model. Hold the camera still for reading. A single centred portrait preview opens from its window above a translucent, non-blocking backdrop. |
| S5 | Reframe the connected cabin/wing/pylon/engine fragment, then close onto the near nacelle. | A short wider framing preserves the physical connection during the pan; the complete aircraft does not return. Close previews before moving. |
| S6 | Orbit 90° horizontally around the actual engine while descending slightly. End facing its circular inlet and 24 curved fan blades; then approach. | The detailed 3D geometry remains fixed. Orthographic vector projection changes with the camera orientation and scroll scale. |
| S7 | Enlarge and fade the inlet into the same plain background. | Stop particle spawning; existing particles finish their own paths. No new particles appear in About. Reverse scroll reverses the aircraft transition. |

## Interaction requirements

One preview at a time. Its final text column is laid out before the outer shell animates, with no letter scaling or intermediate width reflow. Content appears after the shell has sufficient space. Keep the final shape similar to a cabin window, provide safe padding and centre it inside the viewport. A pointer corridor connects the original window, moving shell and final destination. Support hover, focus/Tab, Escape, outside pointer press, first-tap preview and explicit Open case. Keep scrolling native and the card outside clipped scene containers. Resize recalculates final layout without hiding the active preview.

Particles use a separate time clock. New particles follow the opposite flight direction, changing gradually with the view; existing particles retain their velocities. Stop spawning throughout S4, drain existing particles naturally, ramp spawning after S4 and avoid boundary bursts.

## Working proposals retained

- Competency labels: Requirements analysis, Process analysis, Solution evaluation, Stakeholder alignment. These remain editorial design choices grounded in the supplied project summaries.
- Case order and symbols: Chat platform, Quality assessment, Data exchange, Internal tool.
- About copy, recommendation excerpt, current CV and verified WhatsApp destination remain pending; see `content-status.md`. No new professional facts or results were added.

## Open parameters resolved

- Keep the existing dependency-free ES modules, HTML/CSS and Node static build. Retain the existing GitHub Pages routes, palette and local fonts.
- Use fixed-dimension 3D loft geometry projected to SVG rather than adding a WebGL library. A depth-ordered surface renderer uses opaque masks, actual wing/tail boundaries and surface-normal feature visibility; hidden root and tessellation edges are omitted. A separate ray-tested reference is available offline.
- Overview A and detailed B share dimensions, window curves and engine anchors. Switch at progress **7.6**, during the late window zoom after different geometry leaves the crop. No crossfade.
- Use a **1.5 CSS px** non-scaling contour and **0.76** window/preview aspect ratio. Centre previews at up to **420 px** wide, with 20 px outer margins and header clearance; choose shorter copy on constrained viewports.
- Use eight static route threads, 2.2–3 particles/second at full emission, with gentle rate ramping and bounded counts. These are prototype settings, subject to real-browser visual acceptance.
- Allocate a longer S5 pan with a cropped intermediate framing to avoid an empty frame between cabin and engine. Keep scale interpolation logarithmic and each camera phase smooth at its boundaries. Remove the former 140 ms camera settling tail entirely.

Progress is native scroll distance divided by viewport height (1.08 heights on narrow phones):

| Progress | Camera phase |
| --- | --- |
| 0–2.35 | Traverse intro, tangled route and runway |
| 2.35–3.75 | Opaque runway departure, top view |
| 3.75–5.85 | Continuous top-to-side rotation |
| 5.85–8.0 | Window zoom; matched A/B switch at 7.6 |
| 8.0–9.25 | Stable S4 reading interval |
| 9.25–11.75 | Connected cabin-to-engine pan and reframing |
| 11.75–13.75 | 90° engine orbit with small descent |
| 13.75–15.05 | Frontal inlet approach |
| 15.05–15.9 | Final fade into plain background |
