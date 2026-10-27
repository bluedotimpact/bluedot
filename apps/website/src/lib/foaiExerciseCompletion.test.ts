import { describe, expect, test } from 'vitest';
import { isFoaiExerciseComplete } from './foaiExerciseCompletion';

describe('FoAI completion shared by certificates, progress, and exercise UI', () => {
  test.each([
    ['Free text', null, false],
    ['Free text', { response: '', completedAt: null }, false],
    ['Free text', { response: ' \n\t ', completedAt: null }, false],
    ['Free text', { response: 'A saved answer', completedAt: null }, true],
    ['Free text', { response: '', completedAt: '2026-01-01' }, true],
    ['Multiple choice', { response: 'A', completedAt: null }, false],
    ['Multiple choice', { response: 'A', completedAt: '2026-01-01' }, true],
    ['Project submission', { response: 'Submitted', completedAt: null }, false],
    [null, { response: 'Saved', completedAt: null }, false],
    [null, { response: '', completedAt: '2026-01-01' }, true],
  ])('type %s and response %j produce completion %s', (type, response, expected) => {
    expect(isFoaiExerciseComplete(type, response)).toBe(expected);
  });
});
