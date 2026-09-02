import { fireEvent, render, screen } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import { AxiosError } from 'axios';
import { mockApi } from '../__tests__/testUtils';
import RecordAttendance from './record-attendance';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('groupDiscussionId=recDiscussion&participantId=recParticipant'),
}));

describe('/record-attendance', () => {
  test('shows a confirmation when the attendance update succeeds', async () => {
    mockApi(() => ({ status: 200, data: { type: 'success' } }));
    render(<RecordAttendance />);

    fireEvent.click(screen.getByText('Used native Zoom app'));

    expect(await screen.findByText('Thanks for marking your attendance!')).toBeTruthy();
  });

  test('shows the server error message when the attendance update fails', async () => {
    mockApi(() => ({ status: 404, data: { error: 'Resource not found' } }));
    render(<RecordAttendance />);

    fireEvent.click(screen.getByText('Used native Zoom app'));

    expect((await screen.findAllByText(/Resource not found/)).length).toBeGreaterThan(0);
  });

  test('keeps the form available to retry after a failure', async () => {
    mockApi(() => ({ status: 500, data: { error: 'Internal Server Error' } }));
    render(<RecordAttendance />);

    fireEvent.click(screen.getByText('Used native Zoom app'));
    await screen.findAllByText(/Internal Server Error/);

    mockApi(() => ({ status: 200, data: { type: 'success' } }));
    fireEvent.click(screen.getByText('Used native Zoom app'));

    expect(await screen.findByText('Thanks for marking your attendance!')).toBeTruthy();
  });

  test('shows an error when the request fails without a response', async () => {
    mockApi(() => new AxiosError('Network Error', AxiosError.ERR_NETWORK));
    render(<RecordAttendance />);

    fireEvent.click(screen.getByText('Used native Zoom app'));

    expect((await screen.findAllByText(/Network Error/)).length).toBeGreaterThan(0);
  });
});
