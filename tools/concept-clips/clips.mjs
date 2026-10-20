// 동물기록 복구작전 개념 클립. 클립마다 { seconds, frame(f) → SVG }.
// 그림 안에는 글자·숫자가 없다. 자막은 앱이 DOM 으로 얹으므로, 길이나 장면 시간을 바꾸면 앱 쪽 자막 시간도 같이 고친다.
// 장면 구간(초)은 앱 자막 구간과 1:1 로 맞춘 계약이다 — 각 함수 위 주석 참고.
import { Arrow, C, DottedLine, Easing, Sparkle, Stage, el, g, lerp, progress, pulse, spring, t } from './theme.mjs';

const FPS = 30;
const S = sec => Math.round(sec * FPS);
const rad = d => (d * Math.PI) / 180;
const pt = (r, a) => [r * Math.cos(rad(a)), r * Math.sin(rad(a))];
/** 1 inside [a, b], fading over d frames at both ends. */
const win = (f, a, b, d = 12) => Math.max(0, Math.min(progress(f, a, a + d, Easing.linear), 1 - progress(f, b - d, b, Easing.linear)));
const circle = (cx, cy, r, attrs = {}) => el('circle', { cx, cy, r, ...attrs });
const defs = (...children) => el('defs', {}, ...children);
const outline = { stroke: C.frame, strokeWidth: 5, strokeLinejoin: 'round' };

/* =====================================================================
   1. warm-fur (12s) — 털은 열을 만들지 않고, 몸에서 나가는 열을 붙잡아 둔다
   0–3s 몸에서 열이 나감 · 3–6.5s 털 없는 몸: 열이 많이·빨리 나감
   6.5–10s 빽빽한 털 + 털 사이 공기: 열이 적게·천천히 나감 · 10–12s 나란히 비교
   ===================================================================== */

function HeatArrow({ angle, r, len = 62, opacity = 1, width = 8 }) {
  if (opacity <= 0.02) return '';
  const w = len / 4, end = r + len;
  return g({ transform: `rotate(${angle.toFixed(2)})`, opacity: opacity.toFixed(3) },
    el('path', { d: `M${r.toFixed(1)} 0 q${w} -11 ${2 * w} 0 t${2 * w} 0`, fill: 'none', stroke: C.heat, strokeWidth: width, strokeLinecap: 'round' }),
    el('polygon', { points: `${(end + 20).toFixed(1)},0 ${(end - 2).toFixed(1)},-15 ${(end - 2).toFixed(1)},15`, fill: C.heat, stroke: C.heat, strokeWidth: 3, strokeLinejoin: 'round' }));
}

/** Heat arrows leaving the body surface (r0) outward; `period` frames per trip. Always starts at the body, never at the fur. */
function HeatFlow({ f, count, period, r0, range, opacity = 1, spin = 0 }) {
  if (opacity <= 0.02) return [];
  return Array.from({ length: count }, (_, i) => {
    const p = (((f / period + i * 0.618) % 1) + 1) % 1;
    const fade = Math.min(1, p / 0.12) * Math.min(1, (1 - p) / 0.3);
    return HeatArrow({ angle: (i * 360) / count + spin, r: r0 + range * p, opacity: opacity * fade });
  });
}

