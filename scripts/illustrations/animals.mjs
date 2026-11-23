import { bumps, C, INK, light } from './lib.mjs';

/** Front-facing animal heads (avatars, Schlummer-Schloss animals). */
export const fox = (p) => {
  const o = C.orange;
  p.path('M24 42 L18 10 L46 28 Z', o).path('M76 42 L82 10 L54 28 Z', o);
  p.path('M25 32 L22 17 L37 27 Z', '#5a3a3a', { flat: true, sw: 2 }).path('M75 32 L78 17 L63 27 Z', '#5a3a3a', { flat: true, sw: 2 });
  p.path('M16 48 Q18 26 50 24 Q82 26 84 48 Q86 62 70 72 L50 86 L30 72 Q14 62 16 48 Z', o);
  p.path('M28 60 Q40 56 50 66 Q60 56 72 60 Q68 74 50 86 Q32 74 28 60 Z', C.cream, { sw: 2.6 });
  p.eyes([39, 61], 52).cheeks([30, 70], 62);
  p.ellipse(50, 69, 4.6, 3.4, INK, { flat: true, noStroke: true }).smile(50, 74, 4, 3);
  p.shine(36, 34, 9, 4);
};

export const cat = (p, color = C.grey, stripe = '#7d8499') => {
  p.path('M22 46 L22 12 L46 32 Z', color).path('M78 46 L78 12 L54 32 Z', color);
  p.path('M26 36 L26 20 L38 31 Z', C.pink, { flat: true, sw: 2 }).path('M74 36 L74 20 L62 31 Z', C.pink, { flat: true, sw: 2 });
  p.ellipse(50, 56, 34, 29, color);
  p.line('M50 30 L50 38 M42 31 L44 38 M58 31 L56 38', { color: stripe, sw: 3 });
  p.eyes([38, 62], 54).cheeks([28, 72], 64);
  p.path('M46 62 L54 62 L50 66.5 Z', C.pink, { flat: true, sw: 2 });
  p.line('M43 70 Q46.5 73 50 69 Q53.5 73 57 70', { sw: 2.6 });
  p.line('M16 60 L30 62 M16 68 L30 66 M84 60 L70 62 M84 68 L70 66', { sw: 2 });
  p.shine(36, 38, 9, 4);
};

export const dog = (p, collar) => {
  const fur = '#e8b27a';
  const ear = '#8a5a3a';
  p.ellipse(50, 54, 31, 30, fur);
  p.flat('M54 30 Q70 28 72 44 Q66 52 56 46 Q50 38 54 30 Z', '#c98f55', 0.9);
  p.path('M26 30 Q10 34 12 62 Q14 76 24 70 Q30 56 32 38 Z', ear).path('M74 30 Q90 34 88 62 Q86 76 76 70 Q70 56 68 38 Z', ear);
  p.ellipse(50, 68, 15, 11, C.cream, { sw: 2.6 });
  p.eyes([39, 61], 50).cheeks([30, 70], 62);
  p.ellipse(50, 62, 6, 4.4, INK, { flat: true, noStroke: true });
  p.line('M50 66 L50 70 M44 71 Q50 75 56 71', { sw: 2.6 });
  p.path('M47 72 Q50 81 53 72 Z', C.red, { sw: 2 });
  if (collar) {
    p.path('M26 80 Q50 92 74 80 L74 86 Q50 98 26 86 Z', C.blue, { sw: 2.6 });
    p.circle(50, 91, 4.5, C.gold, { sw: 2 });
  }
  p.shine(38, 34, 9, 4);
};

export const panda = (p) => {
  p.circle(26, 30, 11, INK, { flat: true }).circle(74, 30, 11, INK, { flat: true });
  p.ellipse(50, 56, 33, 30, C.white);
  p.ellipse(38, 53, 8.5, 11, INK, { flat: true, noStroke: true, t: 'rotate(25 38 53)' });
  p.ellipse(62, 53, 8.5, 11, INK, { flat: true, noStroke: true, t: 'rotate(-25 62 53)' });
  p.circle(39, 52, 3.6, '#fff', { flat: true, noStroke: true }).circle(61, 52, 3.6, '#fff', { flat: true, noStroke: true });
  p.circle(39.6, 52.4, 2.1, INK, { flat: true, noStroke: true }).circle(61.6, 52.4, 2.1, INK, { flat: true, noStroke: true });
  p.cheeks([28, 72], 66);
  p.ellipse(50, 64, 4.8, 3.4, INK, { flat: true, noStroke: true }).smile(50, 70, 4.5, 3.5);
  p.shine(38, 36, 9, 4);
};

