// Shared drawing kit for the concept clips: plain SVG strings, no framework.
// Replace C (palette) with the project's own colours — never copy another project's palette.
export const W = 1280, H = 720, FPS = 30;

// 동물기록 복구작전 팔레트 — src/layout.css 의 --ui-* 토큰과 같은 값 + 장면용 자연색
export const C = {
  bg: '#f3ead2', paper: '#fff9e9', paperStrong: '#fffdf5', frame: '#4a3a22', ink: '#2f3a2a',
  accent: '#f6d36e', brass: '#b59342', line: '#c9b98a', muted: '#7a6a48',
  green: '#365c43', ok: '#3f7a3a', okSoft: '#5c9a4a', no: '#b8442f', noSoft: '#c0533f',
  wood: '#8a5a32', woodDark: '#5b4a2a',
  sky: '#dcebf0', snow: '#f7fafa', water: '#a9d3df', waterDeep: '#7fb8c9', waterDark: '#2f6f86',
  heat: '#e0663f', heatDark: '#a8442a', heatGlow: '#ffb347',
  skin: '#f2b591', skinDark: '#b8734f', fur: '#fbf6ea', furDark: '#c9b98a',
  duck: '#fffdf5', orange: '#e8913a', orangeDark: '#a85a1c', orangeSoft: '#f6c27a',
  shell: '#7a9a4f', shellDark: '#3f5a2a', turtleSkin: '#a9ba72', grass: '#b7c98a', grassDark: '#7f9a55',
};

/* ---------- timing ---------- */

export const Easing = {
  linear: t => t,
  quad: t => t * t,
  cubic: t => t * t * t,
  sin: t => 1 - Math.cos((t * Math.PI) / 2),
  in: e => e,
  out: e => t => 1 - e(1 - t),
  inOut: e => t => (t < 0.5 ? e(t * 2) / 2 : 1 - e((1 - t) * 2) / 2),
};

/** Piecewise-linear map of x over input→output, clamped at both ends; easing applies per segment. */
export function interpolate(x, input, output, easing = Easing.linear) {
  if (x <= input[0]) return output[0];
  const last = input.length - 1;
  if (x >= input[last]) return output[last];
  let i = 0;
  while (x > input[i + 1]) i++;
  const t = easing((x - input[i]) / (input[i + 1] - input[i]));
  return output[i] + (output[i + 1] - output[i]) * t;
}

/** Damped spring from 0 to 1 starting at frame `delay` (closed-form, initial velocity 0). */
export function spring(frame, delay = 0, { damping = 12, stiffness = 140, mass = 1 } = {}) {
  const t = (frame - delay) / FPS;
  if (t <= 0) return 0;
  const w = Math.sqrt(stiffness / mass), z = damping / (2 * Math.sqrt(stiffness * mass));
  let rest;
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    rest = Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  } else if (z === 1) {
    rest = Math.exp(-w * t) * (1 + w * t);
  } else {
    const s = Math.sqrt(z * z - 1), r1 = -w * (z - s), r2 = -w * (z + s);
    rest = (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
  }
  return 1 - rest;
}

/** 0→1 over [from, to], held at the ends. */
export const progress = (frame, from, to, easing = Easing.inOut(Easing.cubic)) => interpolate(frame, [from, to], [0, 1], easing);
export const lerp = (a, b, t) => a + (b - a) * t;
/** 0→1 pulse after `start` (for glows). */
export const pulse = (frame, start, period = 18) => (frame < start ? 0 : 0.5 - 0.5 * Math.cos(((frame - start) / period) * Math.PI * 2));

/* ---------- svg strings ---------- */

const num = v => (typeof v === 'number' ? String(Math.round(v * 1000) / 1000) : v);
const kebab = k => k.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
/** <tag attrs>children</tag>; null/undefined/false attributes are skipped. */
export function el(tag, attrs = {}, ...children) {
  const a = Object.entries(attrs).filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => ` ${kebab(k)}="${num(v)}"`).join('');
  const body = children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false && c !== '').join('');
  return body ? `<${tag}${a}>${body}</${tag}>` : `<${tag}${a}/>`;
}
export const g = (attrs, ...children) => el('g', attrs, ...children);
export const t = (x, y) => `translate(${num(x)} ${num(y)})`;

