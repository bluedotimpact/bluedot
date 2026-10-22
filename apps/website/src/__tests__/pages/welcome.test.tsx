import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import WelcomePage from '../../pages/welcome';

const routerQuery: { current: Record<string, string> } = { current: {} };
vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/welcome', isReady: true, query: routerQuery.current }),
}));

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  routerQuery.current = {};
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('/welcome', () => {
  test('asks for the password and connects Google Calendar', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: 'That password isn\'t right.' }), { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<WelcomePage />);

    expect(await screen.findByRole('heading', { name: 'Welcome to BlueDot!' })).toBeInTheDocument();
    expect(container).toMatchSnapshot();

    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect Google Calendar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That password isn\'t right.');
    expect(fetchMock).toHaveBeenCalledWith('/api/welcome/google/start', expect.objectContaining({ method: 'POST' }));
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({ password: 'wrong' });
  });

  test('shows who they are meeting after booking', async () => {
    routerQuery.current = {
      chats: JSON.stringify([
        { name: 'Alex Groth', start: '2026-10-20T17:00:00.000Z' },
        { name: 'Bilal Chughtai', start: '2026-10-21T14:30:00.000Z' },
      ]),
      missing: '3',
    };
    render(<WelcomePage />);

    expect(await screen.findByRole('heading', { name: 'You\'re all set!' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Your calls' });
    expect(list).toHaveTextContent('Alex Groth');
    expect(list).toHaveTextContent('Bilal Chughtai');
    expect(screen.getByText(/couldn't find a time for 3 more calls/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect Google Calendar' })).not.toBeInTheDocument();
  });

  test('explains what went wrong when Google sends them back with an error', async () => {
    routerQuery.current = { error: 'missing_scope' };
    render(<WelcomePage />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('We need to see when you\'re busy'));
    expect(screen.getByRole('button', { name: 'Connect Google Calendar' })).toBeInTheDocument();
  });
});
