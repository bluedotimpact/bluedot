/* eslint-disable no-console */
/* global document, getComputedStyle, innerWidth */
/* eslint-disable no-await-in-loop -- These assertions share one browser session. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const base = 'http://localhost:8000';
const headers = { authorization: 'Bearer local-preview-synthetic-data', 'content-type': 'application/json' };
const response = await fetch(`${base}/api/scout/queue`, { headers });
assert.equal(response.status, 200, 'Start the synthetic local preview first');
const { items } = await response.json();
assert.ok(items.some((item) => item.id === 'recScoutSample001'), 'Only use synthetic data');
assert.equal((await fetch(`${base}/api/scout/queue`)).status, 401);
const output = process.argv[2];
if (output) await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/scout`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'BlueDot Apps', exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Scout', exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Explore local preview' }).click();
  await page.getByRole('heading', { name: 'Scout', exact: true }).waitFor();
  await page.getByTestId('choose-round-sample-Technical AI Safety').click();
  await page.getByText('Research engineer · Example Research Institute · United Kingdom').waitFor();
  await page.getByText('Alex Morgan', { exact: true }).waitFor();
  // Both decisions require a modal; cancellation never sends a request.
  let writes = 0;
  await page.route('**/api/scout/decision', async (route) => {
    writes += 1;
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Synthetic save failure' }) });
  });
  await page.getByRole('button', { name: 'Invite to a call', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.equal(writes, 0);
  await page.getByRole('button', { name: 'Invite to a call', exact: true }).click();
  await page.getByRole('button', { name: 'Send invitation', exact: true }).click();
  await page.getByText('Synthetic save failure').waitFor();
  assert.equal(await page.getByText('Sam Chen', { exact: true }).count(), 0);
  await page.unroute('**/api/scout/decision');
  let release;
  const delayed = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/api/scout/decision', async (route) => {
    writes += 1;
    assert.equal(route.request().postDataJSON().id, 'recScoutSample001');
    await delayed;
    await route.fulfill({ contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await page.getByRole('button', { name: 'Saving…', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Skip for now', exact: true }).isDisabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Change round', exact: true }).isDisabled(), true);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 1);
  release();
  await page.getByText('Sam Chen', { exact: true }).waitFor();
  assert.equal(writes, 2);
  await page.unroute('**/api/scout/decision');
  // Failed-save and success checks above intercept every write. Refresh reloads
  // the same fixtures from the server without changing any sample decisions.
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByTestId('choose-round-sample-Technical AI Safety').click();
  await page.getByText('Alex Morgan', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await page.getByText('Sam Chen', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('dialog', { name: 'Leave this review session?' }).waitFor();
  await page.getByRole('button', { name: 'Stay here', exact: true }).click();
  assert.equal(await page.getByText('Sam Chen', { exact: true }).count(), 1);
  await page.getByRole('button', { name: 'Undo skip', exact: true }).click();
  await page.getByRole('heading', { name: 'Alex Morgan', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Finish session', exact: true }).click();
  await page.getByRole('heading', { name: 'Your session, at a glance.' }).waitFor();
  await page.getByRole('button', { name: 'Resume this round', exact: true }).click();
  // All changed views are checked with realistic content at short and tall sizes.
  await page.getByRole('button', { name: 'Refresh queue', exact: true }).click();
  await page.getByText('Alex Morgan', { exact: true }).waitFor();
  const sizes = [
    ...[320, 480, 600, 720, 1024, 1440].flatMap((width) => [700, 1400].map((height) => ({ width, height }))),
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
    { width: 1440, height: 1800 },
  ];
  const measurements = [];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.evaluate(() => globalThis.scrollTo(0, 0));
    await page.waitForTimeout(80);
    const result = await page.evaluate(() => {
      const visible = (el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      };

      const targets = [...document.querySelectorAll('main button, main a, main summary')].filter(visible).map((el) => ({ text: (el.textContent || el.getAttribute('aria-label') || '').slice(0, 80), width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }));
      const cards = [...document.querySelectorAll('main details')].filter(visible).map((el) => el.getBoundingClientRect());
      const sections = [...document.querySelectorAll('main details')].filter((el) => visible(el) && !el.parentElement.closest('details')).map((el) => el.getBoundingClientRect());
      return {
        overlappingSections: sections.filter((rect, index) => index > 0 && rect.top < sections[index - 1].bottom - 1).length,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        smallTargets: innerWidth < 768 ? targets.filter((rect) => rect.width < 43.5 || rect.height < 43.5) : [],
        offscreenCards: cards.filter((rect) => rect.left < -1 || rect.right > innerWidth + 1).length,
      };
    });
    measurements.push({ ...size, ...result });
    if (output) await page.screenshot({ path: path.join(output, `scout-${size.width}x${size.height}.png`), fullPage: true });
    assert.equal(result.horizontalOverflow, false, `Horizontal overflow at ${size.width}x${size.height}`);
    assert.equal(result.overlappingSections, 0, `Overlapping sections at ${size.width}x${size.height}`);
    assert.equal(result.offscreenCards, 0, `Offscreen card at ${size.width}x${size.height}`);
    assert.deepEqual(result.smallTargets, [], `Small touch targets at ${size.width}x${size.height}`);
  }

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByTestId('choose-round-sample-Technical AI Safety').waitFor();
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.evaluate(() => globalThis.scrollTo(0, 0));
    await page.waitForTimeout(80);
    const result = await page.evaluate(() => {
      const visible = (el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      };

      const targets = [...document.querySelectorAll('main button, main a, main summary')].filter(visible).map((el) => ({ text: (el.textContent || el.getAttribute('aria-label') || '').slice(0, 80), width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }));
      const cards = [...document.querySelectorAll('main details')].filter(visible).map((el) => el.getBoundingClientRect());
      const sections = [...document.querySelectorAll('main details')].filter((el) => visible(el) && !el.parentElement.closest('details')).map((el) => el.getBoundingClientRect());
      return {
        overlappingSections: sections.filter((rect, index) => index > 0 && rect.top < sections[index - 1].bottom - 1).length,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        smallTargets: innerWidth < 768 ? targets.filter((rect) => rect.width < 43.5 || rect.height < 43.5) : [],
        offscreenCards: cards.filter((rect) => rect.left < -1 || rect.right > innerWidth + 1).length,
      };
    });
    measurements.push({ phase: 'picker', ...size, ...result });
    if (output) await page.screenshot({ path: path.join(output, `scout-picker-${size.width}x${size.height}.png`), fullPage: true });
    assert.equal(result.horizontalOverflow, false, `Horizontal overflow at ${size.width}x${size.height}`);
    assert.equal(result.overlappingSections, 0, `Overlapping sections at ${size.width}x${size.height}`);
    assert.equal(result.offscreenCards, 0, `Offscreen card at ${size.width}x${size.height}`);
    assert.deepEqual(result.smallTargets, [], `Small touch targets at ${size.width}x${size.height}`);
  }

  await page.getByTestId('choose-round-sample-Technical AI Safety').click();
  await page.getByText('Alex Morgan', { exact: true }).first().waitFor();

  // Expanded content and the confirmation dialog also have to fit mobile.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('summary').filter({ hasText: 'Application' }).first().click();
  await page.locator('summary').filter({ hasText: 'Facilitator 1:1 report' }).first().click();
  if (output) await page.screenshot({ path: path.join(output, 'scout-mobile-expanded.png'), fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await page.getByRole('button', { name: 'Don’t invite', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  if (output) await page.screenshot({ path: path.join(output, 'scout-mobile-confirm.png'), fullPage: false });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Leave session', exact: true }).click();
  await page.getByRole('heading', { name: 'Apps', exact: true }).waitFor();
  assert.equal(await page.getByRole('main').getByRole('link', { name: /^Scout/ }).count(), 1);
  if (output) await page.screenshot({ path: path.join(output, 'portal-home.png'), fullPage: true });
  // Retina screenshots for the PR use actual mobile/touch emulation.
  if (output) {
    for (const [name, device] of [
      ['mobile', devices['iPhone 14']],
      ['desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }],
    ]) {
      const shotContext = await browser.newContext(device);
      const shot = await shotContext.newPage();
      await shot.goto(`${base}/scout`, { waitUntil: 'networkidle' });
      await shot.getByRole('button', { name: 'Explore local preview' }).click();
      await shot.getByTestId('choose-round-sample-Technical AI Safety').click();
      await shot.getByText('Research engineer · Example Research Institute · United Kingdom').waitFor();
      await shot.screenshot({ path: path.join(output, `scout-retina-${name}.png`), fullPage: true });
      await shotContext.close();
    }
  }

  assert.deepEqual(errors, []);
  if (output) await fs.writeFile(path.join(output, 'measurements.json'), JSON.stringify(measurements, null, 2));
  console.log(`PASS Scout sign-in, confirmations, failed save/retry, pending-write guards, skip/navigation, and ${sizes.length * 2} review/picker viewport states`);
} finally {
  await browser.close();
}
