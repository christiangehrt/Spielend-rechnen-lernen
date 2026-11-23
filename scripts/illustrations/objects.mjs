import { bumps, C, INK, light, starPath } from './lib.mjs';

// ---------- jungle ----------
export const parrot = (p) => {
  p.path('M44 70 L38 96 L46 92 L50 96 L52 72 Z', C.blue, { sw: 2.6 });
  p.path('M50 72 L58 96 L62 90 L66 94 L58 68 Z', C.yellow, { sw: 2.6 });
  p.path('M34 44 Q30 22 50 18 Q70 18 70 40 Q72 62 58 74 Q44 82 36 70 Q30 60 34 44 Z', C.red);
  p.path('M44 50 Q60 46 66 58 Q60 74 46 70 Q40 60 44 50 Z', C.green, { sw: 2.6 });
  p.path('M64 30 Q80 30 80 42 Q78 50 70 48 Q72 40 64 38 Z', C.gold, { sw: 2.6 });
  p.circle(56, 32, 7, C.white, { sw: 2.2 });
  p.eyes([57], 32, 3.6);
  p.line('M30 98 L74 98', { sw: 4, color: '#8a5a3a' });
  p.shine(44, 28, 6, 3);
};

export const snake = (p) => {
  const g = '#6cc24a';
  p.path('M18 78 Q14 60 34 58 Q62 56 66 70 Q68 86 46 88 Q24 90 18 78 Z', g);
  p.path('M30 68 Q34 60 50 62 Q60 64 58 72 Q54 78 44 76 Q34 76 30 68 Z', light(g, 0.25), { sw: 2.2 });
  p.path('M56 66 Q66 46 60 30 Q58 18 70 16 Q86 16 86 30 Q86 42 72 42 Q68 52 70 62 Z', g);
  p.flat('M24 80 q4 -4 8 0 M38 84 q4 -4 8 0 M52 82 q4 -4 8 0', 'none');
  p.line('M24 80 q4 -4 8 0 M38 85 q4 -4 8 0 M52 83 q4 -4 8 0', { sw: 2.2, color: '#2f7d3b' });
  p.eyes([70, 80], 27, 3.6).cheeks([66, 84], 34, 3, 2);
  p.line('M86 34 L94 36 M94 36 L98 33 M94 36 L98 39', { sw: 2, color: C.red });
  p.shine(70, 20, 5, 2.5);
};

export const crocodile = (p) => {
  const g = '#4fae5a';
  p.path('M10 62 Q8 44 30 42 L86 46 Q96 50 90 60 Q86 68 70 68 L30 70 Q12 72 10 62 Z', g);
  p.line('M30 58 L88 56', { sw: 2.4 });
  for (let x = 36; x <= 80; x += 9) p.path(`M${x} 57 L${x + 3} 52 L${x + 6} 57 Z`, C.white, { sw: 1.6, flat: true });
  p.circle(30, 36, 10, g).circle(48, 38, 9, g);
  p.circle(30, 35, 5.5, C.white, { sw: 2 }).circle(48, 37, 5, C.white, { sw: 2 });
  p.eyes([31, 49], 36, 3.2);
  p.circle(84, 48, 1.8, INK, { flat: true, noStroke: true });
  p.flat('M40 64 q4 3 8 0 M56 64 q4 3 8 0', 'none');
  p.cheeks([24], 56, 4, 2.6);
};

export const palm = (p) => {
  p.path('M46 46 Q40 70 44 96 L56 96 Q52 70 54 46 Z', '#c98a52');
  p.line('M45 60 L55 58 M44 72 L55 70 M45 84 L56 82', { sw: 2, color: '#8a5a3a' });
  const leaves = ['M50 44 Q30 20 8 30 Q30 30 50 44 Z', 'M50 44 Q70 20 92 30 Q70 30 50 44 Z', 'M50 44 Q24 40 14 60 Q32 46 50 44 Z', 'M50 44 Q76 40 86 60 Q68 46 50 44 Z', 'M50 44 Q46 18 58 6 Q54 26 50 44 Z'];
  for (const d of leaves) p.path(d, C.leaf, { sw: 2.6 });
  p.circle(44, 48, 5, '#8a5a3a', { sw: 2 }).circle(55, 49, 5, '#8a5a3a', { sw: 2 });
};

