import {
  act, cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import {
  afterEach, beforeEach, expect, test, vi,
} from 'vitest';
import { useNavigationState } from '../lib/client/navigation';

vi.mock('../lib/client/api', () => ({ authFetch: vi.fn() }));

import { authFetch } from '../lib/client/api';
import { MoveCourseControl } from '../components/MoveCourseControl';

beforeEach(() => {
  useNavigationState.setState({ sessionActive: false, pendingWrites: 0, promptOpen: false });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const rounds = [
  { id: 'recTais', name: 'Technical AI Safety (2026 Oct W44) - Part-time' },
  { id: 'recTaisp', name: 'Technical AI Safety Project (2026 Nov W47) - Part-time' },
  { id: 'recAgis', name: 'AGI Strategy (2026 Oct W42) - Part-time' },
];

test('offers only rounds whose course exactly matches the target', async () => {
  vi.mocked(authFetch).mockResolvedValue({ ok: true, json: async () => ({ rounds }) } as Response);
  render(<MoveCourseControl applicationId="recOne" targetCourse="Technical AI Safety" allowed onMoved={() => {}} />);
  await act(async () => {});

  expect(screen.getByRole('option', { name: rounds[0]!.name })).toBeTruthy();
  // "Technical AI Safety Project" contains the target as a substring but is a different course.
  expect(screen.queryByRole('option', { name: rounds[1]!.name })).toBeNull();
  expect(screen.queryByRole('option', { name: rounds[2]!.name })).toBeNull();
});

test('keeps the move button disabled when the application does not allow the move', async () => {
  vi.mocked(authFetch).mockResolvedValue({ ok: true, json: async () => ({ rounds }) } as Response);
  render(<MoveCourseControl applicationId="recOne" targetCourse="Technical AI Safety" allowed={false} onMoved={() => {}} />);
  await act(async () => {});

  fireEvent.change(screen.getByLabelText('Move to:'), { target: { value: 'recTais' } });
  expect(screen.getByRole('button', { name: 'Move to Technical AI Safety' })).toHaveProperty('disabled', true);
});
