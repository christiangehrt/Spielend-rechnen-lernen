#!/usr/bin/env node
/**
 * Generates all artwork of the app as SVG (house style, see lib.mjs) and
 * writes the asset manifests art.json and stickers.json.
 *
 * The app only references artwork through these manifests, so final
 * illustrations can still replace single files 1:1 later.
 *
 * Usage: npm run assets:art
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, Pic } from './lib.mjs';
import * as A from './animals.mjs';
import * as O from './objects.mjs';
import * as I from './icons.mjs';
import * as T from './tiles.mjs';
import * as S from './scenes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const artDir = join(root, 'public', 'assets', 'art');
const stickerDir = join(root, 'public', 'assets', 'stickers');

const draw = (fn) => {
  const p = new Pic();
  fn(p);
  return p.toString();
};

/** key -> [drawing, emoji fallback] */
const ART = {
  'avatar.fox': [A.fox, '🦊'],
  'avatar.cat': [A.cat, '🐱'],
  'avatar.dog': [(p) => A.dog(p), '🐶'],
  'avatar.panda': [A.panda, '🐼'],
  'avatar.lion': [A.lion, '🦁'],
  'avatar.unicorn': [A.unicorn, '🦄'],
  'avatar.frog': [A.frog, '🐸'],
  'avatar.owl': [(p) => A.owl(p), '🦉'],
  'avatar.rabbit': [A.rabbit, '🐰'],
  'avatar.bear': [(p) => A.bear(p), '🐻'],
  'avatar.penguin': [A.penguin, '🐧'],
  'avatar.dino': [A.dino, '🦕'],
  'avatar.octopus': [(p) => A.octopus(p), '🐙'],
  'avatar.tiger': [A.tiger, '🐯'],
  'game.blitzblick': [T.tileBlitzblick, '📸'],
  'game.rauf-runter': [T.tileRaufRunter, '🪜'],
  'game.raupen-reihen': [T.tileRaupen, '🐛'],
  'game.nachbar-reihe': [T.tileNachbar, '🏘️'],
  'game.klappen-zu': [T.tileKlappen, '🎲'],
  'game.schlummer-schloss': [T.tileSchloss, '🏰'],
  'game.blitz-fuenf': [T.tileBlitzFuenf, '⚡'],
  'game.verliebte-zahlen': [T.tileVerliebte, '💞'],
  'game.zahlenstrahl-huepfen': [T.tileZahlenstrahl, '🐸'],
  'game.zahlen-detektiv': [T.tileDetektiv, '🔎'],
  'level.junior': [I.levelJunior, '🐣'],
  'level.mittel': [I.levelMittel, '🐥'],
  'level.profi': [I.levelProfi, '🦉'],
  'mode.solo': [I.modeSolo, '🧒'],
  'mode.coop': [I.modeCoop, '🤝'],
  'mode.bot': [I.modeBot, '🤖'],
  'mode.versus': [I.modeVersus, '⚔️'],
  'goal.addition': [I.goalAddition, '➕'],
  'goal.zerlegung': [I.goalZerlegung, '🧩'],
  'goal.zahlenstrahl': [I.goalZahlenstrahl, '📏'],
  'goal.vergleichen': [I.goalVergleichen, '⚖️'],
  'goal.blitzblick': [I.goalBlitzblick, '👀'],
  'ui.star': [I.star, '⭐'],
  'ui.gift': [I.chest, '🎁'],
  'ui.trophy': [I.trophy, '🏆'],
  'ui.party': [I.party, '🎉'],
  'ui.thinking': [I.thinking, '🤔'],
  'ui.sleepy': [I.sleepy, '😴'],
  'ui.basket': [I.basket, '🧺'],
  'ui.magpie': [I.magpie, '🐦‍⬛'],
  'ui.heart': [I.heart, '❤️'],
  'ui.check': [I.check, '✅'],
  'ui.cross': [I.cross, '❌'],
  'ui.question': [I.question, '❓'],
  'ui.target': [I.target, '🎯'],
  'ui.footprints': [I.footprints, '👣'],
  'ui.album': [I.album, '📖'],
  'ui.dice': [I.dice, '🎲'],
  'ui.box': [I.box, '📦'],
  'ui.medal': [I.medal, '🏅'],
  'ui.hourglass': [I.hourglass, '⏳'],
  'ui.stack': [I.stack, '📚'],
  'ui.zzz': [I.zzz, '💤'],
  'ui.hand': [I.hand, '👆'],
  'card.wecker': [I.wecker, '⏰'],
  'card.dieb': [A.raccoon, '🦝'],
  'card.wachhund': [(p) => A.dog(p, true), '🐕'],
  'card.schlaflied': [I.schlaflied, '🎶'],
  'card.trommel': [I.trommel, '🥁'],
  'card.clown': [I.clown, '🤡'],
  'theme.jungle': [O.palm, '🌴'],
  'theme.space': [O.rocket, '🚀'],
  'theme.ocean': [O.fish, '🐠'],
  'theme.farm': [O.tractor, '🚜'],
  'fruit.strawberry': [I.strawberry, '🍓'],
  'fruit.banana': [I.banana, '🍌'],
  'fruit.pear': [I.pear, '🍐'],
  'fruit.grapes': [I.grapes, '🍇'],
};

