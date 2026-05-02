import { chromium } from '/Users/dewi/code/email-drafter/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ deviceScaleFactor: 2 });
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 1000 });
await page.goto('http://localhost:8000/6', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Find the MergedLadder section and screenshot it
const ladder = await page.locator('text=Go deep on a path').first().locator('xpath=ancestor::div[contains(@class, "flex flex-col")]').first();
await ladder.screenshot({ path: '/Users/dewi/claudeAssistant/foai-variants/v6-rung2-detail.png' });

await browser.close();
console.log('saved rung2 detail');