export const butterfly = (p) => {
  p.path('M48 46 Q30 10 12 22 Q4 36 22 48 Q36 54 48 50 Z', C.pink).path('M52 46 Q70 10 88 22 Q96 36 78 48 Q64 54 52 50 Z', C.pink);
  p.path('M48 52 Q26 54 20 70 Q24 84 38 76 Q48 68 49 56 Z', C.purple).path('M52 52 Q74 54 80 70 Q76 84 62 76 Q52 68 51 56 Z', C.purple);
  for (const [x, y, r] of [[24, 32, 5], [76, 32, 5], [32, 70, 3.5], [68, 70, 3.5]]) p.circle(x, y, r, C.yellow, { sw: 1.8 });
  p.ellipse(50, 56, 4.5, 20, INK, { flat: true, noStroke: true });
  p.circle(50, 36, 6, INK, { flat: true, noStroke: true });
  p.line('M48 31 Q44 20 38 18 M52 31 Q56 20 62 18', { sw: 2 });
  p.circle(48.2, 35, 1.4, '#fff', { flat: true, noStroke: true }).circle(52.6, 35, 1.4, '#fff', { flat: true, noStroke: true });
};

// ---------- space ----------
export const rocket = (p) => {
  p.path('M40 74 Q50 98 60 74 Z', C.orange, { sw: 2.4 }).path('M44 74 Q50 90 56 74 Z', C.yellow, { noStroke: true });
  p.path('M36 56 L22 74 L36 70 Z', C.red).path('M64 56 L78 74 L64 70 Z', C.red);
  p.path('M50 6 Q72 24 66 60 L64 74 L36 74 L34 60 Q28 24 50 6 Z', C.white);
  p.path('M50 6 Q60 14 64 24 L36 24 Q40 14 50 6 Z', C.red);
  p.circle(50, 42, 9, C.sky, { sw: 3 });
  p.shine(46, 38, 4, 2.5);
  p.path('M44 66 L56 66 L56 74 L44 74 Z', C.red, { sw: 2.4 });
};

export const ufo = (p) => {
  p.path('M30 50 Q30 26 50 26 Q70 26 70 50 Z', C.sky, { op: 0.95 });
  p.circle(50, 42, 9, '#7ee08a', { sw: 2.4 });
  p.eyes([46.5, 53.5], 41, 2.4);
  p.line('M50 33 L50 26 M50 26 l0 -1', { sw: 2.2 });
  p.ellipse(50, 58, 40, 13, C.silver);
  p.ellipse(50, 54, 26, 6, light(C.grey, 0.2), { sw: 2.2 });
  for (const x of [22, 36, 50, 64, 78]) p.circle(x, 60, 3.4, C.yellow, { sw: 1.8 });
  p.flat('M36 72 L64 72 L72 96 L28 96 Z', C.yellow, 0.25);
  p.shine(40, 32, 6, 3);
};

export const earth = (p) => {
  p.circle(50, 50, 40, C.blue);
  p.path('M26 30 Q36 20 46 26 Q52 34 44 40 Q40 50 30 48 Q22 42 26 30 Z', C.green, { sw: 2.4 });
  p.path('M58 46 Q70 40 78 48 Q82 62 72 70 Q62 76 58 66 Q54 56 58 46 Z', C.green, { sw: 2.4 });
  p.path('M34 64 Q42 62 44 72 Q40 80 34 76 Z', C.green, { sw: 2.2 });
  p.eyes([41, 59], 52, 3.6).cheeks([34, 66], 60, 3.6, 2.4).smile(50, 59, 5, 3.5);
  p.shine(34, 26, 10, 5);
};