/** Hand-made SVG files kept as they are. */
const STATIC = {
  'ui.cards': ['ui-cards.svg', '🂠'],
  'mascot.happy': ['mascot-happy.svg', '🙂'],
  'mascot.cheer': ['mascot-cheer.svg', '🥳'],
  'mascot.think': ['mascot-think.svg', '🤔'],
};

const STICKERS = {
  jungle: { monkey: A.monkey, parrot: O.parrot, snake: O.snake, elephant: A.elephant, giraffe: A.giraffe, crocodile: O.crocodile, palm: O.palm, butterfly: O.butterfly, leopard: A.leopard, sloth: A.sloth },
  space: { rocket: O.rocket, ufo: O.ufo, earth: O.earth, saturn: O.saturn, moon: O.moon, star: O.starFace, alien: O.alien, astronaut: O.astronaut, comet: O.comet, satellite: O.satellite },
  ocean: { fish: O.fish, octopus: (p) => A.octopus(p, C.coral), dolphin: O.dolphin, whale: O.whale, crab: O.crab, turtle: O.turtle, squid: O.squid, blowfish: O.blowfish, jellyfish: O.jellyfish, shell: O.shell },
  farm: { cow: A.cow, pig: A.pig, sheep: A.sheep, rooster: O.rooster, horse: A.horse, tractor: O.tractor, chick: O.chick, sunflower: O.sunflower, cat: (p) => A.cat(p, '#ffad5c', '#d9822b'), duck: O.duck },
};

/** Stickers get a white die-cut edge like real stickers. */
const stickerSvg = (fn) => {
  const inner = draw(fn)
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  const defs = inner.match(/^<defs>([\s\S]*?)<\/defs>/);
  const body = defs ? inner.slice(defs[0].length) : inner;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs ? defs[1] : ''}<filter id="cut" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="d"/><feFlood flood-color="#ffffff"/><feComposite in2="d" operator="in" result="edge"/><feMerge><feMergeNode in="edge"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#cut)" transform="translate(6 6) scale(0.88)">${body}</g></svg>\n`;
};

mkdirSync(artDir, { recursive: true });
mkdirSync(stickerDir, { recursive: true });

const art = {};
for (const [key, [file, emoji]] of Object.entries(STATIC)) {
  if (!existsSync(join(artDir, file))) throw new Error(`missing static artwork ${file}`);
  art[key] = { src: `assets/art/${file}`, emoji };
}
for (const [key, [fn, emoji]] of Object.entries(ART)) {
  const file = `${key.replace('.', '-')}.svg`;
  writeFileSync(join(artDir, file), draw(fn));
  art[key] = { src: `assets/art/${file}`, emoji };
}
writeFileSync(
  join(root, 'public', 'assets', 'art.json'),
  JSON.stringify({ _comment: 'Artwork manifest: key -> SVG file (generated by scripts/illustrations). Replace files 1:1 to swap artwork.', art }, null, 2) + '\n',
);

const stickers = [];
for (const [theme, list] of Object.entries(STICKERS)) {
  for (const [name, fn] of Object.entries(list)) {
    const id = `${theme}-${name}`;
    writeFileSync(join(stickerDir, `${id}.svg`), stickerSvg(fn));
    stickers.push({ id, src: `assets/stickers/${id}.svg`, theme });
  }
}
writeFileSync(
  join(stickerDir, 'stickers.json'),
  JSON.stringify({ _comment: 'Sticker manifest. New stickers can be added here without code changes.', stickers }, null, 2) + '\n',
);

for (const name of ['jungle', 'space', 'ocean', 'farm']) {
  writeFileSync(join(root, 'public', 'assets', 'themes', `${name}.svg`), S[name]());
}

// keep the old emoji fallbacks of keys that are not drawn (none expected)
const previous = JSON.parse(readFileSync(join(root, 'public', 'assets', 'art.json'), 'utf8')).art;
console.log(`art: ${Object.keys(previous).length} keys, stickers: ${stickers.length}`);