export const lion = (p) => {
  bumps(p, 50, 52, 33, 13, 12, '#e0892e', { flat: true, sw: 3 });
  p.circle(31, 30, 6, '#ffc94d', { sw: 2.6 }).circle(69, 30, 6, '#ffc94d', { sw: 2.6 });
  p.ellipse(50, 55, 25, 24, '#ffc94d');
  p.ellipse(50, 66, 12, 8.5, C.cream, { sw: 2.4 });
  p.eyes([41, 59], 51, 4.2).cheeks([33, 67], 61, 4, 2.8);
  p.path('M46 61 L54 61 L50 65.5 Z', '#9a5a3a', { flat: true, sw: 2 });
  p.line('M45 69 Q47.5 71.5 50 68.5 Q52.5 71.5 55 69', { sw: 2.4 });
  p.shine(40, 40, 7, 3.5);
};

export const unicorn = (p) => {
  const w = '#fbf7ff';
  p.path('M30 34 L26 12 L42 26 Z', w, { sw: 2.6 }).path('M70 34 L74 12 L58 26 Z', w, { sw: 2.6 });
  p.path('M29 30 L28 18 L37 26 Z', C.rose, { flat: true, noStroke: true }).path('M71 30 L72 18 L63 26 Z', C.rose, { flat: true, noStroke: true });
  p.path('M26 40 Q12 54 18 76 Q22 88 30 84 Q22 70 30 56 Z', C.lilac, { sw: 2.6 });
  p.ellipse(50, 56, 29, 30, w);
  p.path('M44 28 L50 0 L56 28 Z', C.gold, { sw: 2.6 });
  p.line('M45.5 21 L54.5 18 M47.5 13 L52.5 11', { sw: 2 });
  p.path('M28 40 Q30 22 50 24 Q66 24 70 36 Q58 28 50 36 Q46 30 38 34 Q34 36 28 40 Z', C.pink, { sw: 2.6 });
  p.path('M24 50 Q20 62 26 70 Q26 60 32 54 Z', C.teal, { sw: 2.2 });
  p.ellipse(50, 72, 17, 11.5, '#ffd6e6', { sw: 2.6 });
  p.circle(44.5, 72, 1.8, INK, { flat: true, noStroke: true }).circle(55.5, 72, 1.8, INK, { flat: true, noStroke: true });
  p.eyes([39, 61], 54, 4.6, { lash: true }).cheeks([30, 70], 63, 4.2, 2.8);
  p.sparkle(84, 22, 6).sparkle(16, 18, 4);
};

export const frog = (p) => {
  const g = C.green;
  p.circle(31, 34, 14, g).circle(69, 34, 14, g);
  p.ellipse(50, 60, 38, 27, g);
  p.circle(31, 33, 8.5, C.white, { sw: 2.4 }).circle(69, 33, 8.5, C.white, { sw: 2.4 });
  p.eyes([32, 70], 34, 4.4);
  p.path('M26 60 Q50 80 74 60 Q50 70 26 60 Z', '#2f7d3b', { flat: true, sw: 2.6 });
  p.cheeks([22, 78], 62, 5, 3.4);
  p.circle(45, 52, 1.5, INK, { flat: true, noStroke: true }).circle(55, 52, 1.5, INK, { flat: true, noStroke: true });
  p.shine(30, 48, 9, 4);
};

