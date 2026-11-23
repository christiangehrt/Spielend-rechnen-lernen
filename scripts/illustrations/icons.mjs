import { C, INK, light, starPath } from './lib.mjs';
import { owl } from './animals.mjs';

// ---------- UI ----------
export const star = (p) => {
  p.path(starPath(50, 53, 45, 21), C.yellow, { sw: 3.4 });
  p.shine(38, 36, 8, 4);
};

/** Treasure chest (key "ui.gift" – opens every 5 stars). */
export const chest = (p) => {
  p.path('M14 44 Q14 18 50 18 Q86 18 86 44 Z', C.wood);
  p.rect(10, 44, 80, 42, 6, C.wood);
  p.line('M10 58 L90 58', { sw: 2.4, op: 0.5 });
  p.path('M30 18 L30 86 L40 86 L40 19 Z', C.gold, { sw: 2.4 }).path('M60 19 L60 86 L70 86 L70 18 Z', C.gold, { sw: 2.4 });
  p.rect(10, 42, 80, 7, 3, C.gold, { sw: 2.4 });
  p.rect(42, 40, 16, 20, 4, C.gold, { sw: 2.6 });
  p.circle(50, 48, 3, INK, { flat: true, noStroke: true }).path('M48.5 49 L51.5 49 L52 55 L48 55 Z', INK, { flat: true, noStroke: true });
  p.sparkle(86, 14, 7).sparkle(14, 16, 5);
  p.shine(30, 28, 8, 3);
};

export const trophy = (p) => {
  p.path('M26 22 Q8 22 10 38 Q12 52 30 54', 'none', { sw: 6, stroke: C.gold }).line('M26 22 Q8 22 10 38 Q12 52 30 54', { sw: 2 });
  p.path('M74 22 Q92 22 90 38 Q88 52 70 54', 'none', { sw: 6, stroke: C.gold }).line('M74 22 Q92 22 90 38 Q88 52 70 54', { sw: 2 });
  p.path('M24 14 L76 14 Q76 56 50 62 Q24 56 24 14 Z', C.gold);
  p.rect(44, 60, 12, 14, 2, C.gold, { sw: 2.6 });
  p.rect(30, 74, 40, 14, 4, '#b0764a');
  p.rect(38, 78, 24, 6, 2, C.gold, { sw: 1.8, flat: true });
  p.path(starPath(50, 34, 12, 5.5), C.white, { sw: 2.2, flat: true });
  p.shine(34, 26, 5, 9, -10);
};

export const party = (p) => {
  p.path('M14 90 L34 34 L70 70 Z', C.purple);
  p.line('M24 62 L44 80 M29 48 L56 74', { sw: 2.4, color: C.yellow });
  for (const [x, y, c, r] of [[62, 18, C.red, 4], [82, 30, C.blue, 3.5], [74, 48, C.green, 3.5], [46, 14, C.yellow, 3.5], [88, 54, C.pink, 3]]) p.circle(x, y, r, c, { sw: 1.8 });
  p.line('M50 28 Q56 20 52 10 M66 36 Q78 32 84 40 M60 50 Q72 56 80 70', { sw: 3, color: C.orange });
  p.sparkle(30, 18, 6);
};

export const thinking = (p) => {
  p.circle(18, 84, 5, C.white, { sw: 2.4 }).circle(28, 72, 7, C.white, { sw: 2.4 });
  p.path('M30 50 Q26 26 48 22 Q58 10 72 18 Q90 18 88 38 Q94 54 78 60 Q66 70 52 62 Q34 66 30 50 Z', C.white);
  p.raw(`<text x="59" y="54" text-anchor="middle" font-family="Fredoka, Nunito, Arial, sans-serif" font-weight="700" font-size="34" fill="${C.purple}">?</text>`);
};

export const sleepy = (p) => {
  p.path('M60 14 Q26 18 26 52 Q28 86 64 88 Q40 74 40 52 Q40 30 60 14 Z', C.yellow);
  p.happyEyes([36], 48, 3.6);
  for (const [x, y, s] of [[64, 40, 14], [78, 26, 10], [88, 14, 7]]) p.raw(`<text x="${x}" y="${y}" font-family="Fredoka, Arial, sans-serif" font-weight="700" font-size="${s * 1.6}" fill="${C.blue}" stroke="${INK}" stroke-width="1.2">z</text>`);
};

