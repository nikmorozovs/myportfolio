# Aviation scene revision

The 19 October follow-up takes precedence over the first implementation where the requirements differ. The site, case URLs, factual copy, palette and Pages deployment remain the existing project.

## Code review

- S0 used independent pinned HTML and projected SVG coordinates. HTML faded while the lines changed shape. There was no shared spatial translation.
- S1 interpolated line endpoints towards a small bundle instead of travelling through a long static composition.
- S2 used `planeAlpha` to reveal an aircraft at its destination.
- The aircraft used a coarse projected convex hull, flat wings, one nacelle, four windows and no true occlusion. Fuselage and engine placement changed during zoom.
- A single model served every scale. Its dimensions changed to accommodate the window catalogue.
- Preview text inherited the animated shell width; previews stayed inside the stage and could lose the pointer when displaced.

## Revised implementation decisions

1. Put intro text, competency labels and a static tangled route in one translated world layer. Its translation equals native scroll travel in scene pixels; opacity is not the exit mechanism.
2. Enter with a fully opaque aircraft along the runway continuation. Translation and zoom depend only on scroll progress; remove time-based camera settling.
3. Use a fixed-dimension, narrow-body passenger aircraft made of closed 3D lofts: fuselage, airfoil wings and tail, two attached engines, surface-conforming cockpit glazing and many passenger windows. Project silhouettes and feature curves into SVG with ray-tested occlusion and a constant CSS-pixel stroke.
4. Use a separately sampled close-up model built from the same dimensions and anchors. Switch only after the side view and cropping have removed differing geometry. Match windows and engine exactly, without a crossfade.
5. Use a time-driven particle simulation with scroll-controlled emission. S4 and the end of the scene disable spawning, not existing particles.
6. Use one fixed preview portal and a non-blocking backdrop. Lay out text at the final card width before opening; animate only the shell, then reveal text. A pointer corridor joins the original window to the displaced card.

## Verification scope

Add numerical checks for static route geometry and shared translation, opaque runway entry, fixed aircraft dimensions, A/B anchor matching, camera continuity, abundant windows, particle lifecycle and safe centred previews. Inspect rasterised projection frames including intermediate views. Keep browser interaction/performance checks explicitly unverified if the Sites control-browser capability remains absent.