export const owl = (p, cap = false) => {
  const b = '#a0703f';
  p.path('M18 44 L20 12 L38 28 Q50 24 62 28 L80 12 L82 44 Q86 80 50 88 Q14 80 18 44 Z', b);
  p.flat('M30 66 Q50 92 70 66 Q66 84 50 86 Q34 84 30 66 Z', light(b, 0.35), 0.9);
  p.line('M40 72 q3 3 6 0 M54 72 q3 3 6 0 M47 79 q3 3 6 0', { sw: 2, color: '#7a5230' });
  p.circle(37, 46, 13.5, C.cream, { sw: 2.6 }).circle(63, 46, 13.5, C.cream, { sw: 2.6 });
  p.circle(37, 46, 6.5, INK, { flat: true, noStroke: true }).circle(63, 46, 6.5, INK, { flat: true, noStroke: true });
  p.circle(39.5, 43.5, 2.4, '#fff', { flat: true, noStroke: true }).circle(65.5, 43.5, 2.4, '#fff', { flat: true, noStroke: true });
  p.path('M45 56 L55 56 L50 64 Z', C.orange, { sw: 2.4 });
  if (cap) {
    p.path('M28 20 L50 10 L72 20 L50 30 Z', INK, { flat: true, sw: 2.4 });
    p.path('M38 24 L38 32 Q50 38 62 32 L62 24 L50 30 Z', INK, { flat: true, sw: 2.4 });
    p.line('M70 20 L72 34', { sw: 2, color: C.gold });
    p.circle(72, 36, 3, C.gold, { sw: 1.6 });
  }
  p.shine(30, 30, 6, 3);
};

export const rabbit = (p) => {
  const f = '#ece8f4';
  p.ellipse(36, 22, 9, 22, f, { t: 'rotate(-12 36 22)' }).ellipse(64, 22, 9, 22, f, { t: 'rotate(12 64 22)' });
  p.ellipse(36, 24, 4.2, 15, C.pink, { flat: true, noStroke: true, t: 'rotate(-12 36 24)' });
  p.ellipse(64, 24, 4.2, 15, C.pink, { flat: true, noStroke: true, t: 'rotate(12 64 24)' });
  p.ellipse(50, 60, 31, 27, f);
  p.eyes([39, 61], 56).cheeks([28, 72], 66);
  p.path('M46.5 63 L53.5 63 L50 67 Z', C.pink, { flat: true, sw: 2 });
  p.line('M50 67 L50 70 M44 71 Q47 73.5 50 70 Q53 73.5 56 71', { sw: 2.4 });
  p.rect(46.6, 72, 6.8, 6, 1.5, C.white, { sw: 2, flat: true });
  p.line('M50 72 L50 78', { sw: 1.5 });
  p.shine(36, 44, 8, 4);
};

export const bear = (p, color = '#b8763e') => {
  p.circle(25, 30, 11, color).circle(75, 30, 11, color);
  p.circle(25, 30, 5.5, light(color, 0.35), { flat: true, noStroke: true }).circle(75, 30, 5.5, light(color, 0.35), { flat: true, noStroke: true });
  p.ellipse(50, 56, 33, 30, color);
  p.ellipse(50, 66, 13, 10, C.tan, { sw: 2.6 });
  p.eyes([38, 62], 52).cheeks([28, 72], 64);
  p.ellipse(50, 61.5, 5.5, 4, INK, { flat: true, noStroke: true });
  p.line('M50 65 L50 69 M45 70 Q50 74 55 70', { sw: 2.4 });
  p.shine(37, 36, 9, 4);
};

export const penguin = (p) => {
  p.ellipse(50, 54, 34, 32, C.navy);
  p.path('M50 40 Q38 28 28 42 Q22 56 34 72 Q42 80 50 80 Q58 80 66 72 Q78 56 72 42 Q62 28 50 40 Z', C.white, { sw: 2.4 });
  p.eyes([39, 61], 52).cheeks([30, 70], 64);
  p.path('M42 60 Q50 56 58 60 Q50 70 42 60 Z', C.orange, { sw: 2.4 });
  p.shine(34, 32, 9, 4, -30, 0.35);
};

export const dino = (p) => {
  const g = '#4fbf8a';
  for (const [x, y, sz] of [[30, 26, 8], [44, 18, 9], [58, 16, 9], [72, 24, 8]]) p.path(`M${x - sz} ${y + 8} L${x} ${y - sz} L${x + sz} ${y + 8} Z`, C.orange, { sw: 2.6 });
  p.ellipse(50, 56, 34, 31, g);
  p.circle(72, 40, 3.2, light(g, 0.3), { flat: true, noStroke: true }).circle(28, 46, 2.6, light(g, 0.3), { flat: true, noStroke: true }).circle(66, 30, 2, light(g, 0.3), { flat: true, noStroke: true });
  p.ellipse(50, 70, 21, 12, light(g, 0.4), { sw: 2.4 });
  p.eyes([38, 62], 50).cheeks([27, 73], 62);
  p.circle(44, 66, 1.6, INK, { flat: true, noStroke: true }).circle(56, 66, 1.6, INK, { flat: true, noStroke: true });
  p.smile(50, 72, 8, 6);
  p.path('M44 74.2 L45.6 78.6 L47.4 75.4 Z', C.white, { sw: 1.4, flat: true });
  p.shine(36, 36, 9, 4);
};