export const basket = (p) => {
  p.path('M24 46 Q24 12 50 12 Q76 12 76 46', 'none', { sw: 7, stroke: '#a86a3a' }).line('M24 46 Q24 12 50 12 Q76 12 76 46', { sw: 2 });
  p.path('M10 44 L90 44 L80 88 Q50 94 20 88 Z', '#d99a5a');
  for (const y of [56, 68, 80]) p.line(`M${16 + (y - 44) * 0.2} ${y} L${84 - (y - 44) * 0.2} ${y}`, { sw: 2, color: '#a86a3a' });
  for (const x of [30, 42, 54, 66]) p.line(`M${x} 46 L${x + (x < 50 ? -2 : 2)} 88`, { sw: 2, color: '#a86a3a' });
  p.rect(8, 40, 84, 9, 4, '#c98a52');
  p.path('M36 40 Q40 28 50 32 Q58 26 64 40 Z', C.pink, { sw: 2.2 });
};

export const magpie = (p) => {
  p.path('M60 56 L94 76 L88 84 L58 66 Z', '#3b4d7a');
  p.path('M18 48 Q20 24 42 24 Q60 26 64 48 Q66 70 44 76 Q24 76 18 48 Z', INK, { flat: true });
  p.path('M30 56 Q42 50 54 58 Q50 72 38 72 Q30 68 30 56 Z', C.white, { sw: 2 });
  p.path('M44 40 Q62 40 66 56 Q56 50 44 52 Z', '#4a6ab0', { sw: 2 });
  p.path('M18 36 L4 40 L18 44 Z', '#3b2f3f', { flat: true, sw: 2 });
  p.circle(28, 36, 4, '#fff', { flat: true, noStroke: true }).circle(29, 36.5, 2.2, INK, { flat: true, noStroke: true });
  p.line('M38 76 L36 88 M48 76 L50 88', { sw: 3, color: INK });
  p.sparkle(84, 22, 7, C.silver);
};

export const heart = (p) => {
  p.path('M50 86 Q10 60 12 34 Q14 14 32 14 Q44 14 50 28 Q56 14 68 14 Q86 14 88 34 Q90 60 50 86 Z', C.red);
  p.shine(30, 30, 8, 4);
};

export const check = (p) => {
  p.circle(50, 50, 40, C.green);
  p.line('M30 52 L44 66 L72 36', { sw: 9, color: '#fff' });
  p.shine(36, 30, 9, 4);
};

export const cross = (p) => {
  p.circle(50, 50, 40, C.red);
  p.line('M34 34 L66 66 M66 34 L34 66', { sw: 9, color: '#fff' });
  p.shine(36, 30, 9, 4);
};

export const question = (p) => {
  p.path('M14 44 Q14 14 50 14 Q86 14 86 44 Q86 72 54 74 L40 90 L40 72 Q14 68 14 44 Z', C.purple);
  p.raw(`<text x="50" y="60" text-anchor="middle" font-family="Fredoka, Nunito, Arial, sans-serif" font-weight="700" font-size="44" fill="#fff">?</text>`);
  p.shine(30, 28, 8, 3.5);
};

export const target = (p) => {
  p.circle(46, 54, 38, C.white).circle(46, 54, 27, C.red, { sw: 2.4 }).circle(46, 54, 16, C.white, { sw: 2.4 }).circle(46, 54, 7, C.red, { sw: 2.4 });
  p.line('M46 54 L86 14', { sw: 4 });
  p.path('M80 10 L92 6 L88 18 Z', C.yellow, { sw: 2 });
};

export const footprints = (p) => {
  for (const [x, y, r] of [[34, 62, -12], [64, 36, 12]]) {
    p.raw(`<g transform="rotate(${r} ${x} ${y})">`);
    p.ellipse(x, y + 6, 11, 15, C.green);
    for (const [dx, dy] of [[-10, -12], [-3, -16], [5, -16], [11, -11]]) p.circle(x + dx, y + dy, 4, C.green, { sw: 2.2 });
    p.raw('</g>');
  }
};

export const album = (p) => {
  p.rect(18, 12, 66, 78, 8, C.blue);
  p.rect(18, 12, 12, 78, 6, '#3d6fd0');
  p.rect(36, 24, 38, 30, 6, C.white, { sw: 2.4 });
  p.path(starPath(55, 40, 12, 5.5), C.yellow, { sw: 2 });
  p.line('M40 66 L72 66 M40 76 L64 76', { sw: 3, color: '#fff', op: 0.8 });
  p.shine(46, 18, 8, 2.5, 0);
};

