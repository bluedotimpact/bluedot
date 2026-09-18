/* eslint-disable no-console */
/* eslint-disable no-await-in-loop -- Keyboard checks share one page and must run sequentially. */
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
  assert.equal(await page.getByRole('heading', { name: 'Speed Reviewer', exact: true }).count(), 0);
  assert.equal(await page.locator('header').isVisible(), false);
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('heading', { name: 'Apps', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('button', { name: 'Expand sidebar' }).count(), 1);
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  // The course-page shortcut toggles and persists the same preference as the button.
  await page.keyboard.press('Meta+b');
  await page.getByRole('button', { name: 'Expand sidebar' }).waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('button', { name: 'Expand sidebar' }).count(), 1);
  await page.keyboard.press('Control+b');
  await page.getByRole('button', { name: 'Collapse sidebar' }).waitFor();
  const dispatchShortcut = (options) => page.evaluate((init) => {
    const event = new globalThis.KeyboardEvent('keydown', {
      bubbles: true, cancelable: true, code: 'KeyB', key: 'b', ...init,
    });
    globalThis.document.activeElement.dispatchEvent(event);
    return event.defaultPrevented;
  }, options);
  for (const modifiers of [{}, { metaKey: true, shiftKey: true }, { ctrlKey: true, altKey: true }, { metaKey: true, ctrlKey: true }]) {
    assert.equal(await dispatchShortcut(modifiers), false);
    assert.equal(await page.getByRole('button', { name: 'Collapse sidebar' }).count(), 1);
  }

  assert.equal(await dispatchShortcut({ metaKey: true, key: 'x' }), true, 'Use the physical B key across keyboard layouts');
  await page.getByRole('button', { name: 'Expand sidebar' }).waitFor();
  await page.keyboard.press('Meta+b');
  await page.getByRole('button', { name: 'Collapse sidebar' }).waitFor();
  for (const kind of ['input', 'textarea', 'rich-editor', 'plain-editor']) {
    await page.evaluate((type) => {
      const editor = globalThis.document.createElement(type.endsWith('editor') ? 'div' : type);
      editor.id = 'shortcut-test-editor';
      if (type.endsWith('editor')) {
        editor.contentEditable = type === 'plain-editor' ? 'plaintext-only' : 'true';
        const child = globalThis.document.createElement('span');
        child.tabIndex = 0;
        editor.append(child);
      }

      globalThis.document.body.append(editor);
      (editor.firstElementChild ?? editor).focus();
    }, kind);
    assert.equal(await dispatchShortcut({ metaKey: true }), false, `Keep Cmd+B in ${kind}`);
    assert.equal(await dispatchShortcut({ ctrlKey: true }), false, `Keep Ctrl+B in ${kind}`);
    assert.equal(await page.getByRole('button', { name: 'Collapse sidebar' }).count(), 1);
    await page.locator('#shortcut-test-editor').evaluate((editor) => editor.remove());
  }

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
  assert.equal(await page.getByRole('button', { name: 'Open navigation' }).count(), 0);
  assert.equal(await dispatchShortcut({ metaKey: true }), false, 'Signed-out pages leave browser shortcuts alone');
  assert.deepEqual(errors, [], 'browser errors');
  console.log('PASS browser Back and Forward confirmation, sign-out');
} finally {
  await browser.close();
}