export const octopus = (p, color = C.purple) => {
  const arms = [
    'M20 60 Q8 72 12 84 Q16 92 22 86 Q18 76 30 66 Z',
    'M34 64 Q28 80 32 90 Q38 96 42 88 Q38 80 44 68 Z',
    'M56 68 Q62 80 58 88 Q62 96 68 90 Q72 80 66 64 Z',
    'M70 66 Q82 76 78 86 Q84 92 88 84 Q92 72 80 60 Z',
  ];
  for (const d of arms) p.path(d, color, { sw: 2.8 });
  p.path('M16 60 Q14 20 50 16 Q86 20 84 60 Q84 74 50 74 Q16 74 16 60 Z', color);
  p.eyes([38, 62], 48, 4.8).cheeks([27, 73], 58);
  p.smile(50, 58, 6, 4);
  p.circle(64, 28, 3.5, light(color, 0.35), { flat: true, noStroke: true }).circle(73, 36, 2.2, light(color, 0.35), { flat: true, noStroke: true });
  p.shine(34, 30, 10, 4.5);
};

export const tiger = (p) => {
  const o = '#ff9a3c';
  p.circle(25, 30, 10, o).circle(75, 30, 10, o);
  p.circle(25, 30, 5, C.cream, { flat: true, noStroke: true }).circle(75, 30, 5, C.cream, { flat: true, noStroke: true });
  p.ellipse(50, 56, 34, 30, o);
  p.flat('M44 28 L50 40 L56 28 Z M38 30 L42 38 L46 29 Z M54 29 L58 38 L62 30 Z', INK, 0.9);
  p.flat('M17 52 L28 54 L17 58 Z M17 62 L27 62 L18 67 Z M83 52 L72 54 L83 58 Z M83 62 L73 62 L82 67 Z', INK, 0.9);
  p.path('M32 64 Q38 58 50 64 Q62 58 68 64 Q66 80 50 82 Q34 80 32 64 Z', C.cream, { sw: 2.4 });
  p.eyes([38, 62], 52).cheeks([28, 72], 62, 4, 2.8);
  p.path('M46 62 L54 62 L50 66.5 Z', C.pink, { flat: true, sw: 2 });
  p.line('M43 70 Q46.5 73 50 69 Q53.5 73 57 70', { sw: 2.4 });
  p.shine(37, 38, 8, 3.5);
};

// ---------- extra heads used for stickers & cards ----------

export const monkey = (p) => {
  const b = '#9a6235';
  p.circle(18, 52, 12, b).circle(82, 52, 12, b);
  p.circle(18, 52, 6.5, C.tan, { flat: true, noStroke: true }).circle(82, 52, 6.5, C.tan, { flat: true, noStroke: true });
  p.ellipse(50, 52, 30, 30, b);
  p.path('M50 40 Q40 32 32 40 Q24 52 32 64 Q40 78 50 78 Q60 78 68 64 Q76 52 68 40 Q60 32 50 40 Z', C.tan, { sw: 2.6 });
  p.eyes([41, 59], 50).cheeks([33, 67], 62, 4, 2.8);
  p.circle(47, 60, 1.5, INK, { flat: true, noStroke: true }).circle(53, 60, 1.5, INK, { flat: true, noStroke: true });
  p.smile(50, 66, 7, 5);
  p.shine(38, 32, 8, 3.5);
};