export const Stage = (...children) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${el('rect', { width: W, height: H, fill: C.bg })}${children.flat(Infinity).filter(Boolean).join('')}</svg>`;

/** Force arrow pointing +x; (x,y) is the middle of the tail. */
export function Arrow({ x, y, length, thickness, angle = 0, color = C.waterDark, stroke = C.ink, opacity = 1, outline = false }) {
  const head = Math.min(length * 0.6, Math.max(26, thickness * 1.1));
  const shaft = Math.max(0, length - head);
  const h = thickness / 2, hw = Math.max(h + 10, thickness * 0.95);
  const points = [[0, -h], [shaft, -h], [shaft, -hw], [length, 0], [shaft, hw], [shaft, h], [0, h]].map(p => p.map(num).join(',')).join(' ');
  return g({ transform: `${t(x, y)} rotate(${num(angle)})`, opacity },
    el('polygon', { points, fill: outline ? 'none' : color, stroke, strokeWidth: outline ? 4 : 3, strokeDasharray: outline ? '10 7' : undefined, strokeLinejoin: 'round' }));
}

export function Sparkle({ x, y, size, color = C.accent, opacity = 1 }) {
  if (size <= 0.01 || opacity <= 0.01) return '';
  const s = size, k = s * 0.28;
  return el('path', { transform: t(x, y), opacity, fill: color,
    d: `M0 ${num(-s)} Q${num(k)} ${num(-k)} ${num(s)} 0 Q${num(k)} ${num(k)} 0 ${num(s)} Q${num(-k)} ${num(k)} ${num(-s)} 0 Q${num(-k)} ${num(-k)} 0 ${num(-s)} Z` });
}

/** Line drawing: `progress` 0→1 of the path is stroked. librsvg ignores pathLength, so the dash uses the measured length. */
export function DrawPath({ d, progress: p, color, width = 5, opacity = 1, fill = 'none' }) {
  if (p <= 0) return '';
  const length = pathLength(d);
  return el('path', { d, strokeDasharray: `${num(length)} ${num(length)}`, strokeDashoffset: length * (1 - p), stroke: color, strokeWidth: width,
    strokeLinecap: 'round', strokeLinejoin: 'round', fill, opacity });
}

/** Dotted line from (x1,y1) toward (x2,y2), drawn `progress` of the way. */
export function DottedLine({ x1, y1, x2, y2, progress: p, color, width = 5, dash = '2 12', opacity = 1 }) {
  if (p <= 0) return '';
  return el('line', { x1, y1, x2: lerp(x1, x2, p), y2: lerp(y1, y2, p), stroke: color, strokeWidth: width, strokeDasharray: dash, strokeLinecap: 'round', opacity });
}

/* ---------- path length (M L H V Q C A Z, absolute and relative) ---------- */

const cache = new Map();
export function pathLength(d) {
  if (cache.has(d)) return cache.get(d);
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, total = 0;
  const n = () => Number(tokens[i++]);
  const sample = (fn) => { let px = x, py = y; for (let k = 1; k <= 64; k++) { const [qx, qy] = fn(k / 64); total += Math.hypot(qx - px, qy - py); px = qx; py = qy; } return [px, py]; };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase(), C0 = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    if (C0 === 'Z') { total += Math.hypot(sx - x, sy - y); x = sx; y = sy; continue; }
    if (C0 === 'M') { x = ox + n(); y = oy + n(); sx = x; sy = y; cmd = rel ? 'l' : 'L'; continue; }
    if (C0 === 'L') { const nx = ox + n(), ny = oy + n(); total += Math.hypot(nx - x, ny - y); x = nx; y = ny; continue; }
    if (C0 === 'H') { const nx = (rel ? x : 0) + n(); total += Math.abs(nx - x); x = nx; continue; }
    if (C0 === 'V') { const ny = (rel ? y : 0) + n(); total += Math.abs(ny - y); y = ny; continue; }
    if (C0 === 'Q') {
      const x1 = ox + n(), y1 = oy + n(), x2 = ox + n(), y2 = oy + n(), x0 = x, y0 = y;
      [x, y] = sample(s => [(1 - s) ** 2 * x0 + 2 * (1 - s) * s * x1 + s * s * x2, (1 - s) ** 2 * y0 + 2 * (1 - s) * s * y1 + s * s * y2]);
      continue;
    }
    if (C0 === 'C') {
      const x1 = ox + n(), y1 = oy + n(), x2 = ox + n(), y2 = oy + n(), x3 = ox + n(), y3 = oy + n(), x0 = x, y0 = y;
      const b = (a0, a1, a2, a3, s) => (1 - s) ** 3 * a0 + 3 * (1 - s) ** 2 * s * a1 + 3 * (1 - s) * s * s * a2 + s ** 3 * a3;
      [x, y] = sample(s => [b(x0, x1, x2, x3, s), b(y0, y1, y2, y3, s)]);
      continue;
    }
    if (C0 === 'A') {
      let rx = Math.abs(n()), ry = Math.abs(n());
      const phi = (n() * Math.PI) / 180, large = n(), sweep = n(), x2 = ox + n(), y2 = oy + n(), x1 = x, y1 = y;
      // SVG spec F.6.5: endpoint → centre parameterisation
      const cp = Math.cos(phi), sp = Math.sin(phi), dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
      const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
      const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
      if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
      const num2 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
      const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num2 / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)));
      const cxp = (coef * rx * y1p) / ry, cyp = (-coef * ry * x1p) / rx;
      const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
      const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
      const th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
      let dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
      if (!sweep && dth > 0) dth -= 2 * Math.PI; else if (sweep && dth < 0) dth += 2 * Math.PI;
      [x, y] = sample(s => { const a = th1 + dth * s; return [cx + rx * Math.cos(a) * cp - ry * Math.sin(a) * sp, cy + rx * Math.cos(a) * sp + ry * Math.sin(a) * cp]; });
      x = x2; y = y2;
      continue;
    }
    throw new Error(`pathLength: unsupported command ${cmd} in "${d}"`);
  }
  cache.set(d, total);
  return total;
}
