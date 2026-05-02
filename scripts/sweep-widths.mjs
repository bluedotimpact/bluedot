#!/usr/bin/env node
// Headless Playwright width sweep. Usage:
//   node scripts/sweep-widths.mjs <url> <out-dir> [widths]
// Example:
//   node scripts/sweep-widths.mjs http://localhost:8000/6 /Users/dewi/claudeAssistant/foai-variants 320,480,600,720,1024,1440

import { chromium } from '/Users/dewi/code/email-drafter/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const url = process.argv[2];
const outDir = process.argv[3];
const widths = (process.argv[4] ?? '320,480,600,720,1024,1440')
  .split(',')
  .map((w) => parseInt(w, 10))
  .filter(Number.isFinite);
const slug = process.argv[5] ?? 'page';

if (!url || !outDir) {
  console.error('usage: sweep-widths.mjs <url> <out-dir> [widths] [slug]');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ deviceScaleFactor: 2 });
const page = await context.newPage();

for (const width of widths) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  // dismiss cookie banner if present
  await page.evaluate(() => {
    const accept = Array.from(document.querySelectorAll('button')).find((b) => /accept/i.test(b.textContent || ''));
    if (accept) accept.click();
  }).catch(() => {});
  await page.waitForTimeout(300);
  const path = resolve(outDir, `${slug}-${width}.png`);
  await page.screenshot({ path, fullPage: true });
  // Programmatic check: any element wider than viewport?
  const overflow = await page.evaluate(() => {
    const docEl = document.documentElement;
    const innerW = window.innerWidth;
    const horizontalOverflow = docEl.scrollWidth - innerW;
    return { innerW, scrollW: docEl.scrollWidth, horizontalOverflow };
  });
  console.log(`width=${width}\tscreenshot=${path}\toverflow=${overflow.horizontalOverflow}px`);
}

await browser.close();
