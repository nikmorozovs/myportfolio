# Interactive CV and UI release

The static generator reads `content/cv/profile.json` (verbatim paragraphs extracted from the supplied DOCX and checked against the PDF) and `content/cv/skills.csv`. Update these sources and rebuild; no runtime API is needed. All 64 skills and 11 categories are included. The original PDF and DOCX reside in `public/assets/cv/`; the build check verifies exact output bytes and permits only these two document paths.

Skills have stable category/name hash identifiers. The loader validates fields, priorities, month dates, future dates and duplicates. Static experience is reference metadata. Browser experience uses local calendar months and the elapsed fraction of the current month, captured consistently at page opening, with one decimal and `year` only at 1.0.

The cloud measures actual button rectangles after fonts load, category/selection changes and resizing. Deterministic placement fills the centre outward in priority order. One elapsed-time animation loop moves the active category, applies soft radial constraints, reflects boundary velocity, resolves rectangle penetration and exchanges normal velocity components. Selection adds its experience label to the measured stationary obstacle; other skills use a shared smaller size. The loop pauses offscreen and in hidden documents. Reduced motion retains the interactive static layout. All skills are also available in a static category list.

Language rings share a seven-segment SVG generator spanning 350 degrees and the specified CEFR mapping. IntersectionObserver starts one 1.5-second eased animation per page load; completed states do not replay. Reduced motion and no-JavaScript output show final values directly.

The blog appends five cards per Show more action. Filters reset the visible count; history state retains it on Back. Legacy page parameters are removed. Dates use one DD/MM/YYYY field with a native calendar button and a keyboard-accessible custom fallback.

Viewport geometry uses layout dimensions. Pinch zoom temporarily hides decorative lines and aircraft graphics without changing scroll or rebuilding geometry; normal decoration returns at normal scale.

Validation includes Node data/geometry tests, static route and download checks, Chromium interaction checks and screenshots at 320, 375, 390, 768, 1024, 1440 and 1920 pixels. Real iPhone Safari and low-end physical-device performance require device testing; Chromium checks are not a substitute for those environments.
