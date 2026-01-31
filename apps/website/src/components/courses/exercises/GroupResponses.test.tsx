import '@testing-library/jest-dom';
import {
  render, screen, fireEvent,
} from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { server, trpcMsw } from '../../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../../__tests__/trpcProvider';
import GroupResponses from './GroupResponses';

// Mock MarkdownExtendedRenderer to just render children as text
vi.mock('../MarkdownExtendedRenderer', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}));

const EXERCISE_ID = 'ex1';

const twoResponses = [
  { name: 'Alice', response: 'Short answer' },
  { name: 'Bob', response: 'Another answer' },
];

const makeGroupData = (overrides: Record<string, unknown> = {}) => ({
  groups: [{ id: 'g1', name: 'Group A' }],
  selectedGroupId: 'g1',
  totalParticipants: 5,
  responses: { [EXERCISE_ID]: twoResponses },
  ...overrides,
});

beforeEach(() => {
  server.use(
    trpcMsw.exercises.getGroupExerciseResponses.query(() => makeGroupData()),
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('GroupResponses', () => {
  test('renders response count and pending count', async () => {
    render(<GroupResponses courseSlug="test" exerciseId={EXERCISE_ID} />, { wrapper: TrpcProvider });
    expect(await screen.findByText('2 Responses')).toBeInTheDocument();
    expect(screen.getByText('3 Pending')).toBeInTheDocument();
  });

  test('renders singular "Response" for one response', async () => {
    server.use(
      trpcMsw.exercises.getGroupExerciseResponses.query(() => makeGroupData({
        responses: { [EXERCISE_ID]: [twoResponses[0]] },
        totalParticipants: 3,
      })),
    );
    render(<GroupResponses courseSlug="test" exerciseId={EXERCISE_ID} />, { wrapper: TrpcProvider });
    expect(await screen.findByText('1 Response')).toBeInTheDocument();
  });

  test('renders participant names', async () => {
    render(<GroupResponses courseSlug="test" exerciseId={EXERCISE_ID} />, { wrapper: TrpcProvider });
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  test('group selector appears when multiple groups', async () => {
    server.use(
      trpcMsw.exercises.getGroupExerciseResponses.query(() => makeGroupData({
        groups: [
          { id: 'g1', name: 'Group A' },
          { id: 'g2', name: 'Group B' },
        ],
      })),
    );
    render(<GroupResponses courseSlug="test" exerciseId={EXERCISE_ID} />, { wrapper: TrpcProvider });
    expect(await screen.findByText('Select your group:')).toBeInTheDocument();
  });

  test('group selector hidden with single group', async () => {
    render(<GroupResponses courseSlug="test" exerciseId={EXERCISE_ID} />, { wrapper: TrpcProvider });
    expect(await screen.findByText('2 Responses')).toBeInTheDocument();
    expect(screen.queryByText('Select your group:')).not.toBeInTheDocument();
  });

  test('short responses do not show "Show more"', async () => {
    render(<GroupResponses courseSlug="test" exerciseId={EXERCISE_ID} />, { wrapper: TrpcProvider });
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
  });

  test('long responses show "Show more" and clicking expands', async () => {
    server.use(
      trpcMsw.exercises.getGroupExerciseResponses.query(() => makeGroupData({
        responses: { [EXERCISE_ID]: [{ name: 'Charlie', response: 'x'.repeat(700) }] },
        totalParticipants: 2,
      })),
    );
    render(<GroupResponses courseSlug="test" exerciseId={EXERCISE_ID} />, { wrapper: TrpcProvider });

    const showMore = await screen.findByText('Show more');
    expect(showMore).toBeInTheDocument();

    fireEvent.click(showMore);
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
  });
});
