/* eslint-disable no-console */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = 'http://localhost:8000';
const headers = { authorization: 'Bearer local-preview-synthetic-data', 'content-type': 'application/json' };
const reset = async () => {
  await Promise.all(['recSamplePerson01', 'recSamplePerson02', 'recSamplePerson03', 'recSamplePerson04'].map(async (id) => {
    const r = await fetch(`${base}/api/reset-opinion`, { method: 'POST', headers, body: JSON.stringify({ applicationId: id }) });
    assert.equal(r.status, 204);
  }));
};

assert.equal((await fetch(`${base}/api/rounds`, { headers })).status, 200, 'Start the synthetic local preview before running this check');
await reset();
assert.equal((await fetch(`${base}/api/rounds`)).status, 401);
const browser = await chromium.launch({ headless: true });
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/speed-review`, { waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('heading', { name: 'BlueDot Apps' }).count(), 1);
  assert.equal(await page.getByText('Alex Morgan', { exact: true }).count(), 0);
  assert.equal(await page.getByRole('navigation', { name: 'Apps' }).count(), 0);
  assert.equal(await page.getByText('Speed Reviewer', { exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Open navigation' }).count(), 0);
  assert.equal(await page.getByRole('link', { name: 'Continue with Google' }).getAttribute('href'), '/login?redirect_to=%2Fspeed-review');
  await page.getByRole('button', { name: 'Explore local preview' }).click();
  await page.getByRole('button', { name: 'AGI Strategy (sample round)', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('heading', { name: 'Apps', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('button', { name: 'Expand sidebar' }).count(), 1);
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await page.getByRole('link', { name: 'Speed Reviewer', exact: true }).click();
  await page.getByRole('button', { name: 'AGI Strategy (sample round)', exact: true }).click();
  await page.getByText('Alex Morgan', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Pause timer' }).click();
  // Failed rating stays on the application; retry commits once and advances.
  await page.route('**/api/decisions', (route) => route.fulfill({ status: 500, body: '{"error":"Simulated save failure"}', contentType: 'application/json' }));
  await page.getByRole('button', { name: 'Yes →', exact: true }).click();
  await page.getByRole('heading', { name: 'Save failed', exact: true }).waitFor();
  await page.unroute('**/api/decisions');
  await page.getByRole('button', { name: 'Retry save' }).click();
  await page.getByText('Sam Chen', { exact: true }).waitFor();
  // Leaving a session is explicit, and cancelling preserves the current application.
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('dialog').filter({ hasText: 'Leave this review session?' }).waitFor();
  await page.getByRole('button', { name: 'Stay here', exact: true }).click();
  assert.equal(await page.getByText('Sam Chen', { exact: true }).count(), 1);
  assert.equal(new URL(page.url()).pathname, '/speed-review');
  // The browser Back button must also show the guard and restore the URL when cancelled.
  await page.goBack();
  await page.getByRole('dialog').filter({ hasText: 'Leave this review session?' }).waitFor();
  await page.getByRole('button', { name: 'Stay here', exact: true }).click();
  await page.waitForTimeout(250);
  assert.equal(new URL(page.url()).pathname, '/speed-review');
  assert.equal(await page.getByText('Sam Chen', { exact: true }).count(), 1);
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Leave session', exact: true }).click();
  await page.getByRole('heading', { name: 'Apps', exact: true }).waitFor();
  console.log('PASS sign-in gate, deep link, preference, failed save/retry, navigation and browser Back guards');
  await reset();
  // Confirming browser Back and Forward must preserve the requested destination.
  const startReview = async () => {
    await page.getByRole('button', { name: 'AGI Strategy (sample round)', exact: true }).click();
    await page.getByText('Alex Morgan', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Pause timer' }).click();
  };

  await page.getByRole('link', { name: 'Speed Reviewer', exact: true }).click();
  await startReview();
  await page.goBack();
  await page.getByRole('button', { name: 'Leave session', exact: true }).click();
  await page.getByRole('heading', { name: 'Apps', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Speed Reviewer', exact: true }).click();
  await startReview();
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Leave session', exact: true }).click();
  await page.getByRole('heading', { name: 'Apps', exact: true }).waitFor();
  await page.goBack();
  await startReview();
  await page.goForward();
  await page.getByRole('button', { name: 'Stay here', exact: true }).click();
  await page.waitForTimeout(250);
  assert.equal(new URL(page.url()).pathname, '/speed-review');
  assert.equal(await page.getByText('Alex Morgan', { exact: true }).count(), 1);
  await page.goForward();
  await page.getByRole('button', { name: 'Leave session', exact: true }).click();
  await page.getByRole('heading', { name: 'Apps', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('heading', { name: 'BlueDot Apps', exact: true }).waitFor();
  assert.equal(await page.getByRole('navigation', { name: 'Apps' }).count(), 0);
  assert.equal(await page.getByText('Speed Reviewer', { exact: true }).count(), 0);
  assert.deepEqual(errors, [], 'browser errors');
  console.log('PASS browser Back and Forward confirmation, sign-out');
} finally {
  await browser.close();
}