export const saturn = (p) => {
  p.raw('<g transform="rotate(-18 50 50)">');
  p.path('M10 52 Q10 40 50 40 Q90 40 90 52 Q90 62 50 62 Q10 62 10 52 Z', C.lilac, { sw: 2.6 });
  p.raw('</g>');
  p.circle(50, 48, 24, C.gold);
  p.flat('M28 42 Q50 36 72 42 L72 46 Q50 40 28 46 Z', C.orange, 0.5);
  p.raw('<g transform="rotate(-18 50 50)">');
  p.path('M10 52 Q12 60 50 62 Q88 60 90 52 Q88 66 50 68 Q12 66 10 52 Z', C.lilac, { sw: 2.6 });
  p.raw('</g>');
  p.eyes([43, 57], 48, 3.2).cheeks([37, 63], 54, 3, 2).smile(50, 54, 3.5, 2.5);
  p.shine(40, 34, 6, 3);
};

export const moon = (p) => {
  p.path('M64 10 Q30 14 28 50 Q30 86 66 90 Q42 76 42 50 Q42 24 64 10 Z', C.yellow);
  p.circle(36, 34, 2.6, light(C.gold, 0.1), { flat: true, noStroke: true }).circle(34, 66, 3.4, light(C.gold, 0.1), { flat: true, noStroke: true });
  p.happyEyes([40], 48, 3.6);
  p.smile(40, 58, 3.5, 2.5).cheeks([35], 54, 2.6, 1.8);
  p.sparkle(78, 30, 6).sparkle(70, 70, 4);
};

export const starFace = (p) => {
  p.path(starPath(50, 54, 44, 21), C.yellow);
  p.eyes([42, 58], 52, 4).cheeks([35, 65], 60, 3.6, 2.4).smile(50, 61, 5, 4);
  p.shine(40, 36, 6, 3);
};

export const alien = (p) => {
  const g = '#7ee08a';
  p.line('M38 24 L32 8 M62 24 L68 8', { sw: 3 });
  p.circle(32, 8, 4.5, C.pink, { sw: 2.2 }).circle(68, 8, 4.5, C.pink, { sw: 2.2 });
  p.path('M50 18 Q84 18 82 50 Q80 82 50 90 Q20 82 18 50 Q16 18 50 18 Z', g);
  p.ellipse(37, 48, 9, 12, INK, { flat: true, noStroke: true, t: 'rotate(-20 37 48)' });
  p.ellipse(63, 48, 9, 12, INK, { flat: true, noStroke: true, t: 'rotate(20 63 48)' });
  p.circle(40, 44, 3, '#fff', { flat: true, noStroke: true }).circle(66, 44, 3, '#fff', { flat: true, noStroke: true });
  p.smile(50, 70, 7, 5).cheeks([30, 70], 64, 4, 2.6);
  p.shine(36, 28, 7, 3.5);
};

export const astronaut = (p) => {
  p.rect(26, 70, 48, 26, 12, C.white);
  p.rect(42, 76, 16, 10, 3, C.blue, { sw: 2.2 });
  p.circle(50, 44, 32, C.white);
  p.path('M28 44 Q28 26 50 26 Q72 26 72 44 Q72 62 50 62 Q28 62 28 44 Z', '#3b4d7a');
  p.ellipse(50, 47, 14, 13, C.tan, { noStroke: true });
  p.eyes([44, 56], 46, 3.2).cheeks([40, 60], 52, 2.6, 1.8).smile(50, 52, 3.5, 2.5);
  p.shine(38, 34, 8, 4, -30, 0.6);
  p.circle(84, 20, 3, C.yellow, { flat: true, noStroke: true });
};

export const comet = (p) => {
  p.path('M52 40 Q30 50 6 90 Q36 68 60 58 Z', C.sky, { sw: 2.4, op: 0.9 });
  p.path('M56 36 Q40 52 18 74 Q42 60 62 52 Z', C.lilac, { noStroke: true, op: 0.8 });
  p.path(starPath(66, 34, 26, 12), C.yellow);
  p.eyes([60, 72], 33, 3).smile(66, 39, 3, 2);
};

export const satellite = (p) => {
  p.rect(6, 36, 28, 22, 3, C.blue, { t: 'rotate(-20 20 47)' });
  p.rect(66, 42, 28, 22, 3, C.blue, { t: 'rotate(-20 80 53)' });
  p.line('M10 44 L30 37 M12 52 L32 45 M70 50 L90 43 M72 58 L92 51', { sw: 1.6, color: '#fff', op: 0.8 });
  p.line('M34 48 L66 52', { sw: 3 });
  p.rect(38, 36, 24, 28, 5, C.silver, { t: 'rotate(-20 50 50)' });
  p.line('M50 36 L56 18', { sw: 2.6 });
  p.circle(57, 15, 4.5, C.red, { sw: 2 });
  p.eyes([46, 55], 49, 2.8);
};

