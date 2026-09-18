/* eslint-disable max-depth -- Pairwise sibling overlap checks intentionally nest. */
/* eslint-disable no-console, no-await-in-loop -- Sequential headless workflow and viewport regression checks. */
/** Real workflows against a temporary synthetic server. Never runs a paid model. */
import assert from 'node:assert/strict';
import {
  mkdtemp, mkdir, rm, writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
const output
  = process.env.UI_OUTPUT_DIR
    || (await mkdtemp(path.join(tmpdir(), 'talent-workbench-check-')));
await mkdir(output, { recursive: true });
const base = process.env.PORTAL_TEST_URL || 'http://localhost:8011';
const engine = process.env.CANDIDATE_TEST_ENGINE_URL;
assert.ok(engine, 'Set CANDIDATE_TEST_ENGINE_URL to a fresh synthetic fixture');
assert.equal((await (await fetch(new URL('/api/health', engine))).json()).synthetic, true, 'Refusing mutations against a real candidate engine');
const headers = { authorization: 'Bearer local-preview-synthetic-data' };
assert.equal((await fetch(`${base}/api/rounds`, { headers })).status, 200, 'Start the portal in synthetic preview mode');
const url = `${base}/candidate-sourcing`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const wait = async (fn, arg) => {
  const deadline = Date.now() + 30000;
  while (!(await page.evaluate(fn, arg))) {
    if (Date.now() > deadline) throw Error(`Condition timed out: ${fn}`);
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }
};

const enginePath = (route) => {
  const id = new URL(page.url()).pathname.split('/')[2];
  return new URL(`${id ? `/search/${id}` : ''}/api/${route}`, engine);
};

const api = async (route) => (await fetch(enginePath(route))).json();
const waitFor = async (fn) => {
  const deadline = Date.now() + 30000;
  while (!(await fn())) {
    if (Date.now() > deadline) throw Error('Engine condition timed out');
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }
};

const notes = (text) => page.getByLabel(/^Notes for /).fill(text);
const saved = () =>
  wait(() =>
    globalThis.document.querySelector('.ts-review [role=status]')?.textContent
    === 'Saved');
const view = async (value) => {
  await page.getByRole('button', { name: /^Filters/ }).click();
  await page.getByLabel('People to show', { exact: true }).selectOption(value);
  await page.getByRole('button', { name: /^Show \d+ people$/ }).click();
};

const person = (key) => page.locator(`[data-person="${key}"]`).click();
const feedback = async () => {
  await page
    .getByRole('button', { name: 'Review feedback', exact: true })
    .click();
  await page
    .getByRole('button', { name: /^Apply & update all/ })
    .waitFor({ timeout: 30000 });
};

const assess = async (count) => {
  await page
    .getByRole('button', { name: 'Assess people', exact: true })
    .click();
  await page
    .getByLabel('Additional people', { exact: true })
    .fill(String(count));
  await page
    .getByRole('button', {
      name: `Assess ${count} ${count === 1 ? 'person' : 'people'}`,
      exact: true,
    })
    .click();
};

try {
  await page.goto(url);
  await page.getByRole('button', { name: 'Explore local preview' }).click();
  await page.waitForSelector('.ts-person-row');
  assert.equal(
    await page.locator('#search-picker option:checked').textContent(),
    'Research Program Lead',
  );
  assert.equal(await page.locator('.ts-person-row').count(), 2);
  assert.equal(
    await page.locator('.ts-pool-count').textContent(),
    '2 assessed of 105 people',
  );
  assert.equal(
    await page.locator('.ts-heading h1').textContent(),
    'Candidate sourcing',
  );
  assert.equal(
    await page.locator('.ts-search-meta button + .ts-pool-count').count(),
    1,
  );

  await page.locator('.ts-person-row').first().click();
  await page.keyboard.press('j');
  assert.equal(
    await page.locator('.ts-profile h2').textContent(),
    'Candidate 1',
  );
  await page.keyboard.press('k');
  assert.match(
    await page.locator('.ts-profile h2').textContent(),
    /Alex Example/,
  );
  await view('all');
  assert.equal(await page.locator('.ts-person-row').count(), 50);
  await page.getByLabel('Next page', { exact: true }).click();
  const secondKey = await page
    .locator('.ts-person-row')
    .first()
    .getAttribute('data-person');
  await page.locator('.ts-person-row').first().click();
  await notes('Pagination note survives changing pages.');
  await saved();
  await page.getByLabel('Next page', { exact: true }).click();
  assert.equal(await page.locator('.ts-person-row').count(), 5);
  await page.getByLabel('Previous page', { exact: true }).click();
  await person(secondKey);
  assert.equal(
    await page.getByLabel(/^Notes for /).inputValue(),
    'Pagination note survives changing pages.',
  );
  await page
    .getByLabel('Search people', { exact: true })
    .fill('New Candidate 102');
  assert.equal(await page.locator('.ts-person-row').count(), 1);
  await page.getByLabel('Search people', { exact: true }).fill('');
  await view('scored');
  await person('person-0');
  await notes('Manager reports exceptional repeated delivery.');
  await saved();
  await page.getByRole('tab', { name: 'To review', exact: true }).click();
  assert.equal(
    await page.locator('.ts-person-row').count(),
    2,
    'A note alone does not finish reviewing a person',
  );
  await page.getByRole('tab', { name: 'Shortlisted', exact: true }).click();
  assert.equal(await page.locator('.ts-person-row').count(), 0);
  await page.getByRole('tab', { name: 'All assessed', exact: true }).click();
  await person('person-0');
  await page.getByRole('button', { name: 'Shortlist', exact: true }).click();
  await wait(() =>
    globalThis.document
      .querySelector('.ts-decisions button')
      ?.getAttribute('aria-pressed') === 'true');
  // Click immediately after typing: export must wait for the saved review.
  await notes('Manager reports exceptional repeated delivery.');
  await page
    .getByRole('button', { name: /^Add Alex.*to Ashby as a lead/ })
    .click();
  await wait(() => globalThis.document.querySelector('.ts-star')?.textContent.trim() === '★');
  await page.getByRole('tab', { name: 'Shortlisted', exact: true }).click();
  assert.equal(await page.locator('.ts-person-row').count(), 1);
  await page.getByRole('button', { name: 'Shortlist', exact: true }).click();
  await wait(() =>
    globalThis.document
      .querySelector('.ts-decisions button')
      ?.getAttribute('aria-pressed') === 'false');
  assert.equal(
    await page.locator('.ts-person-row').count(),
    1,
    'A starred person remains shortlisted',
  );
  await page.getByRole('button', { name: 'Shortlist', exact: true }).click();
  await saved();
  await page.getByRole('tab', { name: 'To review', exact: true }).click();
  assert.equal(await page.locator('.ts-person-row').count(), 1);
  assert.equal(
    await page.locator('.ts-person-row').first().getAttribute('data-person'),
    'person-1',
  );
  await page.getByRole('tab', { name: 'To review', exact: true }).press('Home');
  assert.equal(
    await page
      .getByRole('tab', { name: 'All assessed', exact: true })
      .getAttribute('aria-selected'),
    'true',
  );
  await page.reload();
  await page.waitForSelector('.ts-person-row');
  assert.equal(
    await page.getByLabel(/^Notes for /).inputValue(),
    'Manager reports exceptional repeated delivery.',
  );
  assert.equal((await api('data')).ashby_leads['person-0'].status, 'complete');
  // A stale review is kept as a draft and requires a comparison before retry.
  const review = (await api('reviews'))['person-0'];
  const { token } = await api('searches');
  const changed = await fetch(enginePath('review'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: engine, 'X-Review-Token': token },
    // eslint-disable-next-line camelcase -- Python engine wire format.
    body: JSON.stringify({ person_key: 'person-0', version: review.version, patch: { notes: 'Changed in another tab.' } }),
  });
  assert.equal(changed.status, 200);
  await notes('Retained conflict draft.');
  await page.getByRole('button', { name: 'Refresh saved review' }).waitFor();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('dialog').filter({ hasText: 'Leave with an unsaved review?' }).waitFor();
  await page.getByRole('button', { name: 'Stay here', exact: true }).click();
  assert.equal(new URL(page.url()).pathname, '/candidate-sourcing');
  await page.getByRole('button', { name: 'Refresh saved review' }).click();
  await page.getByRole('button', { name: 'Save this draft' }).click();
  await saved();
  assert.equal(
    (await api('reviews'))['person-0'].notes,
    'Retained conflict draft.',
  );
  console.log('PASS pagination, review persistence, Ashby export and review conflict');
  await feedback();
  const oldRevision = (await api('data')).revision;
  await page
    .getByRole('button', { name: /^Apply & update all 2 assessed people/ })
    .click();
  await page.getByRole('button', { name: 'Review finished updates' }).waitFor();
  assert.equal((await api('data')).revision, oldRevision);
  assert.equal(await page.locator('.ts-person-row').count(), 2);
  assert.equal(
    await page.locator('[data-person="person-0"] .ts-row-score').textContent(),
    '40',
  );
  await page.getByRole('button', { name: 'Review finished updates' }).click();
  assert.equal(await page.locator('.ts-person-row').count(), 1);
  await notes('Finish feedback update and retain this human note.');
  await saved();
  await waitFor(async () => (await api('data')).revision !== oldRevision);
  await wait(() =>
    globalThis.document.querySelector('.ts-job b')?.textContent === 'Ranking updated');
  await view('scored');
  assert.equal(await page.locator('.ts-person-row').count(), 2);
  assert.match(await page.locator('.ts-row-score').first().textContent(), /48/);
  // Cancellation retains old criteria/ranking and all notes.
  await person('person-0');
  await notes('Cancel the next feedback update.');
  await saved();
  await feedback();
  const beforeCancel = (await api('data')).revision;
  await page
    .getByRole('button', { name: /^Apply & update all 2 assessed people/ })
    .click();
  await page
    .locator('.ts-job').getByRole('button', { name: 'Cancel update', exact: true })
    .click();
  await wait(() =>
    globalThis.document.querySelector('.ts-job b')?.textContent
    === 'Assessment cancelled');
  assert.equal((await api('data')).revision, beforeCancel);
  console.log('PASS feedback apply and cancellation');
  await assess(41);
  await page.getByRole('button', { name: 'Review finished people' }).waitFor();
  await page.getByRole('button', { name: 'Review finished people' }).click();
  await person('new-000');
  await notes('Early note saved while assessment runs.');
  await saved();
  await page
    .getByRole('button', { name: 'Cancel assessment', exact: true })
    .click();
  await wait(() =>
    globalThis.document.querySelector('.ts-job b')?.textContent
    === 'Assessment cancelled');
  assert.equal((await api('data')).revision, beforeCancel);
  assert.equal(
    (await api('reviews'))['new-000'].notes,
    'Early note saved while assessment runs.',
  );
  await assess(3);
  await page.getByRole('button', { name: 'Review finished people' }).waitFor();
  await page.getByRole('button', { name: 'Review finished people' }).click();
  await person('new-000');
  await notes('Finish this run while I keep typing.');
  await saved();
  await wait(() =>
    globalThis.document.querySelector('.ts-job b')?.textContent === 'Ranking updated');
  assert.equal(
    (await api('data')).people.filter((p) => p.assessment).length,
    5,
  );
  // Complete a full-pool assessment through the actual control.
  await page
    .getByRole('button', { name: 'Assess people', exact: true })
    .click();
  await page
    .getByText('Assess the entire pool afresh', { exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Evaluate all 105 people afresh' })
    .click();
  await waitFor(async () => (await api('data')).people.filter((p) => p.assessment).length === 105);
  await wait(() =>
    globalThis.document.querySelector('.ts-job b')?.textContent === 'Ranking updated');
  assert.equal(
    (await api('data')).people.filter((p) => p.assessment).length,
    105,
  );
  await view('scored');
  assert.equal(await page.locator('.ts-person-row').count(), 50);
  console.log('PASS partial assessment, cancellation and full-pool ranking');
  // Viewports with real populated content and a long note, including portal-width containment.
  await person('person-0');
  await notes('Long reviewer note. '.repeat(30));
  await saved();
  await page.getByLabel('Dismiss assessment status').click();
  const sizes = [320, 480, 600, 720, 1024, 1440].flatMap((width) =>
    [700, 1400].map((height) => ({ width, height })));
  sizes.push({ width: 1440, height: 1800 }, ...[
    [390, 844], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080],
  ].map(([width, height]) => ({ width, height })));
  const results = [];
  const check = async (name) => {
    const result = await page.evaluate(() => {
      const visible = (el) => el.getClientRects().length > 0;
      const overlaps = [];
      for (const selector of [
        '.ts-heading',
        '.ts-search-tools',
        '.ts-list-search',
        '.ts-review-tabs',
        '.ts-list-meta',
        '.ts-profile-title',
        '.ts-profile-nav',
        '.ts-pagination',
        '.ts-decisions',
        '.ts-section-heading',
        '.ts-dialog-head',
      ]) {
        for (const parent of globalThis.document.querySelectorAll(selector)) {
          const children = [...parent.children].filter((el) => visible(el) && !el.classList.contains('ts-sr'));
          for (let i = 0; i < children.length; i++) {
            for (let j = i + 1; j < children.length; j++) {
              const a = children[i].getBoundingClientRect();
              const b = children[j].getBoundingClientRect();
              if (
                Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
                && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
              ) {
                overlaps.push(selector);
              }
            }
          }
        }
      }

      const controls = [
        ...globalThis.document.querySelectorAll('button,input,textarea,select'),
      ]
        .filter(visible)
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.left < -1 || r.right > globalThis.innerWidth + 1;
        })
        .map((el) => el.textContent || el.id);
      return {
        width: globalThis.innerWidth,
        height: globalThis.innerHeight,
        overflow: globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1,
        vertical: globalThis.document.documentElement.scrollHeight > globalThis.innerHeight + 1,
        overlaps,
        controls,
        rows: globalThis.document.querySelectorAll('.ts-person-row').length,
        dialogsCentered: [...globalThis.document.querySelectorAll('dialog[open].ts-dialog')].every((dialog) => {
          const rect = dialog.getBoundingClientRect();
          return Math.abs(rect.left + rect.width / 2 - globalThis.innerWidth / 2) < 2
            && Math.abs(rect.top + rect.height / 2 - globalThis.innerHeight / 2) < 2;
        }),
      };
    });
    assert.equal(result.overflow, false, `${name} horizontal overflow`);
    assert.deepEqual(result.overlaps, [], `${name} overlaps`);
    assert.deepEqual(result.controls, [], `${name} controls overflow`);
    assert.ok(result.rows <= 50);
    assert.ok(result.dialogsCentered, `${name} dialog centered in portal`);
    if (!name.includes('dialog')) {
      assert.equal(result.vertical, false, `${name} desktop must fit viewport`);
    }

    await page.screenshot({
      path: path.join(output, `${name}.png`),
      fullPage: true,
    });
    results.push({ name, ...result });
  };

  for (const size of sizes) {
    await page.setViewportSize(size);
    const narrow = (await page.locator('.talent-workbench').boundingBox()).width <= 700;
    if (
      narrow
      && (await page
        .getByRole('button', { name: '← People', exact: true })
        .isVisible())
    ) {
      await page.getByRole('button', { name: '← People', exact: true }).click();
    }

    await check(`list-${size.width}x${size.height}`);
    if (narrow) {
      await page.locator('.ts-person-row').first().click();
      await check(`profile-${size.width}x${size.height}`);
      await page.getByRole('button', { name: '← People', exact: true }).click();
    }
  }

  for (const width of [320, 720, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole('button', { name: 'Scoring criteria', exact: true })
      .click();
    await check(`criteria-dialog-${width}`);
    await page.getByRole('button', { name: 'Close Scoring criteria' }).click();
    await page.getByRole('button', { name: /^Filters/ }).click();
    await check(`filters-dialog-${width}`);
    await page.getByRole('button', { name: 'Close Filter people' }).click();
  }

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await check('collapsed-sidebar-1024');
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  // Creating a new search uses the same typed API and scoped routes.
  await page.reload();
  await page.waitForSelector('.ts-person-row');
  await page
    .getByRole('button', { name: '＋ New search', exact: true })
    .click();
  await page
    .locator('.ts-setup')
    .getByLabel('Open role in Ashby', { exact: true })
    .selectOption('22222222-2222-4222-8222-222222222222');
  await page
    .getByLabel('People to search', { exact: true })
    .selectOption('upload');
  await page.getByLabel('People CSV', { exact: true }).setInputFiles({
    name: 'synthetic.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('ID,Name,Experience\na,Taylor Example,Built research tools\na,Morgan Example,Led a research team\n'),
  });
  await page.getByLabel('Full name', { exact: true }).waitFor();
  await page
    .getByLabel('Role brief', { exact: true })
    .fill('Build reliable research tools and lead a small engineering team.');
  await page
    .getByRole('button', { name: 'Draft scoring criteria', exact: true })
    .click();
  await page.getByLabel('Scoring rubric', { exact: true }).waitFor();
  await page
    .getByLabel('Unique ID (optional)', { exact: true })
    .selectOption('ID');
  await page
    .getByRole('button', { name: 'Create search with these criteria' })
    .click();
  await wait(() =>
    globalThis.document
      .querySelector('.ts-setup [role=status]')
      ?.textContent.includes('Morgan'));
  await page
    .getByLabel('Unique ID (optional)', { exact: true })
    .selectOption('');
  await page
    .getByRole('button', { name: 'Create search with these criteria' })
    .click();
  await page.waitForURL('**/candidate-sourcing/*');
  await page.waitForSelector('.ts-person-row');
  assert.equal(
    await page.locator('#search-picker option:checked').textContent(),
    'Engineering Lead',
  );
  assert.equal(await page.locator('.ts-person-row').count(), 2);
  await page.locator('.ts-person-row').first().click();
  await notes('New search keeps its own review.');
  await saved();
  await page
    .locator('#search-picker')
    .selectOption('11111111-1111-4111-8111-111111111111');
  await page.waitForURL(url);
  await page.waitForSelector('.ts-person-row');
  assert.equal(
    await page.locator('#search-picker option:checked').textContent(),
    'Research Program Lead',
  );
  // A role with no search opens setup and reuses source people without old scores.
  await page
    .locator('#search-picker')
    .selectOption('33333333-3333-4333-8333-333333333333');
  await page
    .getByRole('button', { name: 'Draft scoring criteria', exact: true })
    .click();
  await page.getByLabel('Scoring rubric', { exact: true }).waitFor();
  for (const size of sizes) {
    await page.setViewportSize(size);
    await check(`setup-dialog-${size.width}x${size.height}`);
  }

  await page
    .getByRole('button', { name: 'Create search with these criteria' })
    .click();
  await page.waitForURL('**/candidate-sourcing/*');
  await wait(() =>
    globalThis.document.querySelector('.ts-pool-count')?.textContent
    === '0 assessed of 105 people');
  const reused = await api('data');
  assert.ok(reused.people.every((p) => !p.assessment && p.overall === null));
  assert.deepEqual(reused.reviews, {});
  assert.equal(
    reused.workspace.ashby_job.id,
    '33333333-3333-4333-8333-333333333333',
  );
  assert.deepEqual(errors, [], 'No browser errors');
  await writeFile(
    path.join(output, 'results.json'),
    JSON.stringify(results, null, 2),
  );
  console.log(`Workbench workflows passed; ${results.length} screenshots and viewport checks. ${output}`);
} catch (error) {
  await page.screenshot({
    path: path.join(output, 'failure.png'),
    fullPage: true,
  });
  await writeFile(path.join(output, 'failure.html'), await page.content());
  throw error;
} finally {
  await browser.close();
  if (!process.env.UI_OUTPUT_DIR) {
    await rm(output, { recursive: true, force: true });
  }
}
