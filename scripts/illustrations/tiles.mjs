import { C, INK, light, starPath } from './lib.mjs';
import { frog } from './animals.mjs';
import { pear } from './icons.mjs';

const num = (p, x, y, n, size = 22, color = INK) =>
  p.raw(`<text x="${x}" y="${y}" text-anchor="middle" font-family="Fredoka, Nunito, Arial, sans-serif" font-weight="700" font-size="${size}" fill="${color}">${n}</text>`);

const card = (p, x, y, w, h, color = C.white, rot = 0) => p.rect(x, y, w, h, 7, color, { t: rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined });

export const tileBlitzblick = (p) => {
  card(p, 10, 26, 72, 52, C.white, -6);
  p.raw('<g transform="rotate(-6 46 52)">');
  p.rect(17, 34, 58, 36, 4, '#f3f6ff', { sw: 2.2 });
  p.line('M17 52 L75 52 M28.6 34 L28.6 70 M40.2 34 L40.2 70 M51.8 34 L51.8 70 M63.4 34 L63.4 70', { sw: 1.4, op: 0.35 });
  for (let i = 0; i < 7; i++) p.circle((22.8 + (i % 5) * 11.6).toFixed(1), i < 5 ? 43 : 61, 4.4, i < 5 ? C.red : C.blue, { flat: true, sw: 1.6 });
  p.raw('</g>');
  p.path('M80 4 L66 30 L78 30 L68 52 L94 22 L82 22 L92 4 Z', C.yellow, { sw: 2.6 });
  p.sparkle(14, 16, 6, C.yellow);
};

export const tileRaufRunter = (p) => {
  card(p, 8, 22, 42, 60, '#e6f6ea', -8);
  card(p, 50, 22, 42, 60, '#fff0e0', 8);
  p.path('M29 36 L42 52 L34 52 L34 66 L24 66 L24 52 L16 52 Z', C.green, { sw: 2.6, t: 'rotate(-8 29 52)' });
  p.path('M71 68 L84 52 L76 52 L76 38 L66 38 L66 52 L58 52 Z', C.orange, { sw: 2.6, t: 'rotate(8 71 52)' });
  p.path('M40 10 Q50 2 60 10', 'none').line('M38 12 Q50 2 62 12', { sw: 3, color: C.purple });
  p.path('M58 6 L64 13 L56 14 Z', C.purple, { sw: 1.6, flat: true });
};

export const tileRaupen = (p) => {
  const g = '#8bd16a';
  for (const [x, y] of [[16, 70], [30, 64], [44, 60]]) p.line(`M${x - 3} ${y + 10} L${x - 4} ${y + 16} M${x + 3} ${y + 10} L${x + 4} ${y + 16}`, { sw: 2.6 });
  for (const [x, y, r] of [[16, 70, 11], [30, 64, 12], [44, 60, 13]]) {
    p.circle(x, y, r, g);
    p.circle(x - 3, y - 4, 2.6, light(g, 0.45), { flat: true, noStroke: true });
  }
  p.circle(68, 48, 19, g);
  p.line('M62 31 L56 16 M74 31 L80 16', { sw: 3 });
  p.circle(56, 14, 4.2, C.orange, { sw: 2 }).circle(80, 14, 4.2, C.orange, { sw: 2 });
  p.eyes([61, 75], 46, 4).cheeks([57, 79], 55, 3.4, 2.2).smile(68, 55, 5, 4);
  p.shine(62, 38, 6, 3);
};

export const tileNachbar = (p) => {
  [10, 11, 12].forEach((n, i) => {
    const x = 8 + i * 30;
    const big = n === 11;
    p.rect(x, big ? 20 : 30, 26, big ? 54 : 40, 6, big ? C.gold : C.red, { sw: big ? 3.4 : 2.6 });
    num(p, x + 13, big ? 55 : 57, n, big ? 20 : 16, '#fff');
  });
  p.line('M30 88 L42 88 M58 88 L70 88', { sw: 3, color: C.purple });
  p.path('M24 88 L31 83 L31 93 Z M76 88 L69 83 L69 93 Z', C.purple, { flat: true, sw: 1.6 });
};

export const tileKlappen = (p) => {
  p.rect(6, 40, 88, 40, 8, '#8b5a2b');
  for (let i = 0; i < 5; i++) {
    const x = 12 + i * 16;
    const shut = i === 1 || i === 3;
    p.rect(x, shut ? 62 : 30, 13, shut ? 12 : 42, 3, shut ? '#5b3a1a' : '#f6d6a8', { sw: 2.2 });
    if (!shut) num(p, x + 6.5, 46, i + 1, 12, '#5a3412');
  }
  p.raw('<g transform="rotate(12 76 78)">');
  p.rect(62, 64, 28, 28, 7, C.white);
  for (const [x, y] of [[70, 72], [76, 78], [82, 84]]) p.circle(x, y, 2.6, INK, { flat: true, noStroke: true });
  p.raw('</g>');
};

