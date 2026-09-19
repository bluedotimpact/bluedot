/* eslint-disable no-console */
/* eslint-disable no-await-in-loop -- Each flow uses one sequential browser session. */
/* global document, innerWidth, getComputedStyle */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const base = 'http://localhost:8000';
const output = process.argv[2];
if (output) await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
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
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  const mutations = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.url().includes('/api/') && request.method() !== 'GET') mutations.push(request.url());
  });
  await page.goto(`${base}/scout/designs/session?demo=1`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'BlueDot Apps', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Explore local preview' }).click();
  await page.getByTestId('choose-round-demo-round-0').waitFor();
  if (output) await page.screenshot({ path: path.join(output, 'session-picker.png'), fullPage: true });
  await page.getByTestId('choose-round-demo-round-0').click();
  await page.getByRole('heading', { name: 'Alex Morgan', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Invite to a call', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await page.getByRole('heading', { name: 'Sam Chen', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Undo last choice', exact: true }).click();
  await page.getByRole('heading', { name: 'Alex Morgan', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Invite to a call', exact: true }).click();
  await page.getByRole('button', { name: 'Save invitation draft', exact: true }).click();
  await page.getByRole('heading', { name: 'Sam Chen', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await page.getByRole('heading', { name: 'Your session, at a glance.' }).waitFor();
  await page.getByRole('button', { name: 'Return to skipped people' }).click();
  await page.getByRole('heading', { name: 'Sam Chen', exact: true }).waitFor();

  await page.goto(`${base}/scout/designs/inbox?demo=1`, { waitUntil: 'networkidle' });
  await page.getByRole('combobox', { name: 'Course', exact: true }).selectOption('Technical AI Safety');
  await page.getByRole('combobox', { name: 'Course round', exact: true }).selectOption('demo-round-0');
  assert.equal(await page.getByRole('region', { name: 'Participant list' }).getByRole('button').count(), 2);
  await page.getByRole('combobox', { name: 'Available evidence', exact: true }).selectOption('report');
  assert.equal(await page.getByRole('region', { name: 'Participant list' }).getByRole('button').count(), 1);
  await page.getByPlaceholder('Search by name').fill('no-match');
  await page.getByRole('heading', { name: 'No participants match these filters.' }).waitFor();
  await page.getByPlaceholder('Search by name').fill('');
  await page.getByRole('combobox', { name: 'Course', exact: true }).selectOption('Biosecurity');
  assert.equal(await page.getByRole('combobox', { name: 'Course round', exact: true }).getAttribute('value'), null);
  assert.equal(await page.getByRole('combobox', { name: 'Course round', exact: true }).evaluate((el) => el.value), '');
  await page.getByRole('combobox', { name: 'Course', exact: true }).selectOption('Technical AI Safety');
  await page.getByRole('heading', { name: 'Alex Morgan', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Full record', exact: true }).click();
  await page.getByText('registration in Airtable ↗').waitFor();
  await page.getByRole('button', { name: 'Decision brief', exact: true }).click();
  await page.getByRole('button', { name: 'Add to shortlist', exact: true }).click();
  await page.getByRole('button', { name: 'Review invitations (1)', exact: true }).click();
  await page.getByRole('dialog', { name: 'Review your invitations', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Back to review', exact: true }).click();
  await page.getByRole('button', { name: 'Undo last choice', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Review invitations (0)', exact: true }).isDisabled(), true);

  await page.goto(`${base}/scout/designs/board?demo=1`, { waitUntil: 'networkidle' });
  await page.getByRole('combobox', { name: 'Course', exact: true }).selectOption('Technical AI Safety');
  await page.getByRole('combobox', { name: 'Course round', exact: true }).selectOption('demo-round-0');
  await page.getByRole('button', { name: /^Alex Morgan/ }).click();
  await page.getByRole('button', { name: 'Add to shortlist', exact: true }).click();
  await page.getByRole('dialog', { name: 'Review participant', exact: true }).getByRole('button', { name: 'Close', exact: true }).click();
  assert.equal(await page.getByRole('region', { name: 'Shortlist', exact: true }).getByRole('button', { name: /^Alex Morgan/ }).count(), 1);
  await page.getByRole('button', { name: /^Sam Chen/ }).click();
  await page.getByRole('button', { name: 'Review later', exact: true }).click();
  await page.getByRole('dialog', { name: 'Review participant', exact: true }).getByRole('button', { name: 'Close', exact: true }).click();
  assert.equal(await page.getByRole('region', { name: 'Review later', exact: true }).getByRole('button', { name: /^Sam Chen/ }).count(), 1);

  for (const version of ['session', 'inbox', 'board']) {
    await page.goto(`${base}/scout/designs/${version}?demo=1`, { waitUntil: 'networkidle' });
    if (version === 'session') await page.getByTestId('choose-round-demo-round-0').click();
    if (version !== 'board') await page.getByRole('heading', { name: 'Alex Morgan', exact: true }).waitFor();
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.evaluate(() => globalThis.scrollTo(0, 0));
      await page.waitForTimeout(70);
      const result = await page.evaluate(() => {
        const visible = (el) => {
          const box = el.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== 'hidden';
        };

        const targets = [...document.querySelectorAll('main button, main a, main input, main select, main summary')].filter(visible).map((el) => ({ text: el.textContent.slice(0, 60), width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }));
        const sections = [...document.querySelector('main > div > div').children].filter(visible).map((el) => el.getBoundingClientRect());
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          smallTargets: innerWidth < 768 ? targets.filter((box) => box.height < 43.5 || box.width < 43.5) : [],
          overlaps: sections.filter((box, index) => index > 0 && box.top < sections[index - 1].bottom - 1).length,
        };
      });
      measurements.push({ version, ...size, ...result });
      if (output) await page.screenshot({ path: path.join(output, `${version}-${size.width}x${size.height}.png`), fullPage: true });
      assert.equal(result.overflow, false, `${version} overflow ${size.width}x${size.height}`);
      assert.deepEqual(result.smallTargets, [], `${version} small controls ${size.width}x${size.height}`);
      assert.equal(result.overlaps, 0, `${version} overlapping sections ${size.width}x${size.height}`);
    }

    if (version === 'board') {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: /^Alex Morgan/ }).click();
      await page.getByRole('heading', { name: 'Alex Morgan', exact: true }).waitFor();
      if (output) await page.screenshot({ path: path.join(output, 'board-mobile-evidence.png') });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    }
  }

  for (const version of ['session', 'inbox', 'board']) {
    for (const [name, device] of [['mobile', devices['iPhone 14']], ['desktop', { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 }]]) {
      const shotContext = await browser.newContext(device);
      const shot = await shotContext.newPage();
      await shot.goto(`${base}/scout/designs/${version}?demo=1`, { waitUntil: 'networkidle' });
      await shot.getByRole('button', { name: 'Explore local preview' }).click();
      if (version === 'session') await shot.getByTestId('choose-round-demo-round-0').click();
      if (version !== 'board') await shot.getByRole('button', { name: /^(Invite to a call|Add to shortlist)$/ }).waitFor({ state: 'visible' });
      if (version === 'board') await shot.getByRole('button', { name: /^Alex Morgan/ }).waitFor();
      if (output) await shot.screenshot({ path: path.join(output, `${version}-retina-${name}.png`), fullPage: true });
      await shotContext.close();
    }
  }

  assert.deepEqual(mutations, [], 'Design pages must not submit mutations');
  assert.deepEqual(errors, []);
  if (output) await fs.writeFile(path.join(output, 'measurements.json'), JSON.stringify(measurements, null, 2));
  console.log(`PASS three complete design flows, auth gate, course/round filters, undo, shortlist, invitation preview, no mutations, ${sizes.length * 3} viewport states`);
} finally {
  await browser.close();
}