// ---------- ocean ----------
export const fish = (p) => {
  p.path('M70 50 L94 30 L90 50 L94 70 Z', C.orange);
  p.path('M10 50 Q26 22 56 26 Q76 30 78 50 Q76 70 56 74 Q26 78 10 50 Z', C.orange);
  p.path('M32 30 Q38 50 32 70 L42 72 Q48 50 42 28 Z', C.white, { sw: 2.2 });
  p.path('M56 27 Q62 50 56 73 L64 70 Q68 50 64 30 Z', C.white, { sw: 2.2 });
  p.path('M44 26 Q50 12 60 14 Q58 22 54 27 Z', C.orange, { sw: 2.2 });
  p.eyes([22], 46, 4.2).cheeks([24], 56, 3.4, 2.2);
  p.smile(16, 56, 3, 2);
  p.shine(46, 36, 6, 3);
};

export const dolphin = (p) => {
  const b = '#5fa8e8';
  p.path('M14 70 Q10 40 40 28 Q66 18 82 34 Q94 46 86 50 Q76 46 66 50 Q50 58 38 76 Q30 90 14 70 Z', b);
  p.path('M44 26 Q50 10 62 16 Q56 22 54 28 Z', b, { sw: 2.4 });
  p.path('M18 72 Q4 76 2 88 Q14 84 22 80 Z', b, { sw: 2.4 }).path('M22 78 Q22 92 30 98 Q30 86 28 78 Z', b, { sw: 2.4 });
  p.path('M30 62 Q48 52 66 50 Q50 62 38 74 Z', '#e8f4ff', { noStroke: true });
  p.eyes([66], 38, 3.8).cheeks([70], 46, 3, 2);
  p.shine(44, 34, 8, 3.5);
};

export const whale = (p) => {
  const b = '#4f8cf0';
  p.line('M34 22 Q30 10 24 8 M34 22 Q36 10 42 6 M34 22 L34 10', { sw: 2.6, color: C.sky });
  p.path('M80 54 Q92 40 96 46 Q92 58 86 62 Q94 70 92 76 Q84 72 78 64 Z', b);
  p.path('M8 58 Q8 28 40 26 Q76 26 82 58 Q80 80 48 82 Q10 84 8 58 Z', b);
  p.path('M12 66 Q40 80 76 66 Q70 80 46 81 Q20 82 12 66 Z', '#dceaff', { sw: 2.2 });
  p.line('M22 70 L22 76 M32 72 L32 79 M42 73 L42 80 M52 72 L52 79 M62 70 L62 77', { sw: 1.6, op: 0.4 });
  p.eyes([28], 52, 4).cheeks([34], 60, 3.6, 2.4).smile(20, 60, 4, 3);
  p.shine(36, 36, 10, 4);
};

export const crab = (p) => {
  const r = '#ff6b5b';
  p.line('M24 66 L10 76 M26 72 L14 86 M76 66 L90 76 M74 72 L86 86', { sw: 4, color: r });
  p.line('M24 66 L10 76 M26 72 L14 86 M76 66 L90 76 M74 72 L86 86', { sw: 1.4, color: INK, op: 0.3 });
  p.path('M26 50 Q12 36 14 22 Q22 14 30 22 L24 26 Q28 34 34 40 Z', r).path('M74 50 Q88 36 86 22 Q78 14 70 22 L76 26 Q72 34 66 40 Z', r);
  p.ellipse(50, 62, 30, 20, r);
  p.line('M42 44 L40 32 M58 44 L60 32', { sw: 2.6 });
  p.circle(40, 30, 5.5, C.white, { sw: 2 }).circle(60, 30, 5.5, C.white, { sw: 2 });
  p.eyes([40.5, 60.5], 30.5, 3).cheeks([36, 64], 66, 3.6, 2.4).smile(50, 66, 5, 3.5);
  p.shine(40, 54, 8, 3);
};

