import { test, expect } from 'vitest';
import { version } from '@zoom/meetingsdk/package.json';
import { ZOOM_VERSION } from './MeetingView';

test('zoom package.json version matches source version', async () => {
  expect(version).toBe(ZOOM_VERSION);
});