export const elephant = (p) => {
  const g = '#9fa8c6';
  p.path('M30 36 Q4 24 8 54 Q12 76 34 64 Z', g).path('M70 36 Q96 24 92 54 Q88 76 66 64 Z', g);
  p.flat('M16 42 Q10 56 22 62 Q28 52 26 44 Z', C.pink, 0.5).flat('M84 42 Q90 56 78 62 Q72 52 74 44 Z', C.pink, 0.5);
  p.ellipse(50, 50, 24, 26, g);
  p.path('M44 62 Q42 80 50 88 Q58 92 62 86 Q56 84 56 76 L56 62 Z', g, { sw: 2.8 });
  p.eyes([41, 59], 48).cheeks([34, 66], 58, 4, 2.6);
  p.line('M47 70 L53 70 M47 77 L54 77', { sw: 1.8, op: 0.5 });
  p.shine(42, 34, 7, 3.5);
};

export const giraffe = (p) => {
  const y = '#ffc65c';
  p.path('M40 60 L38 96 L62 96 L60 60 Z', y);
  p.flat('M44 74 q4 -4 8 0 q-4 5 -8 0 Z M50 86 q4 -4 8 0 q-4 5 -8 0 Z', '#c97a3a', 0.85);
  p.line('M40 22 L38 10 M60 22 L62 10', { sw: 3 });
  p.circle(38, 9, 4, '#c97a3a', { sw: 2.4 }).circle(62, 9, 4, '#c97a3a', { sw: 2.4 });
  p.ellipse(26, 30, 9, 5, y, { t: 'rotate(-25 26 30)' }).ellipse(74, 30, 9, 5, y, { t: 'rotate(25 74 30)' });
  p.ellipse(50, 40, 22, 22, y);
  p.flat('M34 28 q4 -4 8 0 q-4 5 -8 0 Z M60 26 q4 -4 8 0 q-4 5 -8 0 Z', '#c97a3a', 0.85);
  p.ellipse(50, 54, 15, 10, '#ffe0a8', { sw: 2.4 });
  p.circle(45, 53, 1.6, INK, { flat: true, noStroke: true }).circle(55, 53, 1.6, INK, { flat: true, noStroke: true });
  p.eyes([41, 59], 40, 4).cheeks([34, 66], 48, 3.6, 2.4);
  p.smile(50, 59, 5, 3);
};

export const leopard = (p) => {
  const y = '#f7b54a';
  p.circle(26, 30, 9, y).circle(74, 30, 9, y);
  p.ellipse(50, 56, 33, 29, y);
  for (const [x, yy] of [[30, 44], [70, 44], [40, 34], [60, 34], [50, 30], [26, 58], [74, 58]]) p.circle(x, yy, 2.8, '#8a5a2a', { flat: true, sw: 1.6, stroke: INK });
  p.path('M34 64 Q40 58 50 64 Q60 58 66 64 Q64 78 50 80 Q36 78 34 64 Z', C.cream, { sw: 2.4 });
  p.eyes([39, 61], 52).cheeks([30, 70], 62, 4, 2.8);
  p.path('M46 62 L54 62 L50 66.5 Z', '#c0606a', { flat: true, sw: 2 });
  p.line('M44 70 Q47 72.5 50 69 Q53 72.5 56 70', { sw: 2.4 });
};

export const sloth = (p) => {
  const b = '#b39070';
  p.ellipse(50, 54, 33, 30, b);
  p.path('M50 36 Q30 34 26 52 Q26 74 50 76 Q74 74 74 52 Q70 34 50 36 Z', '#f1dcc0', { sw: 2.4 });
  p.ellipse(38, 52, 10, 6.5, '#6b4f3a', { flat: true, noStroke: true, t: 'rotate(-15 38 52)' });
  p.ellipse(62, 52, 10, 6.5, '#6b4f3a', { flat: true, noStroke: true, t: 'rotate(15 62 52)' });
  p.happyEyes([39, 61], 52, 4);
  p.ellipse(50, 61, 5, 3.6, INK, { flat: true, noStroke: true });
  p.smile(50, 66, 7, 5).cheeks([30, 70], 64, 4, 2.6);
};

export const raccoon = (p) => {
  const g = '#a2a6b8';
  p.path('M22 42 L24 14 L44 30 Z', g).path('M78 42 L76 14 L56 30 Z', g);
  p.ellipse(50, 56, 34, 29, g);
  p.path('M18 52 Q34 40 50 50 Q66 40 82 52 Q74 64 62 60 Q50 56 38 60 Q26 64 18 52 Z', INK, { flat: true, sw: 2 });
  p.circle(38, 53, 3.6, '#fff', { flat: true, noStroke: true }).circle(62, 53, 3.6, '#fff', { flat: true, noStroke: true });
  p.circle(38.6, 53.4, 2.1, INK, { flat: true, noStroke: true }).circle(62.6, 53.4, 2.1, INK, { flat: true, noStroke: true });
  p.path('M36 66 Q50 60 64 66 Q62 80 50 82 Q38 80 36 66 Z', C.white, { sw: 2.2 });
  p.ellipse(50, 67, 4.4, 3.2, INK, { flat: true, noStroke: true }).smile(50, 72, 4.5, 3);
};

