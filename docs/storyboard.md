# Scroll storyboard

Implementation interpretation of specification v3.0. The original specification and banner are input materials and are deliberately excluded from this public repository.

## Fixed requirements

One warm background, copper vector contours of constant visible width, English interface, four case windows, native vertical scrolling, and reversible S0–S7 states. The complete sequence also runs on phones. About and contact sections use ordinary document scrolling after the engine has disappeared.

| State | Composition | Transition and interaction |
| --- | --- | --- |
| S0 | Name, Business Analyst role, three carefully qualified facts, and separate competency lines share the opening viewport. | The first scroll joins the lines. No timed introduction. |
| S1 | Competency lines converge into one product route. | Labels represent complementary skills, not a mandatory linear method. |
| S2 | A simple aircraft follows the route, seen from above with its nose pointing down. | The same projected model continues into S3. |
| S3 | The aircraft grows while the viewpoint changes continuously to the side; its nose ends pointing left. | Camera orientation interpolates in space; there is no swapped silhouette. |
| S4 | Camera closes in on four windows. The outer fuselage is outside the viewport. | A stable reading interval; hover/focus opens a similar portrait preview, tap opens a preview, explicit Open case navigates. |
| S5 | Windows move upwards as the camera moves down to the engine below them. | Close any preview before the transition. Do not restore the full aircraft. |
| S6 | Move around the engine through 90° horizontally while descending slightly, ending at its circular front inlet and fan blades. | Project ring, nacelle and blades from one 3D wire model. The shape changes by perspective, not by rotating a flat icon. Then approach the inlet. |
| S7 | The inlet fills the frame and fades out against the same background. | End all scene transformations before About; reversing the scroll reverses the fade. |

## Working rules adopted from the specification

Only one preview at a time. It remains open over the window and expanded surface, stays within the viewport, and closes with Escape, an outside tap, or leaving S4. Preserve catalogue position when returning from a case. Show a static, fully readable alternative for reduced motion and JavaScript failure.

## Open parameters resolved for this implementation

- Use native ES modules, HTML and CSS, with a small Node build that emits real `cases/<slug>/index.html` pages. No server or client-side routing dependency.
- Retain the working palette `#F6F5F0`, `#232323`, `#AB7753`, `#805334`; use locally hosted Unbounded and Onest with OFL licences.
- Competency labels: Requirements analysis, Process analysis, Solution evaluation, Stakeholder alignment. These are grounded in the approved project summaries; wording is a design proposal.
- Case order: Chat platform, Quality assessment, Data exchange, Internal tool. Four distinct vector symbols identify the windows.
- Conditional aircraft geometry is designed around the required camera path. Window aspect ratio is 0.76; similar previews preserve both ratio and corner curvature. All graphic contours are 1.5 CSS pixels.
- Allocate more scroll distance to large screen-space travel and logarithmic zoom than to holds. Initial timings are adjustable, with a short settling tail rather than continuous animation.
- Use the supplied professional facts only. About copy, recommendation excerpt, current CV and a verified WhatsApp destination remain pending; list every replacement in `docs/content-status.md`.

## Review sequence

1. Inspect the eight panels in `storyboard.svg`.
2. Implement the scroll-controlled prototype with the same projection model.
3. Check boundaries, reverse/fast scrolling, stop behavior, proportional previews, mobile geometry and ordinary flow after S7.
4. Build and publish the static output through GitHub Actions.