export const tileSchloss = (p) => {
  p.path('M64 10 Q46 14 46 30 Q48 46 66 48 Q56 40 56 30 Q56 18 64 10 Z', C.yellow, { sw: 2.4 });
  p.rect(14, 46, 72, 46, 4, '#e9e2ff');
  p.rect(8, 30, 20, 62, 3, '#d9ceff').rect(72, 30, 20, 62, 3, '#d9ceff');
  p.path('M4 32 L18 10 L32 32 Z', C.purple).path('M68 32 L82 10 L96 32 Z', C.purple);
  p.path('M38 92 L38 70 Q50 56 62 70 L62 92 Z', '#7b5cd6', { sw: 2.6 });
  p.rect(13, 44, 10, 12, 4, '#3b4d7a', { sw: 2 }).rect(77, 44, 10, 12, 4, '#3b4d7a', { sw: 2 });
  for (const [x, y, s] of [[30, 30, 9], [40, 20, 7]]) p.raw(`<text x="${x}" y="${y}" font-family="Fredoka, Arial, sans-serif" font-weight="700" font-size="${s * 1.7}" fill="${C.blue}" stroke="${INK}" stroke-width="1">z</text>`);
};

export const tileBlitzFuenf = (p) => {
  p.ellipse(50, 82, 38, 12, '#9e1f42', { flat: true });
  p.path('M12 66 Q12 50 50 50 Q88 50 88 66 L88 80 Q50 94 12 80 Z', '#c42e55');
  p.ellipse(50, 62, 38, 14, C.red);
  p.path('M54 50 L44 64 L52 64 L46 76 L62 58 L54 58 L60 50 Z', C.yellow, { sw: 2.2 });
  p.group('translate(52 0) scale(0.42)', pear);
  p.group('translate(8 4) scale(0.36)', pear);
};

export const tileVerliebte = (p) => {
  const heart = (x, y, s, color, n) => {
    p.path(`M${x} ${y + 30 * s} Q${x - 30 * s} ${y + 12 * s} ${x - 28 * s} ${y - 6 * s} Q${x - 26 * s} ${y - 20 * s} ${x - 12 * s} ${y - 20 * s} Q${x - 4 * s} ${y - 20 * s} ${x} ${y - 10 * s} Q${x + 4 * s} ${y - 20 * s} ${x + 12 * s} ${y - 20 * s} Q${x + 26 * s} ${y - 20 * s} ${x + 28 * s} ${y - 6 * s} Q${x + 30 * s} ${y + 12 * s} ${x} ${y + 30 * s} Z`, color);
    num(p, x, y + 8 * s, n, 24 * s, '#fff');
  };
  heart(30, 44, 0.92, C.red, 3);
  heart(70, 56, 0.92, C.pink, 7);
  p.raw(`<text x="50" y="96" text-anchor="middle" font-family="Fredoka, Nunito, Arial, sans-serif" font-weight="700" font-size="16" fill="${C.purple}">= 10</text>`);
  p.sparkle(86, 16, 6);
};

export const tileZahlenstrahl = (p) => {
  p.flat('M0 80 Q50 70 100 80 L100 100 L0 100 Z', C.sky, 0.6);
  for (const [x, ten] of [[16, false], [50, true], [84, false]]) p.ellipse(x, 82, ten ? 14 : 11, ten ? 7 : 6, ten ? C.gold : C.grey);
  num(p, 50, 98, 10, 12);
  p.line('M16 72 Q33 30 50 62', { sw: 2.6, color: C.purple, op: 0.8 });
  p.path('M50 62 L44 58 L50 54', 'none');
  p.group('translate(48 18) scale(0.5)', frog);
};

export const tileDetektiv = (p) => {
  num(p, 30, 46, 7, 24, C.purple);
  num(p, 70, 34, 3, 18, C.grey);
  num(p, 22, 80, 12, 16, C.grey);
  p.line('M62 66 L88 92', { sw: 12 });
  p.line('M62 66 L88 92', { sw: 6, color: '#8a5a3a' });
  p.circle(46, 50, 26, '#d6f0ff', { op: 0.9 });
  p.circle(46, 50, 26, 'none', { sw: 6, stroke: C.grey });
  p.circle(46, 50, 26, 'none', { sw: 2 });
  num(p, 46, 60, '?', 30, C.purple);
  p.shine(36, 40, 8, 4, -30, 0.7);
};