export const cow = (p) => {
  p.path('M28 30 Q16 24 14 14 Q24 18 34 26 Z', C.cream, { sw: 2.4 }).path('M72 30 Q84 24 86 14 Q76 18 66 26 Z', C.cream, { sw: 2.4 });
  p.ellipse(18, 42, 11, 6, C.white, { t: 'rotate(20 18 42)' }).ellipse(82, 42, 11, 6, C.white, { t: 'rotate(-20 82 42)' });
  p.ellipse(50, 50, 28, 30, C.white);
  p.flat('M30 32 Q44 30 42 46 Q34 52 26 44 Q24 36 30 32 Z M64 52 Q76 48 76 60 Q70 66 62 60 Z', INK, 0.88);
  p.ellipse(50, 70, 20, 13, C.rose, { sw: 2.6 });
  p.ellipse(43, 70, 2.4, 3.2, '#c0606a', { flat: true, noStroke: true }).ellipse(57, 70, 2.4, 3.2, '#c0606a', { flat: true, noStroke: true });
  p.eyes([40, 60], 50).cheeks([30, 70], 58, 4, 2.6);
};

export const pig = (p) => {
  const k = '#ffb3c1';
  p.path('M26 36 L22 14 L44 28 Z', k).path('M74 36 L78 14 L56 28 Z', k);
  p.ellipse(50, 56, 33, 30, k);
  p.ellipse(50, 64, 13, 9.5, '#ff94a8', { sw: 2.6 });
  p.ellipse(45.5, 64, 2.4, 3.4, '#b04a62', { flat: true, noStroke: true }).ellipse(54.5, 64, 2.4, 3.4, '#b04a62', { flat: true, noStroke: true });
  p.eyes([38, 62], 50).cheeks([27, 73], 62, 4.5, 3);
  p.smile(50, 76, 6, 3.5);
  p.shine(36, 36, 9, 4);
};

export const sheep = (p) => {
  bumps(p, 50, 50, 30, 12, 12, C.white, { flat: true, sw: 2.8 });
  p.ellipse(22, 52, 9, 5, '#5b5168', { t: 'rotate(-20 22 52)' }).ellipse(78, 52, 9, 5, '#5b5168', { t: 'rotate(20 78 52)' });
  p.ellipse(50, 58, 20, 22, '#5b5168');
  bumps(p, 50, 36, 9, 6, 6.5, C.white, { flat: true, sw: 2.4 });
  p.circle(42, 56, 4, '#fff', { flat: true, noStroke: true }).circle(58, 56, 4, '#fff', { flat: true, noStroke: true });
  p.circle(42.6, 56.6, 2.4, INK, { flat: true, noStroke: true }).circle(58.6, 56.6, 2.4, INK, { flat: true, noStroke: true });
  p.smile(50, 69, 5, 3.5).cheeks([37, 63], 65, 3.5, 2.4);
};

export const horse = (p) => {
  const b = '#b06e3e';
  p.path('M36 26 L32 8 L46 20 Z', b).path('M64 26 L68 8 L54 20 Z', b);
  p.path('M30 34 Q30 18 50 18 Q70 18 70 34 L66 70 Q50 92 34 70 Z', b);
  p.path('M42 18 Q50 6 58 18 Q54 30 50 40 Q46 30 42 18 Z', '#5a3a2a', { sw: 2.4 });
  p.ellipse(50, 74, 15, 11, '#e8b88e', { sw: 2.4 });
  p.ellipse(45, 74, 2, 3, INK, { flat: true, noStroke: true }).ellipse(55, 74, 2, 3, INK, { flat: true, noStroke: true });
  p.eyes([40, 60], 46, 4.4).cheeks([33, 67], 58, 3.6, 2.4);
  p.shine(38, 32, 6, 3);
};