export const dice = (p) => {
  p.path('M18 30 L50 14 L84 30 L50 46 Z', '#fff');
  p.path('M18 30 L50 46 L50 88 L18 70 Z', '#ffe1e6');
  p.path('M84 30 L50 46 L50 88 L84 70 Z', '#ffc2cc');
  for (const [x, y] of [[50, 30]]) p.ellipse(x, y, 5, 3, C.red, { flat: true, noStroke: true });
  for (const [x, y] of [[28, 46], [40, 66]]) p.ellipse(x, y, 3.2, 4.2, INK, { flat: true, noStroke: true });
  for (const [x, y] of [[60, 52], [67, 63], [74, 74], [60, 74], [74, 52]]) p.ellipse(x, y, 3, 4, INK, { flat: true, noStroke: true });
};

export const box = (p) => {
  p.path('M12 40 L50 54 L88 40 L50 26 Z', '#e8b27a');
  p.path('M12 40 L50 54 L50 92 L12 76 Z', '#d99a5a');
  p.path('M88 40 L50 54 L50 92 L88 76 Z', '#c98a52');
  p.path('M12 40 L4 26 L42 14 L50 26 Z', '#f0c995', { sw: 2.6 });
  p.path('M88 40 L96 26 L58 14 L50 26 Z', '#f0c995', { sw: 2.6 });
};

export const medal = (p) => {
  p.path('M30 8 L44 44 L56 44 L42 8 Z', C.blue).path('M70 8 L56 44 L44 44 L58 8 Z', C.red);
  p.circle(50, 64, 26, C.gold);
  p.circle(50, 64, 17, light(C.gold, 0.25), { sw: 2.2 });
  p.path(starPath(50, 65, 11, 5), C.white, { sw: 1.8, flat: true });
  p.shine(40, 54, 6, 3);
};

export const hourglass = (p) => {
  p.rect(22, 8, 56, 10, 4, C.wood).rect(22, 82, 56, 10, 4, C.wood);
  p.path('M28 18 L72 18 Q72 40 54 50 Q72 60 72 82 L28 82 Q28 60 46 50 Q28 40 28 18 Z', '#e8f4ff', { op: 0.95 });
  p.path('M34 30 L66 30 Q62 42 50 48 Q38 42 34 30 Z M36 80 Q42 66 50 64 Q58 66 64 80 Z', C.yellow, { noStroke: true });
};

export const stack = (p) => {
  for (const [y, c] of [[64, C.green], [44, C.blue], [24, C.red]]) p.rect(16, y, 68, 16, 4, c);
  p.line('M24 30 L76 30 M24 50 L76 50 M24 70 L76 70', { sw: 2, color: '#fff', op: 0.7 });
};

export const zzz = (p) => {
  for (const [x, y, s] of [[14, 84, 30], [46, 58, 24], [70, 32, 18]]) {
    p.path(`M${x} ${y - s} L${x + s} ${y - s} L${x} ${y} L${x + s} ${y}`, 'none', { sw: 8, stroke: C.blue }).line(`M${x} ${y - s} L${x + s} ${y - s} L${x} ${y} L${x + s} ${y}`, { sw: 2.2, color: '#fff', op: 0.6 });
  }
};

/** Pointing hand for tutorials – fingertip at (40, 4). */
export const hand = (p) => {
  const skin = '#ffd2a8';
  p.path('M34 44 L34 10 Q34 2 40 2 Q46 2 46 10 L46 40 Q48 34 54 35 Q60 36 60 43 Q62 37 68 38 Q74 40 74 47 Q78 42 83 45 Q88 48 86 58 L82 80 Q78 96 58 96 L46 96 Q30 94 24 80 L16 62 Q14 54 20 52 Q28 50 34 60 Z', skin);
  p.line('M46 40 L46 52 M60 43 L60 54 M74 47 L74 56', { sw: 2.2, op: 0.6 });
  p.path('M36 8 Q40 4 44 8 L44 13 L36 13 Z', light(skin, 0.5), { noStroke: true });
  p.shine(38, 22, 3, 7, 0, 0.5);
};

