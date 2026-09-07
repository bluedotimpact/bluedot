import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import { shouldIgnoreClientError, SENTRY_MIRRORED_PATTERNS } from './clientErrorIgnoreList';
import { reportClientError } from './reportClientError';

describe('reportClientError wiring', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })));
  });

  test('does not post denylisted noise', () => {
    reportClientError({ message: 'Script error.' }, 'window.onerror');
    expect(fetch).not.toHaveBeenCalled();
  });

  test('posts real errors', () => {
    reportClientError({ message: 'wiring-probe-unique-error-42' }, 'window.onerror');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('Sentry parity', () => {
  test('every mirrored pattern exists in instrumentation-client.ts ignoreErrors', () => {
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const src = fs.readFileSync(path.resolve(dirname, '..', 'instrumentation-client.ts'), 'utf8');
    const start = src.indexOf('ignoreErrors');
    const block = src.slice(start, src.indexOf('denyUrls', start));
    for (const pattern of SENTRY_MIRRORED_PATTERNS) {
      expect(block.toLowerCase()).toContain(pattern.source.toLowerCase());
    }
  });

  test('denylist matches the documented third-party messages', () => {
    expect(shouldIgnoreClientError('No Listener: tabs:outgoing.message.ready')).toBe(true);
  });
});
