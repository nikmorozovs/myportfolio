# Case studies and blog

`src/content.json` contains shared identity, labels and configuration. Every case is in `content/cases/<id>.json`; every article is in `content/posts/<id>.json`. Copy the corresponding `_template.json`, give it a lowercase hyphenated filename, fill in the content and set `status` to `published`. Commit the file to rebuild GitHub Pages. No registration list, routing edit or camera change is required.

Templates and drafts never enter generated pages, runtime collections or public metadata. Filenames become permanent IDs and URL paths. Renaming a published filename requires a URL migration. Do not add `id`, `slug` or `number` properties. JSON discovery is deterministic, and malformed records fail the build with a filename-specific error.

## Cases

Explicit finite `order` values come first; duplicates are rejected. Unordered cases follow alphabetically by filename. Visible numbers are assigned after drafts are excluded. The existing case files use orders 10, 20, 30 and 40 and retain their previous URLs and wording.

`window` falls back to `short`; `compact` is derived from `preview`; omitted `flow` produces no diagram container. Any nonempty number of sections and diagram steps is supported. Missing, null or empty `icon` uses `default`; the registry in `src/content.mjs` also contains `chat`, `quality`, `data` and `tool`. Unknown names fail validation. Raw SVG cannot be supplied through JSON. Related cases wrap through canonical order and show at most three distinct alternatives.

## Aircraft geometry

`caseWindowLayout(ids, width, height)` in `src/aircraft.mjs` is the shared source for physical case windows, camera framing and carousel slots. It uses the aircraft's 8.4-unit physical pitch and 3.8 × 5-unit window shape. The group is symmetric around the existing cabin midpoint; odd and even collections use the corresponding centred passenger lattice. Window curves remain on the fuselage surface, with clearance around doors.

The complete bounds determine the group centre. A viewport capacity is derived from a minimum 66 CSS-pixel pitch; the visible bounds plus consistent physical margins determine zoom. Desktop collections of five and six remain fully visible. Larger collections on narrow screens retain all underlying identities and physical positions while the carousel exposes a calculated subset. Arrows, left/right keys and horizontal gestures advance one record cyclically. Helper copies are inert and hidden from assistive technologies. A saved project ID takes precedence over a stale positional offset on return.

The same layout is supplied throughout the existing logarithmic camera interpolation and aircraft model handoff. Layouts are cached by ordered IDs and viewport dimensions; aircraft models by sampling level and IDs. Animation frames reuse the cached model. Resize/orientation recomputes the viewport layout without rebuilding the aircraft mesh.

The current door-free symmetric bay accommodates **15** cases at the original pitch. Beyond that physical limit the build emits an explicit diagnostic; it never hides excess records or overlaps the door. Extending this bay is an aircraft geometry change, rather than a case-count-specific camera preset. All counts from 0 through 10 use the same formulas. Zero cases show a neutral empty-work message; one case has no movement controls.

## Articles

Dates are strict ISO `YYYY-MM-DD` in JSON. Published dates later than the UTC build date are rejected, never scheduled. An article requires its original LinkedIn publication URL, title, tags and body. Preserve original wording and language. The first body block must be a paragraph; its text supplies the excerpt automatically.

Body blocks support `paragraph`, `heading` and `list`. Paragraph/heading `text`, and each list item, can be a string or an array of `{ "text": "Link label", "href": "https://example.com" }` spans. Omit `href` for plain spans. Lists can use `"ordered": true`. HTML blocks and unsafe URL protocols are rejected; all rendered text is escaped.

The archive uses `tag` (repeatable), `from`, `to`, `sort=old` and `page` query parameters. Tags combine with OR, dates with AND. Date bounds are inclusive. Equal publication dates use ID order. Committed state participates in browser history. The advanced dialog stages changes until Apply; Cancel, Escape and outside dismissal discard them. All posts clears filters while preserving sorting; Reset all restores the default order too.

The page size is always 10. Set `blog.pagination_always_visible` to `true` in shared configuration only to show real single-page controls during testing. It never creates extra pages. Chronological article links ignore archive state. Reading history stays in `localStorage` under `nikmorozovs:blog:visited:v1`; it is never transmitted. Corrupt or unavailable storage does not prevent reading.

## Initial editorial inputs

Seven original English LinkedIn posts are included from the supplied `linkedin_posts_source(1).md`, retaining original dates, wording and source URLs. The supplied working titles and suggested tags serve as article metadata. `lnkd.in/p/` publication links are accepted alongside full LinkedIn publication URLs, without rewriting supplied links. The requested pagination reference image was not attached; the implementation follows its written description.

## Verification

Run `npm test`, `npm run build`, and `npm run check`. Tests retain the original animation/gesture regressions, compare migrated cases to the original snapshot, and build isolated fixtures for JSON-only growth, seven posts and pagination boundaries. `scripts/browser-check.mjs` adds real Chromium checks for filters, history, validation, keyboard focus, responsive layouts, reading history, 0–10 cases, previews and reduced motion. Install Playwright test tooling separately and run this script; it writes fixtures and screenshots only under ignored `qa-output/`. The pull request verification workflow runs it without changing production dependencies or the existing Pages deployment workflow.

### Release verification — 26 October 2026

The coordinated release passes 99 Node tests, the static build, and the route/asset checker (14 HTML pages, 418 local links/assets). The seven original posts are checked against the supplied dates, titles, tags, source URLs and body hashes.

Chromium acceptance also passes: archive filters and validation, URL history, pagination, reading history, mobile keyboard focus and scroll locking, 0/1/2/3/4/5/6/8/10-case collections at mobile/tablet/desktop sizes, reduced motion, cyclic navigation, previews, case detail links and restored selection after return. Real archive, article and homepage Blog layouts are checked at 390px and 1440px; the navigation breakpoint is checked through 900px/901px. Screenshots are retained by the PR verification workflow. The native section-link offset follows the responsive header height.
