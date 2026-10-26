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
  await user.type(screen.getByRole('textbox', { name: /Project title/ }), 'An important project');
  await user.type(screen.getByRole('textbox', { name: /What should someone work on/ }), 'Build a useful resource.');
  await user.type(screen.getByRole('textbox', { name: /Why does it matter/ }), 'It addresses a neglected problem.');
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
    expect(payload).toMatchObject({ title: 'An important project', submitterType: 'person', contact: '' });
  });

  test('preserves an agent’s draft when the server is busy', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 429 }));
    vi.stubGlobal('fetch', fetch);
    render(<ProjectSubmissionForm />);
    const user = await fillPitch();
    await user.click(screen.getByRole('radio', { name: 'An AI agent' }));
    await act(async () => user.click(screen.getByRole('button', { name: 'Send your idea' })));
    expect(await screen.findByRole('alert')).toHaveTextContent('try again in a minute');
    expect(screen.getByRole('textbox', { name: /Project title/ })).toHaveValue('An important project');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(JSON.parse(fetch.mock.calls[0]![1].body as string).submitterType).toBe('agent');
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
