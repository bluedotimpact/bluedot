import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import {
  describe, expect, it, test, vi,
} from 'vitest';
import { createMockExercise } from '../../__tests__/testUtils';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { formatResourceTime, ResourceDisplay } from './ResourceDisplay';

// Mock next/router — exercises render FreeTextResponse, which calls useRouter()
vi.mock('next/router', () => ({
  useRouter: () => ({ query: { courseSlug: 'test-course' } }),
}));

// Mock MarkdownExtendedRenderer
vi.mock('./MarkdownExtendedRenderer', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}));

describe('formatResourceTime', () => {
  it('should round up small times (< 60 mins) to nearest 5 minutes', () => {
    expect(formatResourceTime(1)).toBe('5 mins');
    expect(formatResourceTime(3)).toBe('5 mins');
    expect(formatResourceTime(7)).toBe('10 mins');
    expect(formatResourceTime(12)).toBe('15 mins');
    expect(formatResourceTime(18)).toBe('20 mins');

    // Exact 5-minute intervals
    expect(formatResourceTime(5)).toBe('5 mins');
    expect(formatResourceTime(10)).toBe('10 mins');
    expect(formatResourceTime(15)).toBe('15 mins');
    expect(formatResourceTime(30)).toBe('30 mins');
    expect(formatResourceTime(45)).toBe('45 mins');
    expect(formatResourceTime(55)).toBe('55 mins');
  });

  it('should round times >= 60 mins to nearest 10 minutes', () => {
    expect(formatResourceTime(61)).toBe('1 hr 10 mins');
    expect(formatResourceTime(72)).toBe('1 hr 20 mins');
    expect(formatResourceTime(85)).toBe('1 hr 30 mins');
  });

  it('should format exact hours without remaining minutes', () => {
    expect(formatResourceTime(60)).toBe('1 hr');
    expect(formatResourceTime(120)).toBe('2 hrs');
    expect(formatResourceTime(180)).toBe('3 hrs');
    expect(formatResourceTime(240)).toBe('4 hrs');
  });

  it('should handle edge cases around 60 minutes', () => {
    expect(formatResourceTime(59)).toBe('1 hr');
    expect(formatResourceTime(61)).toBe('1 hr 10 mins');
    expect(formatResourceTime(119)).toBe('2 hrs');
    expect(formatResourceTime(121)).toBe('2 hrs 10 mins');
  });

  it('should handle fractional minutes by rounding up', () => {
    expect(formatResourceTime(0.1)).toBe('5 mins');
    expect(formatResourceTime(2.3)).toBe('5 mins');
    expect(formatResourceTime(60.1)).toBe('1 hr 10 mins');
    expect(formatResourceTime(125.7)).toBe('2 hrs 10 mins');
  });
});

describe('ResourceDisplay - exercise status split', () => {
  const registerExerciseHandlers = (exercises: ReturnType<typeof createMockExercise>[]) => {
    server.use(
      trpcMsw.exercises.getExercise.query(({ input }) => exercises.find((e) => e.id === input.exerciseId)!),
      trpcMsw.exercises.getExerciseResponse.query(() => null),
      trpcMsw.exercises.getGroupExerciseResponses.query(() => null),
    );
  };

  test('required exercises render in the main Exercises section; Further/Active+isOptional render under Optional Exercises; Maybe/Inactive are absent', async () => {
    const exercises = [
      createMockExercise({ id: 'ex-core', status: 'Core', title: 'Core exercise' }),
      createMockExercise({
        id: 'ex-active-req', status: 'Active', isOptional: false, title: 'Active required exercise',
      }),
      createMockExercise({ id: 'ex-further', status: 'Further', title: 'Further exercise' }),
      createMockExercise({
        id: 'ex-active-opt', status: 'Active', isOptional: true, title: 'Active optional exercise',
      }),
      createMockExercise({ id: 'ex-maybe', status: 'Maybe', title: 'Maybe exercise' }),
      createMockExercise({ id: 'ex-inactive', status: 'Inactive', title: 'Inactive exercise' }),
    ];
    registerExerciseHandlers(exercises);

    render(<ResourceDisplay resources={[]} exercises={exercises} />, { wrapper: TrpcProvider });

    expect(await screen.findByText('Core exercise')).toBeInTheDocument();
    expect(await screen.findByText('Active required exercise')).toBeInTheDocument();
    expect(await screen.findByText('Further exercise')).toBeInTheDocument();
    expect(await screen.findByText('Active optional exercise')).toBeInTheDocument();
    expect(screen.queryByText('Maybe exercise')).not.toBeInTheDocument();
    expect(screen.queryByText('Inactive exercise')).not.toBeInTheDocument();

    // Required exercises render inside the main "Exercises" section, not the collapsible
    const exercisesSection = screen.getByText('Exercises').closest('section')!;
    expect(within(exercisesSection).getByText('Core exercise')).toBeInTheDocument();
    expect(within(exercisesSection).getByText('Active required exercise')).toBeInTheDocument();
    expect(within(exercisesSection).queryByText('Further exercise')).not.toBeInTheDocument();
    expect(within(exercisesSection).queryByText('Active optional exercise')).not.toBeInTheDocument();

    // Further/Active+isOptional exercises render inside the "Optional Exercises" collapsible
    expect(screen.getByText('Optional Exercises')).toBeInTheDocument();
    const optionalExercisesSection = screen.getByText('Optional Exercises').closest('details')!;
    expect(within(optionalExercisesSection).getByText('Further exercise')).toBeInTheDocument();
    expect(within(optionalExercisesSection).getByText('Active optional exercise')).toBeInTheDocument();
  });

  test('does not render the Optional Exercises collapsible when there are no optional exercises', async () => {
    const exercises = [createMockExercise({ id: 'ex-core', status: 'Core', title: 'Core exercise' })];
    registerExerciseHandlers(exercises);

    render(<ResourceDisplay resources={[]} exercises={exercises} />, { wrapper: TrpcProvider });

    expect(await screen.findByText('Core exercise')).toBeInTheDocument();
    expect(screen.queryByText('Optional Exercises')).not.toBeInTheDocument();
  });
});
