/** Independent, slow deformation of the existing four-cubic tangled routes. */
export const ROUTE_MOTION = Object.freeze({
 periods: [9.1333, 11.9333, 15.2, 13.0667], // seconds; original periods / 1.5 (50% faster)
 desktopAmplitude: [7, 19.25, 22.75], // original radii * 1.75; first/upper/lower handle, CSS px
 mobileAmplitude: [3.15, 7.875, 10.15], // original radii * 1.75
 readyPadding: [9, 18], // mobile, desktop; in addition to actual heading bounds
 labelPadding: [6, 11],
 edgePadding: [6, 12],
 clearanceSlack: 3, // guards the gaps between sampled cubic positions
 fadeIn: 1.8,
 maxFrameGap: 0.05
});
const TAU = 2 * Math.PI;
// Identical displacement of neighbouring handles and knots preserves both joins.
// The last segment, its incoming tangent and the connection remain completely fixed.
const GROUP = [-1, 0, 1, 1, 1, 2, 2, 2, -1, -1, -1, -1, -1];
const format = point => Number(point[0].toFixed(3)) + ',' + Number(point[1].toFixed(3));

function parseRoute(d) {
 const numbers = (d.match(/-?(?:\d+\.?\d*|\.\d+)/g) || []).map(Number);
 if (numbers.length !== 26) throw new Error('Expected four cubic segments per tangled route');
 return Array.from({length: 13}, (_, i) => [numbers[2 * i], numbers[2 * i + 1]]);
}
export function pathFromPoints(points) {
 let d = 'M' + format(points[0]);
 for (let i = 1; i <= 10; i += 3) d += 'C' + format(points[i]) + ' ' + format(points[i + 1]) + ' ' + format(points[i + 2]);
 return d;
}
function sample(points, segment, t) {
 const u = 1 - t, b = [u*u*u, 3*u*u*t, 3*u*t*t, t*t*t], weights = [0, 0, 0];
 let x = 0, y = 0;
 for (let i = 0; i < 4; i++) {
  const j = segment * 3 + i, p = points[j];
  x += b[i] * p[0]; y += b[i] * p[1];
  if (GROUP[j] >= 0) weights[GROUP[j]] += b[i];
 }
 return {x, y, weights};
}
function clearance(x, y, width, rects, edge) {
 let distance = Math.min(x - edge, width - edge - x);
 for (const r of rects) {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  distance = Math.min(distance, Math.hypot(dx, dy));
 }
 return distance;
}
/** The convex hull of a Bezier's moving controls bounds its entire displacement.
 * Sample the BASE curve, budget each group's maximum displacement by its Bernstein
 * weight, and shrink (never clamp) the motion radii to preserve text/edge clearance. */
