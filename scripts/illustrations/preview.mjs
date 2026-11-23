#!/usr/bin/env node
/** Renders a contact sheet of illustrations (dev tool): node preview.mjs <module> <out.png> [size] */
import { createRequire } from 'node:module';
import { Pic } from './lib.mjs';

const [mod, out, sizeArg] = process.argv.slice(2);
const size = Number(sizeArg ?? 110);
const m = await import(`./${mod}.mjs`);
const items = Object.entries(m).filter(([, f]) => typeof f === 'function');
const cells = items
  .map(([name, f]) => {
    const p = new Pic();
    f(p);
    return `<figure style="margin:0;text-align:center;font:12px sans-serif"><img width="${size}" height="${size}" src="data:image/svg+xml;base64,${Buffer.from(p.toString()).toString('base64')}"><figcaption>${name}</figcaption></figure>`;
  })
  .join('');
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 400 } });
await page.setContent(`<body style="margin:10px;background:#fff7e8;display:flex;flex-wrap:wrap;gap:12px">${cells}</body>`);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`${items.length} drawings -> ${out}`);
