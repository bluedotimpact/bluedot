import {
  act, fireEvent, render, screen,
} from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import { mockApi } from '../__tests__/testUtils';
import SelectPersonView from './SelectPersonView';

const meetingParticipants = {
  type: 'success',
  groupDiscussionId: 'recDiscussion',
  participants: [{ id: 'recParticipant', name: 'Ada Lovelace', role: 'participant' }],
  meetingNumber: '123456789',
  meetingPassword: 'abc123',
  meetingHostKey: '654321',
  meetingStartTime: 1735689600,
  meetingEndTime: 1735693200,
};

describe('SelectPersonView', () => {
  test('shows an error when the participants cannot be loaded', async () => {
    mockApi(() => ({ status: 404, data: { error: 'No discussions found for this group.' } }));
    render(<SelectPersonView page={{ name: 'select', groupId: 'recGroup' }} setPage={vi.fn()} />);

    expect((await screen.findAllByText(/No discussions found for this group./)).length).toBeGreaterThan(0);
  });

  test('shows an error and stays on the page when recording attendance fails', async () => {
    mockApi((url) => (url.endsWith('meeting-participants')
      ? { status: 200, data: meetingParticipants }
      : { status: 500, data: { error: 'Internal Server Error' } }));
    const setPage = vi.fn();
    render(<SelectPersonView page={{ name: 'select', groupId: 'recGroup' }} setPage={setPage} />);

    fireEvent.click(await screen.findByText('Ada Lovelace'));

    expect((await screen.findAllByText(/Internal Server Error/)).length).toBeGreaterThan(0);
    expect(setPage).not.toHaveBeenCalled();
  });

  test('joins the meeting when recording attendance succeeds', async () => {
    mockApi((url) => (url.endsWith('meeting-participants')
      ? { status: 200, data: meetingParticipants }
      : { status: 200, data: { type: 'success' } }));
    const setPage = vi.fn();
    render(<SelectPersonView page={{ name: 'select', groupId: 'recGroup' }} setPage={setPage} />);

    const person = await screen.findByText('Ada Lovelace');
    await act(async () => {
      fireEvent.click(person);
    });

    expect(setPage).toHaveBeenCalledWith({
      name: 'appJoin',
      meetingNumber: '123456789',
      meetingPassword: 'abc123',
      meetingHostKey: undefined,
      activityDoc: undefined,
    });
  });

  test('passes the host key when a host records attendance', async () => {
    mockApi((url) => (url.endsWith('meeting-participants')
      ? { status: 200, data: { ...meetingParticipants, participants: [{ id: 'recHost', name: 'Grace Hopper', role: 'host' }] } }
      : { status: 200, data: { type: 'success' } }));
    const setPage = vi.fn();
    render(<SelectPersonView page={{ name: 'select', groupId: 'recGroup' }} setPage={setPage} />);

    const host = await screen.findByText('Grace Hopper');
    await act(async () => {
      fireEvent.click(host);
    });

    expect(setPage).toHaveBeenCalledWith(expect.objectContaining({ name: 'appJoin', meetingHostKey: '654321' }));
  });

  test('does not pass the host key when joining without registering attendance', async () => {
    mockApi(() => ({ status: 200, data: meetingParticipants }));
    const setPage = vi.fn();
    render(<SelectPersonView page={{ name: 'select', groupId: 'recGroup' }} setPage={setPage} />);

    fireEvent.click(await screen.findByText('Join without registering attendance.'));

    expect(setPage).toHaveBeenCalledWith({
      name: 'appJoin',
      meetingNumber: '123456789',
      meetingPassword: 'abc123',
      activityDoc: undefined,
    });
    expect(setPage.mock.calls[0]?.[0]).not.toHaveProperty('meetingHostKey');
  });
});
