import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  status: null,
  unitNumber: null,
  unitId: 'unit-1',
  courseIdWrite: 'course-write-1',
  courseIdRead: 'course-read-1',
  exerciseNumber: null,
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
        groups: [{
          id: 'g1', name: 'Group 1', totalParticipants: 2, responses: [{ name: 'Alice', response: 'My answer' }],
        }],
      })),
    );

    render(<Exercise exerciseId="ex1" />, { wrapper: TrpcProvider });

    // Facilitator view shows toggle and participant responses
    expect(await screen.findByText("Show my group's responses")).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('1 Response')).toBeInTheDocument();
    expect(screen.getByText('1 Pending')).toBeInTheDocument();
  });

  test('completion checkbox is enabled when exercise has a saved response', async () => {
    server.use(
      trpcMsw.exercises.getExerciseResponse.query(() => ({
        id: 'resp-1',
        email: 'test@example.com',
        autoNumberId: null,
        completedAt: null,
        exerciseId: 'ex1',
        response: 'Some text the user wrote',
        completed: false,
      })),
    );

    render(<Exercise exerciseId="ex1" />, { wrapper: TrpcProvider });

    const checkbox = await screen.findByRole('button', { name: 'Mark as complete' });
    expect(checkbox).not.toBeDisabled();
  });

  test('completion checkbox is disabled when exercise has no response', async () => {
    server.use(
      trpcMsw.exercises.getExerciseResponse.query(() => ({
        id: 'resp-2',
        email: 'test@example.com',
        autoNumberId: null,
        completedAt: null,
        exerciseId: 'ex1',
        response: '',
        completed: false,
      })),
    );

    render(<Exercise exerciseId="ex1" />, { wrapper: TrpcProvider });

    const checkbox = await screen.findByRole('button', { name: 'Mark as complete' });
    expect(checkbox).toBeDisabled();
  });

  test('completion checkbox submits current editor draft, not stale server value', async () => {
    const user = userEvent.setup();
    let savedResponse: string | undefined;

    server.use(
      trpcMsw.exercises.getExerciseResponse.query(() => ({
        id: 'resp-3',
        email: 'test@example.com',
        autoNumberId: null,
        completedAt: null,
        exerciseId: 'ex1',
        response: 'Old saved text',
        completed: false,
      })),
      trpcMsw.exercises.saveExerciseResponse.mutation(({ input }) => {
        savedResponse = input.response;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      }),
    );

    const { container } = render(<Exercise exerciseId="ex1" />, { wrapper: TrpcProvider });

    // Wait for editor to render with old saved text
    const checkbox = await screen.findByRole('button', { name: 'Mark as complete' });

    // Type new text into the ProseMirror editor (appends to existing content)
    const editor = await waitFor(() => {
      const el = container.querySelector('.ProseMirror') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    await user.click(editor);
    await user.type(editor, ' plus new draft');

    // Click the completion checkbox — should submit the current draft, not the stale server value
    await user.click(checkbox);

    await waitFor(() => {
      expect(savedResponse).toBeDefined();
      expect(savedResponse).toContain('new draft');
      expect(savedResponse).not.toBe('Old saved text');
    });
  });
});