function FurCoat(R, L, k) {
  const outer = R + L;
  const tufts = Array.from({ length: 36 }, (_, i) => { const [x, y] = pt(outer - 8, i * 10); return circle(x, y, 15 * k, { fill: C.fur, stroke: C.furDark, strokeWidth: 4 }); });
  const hairs = Array.from({ length: 60 }, (_, i) => {
    const a = i * 6, [x1, y1] = pt(R + 3, a), [x2, y2] = pt(outer - 8, a + 5), [cx, cy] = pt((R + outer) / 2, a - 4);
    return el('path', { d: `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, stroke: C.furDark, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' });
  });
  // small air pockets trapped between the hairs
  const air = Array.from({ length: 30 }, (_, i) => { const [x, y] = pt(R + L * (i % 2 ? 0.36 : 0.66), i * 12 + 3); return circle(x, y, 6 * k, { fill: '#ffffff', stroke: '#7fb0c2', strokeWidth: 2.5 }); });
  return [tufts, circle(0, 0, outer - 8, { fill: C.fur }), hairs, air];
}

/** Round warm body (same creature with and without fur). glow = how warm the body itself still is. */
function Critter({ x, y, s = 1, f, fur = 0, glow = 1, shiver = 0, heat = [] }) {
  const R = 95, L = 58 * fur;
  const jitter = shiver * Math.sin(f * 2.3) * 3;
  return g({ transform: `${t(x + jitter, y)} scale(${s.toFixed(3)})` },
    circle(0, 0, R * 1.55, { fill: 'url(#bodyHeat)', opacity: glow.toFixed(3) }),
    fur > 0.01 && FurCoat(R, L, fur),
    circle(0, 0, R, { fill: C.skin, stroke: C.skinDark, strokeWidth: 6 }),
    circle(0, 0, R - 14, { fill: C.heatGlow, opacity: (0.45 * glow).toFixed(3) }),
    el('ellipse', { cx: -32, cy: -40, rx: 26, ry: 15, fill: '#fbd9c2', opacity: 0.9 }),
    el('path', { d: 'M-44 -2 q13 -12 26 0 M18 -2 q13 -12 26 0', fill: 'none', stroke: C.ink, strokeWidth: 6, strokeLinecap: 'round' }),
    circle(-50, 24, 11, { fill: '#ee8f7a', opacity: 0.6 }), circle(50, 24, 11, { fill: '#ee8f7a', opacity: 0.6 }),
    el('path', { d: 'M-14 30 q14 12 28 0', fill: 'none', stroke: C.ink, strokeWidth: 5, strokeLinecap: 'round' }),
    heat);
}

/** Horizontal warmth bar with a bulb (no numbers): how much warmth the body keeps. */
function WarmthBar({ x, y, level, opacity }) {
  if (opacity <= 0.02) return '';
  const w = 230;
  return g({ transform: t(x, y), opacity: opacity.toFixed(3) },
    el('rect', { x: -w / 2, y: -17, width: w, height: 34, rx: 17, fill: C.paperStrong, stroke: C.frame, strokeWidth: 5 }),
    circle(-w / 2, 0, 28, { fill: C.heat, stroke: C.frame, strokeWidth: 5 }),
    el('rect', { x: -w / 2, y: -8, width: (w - 14) * level + 8, height: 16, rx: 8, fill: C.heat }),
    circle(-w / 2, 0, 19, { fill: C.heat }));
}

function snowfall(f) {
  return Array.from({ length: 16 }, (_, i) => {
    const x = (i * 331 + Math.sin(f / 40 + i) * 14) % 1280, y = ((i * 263 + f * 1.1) % 760) - 20;
    return circle(x, y, 4 + (i % 3) * 2, { fill: '#ffffff', opacity: 0.95 });
  });
}

function warmFur(f) {
  const enter = spring(f, 0, { damping: 14 });
  const fur = spring(f, S(6.6), { damping: 18, stiffness: 80 });
  const split = progress(f, S(10), S(10.9));
  // three heat regimes, cross-faded at the caption boundaries
  const wA = 1 - progress(f, S(2.8), S(3.2), Easing.linear);
  const wB = progress(f, S(2.8), S(3.2), Easing.linear) * (1 - progress(f, S(6.4), S(6.8), Easing.linear));
  const wC = progress(f, S(6.4), S(6.8), Easing.linear);
  const r0 = 99;
  const heat = [
    HeatFlow({ f, count: 6, period: 50, r0, range: 170, opacity: wA * enter }),
    HeatFlow({ f, count: 14, period: 22, r0, range: 230, opacity: wB }),
    HeatFlow({ f, count: 4, period: 95, r0, range: 190 + 30 * (1 - split), opacity: wC, spin: 20 }),
  ];
  const glow = f < S(3) ? 0.9 + 0.1 * pulse(f, 0, 30)
    : f < S(6.6) ? lerp(1, 0.5, progress(f, S(3), S(6.5)))
    : lerp(0.5, 0.95, progress(f, S(6.6), S(9.8)));
  const shiver = win(f, S(3.2), S(6.8), 8) + win(f, S(10.2), S(12) + 20, 8);
  const y = lerp(360, 320, split);
  const bareIn = spring(f, S(10.2), { damping: 14 });
  const warm = progress(f, S(10.6), S(11.7));
  return Stage(
    defs(el('radialGradient', { id: 'bodyHeat' },
      el('stop', { offset: 0, stopColor: C.heatGlow, stopOpacity: 0.95 }), el('stop', { offset: 1, stopColor: C.heatGlow, stopOpacity: 0 }))),
    el('rect', { width: 1280, height: 720, fill: C.sky }),
    el('path', { d: 'M0 668 Q160 640 330 664 Q520 690 700 660 Q900 632 1080 662 Q1190 678 1280 656 V720 H0 Z', fill: C.snow, stroke: '#c9dde3', strokeWidth: 4 }),
    snowfall(f),
    // left: the same body without fur (comparison only)
    bareIn > 0.01 && g({ opacity: Math.min(1, bareIn).toFixed(3) },
      Critter({ x: 360, y: 320, s: 0.86 * bareIn, f, glow: 0.5, shiver: 1,
        heat: HeatFlow({ f, count: 14, period: 22, r0, range: 230, opacity: 1 }) })),
    Critter({ x: lerp(640, 920, split), y, s: lerp(1, 0.86, split) * Math.min(1, enter + 0.0001), f, fur, glow, shiver: f < S(6.8) ? shiver : 0, heat }),
    WarmthBar({ x: 360, y: 652, level: lerp(0.62, 0.22, warm), opacity: bareIn }),
    WarmthBar({ x: 920, y: 652, level: lerp(0.62, 0.9, warm), opacity: bareIn }),
    Sparkle({ x: 1075, y: 170, size: 26 * warm * (1 + 0.3 * pulse(f, S(11.2), 20)), color: C.heatGlow, opacity: warm }),
  );
}

/* =====================================================================
   2. webbed-foot (10s) — 넓은 면이 물을 더 많이 뒤로 민다
   0–3.5s 오리 발이 물갈퀴를 펴고 물을 뒤로 밂 · 3.5–7s 좁은 발가락 vs 물갈퀴: 넓은 쪽이 더 나아감
   7–10s 사람 발의 오리발도 넓고 납작한 면으로 물을 민다
   ===================================================================== */

/** Duck foot in the leg's frame, ankle at (0,0). Toes fan out across the stroke; webbing only between the three front toes. */
function Foot({ open = 1, webbed = true, s = 1 }) {
  const spread = lerp(7, 30, open), base = 80, len = 74;
  const tips = [-1, 0, 1].map(k => pt(len, base + k * spread));
  const back = pt(26, -70); // small hind toe, no webbing
  const web = webbed && el('path', {
    d: `M0 0 L${tips[0][0]} ${tips[0][1]} Q${(tips[0][0] + tips[1][0]) / 2 * 0.82} ${(tips[0][1] + tips[1][1]) / 2 * 0.82} ${tips[1][0]} ${tips[1][1]} Q${(tips[1][0] + tips[2][0]) / 2 * 0.82} ${(tips[1][1] + tips[2][1]) / 2 * 0.82} ${tips[2][0]} ${tips[2][1]} Z`,
    fill: C.orangeSoft, stroke: C.orangeDark, strokeWidth: 4, strokeLinejoin: 'round' });
  const toeWidth = webbed ? 9 : 8;
  return g({ transform: `scale(${s})` },
    web,
    tips.map(([x, y]) => el('line', { x1: 0, y1: 0, x2: x, y2: y, stroke: C.orange, strokeWidth: toeWidth, strokeLinecap: 'round' })),
    tips.map(([x, y]) => el('line', { x1: 0, y1: 0, x2: x, y2: y, stroke: C.orangeDark, strokeWidth: 2.5, strokeLinecap: 'round', opacity: 0.6 })),
    el('line', { x1: 0, y1: 0, x2: back[0], y2: back[1], stroke: C.orange, strokeWidth: 8, strokeLinecap: 'round' }));
}

const HIP = [-10, 22], LEG = 90, FOOT = 1.3;
/** Side-view duck floating; origin = water surface under the body centre. leg > 0 swings the foot backward. */
function Duck({ x, y, s = 1, leg = -25, open = 0.2, webbed = true }) {
  return g({ transform: `${t(x, y)} scale(${s})` },
    g({ transform: `translate(${HIP[0]} ${HIP[1]}) rotate(${leg.toFixed(2)})` },
      el('line', { x1: 0, y1: 0, x2: 0, y2: LEG, stroke: C.orange, strokeWidth: 12, strokeLinecap: 'round' }),
      g({ transform: `translate(0 ${LEG})` }, Foot({ open, webbed, s: FOOT }))),
    el('path', { d: 'M-168 -38 Q-150 -100 -40 -94 L60 -90 Q152 -88 150 -18 Q140 42 0 44 Q-125 44 -168 -38 Z', fill: C.duck, ...outline }),
    el('path', { d: 'M-110 -52 Q-40 -86 40 -56 Q-20 -10 -110 -52 Z', fill: '#efe7d2', stroke: C.line, strokeWidth: 4 }),
    el('path', { d: 'M88 -84 Q92 -120 110 -150', fill: 'none', stroke: C.frame, strokeWidth: 5 }),
    circle(118, -128, 46, { fill: C.duck, ...outline }),
    el('path', { d: 'M156 -138 Q204 -136 212 -118 Q192 -106 154 -114 Z', fill: C.orange, stroke: C.orangeDark, strokeWidth: 4, strokeLinejoin: 'round' }),
    circle(130, -138, 7, { fill: C.ink }));
}

/** Kick cycle: power stroke (foot sweeps back, webbing open) then recovery (folded, comes forward). */
function kick(f, starts, power = 24, rec = 20) {
  let leg = -28, open = 0.15, push = 0, glide = 0;
  for (const st of starts) {
    if (f >= st && f < st + power) {
      const p = (f - st) / power;
      leg = lerp(-28, 34, Easing.inOut(Easing.sin)(p)); open = Math.min(1, (f - st) / 5);
    } else if (f >= st + power && f < st + power + rec) {
      const p = (f - st - power) / rec;
      leg = lerp(34, -28, Easing.inOut(Easing.sin)(p)); open = Math.max(0.15, 1 - p * 3);
    }
    push = Math.max(push, progress(f, st, st + power * 0.6) * (1 - progress(f, st + power, st + power + 14)));
    glide += progress(f, st + 4, st + power + rec + 10, Easing.out(Easing.cubic));
  }
  return { leg, open, push, glide };
}

/** Ankle position in scene coordinates (for the water arrows). */
function ankle(x, y, s, leg) {
  return [x + s * (HIP[0] - LEG * Math.sin(rad(leg))), y + s * (HIP[1] + LEG * Math.cos(rad(leg)))];
}

function waterBand(top, bottom, f) {
  return [
    el('rect', { x: 0, y: top, width: 1280, height: bottom - top, fill: C.water }),
    el('rect', { x: 0, y: top + (bottom - top) * 0.55, width: 1280, height: (bottom - top) * 0.45, fill: C.waterDeep, opacity: 0.45 }),
    Array.from({ length: 8 }, (_, i) => circle((i * 173 + 60) % 1280, bottom - 20 - ((i * 47 + f * 0.8) % (bottom - top - 30)), 4 + (i % 2) * 3, { fill: '#ffffff', opacity: 0.5 })),
  ];
}
const surface = (y, f, x0 = 0, x1 = 1280) => el('path', {
  d: `M${x0} ${y} ` + Array.from({ length: Math.ceil((x1 - x0) / 80) }, (_, i) => `q20 ${(Math.sin(f / 9 + i) * 4).toFixed(1)} 40 0 t40 0`).join(' '),
  fill: 'none', stroke: '#ffffff', strokeWidth: 5, opacity: 0.85 });
const ripple = (x, y, k, size = 1) => k > 0.01 && k < 0.99 && el('ellipse', { cx: x, cy: y, rx: (20 + 60 * k) * size, ry: (12 + 34 * k) * size, fill: 'none', stroke: '#ffffff', strokeWidth: 5, opacity: (1 - k).toFixed(3) });

function sceneA(f) {
  const sy = 280;
  const k = kick(f, [S(0.45), S(1.95)]);
  const s = 1.4, x = 500 + 90 * k.glide;
  const [ax, ay] = ankle(x, sy, s, k.leg);
  return [
    el('rect', { width: 1280, height: sy, fill: '#eaf2e6' }),
    el('path', { d: `M0 ${sy - 40} Q300 ${sy - 90} 640 ${sy - 50} Q980 ${sy - 10} 1280 ${sy - 60} V${sy} H0 Z`, fill: C.grass, opacity: 0.7 }),
    waterBand(sy, 720, f),
    Duck({ x, y: sy, s, leg: k.leg, open: k.open }),
    el('rect', { x: 0, y: sy, width: 1280, height: 720 - sy, fill: C.water, opacity: 0.2 }),
    surface(sy, f),
    [S(0.45), S(1.95)].map(st => ripple(ax - 120, ay + 70, progress(f, st + 16, st + 50, Easing.out(Easing.quad)), 1.4)),
    Arrow({ x: ax - 70, y: ay + 30, length: 190 * k.push, thickness: 34, angle: 180, opacity: k.push > 0.03 ? 1 : 0 }),
    Arrow({ x: ax - 60, y: ay + 110, length: 150 * k.push, thickness: 26, angle: 176, opacity: k.push > 0.03 ? 0.85 : 0 }),
  ];
}

function sceneB(f) {
  const lanes = [
    { top: 34, surf: 164, bottom: 336, webbed: false, dist: 70, arrow: [70, 12] },
    { top: 380, surf: 510, bottom: 686, webbed: true, dist: 175, arrow: [150, 30] },
  ];
  const starts = [S(3.95), S(5.35)];
  const k = kick(f, starts, 22, 18);
  const x0 = 300, s = 0.66;
  const done = progress(f, S(6.5), S(6.95));
  return lanes.map((lane, i) => {
    const x = x0 + lane.dist * k.glide;
    const [ax, ay] = ankle(x, lane.surf, s, k.leg);
    return g({ clipPath: `url(#lane${i})` },
      el('rect', { x: 40, y: lane.top, width: 1200, height: lane.bottom - lane.top, fill: '#eaf2e6' }),
      waterBand(lane.surf, lane.bottom, f),
      DottedLine({ x1: x0, y1: lane.top + 10, x2: x0, y2: lane.bottom - 10, progress: 1, color: C.muted, width: 5, dash: '4 12' }),
      Duck({ x, y: lane.surf, s, leg: k.leg, open: k.open, webbed: lane.webbed }),
      el('rect', { x: 40, y: lane.surf, width: 1200, height: lane.bottom - lane.surf, fill: C.water, opacity: 0.2 }),
      surface(lane.surf, f, 40, 1240),
      starts.map(st => ripple(ax - 60, ay + 40, progress(f, st + 14, st + 44, Easing.out(Easing.quad)), lane.webbed ? 0.9 : 0.4)),
      Arrow({ x: ax - 40, y: ay + 40, length: lane.arrow[0] * k.push, thickness: lane.arrow[1], angle: 180, opacity: k.push > 0.03 ? 1 : 0 }),
      DottedLine({ x1: x0, y1: lane.bottom - 26, x2: x, y2: lane.bottom - 26, progress: done, color: lane.webbed ? C.ok : C.muted, width: 7, dash: '2 14' }),
      lane.webbed && Sparkle({ x: x + 210, y: lane.surf - 50, size: 30 * done * (1 + 0.3 * pulse(f, S(6.6), 18)), color: C.brass, opacity: done }),
      el('rect', { x: 40, y: lane.top, width: 1200, height: lane.bottom - lane.top, rx: 24, fill: 'none', stroke: C.frame, strokeWidth: 5 }));
  });
}

/** Human leg with a swim fin, hip on the right, toes pointing left (swimming toward the right). */
function FinLeg({ angle, flex }) {
  return g({ transform: `${t(1190, 330)} rotate(${angle.toFixed(2)})` },
    el('line', { x1: 0, y1: 0, x2: -270, y2: 8, stroke: C.frame, strokeWidth: 84, strokeLinecap: 'round' }),
    el('line', { x1: 0, y1: 0, x2: -270, y2: 8, stroke: C.skin, strokeWidth: 74, strokeLinecap: 'round' }),
    el('line', { x1: -270, y1: 8, x2: -500, y2: 14, stroke: C.frame, strokeWidth: 64, strokeLinecap: 'round' }),
    el('line', { x1: -270, y1: 8, x2: -500, y2: 14, stroke: C.skin, strokeWidth: 54, strokeLinecap: 'round' }),
    g({ transform: `translate(-500 14) rotate(${flex.toFixed(2)})` },
      // wide flat blade
      el('path', { d: 'M-70 -26 L-290 -88 Q-312 0 -290 88 L-70 26 Z', fill: C.accent, stroke: C.brass, strokeWidth: 6, strokeLinejoin: 'round' }),
      el('path', { d: 'M-90 -14 L-280 -58 M-90 14 L-280 58', stroke: C.brass, strokeWidth: 5, opacity: 0.6 }),
      // foot pocket
      el('path', { d: 'M20 -36 Q-60 -42 -110 -18 Q-120 0 -110 18 Q-60 42 20 36 Z', fill: '#e2b84a', stroke: C.brass, strokeWidth: 6, strokeLinejoin: 'round' })),
    el('rect', { x: -20, y: -60, width: 140, height: 120, rx: 30, fill: C.green, stroke: C.frame, strokeWidth: 5 }));
}

function sceneC(f) {
  const t0 = S(7);
  const starts = [t0 + 14, t0 + 46];
  let angle = -7, flex = 10, push = 0;
  for (const st of starts) {
    const down = progress(f, st, st + 16, Easing.inOut(Easing.sin)), up = progress(f, st + 16, st + 32, Easing.inOut(Easing.sin));
    if (f >= st && f < st + 32) { angle = lerp(lerp(-7, 7, down), -7, up); flex = f < st + 16 ? lerp(10, -14, down) : lerp(-14, 10, up); }
    push = Math.max(push, progress(f, st, st + 9) * (1 - progress(f, st + 16, st + 28)));
  }
  // fin tip in scene coordinates
  const a = rad(angle), tipX = 1190 - 790 * Math.cos(a), tipY = 330 - 790 * Math.sin(a) * -1;
  const inset = spring(f, t0 + 4, { damping: 14 });
  return [
    el('rect', { width: 1280, height: 720, fill: C.water }),
    el('rect', { y: 420, width: 1280, height: 300, fill: C.waterDeep, opacity: 0.45 }),
    // water drifting past: the swimmer moves forward (right)
    Array.from({ length: 14 }, (_, i) => circle(((i * 211 + 1400 - (f - t0) * 5) % 1400) - 60, 80 + ((i * 97) % 560), 5 + (i % 3) * 2, { fill: '#ffffff', opacity: 0.55 })),
    FinLeg({ angle, flex }),
    starts.map(st => ripple(tipX - 120, tipY + 30, progress(f, st + 10, st + 40, Easing.out(Easing.quad)), 1.3)),
    Arrow({ x: tipX - 50, y: tipY - 10, length: 180 * push, thickness: 32, angle: 186, opacity: push > 0.03 ? 1 : 0 }),
    Arrow({ x: tipX - 40, y: tipY + 70, length: 140 * push, thickness: 24, angle: 170, opacity: push > 0.03 ? 0.8 : 0 }),
    // reminder card: the duck's webbed foot does the same
    inset > 0.01 && g({ transform: `${t(1060, 150)} scale(${inset.toFixed(3)})` },
      el('rect', { x: -170, y: -110, width: 340, height: 220, rx: 24, fill: C.paper, stroke: C.frame, strokeWidth: 5 }),
      el('rect', { x: -150, y: -90, width: 300, height: 180, rx: 16, fill: C.water }),
      g({ transform: 'translate(40 -55) rotate(18)' }, el('line', { x1: 0, y1: -30, x2: 0, y2: 0, stroke: C.orange, strokeWidth: 12, strokeLinecap: 'round' }), Foot({ open: 1, s: 1.15 })),
      Arrow({ x: -10, y: 30, length: 120 * push, thickness: 22, angle: 180, opacity: push > 0.03 ? 1 : 0 })),
  ];
}

function webbedFoot(f) {
  const aOut = 1 - progress(f, S(3.35), S(3.6), Easing.linear);
  const cIn = progress(f, S(6.9), S(7.15), Easing.linear);
  return Stage(
    defs([0, 1].map(i => el('clipPath', { id: `lane${i}` }, el('rect', { x: 40, y: i ? 380 : 34, width: 1200, height: i ? 306 : 302, rx: 24 })))),
    f < S(3.6) && g({ opacity: aOut.toFixed(3) }, sceneA(f)),
    f >= S(3.35) && f < S(7.15) && g({ opacity: (1 - aOut).toFixed(3) }, sceneB(f)),
    f >= S(6.9) && g({ opacity: cIn.toFixed(3) }, sceneC(f)),
  );
}

/* =====================================================================
   3. shell-helmet (10s) — 단단한 덮개가 몸을 덮어 부딪힘을 막는다
   0–3.5s 등에 단단한 등딱지를 진 거북 · 3.5–7s 도토리가 톡 떨어져도 등딱지는 멀쩡
   7–10s 안전모도 머리를 덮어 같은 방식으로 막아 준다
   ===================================================================== */

const SHELL = 'M-176 8 Q-172 -166 0 -172 Q172 -166 176 8 Z';
function Turtle({ x, y, s = 1, tuck = 0, walk = 0, glow = 0 }) {
  const sw = Math.sin(walk) * 9, headX = lerp(205, 160, tuck);
  const leg = (lx, ly) => el('rect', { x: lx - 24, y: ly - 14, width: 48, height: 62, rx: 22, fill: C.turtleSkin, stroke: C.shellDark, strokeWidth: 5 });
  return g({ transform: `${t(x, y)} scale(${s.toFixed(3)})` },
    leg(-112 + sw, 0), leg(112 - sw, 0), leg(-70 - sw, 6), leg(70 + sw, 6),
    el('path', { d: 'M-168 -2 L-214 14 L-166 22 Z', fill: C.turtleSkin, stroke: C.shellDark, strokeWidth: 5, strokeLinejoin: 'round' }),
    el('rect', { x: 120, y: -58, width: Math.max(10, headX - 120), height: 44, rx: 22, fill: C.turtleSkin, stroke: C.shellDark, strokeWidth: 5 }),
    el('ellipse', { cx: headX, cy: -44, rx: 48, ry: 36, fill: C.turtleSkin, stroke: C.shellDark, strokeWidth: 5 }),
    circle(headX + 20, -54, 7, { fill: C.ink }),
    el('path', { d: `M${headX + 18} -28 q14 6 26 -4`, fill: 'none', stroke: C.shellDark, strokeWidth: 4, strokeLinecap: 'round' }),
    glow > 0.02 && el('path', { d: SHELL, fill: 'none', stroke: C.accent, strokeWidth: 26, opacity: glow.toFixed(3), strokeLinejoin: 'round' }),
    el('path', { d: SHELL, fill: C.shell, stroke: C.shellDark, strokeWidth: 6, strokeLinejoin: 'round' }),
    g({ clipPath: 'url(#shellClip)' },
      el('polygon', { points: '-46,-82 -23,-122 23,-122 46,-82 23,-42 -23,-42', fill: '#8fae5f', stroke: C.shellDark, strokeWidth: 5, strokeLinejoin: 'round' }),
      el('path', { d: 'M-46 -82 L-130 -110 M-23 -42 L-80 8 M23 -42 L80 8 M46 -82 L130 -110 M-23 -122 L-50 -180 M23 -122 L50 -180 M-130 -110 L-176 -40 M130 -110 L176 -40', stroke: C.shellDark, strokeWidth: 5, fill: 'none' })),
    el('path', { d: 'M-120 -140 Q-60 -168 0 -166', fill: 'none', stroke: '#c3d79a', strokeWidth: 8, strokeLinecap: 'round', opacity: 0.8 }),
    el('rect', { x: -188, y: -6, width: 376, height: 26, rx: 13, fill: '#d9c48a', stroke: C.shellDark, strokeWidth: 5 }));
}

function Acorn({ x, y, rot = 0 }) {
  return g({ transform: `${t(x, y)} rotate(${rot.toFixed(1)})` },
    el('ellipse', { cx: 0, cy: 6, rx: 20, ry: 25, fill: '#c98a4b', stroke: C.woodDark, strokeWidth: 4 }),
    el('path', { d: 'M-24 -4 Q-24 -28 0 -28 Q24 -28 24 -4 Z', fill: '#8a5a32', stroke: C.woodDark, strokeWidth: 4 }),
    el('path', { d: 'M-16 -14 H16 M-12 -22 H12', stroke: C.woodDark, strokeWidth: 3, opacity: 0.6 }),
    el('line', { x1: 0, y1: -28, x2: 4, y2: -40, stroke: C.woodDark, strokeWidth: 5, strokeLinecap: 'round' }));
}

/** Short lines bursting from the contact point (the bump), above the surface only. */
function Bump(x, y, k) {
  if (k <= 0.01 || k >= 0.99) return '';
  return g({ transform: t(x, y), opacity: (1 - k).toFixed(3) },
    [-150, -120, -90, -60, -30].map(a => { const [x1, y1] = pt(30 + 20 * k, a), [x2, y2] = pt(52 + 34 * k, a); return el('line', { x1, y1, x2, y2, stroke: C.brass, strokeWidth: 7, strokeLinecap: 'round' }); }));
}

/** Falling acorn: falls to `hitY`, bounces off and rolls to rest on the ground. */
function fallBounce(f, { start, x0, top, hitY, fall = 24, fly = 34, dx = 230, ground = 538 }) {
  if (f < start) return { x: x0, y: top, rot: 0, hit: -1 };
  if (f < start + fall) { const p = Easing.quad((f - start) / fall); return { x: x0, y: lerp(top, hitY, p), rot: 0, hit: -1 }; }
  const u = Math.min(1, (f - start - fall) / fly), drop = ground - hitY, up = 70;
  // y(u) = hitY - a·u + b·u², peak height `up`, lands on the ground at u = 1
  const b = drop + 2 * up + 2 * Math.sqrt(up * (up + drop)), a = b - drop;
  const roll = progress(f, start + fall + fly, start + fall + fly + 14, Easing.out(Easing.quad));
  return { x: x0 + dx * u + 40 * roll, y: hitY - a * u + b * u * u, rot: 200 * u + 90 * roll, hit: (f - start - fall) / 22 };
}

function Child({ glow }) {
  return g({},
    el('path', { d: 'M620 720 Q624 566 800 548 Q976 566 980 720 Z', fill: C.green, stroke: C.frame, strokeWidth: 5 }),
    el('rect', { x: 768, y: 470, width: 64, height: 92, rx: 20, fill: C.skin, stroke: C.skinDark, strokeWidth: 5 }),
    circle(686, 392, 24, { fill: C.skin, stroke: C.skinDark, strokeWidth: 5 }), circle(914, 392, 24, { fill: C.skin, stroke: C.skinDark, strokeWidth: 5 }),
    circle(800, 380, 116, { fill: C.skin, stroke: C.skinDark, strokeWidth: 6 }),
    el('path', { d: 'M690 350 Q700 300 740 292 M910 350 Q900 300 860 292', fill: 'none', stroke: '#5b3a22', strokeWidth: 16, strokeLinecap: 'round' }),
    circle(758, 398, 10, { fill: C.ink }), circle(842, 398, 10, { fill: C.ink }),
    circle(735, 432, 14, { fill: '#ee8f7a', opacity: 0.55 }), circle(865, 432, 14, { fill: '#ee8f7a', opacity: 0.55 }),
    el('path', { d: 'M772 446 Q800 470 828 446', fill: 'none', stroke: C.ink, strokeWidth: 6, strokeLinecap: 'round' }),
    // safety helmet covering the top of the head
    glow > 0.02 && el('path', { d: 'M668 338 Q668 196 800 192 Q932 196 932 338 Z', fill: 'none', stroke: C.heatGlow, strokeWidth: 26, opacity: glow.toFixed(3), strokeLinejoin: 'round' }),
    el('path', { d: 'M668 338 Q668 196 800 192 Q932 196 932 338 Z', fill: C.accent, stroke: C.brass, strokeWidth: 6, strokeLinejoin: 'round' }),
    el('path', { d: 'M800 196 V334', stroke: '#e2b84a', strokeWidth: 26 }),
    el('path', { d: 'M800 196 V334', stroke: C.brass, strokeWidth: 4, opacity: 0.6 }),
    el('path', { d: 'M700 300 Q700 230 760 214', fill: 'none', stroke: '#fff3c4', strokeWidth: 10, strokeLinecap: 'round' }),
    el('rect', { x: 640, y: 326, width: 320, height: 28, rx: 14, fill: '#e9c24f', stroke: C.brass, strokeWidth: 6 }));
}

function shellHelmet(f) {
  const tA = S(3.5), tC = S(7);
  const walkIn = progress(f, 0, S(2.6), Easing.out(Easing.quad));
  const m = progress(f, tC, tC + 26);
  const acorn1 = fallBounce(f, { start: tA + 6, x0: 668, top: 120, hitY: 328 - 0, dx: 240 });
  const acorn2 = fallBounce(f, { start: tC + 22, x0: 830, top: -40, hitY: 166, fall: 20, fly: 30, dx: 210 });
  const hit1 = acorn1.hit, hit2 = acorn2.hit;
  const shellGlow = 0.85 * win(f, S(0.9), S(3.4), 14) * (0.6 + 0.4 * pulse(f, S(0.9), 30))
    + 0.9 * win(f, tA + 30, tC - 4, 8) * (0.55 + 0.45 * pulse(f, tA + 30, 24))
    + 0.9 * win(f, tC + 42, S(10) + 30, 8) * (0.6 + 0.4 * pulse(f, tC + 42, 24));
  const tuck = progress(f, tA + 26, tA + 34) * (1 - progress(f, tA + 70, tA + 96));
  const turtle = Turtle({ x: lerp(lerp(470, 640, walkIn), 215, m), y: lerp(520, 260, m), s: lerp(1, 0.56, m), tuck, walk: f < S(2.6) ? f * 0.3 : 0, glow: Math.min(1, shellGlow) });
  return Stage(
    defs(el('clipPath', { id: 'shellClip' }, el('path', { d: SHELL }))),
    el('rect', { width: 1280, height: 720, fill: '#eef2df' }),
    el('path', { d: 'M0 560 Q320 540 640 556 Q960 572 1280 552 V720 H0 Z', fill: C.grass, stroke: C.grassDark, strokeWidth: 5 }),
    // oak branch (fades when the helmet scene starts)
    g({ opacity: (1 - m).toFixed(3) },
      el('path', { d: 'M1290 70 Q980 70 640 112', fill: 'none', stroke: C.wood, strokeWidth: 26, strokeLinecap: 'round' }),
      [[700, 96, 46], [800, 70, 52], [930, 66, 56], [1070, 56, 60], [1200, 48, 62], [860, 120, 40], [1010, 112, 44]].map(([cx, cy, r]) => circle(cx, cy, r, { fill: C.grassDark, stroke: C.shellDark, strokeWidth: 4, opacity: 0.95 })),
      f < tC && Acorn(acorn1),
      Bump(acorn1.x, 312, hit1)),
    // inset card behind the shrinking turtle
    m > 0.01 && el('rect', { x: 50, y: 70, width: 330, height: 280, rx: 26, fill: C.paper, stroke: C.frame, strokeWidth: 5, opacity: m.toFixed(3) }),
    m > 0.01 && el('rect', { x: 66, y: 290, width: 298, height: 44, rx: 14, fill: C.grass, opacity: m.toFixed(3) }),
    turtle,
    m > 0.01 && g({ opacity: m.toFixed(3) }, Child({ glow: Math.min(1, 0.9 * win(f, tC + 42, S(10) + 30, 8) * (0.6 + 0.4 * pulse(f, tC + 42, 24))) })),
    f >= tC && Acorn(acorn2),
    Bump(acorn2.x, 176, hit2),
  );
}

/* =====================================================================
   4. sort-criteria (12s) — 좋은 분류 기준
   0–4s '빠른가?'(생각 질문): 세 연구원의 O/X 결과가 서로 다름
   4–8s '날개가 있나?'(관찰 질문): 셋의 결과가 같음
   8–12s 누가 해도 같은 결과 + 두 무리로 나뉨
   ===================================================================== */

const animalStroke = { stroke: C.frame, strokeWidth: 4, strokeLinejoin: 'round' };
const Rabbit = () => [
  el('ellipse', { cx: 2, cy: -40, rx: 9, ry: 26, fill: '#efe6d6', ...animalStroke, transform: 'rotate(-12 2 -20)' }),
  el('ellipse', { cx: 18, cy: -40, rx: 9, ry: 26, fill: '#efe6d6', ...animalStroke, transform: 'rotate(10 18 -20)' }),
  circle(-34, 16, 10, { fill: '#ffffff', ...animalStroke }),
  el('ellipse', { cx: -6, cy: 16, rx: 32, ry: 24, fill: '#efe6d6', ...animalStroke }),
  circle(14, -6, 20, { fill: '#efe6d6', ...animalStroke }),
  circle(22, -10, 4, { fill: C.ink }), circle(33, -2, 4, { fill: '#ee8f7a' })];
const Bird = () => [
  el('path', { d: 'M-26 2 L-52 -12 L-48 12 Z', fill: '#8a5a32', ...animalStroke }),
  el('line', { x1: -4, y1: 26, x2: -8, y2: 40, stroke: C.orangeDark, strokeWidth: 4 }), el('line', { x1: 8, y1: 26, x2: 10, y2: 40, stroke: C.orangeDark, strokeWidth: 4 }),
  el('ellipse', { cx: 0, cy: 6, rx: 32, ry: 23, fill: '#c9955f', ...animalStroke }),
  circle(24, -16, 17, { fill: '#c9955f', ...animalStroke }),
  el('path', { d: 'M38 -20 L54 -14 L38 -9 Z', fill: C.orange, ...animalStroke }),
  el('path', { d: 'M-22 -2 Q0 -14 18 4 Q0 22 -22 -2 Z', fill: '#8a5a32', ...animalStroke }),
  circle(30, -19, 3.5, { fill: C.ink })];
const Butterfly = () => [
  el('ellipse', { cx: -20, cy: -14, rx: 20, ry: 25, fill: C.accent, ...animalStroke, transform: 'rotate(-25 -20 -14)' }),
  el('ellipse', { cx: 20, cy: -14, rx: 20, ry: 25, fill: C.accent, ...animalStroke, transform: 'rotate(25 20 -14)' }),
  el('ellipse', { cx: -16, cy: 18, rx: 14, ry: 17, fill: C.orange, ...animalStroke, transform: 'rotate(20 -16 18)' }),
  el('ellipse', { cx: 16, cy: 18, rx: 14, ry: 17, fill: C.orange, ...animalStroke, transform: 'rotate(-20 16 18)' }),
  el('ellipse', { cx: 0, cy: 2, rx: 5, ry: 26, fill: C.ink }),
  el('path', { d: 'M-2 -22 Q-8 -36 -16 -40 M2 -22 Q8 -36 16 -40', fill: 'none', stroke: C.ink, strokeWidth: 3, strokeLinecap: 'round' })];
const MiniTurtle = () => [
  el('rect', { x: -28, y: 4, width: 14, height: 18, rx: 6, fill: C.turtleSkin, ...animalStroke }), el('rect', { x: 14, y: 4, width: 14, height: 18, rx: 6, fill: C.turtleSkin, ...animalStroke }),
  circle(40, -2, 12, { fill: C.turtleSkin, ...animalStroke }), circle(44, -5, 2.5, { fill: C.ink }),
  el('path', { d: 'M-38 10 Q-36 -32 0 -34 Q36 -32 38 10 Z', fill: C.shell, ...animalStroke }),
  el('path', { d: 'M-14 -10 L0 -22 L14 -10 L8 6 L-8 6 Z', fill: '#8fae5f', stroke: C.shellDark, strokeWidth: 3 })];
const ANIMALS = [Rabbit, Bird, Butterfly, MiniTurtle];
const FAST = [[1, 1, 0, 0], [1, 0, 0, 0], [1, 1, 1, 0]];   // each researcher's own opinion — 1 = O
const WINGS = [0, 1, 1, 0];                                  // observable — same for everyone
const POOL = i => [-135 + 90 * i, 40];
function groupSlots(groups) {
  let o = 0, x = 0;
  return groups.map(v => { const k = v ? o++ : x++; return [(v ? -90 : 90) + (k % 2 ? 42 : -42), 196 + Math.floor(k / 2) * 84]; });
}
const arc = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - Math.sin(Math.PI * p) * 50];

function Board({ animals, outlineColor, outlineOpacity, dashed, pool = 1 }) {
  return [
    el('rect', { x: -180, y: 0, width: 360, height: 80, rx: 16, fill: C.paperStrong, stroke: C.line, strokeWidth: 4, opacity: pool.toFixed(3) }),
    el('rect', { x: -180, y: 92, width: 176, height: 230, rx: 18, fill: '#e3ecd2', stroke: C.okSoft, strokeWidth: 4 }),
    el('rect', { x: 4, y: 92, width: 176, height: 230, rx: 18, fill: '#f3dccf', stroke: C.noSoft, strokeWidth: 4 }),
    circle(-92, 130, 22, { fill: 'none', stroke: C.ok, strokeWidth: 9 }),
    el('path', { d: 'M74 112 L110 148 M110 112 L74 148', stroke: C.no, strokeWidth: 9, strokeLinecap: 'round' }),
    outlineOpacity > 0.02 && el('rect', { x: -192, y: 80, width: 384, height: 254, rx: 24, fill: 'none', stroke: outlineColor, strokeWidth: 7, strokeDasharray: dashed ? '18 12' : undefined, opacity: outlineOpacity.toFixed(3) }),
    animals,
  ];
}

function Researcher({ x, y, coat, tilt = 0, nod = 0, opacity = 1 }) {
  if (opacity <= 0.02) return '';
  return g({ transform: t(x, y), opacity: opacity.toFixed(3) },
    el('path', { d: 'M-50 52 Q-50 4 0 0 Q50 4 50 52 Z', fill: coat, ...outline }),
    el('path', { d: 'M-10 2 L0 22 L10 2', fill: C.paper, stroke: C.frame, strokeWidth: 3 }),
    g({ transform: `translate(0 ${(-4 + nod).toFixed(2)}) rotate(${tilt.toFixed(2)})` },
      circle(0, -30, 30, { fill: C.skin, stroke: C.skinDark, strokeWidth: 5 }),
      el('path', { d: 'M-30 -36 Q-26 -66 4 -62 Q28 -60 30 -38 Q10 -50 -30 -36 Z', fill: '#5b3a22' }),
      circle(-10, -26, 4.5, { fill: C.ink }), circle(10, -26, 4.5, { fill: C.ink }),
      el('path', { d: 'M-8 -12 q8 5 16 0', fill: 'none', stroke: C.ink, strokeWidth: 3.5, strokeLinecap: 'round' })));
}

const FastIcon = () => [
  el('path', { d: 'M-70 -16 H-20 M-80 2 H-14 M-66 20 H-20', stroke: C.muted, strokeWidth: 7, strokeLinecap: 'round' }),
  circle(18, 2, 24, { fill: C.heat, stroke: C.heatDark, strokeWidth: 5 }),
  el('path', { d: 'M28 -30 l12 -10 M38 -14 l14 -6', stroke: C.heatDark, strokeWidth: 5, strokeLinecap: 'round' })];
const WingIcon = () => [
  [[-12, 92], [-30, 84], [-48, 74], [-66, 62]].map(([ang, len]) =>
    el('ellipse', { cx: len / 2, cy: 0, rx: len / 2 + 6, ry: 13, fill: C.paperStrong, stroke: C.frame, strokeWidth: 4, transform: `translate(-46 30) rotate(${ang})` })),
  el('path', { d: 'M-60 34 Q-62 -6 -24 -22 Q8 -30 18 -14 Q-6 4 -20 30 Z', fill: '#e8dfc3', stroke: C.frame, strokeWidth: 4, strokeLinejoin: 'round' })];

function sortCriteria(f) {
  const xs = [220, 640, 1060], coats = [C.green, C.brass, C.waterDark];
  const enter = spring(f, 0, { damping: 14 });
  const swap = spring(f, S(4.2), { damping: 12 });
  const mismatch = win(f, S(3.2), S(4.1), 6);
  const match = win(f, S(6.8), S(8.4), 6);
  const m = progress(f, S(8.1), S(9.2));
  const z = progress(f, S(9.1), S(10.4));
  const final = progress(f, S(10.4), S(10.9));
  const boards = xs.map((bx, r) => {
    const animals = ANIMALS.map((Animal, a) => {
      const fastSlot = groupSlots(FAST[r])[a], wingSlot = groupSlots(WINGS)[a], pool = POOL(a);
      const d1 = 22 + a * 10 + r * 4, d2 = S(4.6) + a * 10 + r * 4;
      const p = f < S(3.9) ? arc(pool, fastSlot, progress(f, d1, d1 + 20))
        : f < S(4.6) ? arc(fastSlot, pool, progress(f, S(3.95) + a * 3, S(4.45) + a * 3))
        : arc(pool, wingSlot, progress(f, d2, d2 + 20));
      return g({ transform: `${t(p[0], p[1])} scale(0.82)` }, Animal());
    });
    const x = lerp(bx, 640, m), y = lerp(262, 30, z), s = lerp(1, 1.6, z);
    const outlineColor = f < S(5) ? C.no : C.ok;
    const outlineOpacity = f < S(5) ? mismatch : Math.max(match, final);
    const fade = r === 0 ? 1 : 1 - progress(f, S(8.9), S(9.2), Easing.linear);
    return fade > 0.01 && g({ transform: `${t(x, y)} scale(${s.toFixed(3)})`, opacity: (enter * fade).toFixed(3) },
      Board({ animals, outlineColor, outlineOpacity, dashed: f < S(5), pool: 1 - z }));
  });
  const people = xs.map((x, r) => Researcher({ x, y: 200, coat: coats[r],
    tilt: [-14, 12, -10][r] * mismatch, nod: Math.abs(Math.sin((f - S(6.8)) / 5)) * 6 * match,
    opacity: enter * (1 - progress(f, S(8), S(8.5), Easing.linear)) }));
  return Stage(
    el('rect', { width: 1280, height: 720, fill: C.bg }),
    people,
    boards.reverse(),
    // question bubble: opinion ("fast?") → observation ("wings?")
    g({ transform: t(640, 58), opacity: enter.toFixed(3) },
      el('rect', { x: -110, y: -54, width: 220, height: 108, rx: 32, fill: C.paper, stroke: C.frame, strokeWidth: 5 }),
      el('polygon', { points: '-14,52 14,52 0,74', fill: C.paper, stroke: C.frame, strokeWidth: 5, strokeLinejoin: 'round' }),
      el('rect', { x: -16, y: 46, width: 32, height: 9, fill: C.paper }),
      f < S(4.4) && g({ opacity: (1 - progress(f, S(4.05), S(4.35), Easing.linear)).toFixed(3) }, FastIcon()),
      f >= S(4.1) && g({ transform: `scale(${Math.max(0.01, swap).toFixed(3)})` }, WingIcon())),
    [[-260, 230], [260, 240], [-250, 560], [262, 560]].map(([dx, dy], i) =>
      Sparkle({ x: 640 + dx, y: dy, size: 26 * final * (1 + 0.35 * pulse(f, S(10.6) + i * 6, 22)), color: C.brass, opacity: final })),
  );
}

export const clips = {
  'warm-fur': { seconds: 12, frame: warmFur },
  'webbed-foot': { seconds: 10, frame: webbedFoot },
  'shell-helmet': { seconds: 10, frame: shellHelmet },
  'sort-criteria': { seconds: 12, frame: sortCriteria },
};