// ---------- levels & modes ----------
export const levelJunior = (p) => {
  p.path('M18 60 Q18 92 50 92 Q82 92 82 60 L72 52 L64 62 L56 52 L48 62 L40 52 L32 62 L24 52 Z', C.cream);
  p.circle(50, 44, 22, C.yellow);
  p.path('M24 36 L32 28 L40 38 L48 28 L56 38 L64 28 L72 36 Q72 10 50 10 Q28 10 24 36 Z', C.cream);
  p.eyes([42, 58], 44, 3.6).cheeks([35, 65], 52, 3.4, 2.2);
  p.path('M45 50 L55 50 L50 56 Z', C.orange, { sw: 2.2 });
};

export const levelMittel = (p) => {
  p.ellipse(50, 60, 30, 28, C.yellow);
  p.path('M20 56 Q8 50 12 42 Q22 44 26 52 Z', C.gold, { sw: 2.4 }).path('M80 56 Q92 50 88 42 Q78 44 74 52 Z', C.gold, { sw: 2.4 });
  p.eyes([40, 60], 54).cheeks([31, 69], 63);
  p.path('M44 61 L56 61 L50 69 Z', C.orange, { sw: 2.4 });
  p.line('M42 88 L40 96 M58 88 L60 96', { sw: 3, color: C.orange });
  p.line('M46 32 Q48 24 52 30 M52 30 Q54 22 58 28', { sw: 2.6 });
  p.shine(38, 42, 8, 4);
};

export const levelProfi = (p) => owl(p, true);

export const modeSolo = (p) => {
  p.path('M18 96 Q18 70 50 70 Q82 70 82 96 Z', C.blue);
  p.circle(50, 44, 24, C.tan);
  p.path('M26 42 Q24 16 50 16 Q76 16 74 42 Q66 30 52 32 Q40 24 26 42 Z', '#7a4a2a');
  p.eyes([42, 58], 46, 3.8).cheeks([35, 65], 54, 3.4, 2.2).smile(50, 54, 6, 4);
};

export const modeCoop = (p) => {
  const skinA = '#ffd2a8';
  const skinB = '#d9a27a';
  p.path('M8 60 Q20 46 40 46 L58 52 Q64 56 58 62 L46 60 Z', skinA);
  p.path('M92 52 Q82 38 62 40 L44 46 Q38 52 44 56 L56 54 L66 64 Q78 70 92 60 Z', skinB);
  p.path('M10 62 Q24 76 50 74 Q60 72 60 64 L48 62', skinA, { sw: 3 });
  p.rect(0, 52, 14, 22, 4, C.blue).rect(86, 42, 14, 22, 4, C.green);
  p.sparkle(50, 22, 8);
};

export const modeBot = (p) => {
  p.line('M50 20 L50 8', { sw: 3 });
  p.circle(50, 8, 5, C.red, { sw: 2.2 });
  p.rect(10, 40, 10, 22, 4, C.blue).rect(80, 40, 10, 22, 4, C.blue);
  p.rect(18, 20, 64, 58, 16, C.silver);
  p.rect(26, 30, 48, 30, 10, '#3b4d7a', { sw: 2.4 });
  p.circle(39, 44, 6, '#7ee0ff', { flat: true, noStroke: true }).circle(61, 44, 6, '#7ee0ff', { flat: true, noStroke: true });
  p.circle(41, 42, 2, '#fff', { flat: true, noStroke: true }).circle(63, 42, 2, '#fff', { flat: true, noStroke: true });
  p.line('M42 66 L58 66', { sw: 3 });
  p.cheeks([28, 72], 68, 4, 2.4);
  p.shine(30, 26, 6, 2.5);
};

export const modeVersus = (p) => {
  const kid = (x, hair, shirt, skin) => {
    p.path(`M${x - 18} 96 Q${x - 18} 72 ${x} 72 Q${x + 18} 72 ${x + 18} 96 Z`, shirt);
    p.circle(x, 52, 17, skin);
    p.path(`M${x - 17} 50 Q${x - 18} 32 ${x} 32 Q${x + 18} 32 ${x + 17} 50 Q${x + 8} 40 ${x} 42 Q${x - 8} 38 ${x - 17} 50 Z`, hair);
    p.eyes([x - 6, x + 6], 54, 3).smile(x, 60, 4, 3);
  };
  kid(28, '#7a4a2a', C.blue, '#ffd2a8');
  kid(72, '#2b2d42', C.green, '#d9a27a');
  p.path('M50 16 L44 30 L52 30 L46 44 L60 26 L52 26 L58 16 Z', C.yellow, { sw: 2.2 });
};

