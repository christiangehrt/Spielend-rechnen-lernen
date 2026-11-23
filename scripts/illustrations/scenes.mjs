import { C, Pic, starPath } from './lib.mjs';
import * as O from './objects.mjs';

/** Album scenes (1600 × 1000): soft layered landscapes with a few decorations in the house style. */
const scene = (defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>\n`;

const linear = (id, stops) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

/** Place a 100×100 drawing (with its own gradients) at x/y with a size in px. */
const deco = (fn, x, y, size, extra = '') => {
  const p = new Pic();
  fn(p);
  const svg = p.toString().replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">', '').replace(/<\/svg>\s*$/, '');
  // unique gradient ids per placement
  const tag = `d${Math.round(x)}_${Math.round(y)}`;
  return `<g transform="translate(${x} ${y}) scale(${size / 100})" ${extra}>${svg.replace(/id="g(\d+)"/g, `id="${tag}g$1"`).replace(/url\(#g(\d+)\)/g, `url(#${tag}g$1)`)}</g>`;
};

const flower = (x, y, color, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-14" rx="9" ry="13" fill="${color}" stroke="#3b2f3f" stroke-width="3" transform="rotate(${a})"/>`).join('')}<circle r="9" fill="${C.yellow}" stroke="#3b2f3f" stroke-width="3"/></g>`;

export const jungle = () =>
  scene(
    linear('sky', [[0, '#d9f5c5'], [1, '#a6e3a1']]),
    `<rect width="1600" height="1000" fill="url(#sky)"/>
    <circle cx="1290" cy="170" r="95" fill="#fff6b3"/><circle cx="1290" cy="170" r="130" fill="#fff6b3" opacity=".35"/>
    <path d="M0 600 Q200 500 420 580 T860 570 T1300 550 T1600 580 V1000 H0Z" fill="#7fcb7a"/>
    ${deco(O.palm, 60, 300, 360, 'opacity=".95"')}${deco(O.palm, 1200, 330, 330, 'opacity=".95"')}
    <path d="M0 730 Q260 640 520 720 T1040 710 T1600 690 V1000 H0Z" fill="#4fae5a"/>
    <path d="M0 860 Q300 800 640 860 T1300 850 T1600 840 V1000 H0Z" fill="#3a9148"/>
    <g fill="#2e8b3e" stroke="#3b2f3f" stroke-width="5" stroke-linejoin="round">
      <path d="M0 0 C160 40 220 140 200 260 C120 180 40 140 0 150Z"/><path d="M1600 0 C1440 50 1380 150 1400 280 C1480 190 1560 150 1600 160Z"/>
      <path d="M0 1000 C80 860 200 820 330 840 C240 900 180 950 170 1000Z"/><path d="M1600 1000 C1520 870 1400 830 1270 850 C1360 910 1420 960 1430 1000Z"/>
    </g>
    <g fill="none" stroke="#3a8a3f" stroke-width="10" stroke-linecap="round"><path d="M520 0 C540 80 500 150 530 220"/><path d="M980 0 C960 100 1000 160 970 250"/></g>
    ${flower(420, 900, C.pink)}${flower(470, 935, C.yellow, 0.8)}${flower(1120, 905, C.purple)}${flower(760, 950, C.red, 0.9)}
    ${deco(O.butterfly, 700, 140, 110, 'opacity=".9"')}`,
  );

export const space = () => {
  const stars = [];
  let s = 7;
  for (let i = 0; i < 70; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = (s / 233280) * 1600;
    s = (s * 9301 + 49297) % 233280;
    const y = (s / 233280) * 760;
    stars.push(i % 9 === 0 ? `<path d="${starPath(x, y, 14, 6)}" fill="#ffe28a" stroke="#3b2f3f" stroke-width="2.5"/>` : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${1.5 + (i % 3)}" fill="#fff" opacity=".9"/>`);
  }
  return scene(
    linear('sky', [[0, '#1b1f4b'], [1, '#3a2468']]) +
      `<radialGradient id="neb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff7eb6" stop-opacity=".45"/><stop offset="1" stop-color="#ff7eb6" stop-opacity="0"/></radialGradient><radialGradient id="neb2" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6ec8ff" stop-opacity=".4"/><stop offset="1" stop-color="#6ec8ff" stop-opacity="0"/></radialGradient>`,
    `<rect width="1600" height="1000" fill="url(#sky)"/>
    <ellipse cx="380" cy="300" rx="420" ry="260" fill="url(#neb)"/><ellipse cx="1200" cy="620" rx="460" ry="280" fill="url(#neb2)"/>
    ${stars.join('')}
    ${deco(O.saturn, 1220, 40, 300)}${deco(O.earth, 80, 90, 170, 'opacity=".95"')}
    <path d="M0 1000 V840 Q400 740 800 790 T1600 820 V1000Z" fill="#8f86c9" stroke="#3b2f3f" stroke-width="6"/>
    <g fill="#7a71b6" stroke="#3b2f3f" stroke-width="4"><ellipse cx="300" cy="900" rx="80" ry="24"/><ellipse cx="900" cy="880" rx="56" ry="17"/><ellipse cx="1320" cy="925" rx="90" ry="26"/></g>`,
  );
};

export const ocean = () =>
  scene(
    linear('sea', [[0, '#7fd6f5'], [1, '#1f6fb2']]),
    `<rect width="1600" height="1000" fill="url(#sea)"/>
    <g fill="#ffffff" opacity=".13"><path d="M200 0 L320 0 L520 900 L380 900Z"/><path d="M700 0 L780 0 L900 800 L800 800Z"/><path d="M1200 0 L1330 0 L1450 900 L1300 900Z"/></g>
    <g fill="none" stroke="#fff" stroke-width="5" opacity=".6"><circle cx="400" cy="600" r="18"/><circle cx="420" cy="520" r="11"/><circle cx="395" cy="455" r="7"/><circle cx="1100" cy="400" r="16"/><circle cx="1120" cy="330" r="10"/><circle cx="1105" cy="280" r="6"/></g>
    <path d="M0 850 Q300 790 600 840 T1200 830 T1600 840 V1000 H0Z" fill="#f3d59b" stroke="#3b2f3f" stroke-width="6"/>
    <path d="M0 920 Q400 880 800 920 T1600 910 V1000 H0Z" fill="#e8c27f"/>
    <g fill="none" stroke="#2e9e6a" stroke-width="18" stroke-linecap="round"><path d="M120 900 C80 820 160 760 110 680 C80 630 130 580 110 530"/><path d="M190 910 C220 840 160 790 200 720"/><path d="M1440 900 C1400 830 1480 760 1430 690 C1400 640 1450 600 1430 560"/><path d="M1510 910 C1540 850 1480 800 1520 740"/></g>
    <g fill="#ff8fa3" stroke="#3b2f3f" stroke-width="5" stroke-linejoin="round"><path d="M640 880 L640 800 Q620 760 650 750 Q660 790 670 760 Q690 740 690 790 L690 880Z"/><path d="M980 890 L990 820 Q970 790 1000 780 Q1010 810 1020 785 Q1045 780 1030 830 L1035 890Z" fill="#ffb347"/></g>
    ${deco(O.shell, 820, 860, 90)}${deco(O.shell, 1260, 880, 70)}`,
  );

export const farm = () =>
  scene(
    linear('sky', [[0, '#8fd3ff'], [1, '#dff4ff']]),
    `<rect width="1600" height="1000" fill="url(#sky)"/>
    <g stroke="#3b2f3f" stroke-width="5"><circle cx="1400" cy="150" r="80" fill="#ffd84d"/></g>
    <g fill="#ffffff" stroke="#3b2f3f" stroke-width="5"><path d="M210 190 Q200 130 270 130 Q300 90 350 120 Q410 110 410 170 Q440 200 400 220 L230 220 Q180 215 210 190Z"/><path d="M850 140 Q850 100 900 100 Q930 70 965 95 Q1010 95 1005 140 Q1020 165 990 170 L870 170 Q835 165 850 140Z"/></g>
    <path d="M0 600 Q300 480 640 580 T1300 540 T1600 560 V1000 H0Z" fill="#9bd36a" stroke="#3b2f3f" stroke-width="6"/>
    <g transform="translate(1120 410)" stroke="#3b2f3f" stroke-width="6" stroke-linejoin="round">
      <rect x="0" y="90" width="260" height="190" fill="#e05252"/><path d="M-24 100 L130 0 L284 100Z" fill="#a83232"/>
      <rect x="95" y="170" width="70" height="110" fill="#fff4e0"/><path d="M95 170 L165 280 M165 170 L95 280" stroke="#e05252" stroke-width="8"/>
      <circle cx="130" cy="70" r="20" fill="#fff4e0"/>
    </g>
    <path d="M0 720 Q400 640 800 700 T1600 690 V1000 H0Z" fill="#7cc04f"/>
    <g stroke="#3b2f3f" stroke-width="5" fill="#d9a066"><rect x="0" y="815" width="1600" height="16"/><rect x="0" y="865" width="1600" height="16"/>
      ${[60, 260, 460, 660, 860, 1060, 1260, 1460].map((x) => `<rect x="${x - 9}" y="790" width="18" height="130" rx="4"/>`).join('')}</g>
    ${deco(O.sunflower, 120, 560, 230)}${deco(O.sunflower, 300, 600, 180)}`,
  );