export const turtle = (p) => {
  const g = '#6cc24a';
  p.ellipse(18, 70, 9, 6, g).ellipse(82, 70, 9, 6, g).ellipse(26, 44, 8, 5, g, { t: 'rotate(-30 26 44)' }).ellipse(74, 44, 8, 5, g, { t: 'rotate(30 74 44)' });
  p.circle(50, 24, 13, g);
  p.eyes([45, 55], 23, 3.2).cheeks([41, 59], 29, 2.6, 1.8).smile(50, 28, 3.5, 2.5);
  p.path('M18 64 Q18 34 50 34 Q82 34 82 64 Q66 74 50 74 Q34 74 18 64 Z', '#c98a52');
  p.path('M50 40 L62 48 L58 62 L42 62 L38 48 Z', '#e0a868', { sw: 2.2 });
  p.line('M50 40 L50 34 M62 48 L74 44 M58 62 L66 70 M42 62 L34 70 M38 48 L26 44', { sw: 2.2 });
  p.shine(36, 44, 7, 3);
};

export const squid = (p) => {
  const k = '#ff8fb8';
  for (const x of [34, 42, 50, 58, 66]) p.path(`M${x - 3} 64 Q${x - 6} 82 ${x} 96 Q${x + 6} 82 ${x + 3} 64 Z`, k, { sw: 2.4 });
  p.path('M50 4 Q74 26 70 64 L30 64 Q26 26 50 4 Z', k);
  p.path('M50 4 L70 30 L58 28 L50 14 L42 28 L30 30 Z', light(k, 0.2), { sw: 2.4 });
  p.eyes([42, 58], 46, 4).cheeks([36, 64], 54, 3.4, 2.2).smile(50, 54, 4, 3);
  p.shine(40, 30, 5, 3);
};

export const blowfish = (p) => {
  const y = C.yellow;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = 48 + Math.cos(a) * 36;
    const yy = 52 + Math.sin(a) * 34;
    const x2 = 48 + Math.cos(a) * 44;
    const y2 = 52 + Math.sin(a) * 42;
    p.path(`M${(x - Math.sin(a) * 5).toFixed(1)} ${(yy + Math.cos(a) * 5).toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${(x + Math.sin(a) * 5).toFixed(1)} ${(yy - Math.cos(a) * 5).toFixed(1)} Z`, '#f2a93b', { sw: 2 });
  }
  p.path('M84 52 L96 42 L96 62 Z', y, { sw: 2.4 });
  p.circle(48, 52, 36, y);
  p.path('M20 62 Q48 92 76 62 Q70 82 48 86 Q26 82 20 62 Z', C.cream, { noStroke: true });
  p.eyes([38, 58], 46, 4.6).cheeks([30, 66], 56, 4, 2.6);
  p.ellipse(48, 62, 5, 4, '#e86a5a', { sw: 2 });
  p.shine(34, 32, 9, 4);
};

export const jellyfish = (p) => {
  for (const x of [30, 42, 58, 70]) p.line(`M${x} 56 Q${x - 6} 70 ${x} 80 Q${x + 6} 90 ${x} 98`, { sw: 3, color: C.lilac });
  p.line('M50 56 Q44 70 50 86', { sw: 3, color: C.pink });
  p.path('M14 58 Q14 16 50 14 Q86 16 86 58 Q78 52 70 58 Q60 52 50 58 Q40 52 30 58 Q22 52 14 58 Z', '#ffa8d8', { op: 0.95 });
  p.eyes([40, 60], 38, 4).cheeks([32, 68], 46, 3.6, 2.4).smile(50, 45, 4, 3);
  p.shine(32, 26, 8, 3.5, -30, 0.6);
};

export const shell = (p) => {
  const s = '#ffb59a';
  p.path('M50 88 Q16 80 10 46 Q14 16 50 12 Q86 16 90 46 Q84 80 50 88 Z', s);
  for (const d of ['M50 86 L22 30', 'M50 86 L36 18', 'M50 86 L50 14', 'M50 86 L64 18', 'M50 86 L78 30']) p.line(d, { sw: 2.4, color: '#d67a5a' });
  p.path('M38 86 Q50 98 62 86 L56 80 L44 80 Z', s, { sw: 2.6 });
  p.shine(34, 32, 8, 4);
};