export function prepareRoute(d, index, width, rects = [], mobile = width < 640) {
 const points = parseRoute(d), radii = [...(mobile ? ROUTE_MOTION.mobileAmplitude : ROUTE_MOTION.desktopAmplitude)];
 const edge = ROUTE_MOTION.edgePadding[mobile ? 0 : 1];
 for (let segment = 0; segment < 3; segment++) {
  // Competency labels intentionally meet the fixed starting anchors. Their
  // padded rectangles may contain the anchor itself, so checking the first
  // cubic against them would shrink EVERY moving handle to zero. That cubic
  // leaves the labels downwards; its fixed start and Bernstein weights already
  // taper displacement to zero at the anchor. Check all other obstacles here.
  const obstacles = segment === 0 ? rects.filter(rect => !rect.startLabel) : rects;
  let longest = 0;
  for (let j = segment * 3; j < segment * 3 + 3; j++)
   longest = Math.max(longest, Math.hypot(points[j + 1][0] - points[j][0], points[j + 1][1] - points[j][1]));
  // Curve speed <= 3*longest, hence the closest sample is <= 1.5px
  // away in world space when steps >= longest. The slack covers this
  // and variation of the Bernstein weights between samples.
  const steps = Math.max(80, Math.ceil(longest));
  for (let j = 0; j <= steps; j++) {
   const {x, y, weights} = sample(points, segment, j / steps);
   const room = Math.max(0, clearance(x, y, width, obstacles, edge) - ROUTE_MOTION.clearanceSlack);
   const excursion = weights.reduce((sum, weight, i) => sum + weight * radii[i], 0);
   if (excursion > room && excursion > 0) {
    const ratio = room / excursion;
    for (let i = 0; i < radii.length; i++) if (weights[i] > 1e-8) radii[i] *= ratio;
   }
  }
 }
 return {points, radii, index, staticD: d};
}
function wave(time, line, group, radius) {
 const periods = ROUTE_MOTION.periods, phase = line * 1.73 + group * 1.09 + 0.37;
 const x = .69 * radius * (
  .58 * Math.sin(TAU * time / periods[(line + group) % 4] + phase) +
  .42 * Math.sin(TAU * time / periods[(line + group + 2) % 4] - phase * .61));
 const y = .69 * radius * (
  .58 * Math.sin(TAU * time / periods[(line + group + 1) % 4] - phase * .53) +
  .42 * Math.sin(TAU * time / periods[(line + group + 3) % 4] + phase * 1.17));
 // |wave| < radius for every time, so the precomputed envelope stays valid.
 return [x, y];
}
export function routePointsAt(model, time) {
 const t = Math.min(1, Math.max(0, time / ROUTE_MOTION.fadeIn));
 const onset = t * t * (3 - 2 * t);
 const displacement = model.radii.map((radius, group) => wave(time, model.index, group, radius));
 return model.points.map((p, j) => {
  const group = GROUP[j];
  return group < 0 ? [...p] : [p[0] + displacement[group][0] * onset, p[1] + displacement[group][1] * onset];
 });
}
/** One clock/RAF for all eight paths, independent of the scroll-only world transform. */
export function mountRouteMotion({route, world}) {
 let paths = [], models = [], elapsed = 0, previous = null, raf = 0;
 let inView = typeof IntersectionObserver === 'undefined';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
  inView = entries[0]?.isIntersecting || false;
  sync();
 });
 if (observer) observer.observe(route);
 function bounds() {
  const box = route.getBoundingClientRect(), vb = route.viewBox.baseVal;
  if (!box.width || !box.height) return [];
  const sx = vb.width / box.width, sy = vb.height / box.height;
  const mobile = vb.width < 640, rects = [];
  for (const element of world.querySelectorAll('.ready-heading, .skills .competency-toggle, .intro h1')) {
   const b = element.getBoundingClientRect();
   if (!b.width || !b.height) continue;
   const pair = element.matches('.ready-heading') ? ROUTE_MOTION.readyPadding : ROUTE_MOTION.labelPadding;
   const pad = pair[mobile ? 0 : 1];
   rects.push({
    startLabel: element.matches('.competency-toggle'),
    left: (b.left - box.left) * sx - pad, right: (b.right - box.left) * sx + pad,
    top: (b.top - box.top) * sy - pad, bottom: (b.bottom - box.top) * sy + pad
   });
  }
  return rects;
 }
 function paint() {
  for (let i = 0; i < models.length; i++) {
   if (models[i].radii.some(radius => radius > 0.001))
    paths[i].setAttribute('d', pathFromPoints(routePointsAt(models[i], elapsed)));
  }
 }
 function pause() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0; previous = null;
 }
 function intersects() {
  if (observer) return inView;
  const box = route.getBoundingClientRect();
  return box.bottom > 0 && box.top < innerHeight;
 }
 function enabled() {
  return paths.length > 0 && !document.hidden && !reduced.matches &&
   !!world.closest('.motion-ready') && intersects();
 }
 function frame(stamp) {
  raf = 0;
  if (previous !== null)
   elapsed += Math.min(ROUTE_MOTION.maxFrameGap, Math.max(0, (stamp - previous) / 1000));
  previous = stamp;
  paint();
  if (enabled()) raf = requestAnimationFrame(frame);
  else previous = null;
 }
 function sync() {
  if (!enabled()) { pause(); return; }
  if (!raf) raf = requestAnimationFrame(frame);
 }
 if (!observer) addEventListener('scroll', sync, {passive: true});
 document.addEventListener('visibilitychange', sync);
 return {
  refresh() {
   pause();
   paths = [...route.querySelectorAll('.scene-line > path[opacity]')];
   const rects = bounds(), width = route.viewBox.baseVal.width;
   models = paths.map((path, i) => prepareRoute(path.getAttribute('d'), i, width, rects));
   if (elapsed) paint(); // resize uses the same phase before the next browser paint
   sync();
  },
  stop() {
   pause();
   paths.forEach((path, i) => path.setAttribute('d', models[i].staticD));
   paths = []; models = []; elapsed = 0;
  }
 };
}
