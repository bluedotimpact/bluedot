import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { server, trpcMsw } from '../../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../../__tests__/trpcProvider';
import Exercise from './Exercise';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => ({ query: { courseSlug: 'test-course' } }),
}));

// Mock MarkdownExtendedRenderer
vi.mock('../MarkdownExtendedRenderer', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}));

// Mock useAuthStore — default: logged in
const mockAuth = { email: 'test@example.com', token: 'tok' };
vi.mock('@bluedot/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@bluedot/ui')>();
  return {
    ...actual,
    useAuthStore: (selector: (s: { auth: typeof mockAuth | null }) => unknown) => selector({ auth: mockAuth }),
  };
});

const freeTextExercise = {
  id: 'ex1',
  title: 'Reflection',
  description: 'Write your thoughts.',
  type: 'Free text' as const,
  answer: null,
  options: null,
};

beforeEach(() => {
  // Default handlers
  server.use(
    trpcMsw.exercises.getExercise.query(() => freeTextExercise),
    trpcMsw.exercises.getExerciseResponse.query(() => null),
    trpcMsw.exercises.getGroupExerciseResponses.query(() => null),
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Exercise', () => {
  test('renders free text exercise with title and description', async () => {
    render(<Exercise exerciseId="ex1" />, { wrapper: TrpcProvider });

    expect(await screen.findByText('Reflection')).toBeInTheDocument();
    expect(screen.getByText('Write your thoughts.')).toBeInTheDocument();
  });

  test('renders multiple choice exercise', async () => {
    server.use(
      trpcMsw.exercises.getExercise.query(() => ({
        ...freeTextExercise,
        type: 'Multiple choice' as const,
        options: 'A\nB\nC',
        answer: 'B',
      })),
    );

    render(<Exercise exerciseId="ex1" />, { wrapper: TrpcProvider });

    expect(await screen.findByText('Reflection')).toBeInTheDocument();
  });

  test('shows facilitator view when group data is returned', async () => {
    server.use(
      trpcMsw.exercises.getGroupExerciseResponses.query(() => ({
        groups: [{ id: 'g1', name: 'Group 1' }],
        selectedGroupId: 'g1',
        totalParticipants: 2,
        responses: {
          ex1: [{ name: 'Alice', response: 'My answer' }],
        },
      })),
    );

    render(<Exercise exerciseId="ex1" />, { wrapper: TrpcProvider });

    // Facilitator view shows toggle and participant responses
    expect(await screen.findByText("Show my group's responses")).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('1 Response')).toBeInTheDocument();
    expect(screen.getByText('1 Pending')).toBeInTheDocument();
  });
});