// ---------- farm ----------
export const rooster = (p) => {
  p.path('M62 54 Q86 30 92 46 Q94 62 80 70 Q86 52 66 62 Z', C.leaf);
  p.path('M70 60 Q90 50 88 70 Q80 78 66 70 Z', C.red, { sw: 2.4 });
  p.ellipse(50, 66, 26, 22, C.white);
  p.circle(40, 38, 15, C.white);
  p.path('M30 26 Q30 14 38 20 Q40 10 46 18 Q52 12 52 24 Z', C.red, { sw: 2.4 });
  p.path('M24 40 L14 44 L24 48 Z', C.yellow, { sw: 2.2 });
  p.path('M24 48 Q22 58 30 56 Q32 50 28 47 Z', C.red, { sw: 2 });
  p.eyes([36], 36, 3.6).cheeks([42], 44, 3, 2);
  p.line('M44 86 L42 96 M56 86 L58 96', { sw: 3, color: C.orange });
  p.path('M44 62 Q56 56 62 70 Q54 80 44 74 Z', light(C.grey, 0.5), { sw: 2 });
};

export const tractor = (p) => {
  p.rect(14, 46, 54, 24, 6, C.red);
  p.path('M44 46 L44 20 L72 20 L76 46 Z', C.red);
  p.path('M50 26 L68 26 L70 42 L50 42 Z', C.sky, { sw: 2.4 });
  p.rect(16, 34, 8, 14, 2, INK, { flat: true, sw: 2 });
  p.circle(68, 72, 20, INK, { flat: true });
  p.circle(68, 72, 9, C.yellow, { sw: 2.6 });
  p.circle(26, 78, 13, INK, { flat: true });
  p.circle(26, 78, 6, C.yellow, { sw: 2.4 });
  p.shine(28, 52, 8, 3);
};

export const chick = (p) => {
  p.ellipse(50, 60, 34, 30, C.yellow);
  p.path('M44 30 Q46 22 50 26 Q52 18 56 26', C.yellow, { flat: true });
  p.path('M18 60 Q8 52 14 46 Q22 50 26 58 Z', C.gold, { sw: 2.4 }).path('M82 60 Q92 52 86 46 Q78 50 74 58 Z', C.gold, { sw: 2.4 });
  p.eyes([40, 60], 54).cheeks([31, 69], 64);
  p.path('M44 62 L56 62 L50 70 Z', C.orange, { sw: 2.4 });
  p.line('M42 90 L40 96 M58 90 L60 96', { sw: 3, color: C.orange });
  p.line('M46 30 Q48 22 52 28 M52 28 Q54 20 58 26', { sw: 2.6 });
  p.shine(38, 42, 9, 4);
};

export const sunflower = (p) => {
  p.path('M48 60 Q46 80 50 98 L54 98 Q52 80 54 60 Z', C.leaf, { sw: 2.4 });
  p.path('M51 82 Q66 70 76 76 Q66 88 52 86 Z', C.leaf, { sw: 2.4 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360;
    p.ellipse(50, 18, 7, 14, C.yellow, { t: `rotate(${a} 50 40)`, sw: 2.4 });
  }
  p.circle(50, 40, 15, '#9a5a2a');
  p.eyes([45, 55], 38, 2.8).smile(50, 44, 4, 3).cheeks([41, 59], 43, 2.6, 1.8);
};

export const duck = (p) => {
  p.path('M18 66 Q16 88 50 88 Q80 88 84 66 Q90 54 96 50 Q88 62 74 60 Q56 50 18 66 Z', C.white);
  p.path('M44 70 Q60 62 70 72 Q60 82 46 78 Z', light(C.grey, 0.55), { sw: 2.2 });
  p.circle(32, 44, 16, C.white);
  p.path('M18 46 Q4 46 6 53 Q14 56 22 51 Z', C.orange, { sw: 2.4 });
  p.eyes([30, 40], 41, 3.4).cheeks([26, 44], 50, 3, 2);
  p.shine(28, 34, 5, 2.5);
};
