import { describe, expect, test } from 'vitest';
import { cleanName, welcomePost } from './book';

describe('cleanName', () => {
  test('drops a placeholder surname', () => {
    expect(cleanName('Agatha ___')).toBe('Agatha');
    expect(cleanName('Agatha - .')).toBe('Agatha');
  });

  test('keeps real names, including accents and punctuation', () => {
    expect(cleanName('Weronika Żurek')).toBe('Weronika Żurek');
    expect(cleanName('Mary-Jane O\'Brien')).toBe('Mary-Jane O\'Brien');
    expect(cleanName('  Caitlin   Mah ')).toBe('Caitlin Mah');
  });

  test('falls back to the original when nothing is left', () => {
    expect(cleanName('___')).toBe('___');
  });
});

describe('welcomePost', () => {
  test('uses just the first name when that is all we have', () => {
    const post = welcomePost({
      hire: { name: cleanName('Agatha ___') }, planned: [], missing: 5, isFirstVisit: true,
    });
    expect(post).toContain('*Welcome, Agatha!* Agatha is joining BlueDot');
    expect(post).not.toContain('___');
  });
});