// ---------- learning goals ----------
export const goalAddition = (p) => {
  p.rect(12, 12, 76, 76, 20, C.green);
  p.path('M42 26 L58 26 L58 42 L74 42 L74 58 L58 58 L58 74 L42 74 L42 58 L26 58 L26 42 L42 42 Z', C.white, { sw: 2.6 });
  p.shine(28, 24, 8, 3);
};

export const goalZerlegung = (p) => {
  p.path('M14 30 L36 30 Q34 16 46 16 Q58 16 56 30 L80 30 L80 50 Q94 48 94 60 Q94 72 80 70 L80 90 L14 90 L14 70 Q26 72 26 60 Q26 48 14 50 Z', C.orange);
  p.shine(30, 40, 8, 3.5);
};

export const goalZahlenstrahl = (p) => {
  p.rect(6, 34, 88, 30, 8, C.yellow);
  for (let i = 0; i <= 10; i++) {
    const x = 12 + i * 7.6;
    p.line(`M${x.toFixed(1)} 34 L${x.toFixed(1)} ${i % 5 === 0 ? 50 : 42}`, { sw: i % 5 === 0 ? 3 : 2 });
  }
  p.circle(50, 76, 0, C.white);
  p.shine(24, 40, 10, 2.5, 0);
};

export const goalVergleichen = (p) => {
  p.line('M50 16 L50 84', { sw: 4 });
  p.path('M30 92 L70 92 L62 82 L38 82 Z', C.wood);
  p.line('M14 30 L86 22', { sw: 4 });
  p.circle(50, 26, 5, C.gold, { sw: 2.2 });
  p.path('M4 56 Q14 70 26 56 Z', C.blue).line('M4 56 L14 30 L26 56', { sw: 2 });
  p.path('M74 48 Q84 62 96 48 Z', C.red).line('M74 48 L86 22 L96 48', { sw: 2 });
};

export const goalBlitzblick = (p) => {
  p.path('M8 52 Q50 8 92 52 Q50 96 8 52 Z', C.white);
  p.circle(50, 52, 20, C.teal);
  p.circle(50, 52, 9, INK, { flat: true, noStroke: true });
  p.circle(56, 46, 4, '#fff', { flat: true, noStroke: true });
  p.path('M78 4 L70 20 L78 20 L72 34 L88 14 L80 14 L86 4 Z', C.yellow, { sw: 2.2 });
};

// ---------- fruits (Blitz-Fünf) ----------
export const strawberry = (p) => {
  p.path('M50 92 Q14 70 16 40 Q20 24 50 26 Q80 24 84 40 Q86 70 50 92 Z', C.red);
  for (const [x, y] of [[34, 44], [50, 42], [66, 44], [28, 58], [42, 58], [58, 58], [72, 58], [38, 72], [52, 74], [64, 70]]) p.ellipse(x, y, 1.6, 2.6, C.yellow, { flat: true, noStroke: true });
  p.path('M50 30 L30 20 L42 32 L28 36 L46 36 L50 46 L54 36 L72 36 L58 32 L70 20 Z', C.leaf, { sw: 2.4 });
  p.line('M50 30 L52 16', { sw: 3 });
  p.shine(32, 40, 6, 3);
};

export const banana = (p) => {
  p.path('M18 30 Q14 70 50 84 Q80 92 92 70 Q70 78 52 68 Q32 56 30 26 Z', C.yellow);
  p.line('M24 36 Q24 62 48 76', { sw: 2, op: 0.4 });
  p.path('M18 30 L16 20 L28 18 L30 26 Z', '#8a6a3a', { sw: 2.2 });
  p.path('M90 70 L96 66', 'none').circle(93, 69, 2.5, '#6a4a2a', { flat: true, noStroke: true });
  p.shine(36, 62, 4, 9, -40);
};

export const pear = (p) => {
  p.path('M50 22 Q62 22 62 38 Q62 48 72 58 Q86 74 72 88 Q60 96 50 96 Q40 96 28 88 Q14 74 28 58 Q38 48 38 38 Q38 22 50 22 Z', '#9fd356');
  p.line('M50 22 L52 8', { sw: 3.2, color: '#6a4a2a' });
  p.path('M52 14 Q66 4 76 12 Q66 22 52 16 Z', C.leaf, { sw: 2.4 });
  p.shine(38, 64, 6, 10, -20);
};

