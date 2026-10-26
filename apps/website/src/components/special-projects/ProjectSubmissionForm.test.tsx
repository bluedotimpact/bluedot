import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import ProjectSubmissionForm from './ProjectSubmissionForm';

afterEach(() => vi.unstubAllGlobals());

const fillPitch = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByRole('textbox', { name: 'What outcome would you like to see in the world?' }), 'More people doing useful AI safety work.');
  await user.type(screen.getByRole('textbox', { name: 'Why?' }), 'It addresses a neglected problem.');
  await user.type(screen.getByRole('textbox', { name: 'How could someone make it happen/make progress towards it?' }), 'Build a useful resource.');
  return user;
};

describe('ProjectSubmissionForm', () => {
  test('accepts an idea without requiring an owner, identity, or contact details', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ received: true, reference: 'recSaved' })));
    vi.stubGlobal('fetch', fetch);
    render(<ProjectSubmissionForm />);
    const user = await fillPitch();
    await act(async () => user.click(screen.getByRole('button', { name: 'Send your idea' })));
    expect(await screen.findByRole('status')).toHaveTextContent('recSaved');
    expect(fetch).toHaveBeenCalledWith('/api/special-projects', expect.objectContaining({ method: 'POST' }));
    const payload = JSON.parse(fetch.mock.calls[0]![1].body as string);
    expect(payload).toMatchObject({
      outcome: 'More people doing useful AI safety work.',
      whyItMatters: 'It addresses a neglected problem.',
      approach: 'Build a useful resource.',
      submitterType: 'person',
      contact: '',
    });
    expect(payload).not.toHaveProperty('title');
  });

  test('preserves the draft when the server is busy', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 429 }));
    vi.stubGlobal('fetch', fetch);
    render(<ProjectSubmissionForm />);
    const user = await fillPitch();
    await act(async () => user.click(screen.getByRole('button', { name: 'Send your idea' })));
    expect(await screen.findByRole('alert')).toHaveTextContent('try again in a minute');
    expect(screen.getByRole('textbox', { name: 'What outcome would you like to see in the world?' })).toHaveValue('More people doing useful AI safety work.');
    expect(screen.getByRole('textbox', { name: 'How could someone make it happen/make progress towards it?' })).toHaveValue('Build a useful resource.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('does not report success without a receipt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    render(<ProjectSubmissionForm />);
    const user = await fillPitch();
    await act(async () => user.click(screen.getByRole('button', { name: 'Send your idea' })));
    expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t confirm');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
