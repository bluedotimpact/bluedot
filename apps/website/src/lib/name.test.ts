import { describe, expect, test } from 'vitest';
import { joinName, splitName } from './name';

describe('joinName', () => {
  test('joins and trims, dropping empty parts', () => {
    expect(joinName(' Jane ', 'Doe')).toBe('Jane Doe');
    expect(joinName('Jane', '')).toBe('Jane');
    expect(joinName('', '')).toBe('');
  });
});

describe('splitName', () => {
  test('splits on the last space', () => {
    expect(splitName('Jane Doe')).toEqual({ firstName: 'Jane', lastName: 'Doe' });
    expect(splitName('Jean Pierre  Dupont ')).toEqual({ firstName: 'Jean Pierre', lastName: 'Dupont' });
  });

  test('single word becomes the first name', () => {
    expect(splitName('Jane')).toEqual({ firstName: 'Jane', lastName: '' });
    expect(splitName('')).toEqual({ firstName: '', lastName: '' });
  });
});