export const grapes = (p) => {
  const g = '#9b6bdf';
  for (const [x, y] of [[34, 34], [50, 32], [66, 34], [42, 48], [58, 48], [26, 48], [74, 48], [34, 62], [50, 62], [66, 62], [42, 76], [58, 76], [50, 90]]) {
    p.circle(x, y, 9.5, g, { sw: 2.4 });
    p.circle(x - 3, y - 3, 2.4, '#fff', { flat: true, noStroke: true, op: 0.6 });
  }
  p.line('M50 24 L54 8', { sw: 3.2, color: '#6a4a2a' });
  p.path('M54 12 Q70 2 80 12 Q70 22 54 16 Z', C.leaf, { sw: 2.4 });
};

// ---------- Schlummer-Schloss cards ----------
export const wecker = (p) => {
  p.line('M30 82 L22 94 M70 82 L78 94', { sw: 5 });
  p.path('M14 30 Q14 12 32 12 Q22 20 24 32 Z', C.gold, { sw: 2.6 }).path('M86 30 Q86 12 68 12 Q78 20 76 32 Z', C.gold, { sw: 2.6 });
  p.circle(50, 56, 34, C.red);
  p.circle(50, 56, 26, C.white, { sw: 2.6 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    p.circle((50 + Math.cos(a) * 21).toFixed(1), (56 + Math.sin(a) * 21).toFixed(1), i % 3 === 0 ? 2 : 1.1, INK, { flat: true, noStroke: true });
  }
  p.line('M50 56 L50 40 M50 56 L62 60', { sw: 3 });
  p.line('M50 22 L50 14', { sw: 4 });
  p.circle(50, 12, 5, C.gold, { sw: 2.2 });
  p.shine(34, 38, 6, 3);
};

export const schlaflied = (p) => {
  p.path('M58 14 Q26 18 26 50 Q28 82 60 84 Q38 72 38 50 Q38 28 58 14 Z', C.yellow);
  p.happyEyes([34], 46, 3.4);
  const note = (x, y, c) => {
    p.ellipse(x, y, 7, 5.5, c, { t: `rotate(-20 ${x} ${y})`, sw: 2.4 });
    p.line(`M${x + 6} ${y - 2} L${x + 6} ${y - 28} L${x + 18} ${y - 22}`, { sw: 3 });
  };
  note(62, 64, C.purple);
  note(80, 46, C.blue);
  p.sparkle(18, 20, 5);
};

export const trommel = (p) => {
  p.line('M24 10 L46 40 M80 8 L56 40', { sw: 5, color: '#a86a3a' });
  p.line('M24 10 L46 40 M80 8 L56 40', { sw: 1.6, op: 0.4 });
  p.circle(22, 8, 5, C.cream, { sw: 2 }).circle(82, 6, 5, C.cream, { sw: 2 });
  p.path('M14 48 L14 78 Q50 96 86 78 L86 48 Z', C.red);
  p.line('M14 52 L32 84 L50 54 L68 86 L86 52', { sw: 2.6, color: C.gold });
  p.ellipse(50, 48, 36, 12, C.cream);
  p.shine(30, 64, 4, 8, 0);
};

export const clown = (p) => {
  p.circle(20, 46, 14, '#ff6b5b').circle(80, 46, 14, '#ff6b5b').circle(30, 30, 11, '#ff6b5b').circle(70, 30, 11, '#ff6b5b');
  p.path('M32 20 L50 0 L68 20 Z', C.blue, { sw: 2.6 });
  p.circle(50, 2, 4.5, C.yellow, { sw: 2 });
  p.circle(50, 54, 28, C.white);
  p.path('M36 42 L40 34 L44 42 M56 42 L60 34 L64 42', 'none').line('M35 40 L41 34 M59 34 L65 40', { sw: 2.4, color: C.blue });
  p.eyes([40, 60], 46, 4);
  p.circle(50, 58, 7, C.red);
  p.shine(48, 55, 2.4, 1.6, 0, 0.7);
  p.path('M34 66 Q50 84 66 66 Q50 74 34 66 Z', C.red, { sw: 2.4 });
  p.cheeks([30, 70], 60, 4.5, 3);
};
