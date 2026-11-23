/**
 * Tiny SVG illustration kit – the house style of "Spielend rechnen lernen":
 * rounded shapes, one shared dark outline colour, soft radial shading and
 * glossy highlights, the same cute eyes and cheeks for every character.
 */
export const INK = '#3b2f3f';
export const SW = 3.2; // outline width in a 100×100 box

export const C = {
  orange: '#ff8a3d',
  red: '#ef476f',
  coral: '#ff6b5b',
  pink: '#ff8fb8',
  rose: '#ffb3c8',
  yellow: '#ffcf4d',
  gold: '#ffbf2e',
  green: '#5cc26b',
  leaf: '#3fa45b',
  teal: '#2ec4b6',
  blue: '#4f8cf0',
  sky: '#8fd3ff',
  navy: '#2f3a5a',
  purple: '#9b7be0',
  lilac: '#c9b6ff',
  brown: '#b07a4f',
  wood: '#c98a52',
  tan: '#f0c995',
  cream: '#fff4e3',
  white: '#ffffff',
  grey: '#a7adbf',
  silver: '#d9dde8',
  dark: '#4a4058',
  cheek: '#ff8fa3',
};

const rgb = (h) => {
  const x = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
  return [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
};
const hex = (a) => '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (c, t, a) => {
  const x = rgb(c);
  const y = rgb(t);
  return hex(x.map((v, i) => v + (y[i] - v) * a));
};
export const light = (c, a = 0.35) => mix(c, '#ffffff', a);
export const darker = (c, a = 0.18) => mix(c, '#000000', a);

const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

export class Pic {
  constructor(w = 100, h = 100) {
    this.w = w;
    this.h = h;
    this.defs = new Map();
    this.parts = [];
  }

  /** Soft radial gradient for a colour (light top-left → base). */
  grad(color) {
    if (!this.defs.has(color)) {
      const id = `g${this.defs.size}`;
      this.defs.set(color, {
        id,
        def: `<radialGradient id="${id}" cx="0.35" cy="0.28" r="0.85"><stop offset="0" stop-color="${light(color, 0.38)}"/><stop offset="0.65" stop-color="${color}"/><stop offset="1" stop-color="${darker(color, 0.08)}"/></radialGradient>`,
      });
    }
    return `url(#${this.defs.get(color).id})`;
  }

  style(color, o = {}) {
    return {
      fill: color === 'none' ? 'none' : o.flat ? color : this.grad(color),
      stroke: o.noStroke ? undefined : (o.stroke ?? INK),
      'stroke-width': o.noStroke ? undefined : (o.sw ?? SW),
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
      transform: o.t,
      opacity: o.op,
    };
  }

  raw(s) {
    this.parts.push(s);
    return this;
  }
  path(d, color, o) {
    return this.raw(`<path ${attrs({ d, ...this.style(color, o) })}/>`);
  }
  circle(cx, cy, r, color, o) {
    return this.raw(`<circle ${attrs({ cx, cy, r, ...this.style(color, o) })}/>`);
  }
  ellipse(cx, cy, rx, ry, color, o) {
    return this.raw(`<ellipse ${attrs({ cx, cy, rx, ry, ...this.style(color, o) })}/>`);
  }
  rect(x, y, w, h, rx, color, o) {
    return this.raw(`<rect ${attrs({ x, y, width: w, height: h, rx, ...this.style(color, o) })}/>`);
  }
  /** Outline-only stroke (mouths, whiskers, details). */
  line(d, o = {}) {
    return this.raw(
      `<path ${attrs({ d, fill: 'none', stroke: o.color ?? INK, 'stroke-width': o.sw ?? SW, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: o.op, transform: o.t })}/>`,
    );
  }
  /** Flat shape without outline (markings, shadows). */
  flat(d, color, op) {
    return this.raw(`<path ${attrs({ d, fill: color, opacity: op })}/>`);
  }
  group(t, fn) {
    this.raw(`<g transform="${t}">`);
    fn(this);
    return this.raw('</g>');
  }
  /** Cute eyes: dark ovals with a white glint. */
  eyes(xs, y, r = 4.6, o = {}) {
    for (const x of xs) {
      this.ellipse(x, y, r * 0.86, r, INK, { flat: true, noStroke: true });
      this.circle(x + r * 0.32, y - r * 0.38, r * 0.34, '#ffffff', { flat: true, noStroke: true });
      if (o.lash) this.line(`M${x - r} ${y - r * 1.1} l-2 -2.5`, { sw: 2 });
    }
    return this;
  }
  /** Happy closed eyes ^ ^ */
  happyEyes(xs, y, r = 5) {
    for (const x of xs) this.line(`M${x - r} ${y + 1.5} Q${x} ${y - r * 1.2} ${x + r} ${y + 1.5}`, { sw: 3 });
    return this;
  }
  cheeks(xs, y, rx = 5, ry = 3.2) {
    for (const x of xs) this.ellipse(x, y, rx, ry, C.cheek, { flat: true, noStroke: true, op: 0.65 });
    return this;
  }
  smile(cx, y, w = 8, depth = 5) {
    return this.line(`M${cx - w} ${y} Q${cx} ${y + depth} ${cx + w} ${y}`, { sw: 2.8 });
  }
  /** Glossy highlight. */
  shine(cx, cy, rx, ry, rot = -30, op = 0.45) {
    return this.raw(`<ellipse ${attrs({ cx, cy, rx, ry, fill: '#ffffff', opacity: op, transform: `rotate(${rot} ${cx} ${cy})` })}/>`);
  }
  /** Small four-point sparkle. */
  sparkle(x, y, s = 6, color = C.yellow) {
    return this.path(
      `M${x} ${y - s} Q${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y} Q${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s} Q${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y} Q${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s} Z`,
      color,
      { sw: 2, flat: true },
    );
  }
  toString() {
    const defs = [...this.defs.values()].map((d) => d.def).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}">${defs ? `<defs>${defs}</defs>` : ''}${this.parts.join('')}</svg>\n`;
  }
}

/** Points of a regular star. */
export const starPath = (cx, cy, outer, inner, n = 5, rot = -90) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
};

/** Ring of overlapping circles (manes, clouds, wool). */
export const bumps = (p, cx, cy, radius, count, r, color, o = {}) => {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (o.offset ?? 0);
    p.circle((cx + radius * Math.cos(a)).toFixed(1), (cy + radius * Math.sin(a)).toFixed(1), r, color, o);
  }
  // cover the inner outlines
  p.circle(cx, cy, radius + r * 0.35, color, { ...o, noStroke: true });
  return p;
};
