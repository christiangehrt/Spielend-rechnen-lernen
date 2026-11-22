#!/usr/bin/env node
/**
 * Copies the placeholder artwork (Twemoji, CC-BY 4.0) into public/assets and
 * writes the asset manifests art.json and stickers.json.
 *
 * The app only ever references artwork through these manifests, so final
 * illustrations can later replace the SVG files 1:1 (same file names) or be
 * re-pointed in the JSON without any code change.
 *
 * Usage: node scripts/copy-twemoji.mjs   (needs the @twemoji/svg dev dependency)
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', '@twemoji', 'svg');

// key -> [codepoint file, fallback emoji character]
const ART = {
  // avatars
  'avatar.fox': ['1f98a', '🦊'],
  'avatar.cat': ['1f431', '🐱'],
  'avatar.dog': ['1f436', '🐶'],
  'avatar.panda': ['1f43c', '🐼'],
  'avatar.lion': ['1f981', '🦁'],
  'avatar.unicorn': ['1f984', '🦄'],
  'avatar.frog': ['1f438', '🐸'],
  'avatar.owl': ['1f989', '🦉'],
  'avatar.rabbit': ['1f430', '🐰'],
  'avatar.bear': ['1f43b', '🐻'],
  'avatar.penguin': ['1f427', '🐧'],
  'avatar.dino': ['1f995', '🦕'],
  'avatar.octopus': ['1f419', '🐙'],
  'avatar.tiger': ['1f42f', '🐯'],
  // game tiles
  'game.rauf-runter': ['1fa9c', '🪜'],
  'game.raupen-reihen': ['1f41b', '🐛'],
  'game.nachbar-reihe': ['1f3d8', '🏘️'],
  'game.klappen-zu': ['1f3b2', '🎲'],
  'game.schlummer-schloss': ['1f3f0', '🏰'],
  'game.blitz-fuenf': ['26a1', '⚡'],
  'game.verliebte-zahlen': ['1f49e', '💞'],
  'game.zahlenstrahl-huepfen': ['1f438', '🐸'],
  'game.zahlen-detektiv': ['1f50e', '🔎'],
  // presets & modes
  'level.junior': ['1f423', '🐣'],
  'level.mittel': ['1f425', '🐥'],
  'level.profi': ['1f989', '🦉'],
  'mode.solo': ['1f9d2', '🧒'],
  'mode.coop': ['1f91d', '🤝'],
  'mode.bot': ['1f916', '🤖'],
  'mode.versus': ['2694', '⚔️'],
  // learning goals
  'goal.addition': ['2795', '➕'],
  'goal.zerlegung': ['1f9e9', '🧩'],
  'goal.zahlenstrahl': ['1f4cf', '📏'],
  'goal.vergleichen': ['2696', '⚖️'],
  'goal.blitzblick': ['1f440', '👀'],
  // misc ui
  'ui.star': ['2b50', '⭐'],
  'ui.gift': ['1f381', '🎁'],
  'ui.trophy': ['1f3c6', '🏆'],
  'ui.party': ['1f389', '🎉'],
  'ui.thinking': ['1f914', '🤔'],
  'ui.sleepy': ['1f634', '😴'],
  'ui.cards': ['1f0cf', '🃏'],
  'ui.basket': ['1f9fa', '🧺'],
  'ui.magpie': ['1f426-200d-2b1b', '🐦‍⬛'],
  'ui.heart': ['2764', '❤️'],
  'ui.check': ['2705', '✅'],
  'ui.cross': ['274c', '❌'],
  'ui.question': ['2753', '❓'],
  'ui.target': ['1f3af', '🎯'],
  'ui.footprints': ['1f463', '👣'],
  'ui.album': ['1f4d6', '📖'],
  'ui.dice': ['1f3b2', '🎲'],
  'ui.box': ['1f4e6', '📦'],
  'ui.medal': ['1f3c5', '🏅'],
  'ui.hourglass': ['23f3', '⏳'],
  'ui.stack': ['1f4da', '📚'],
  // album scenes
  'theme.jungle': ['1f334', '🌴'],
  'theme.space': ['1f680', '🚀'],
  'theme.ocean': ['1f420', '🐠'],
  'theme.farm': ['1f69c', '🚜'],
  // fruits (Blitz-Fünf)
  'fruit.strawberry': ['1f353', '🍓'],
  'fruit.banana': ['1f34c', '🍌'],
  'fruit.pear': ['1f350', '🍐'],
  'fruit.grapes': ['1f347', '🍇'],
};

const STICKERS = {
  jungle: [
    ['monkey', '1f412'], ['parrot', '1f99c'], ['snake', '1f40d'], ['elephant', '1f418'], ['giraffe', '1f992'],
    ['crocodile', '1f40a'], ['palm', '1f334'], ['butterfly', '1f98b'], ['leopard', '1f406'], ['sloth', '1f9a5'],
  ],
  space: [
    ['rocket', '1f680'], ['ufo', '1f6f8'], ['earth', '1f30d'], ['saturn', '1fa90'], ['moon', '1f319'],
    ['star', '1f31f'], ['alien', '1f47d'], ['astronaut', '1f9d1-200d-1f680'], ['comet', '2604'], ['satellite', '1f6f0'],
  ],
  ocean: [
    ['fish', '1f420'], ['octopus', '1f419'], ['dolphin', '1f42c'], ['whale', '1f433'], ['crab', '1f980'],
    ['turtle', '1f422'], ['squid', '1f991'], ['blowfish', '1f421'], ['jellyfish', '1fabc'], ['shell', '1f41a'],
  ],
  farm: [
    ['cow', '1f404'], ['pig', '1f416'], ['sheep', '1f411'], ['rooster', '1f413'], ['horse', '1f434'],
    ['tractor', '1f69c'], ['chick', '1f425'], ['sunflower', '1f33b'], ['cat', '1f408'], ['duck', '1f986'],
  ],
};

const copy = (code, dest) => {
  const file = join(src, `${code}.svg`);
  if (!existsSync(file)) throw new Error(`missing twemoji ${code}`);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(file, dest);
};

const art = {};
for (const [key, [code, emoji]] of Object.entries(ART)) {
  const name = `${key.replace('.', '-')}.svg`;
  copy(code, join(root, 'public', 'assets', 'art', name));
  art[key] = { src: `assets/art/${name}`, emoji };
}
writeFileSync(
  join(root, 'public', 'assets', 'art.json'),
  JSON.stringify({ _comment: 'Artwork manifest: key -> SVG file. Replace files 1:1 to swap artwork.', art }, null, 2) + '\n',
);

const stickers = [];
for (const [theme, list] of Object.entries(STICKERS)) {
  for (const [name, code] of list) {
    const id = `${theme}-${name}`;
    copy(code, join(root, 'public', 'assets', 'stickers', `${id}.svg`));
    stickers.push({ id, src: `assets/stickers/${id}.svg`, theme });
  }
}
writeFileSync(
  join(root, 'public', 'assets', 'stickers', 'stickers.json'),
  JSON.stringify({ _comment: 'Sticker manifest. New stickers can be added here without code changes.', stickers }, null, 2) + '\n',
);
console.log(`art: ${Object.keys(art).length}, stickers: ${stickers.length}`);
