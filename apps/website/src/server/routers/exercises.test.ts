import { describe, expect, test } from 'vitest';
import { setupTestDb, createCaller, testAuthContextLoggedIn } from '../../__tests__/dbTestUtils';

setupTestDb();

const caller = createCaller(testAuthContextLoggedIn);

describe('exercises.saveExerciseResponse', () => {
  test('creates a new response when none exists', async () => {
    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'My first answer',
    });

    expect(result).toMatchObject({
      email: 'test@example.com',
      exerciseId: 'exercise-1',
      response: 'My first answer',
      completedAt: null,
    });
    expect(result.id).toBeDefined();
  });

  test('updates an existing response', async () => {
    await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Draft answer',
    });

    const updated = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Final answer',
    });

    expect(updated.response).toBe('Final answer');

    const fetched = await caller.exercises.getExerciseResponse({ exerciseId: 'exercise-1' });
    expect(fetched).toMatchObject({
      response: 'Final answer',
      completedAt: null,
    });
  });

  test('sets completedAt when completed: true', async () => {
    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Complete answer',
      completed: true,
    });

    expect(result.completedAt).toBeTruthy();
    expect(new Date(result.completedAt!).getTime()).not.toBeNaN();
  });

  test('clears completedAt when completed: false', async () => {
    await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Answer',
      completed: true,
    });

    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Answer',
      completed: false,
    });

    expect(result.completedAt).toBeNull();
  });

  test('preserves completedAt when completed is omitted', async () => {
    await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Answer',
      completed: true,
    });

    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Updated answer',
    });

    expect(result.response).toBe('Updated answer');
    expect(result.completedAt).toBeTruthy();
  });
});

describe('exercises.getExerciseResponse', () => {
  test('returns null when no response exists', async () => {
    const result = await caller.exercises.getExerciseResponse({ exerciseId: 'exercise-1' });
    expect(result).toBeNull();
  });

  test('returns response scoped to the current user', async () => {
    await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'My answer',
    });

    const otherCaller = createCaller({
      ...testAuthContextLoggedIn,
      auth: {
        ...testAuthContextLoggedIn.auth!,
        email: 'other@example.com',
      },
    });

    const otherResult = await otherCaller.exercises.getExerciseResponse({ exerciseId: 'exercise-1' });
    expect(otherResult).toBeNull();

    const myResult = await caller.exercises.getExerciseResponse({ exerciseId: 'exercise-1' });
    expect(myResult).toMatchObject({ response: 'My answer' });
  });
});
