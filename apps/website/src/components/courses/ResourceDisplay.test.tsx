import { describe, expect, it } from 'vitest';
import { formatResourceTime } from './ResourceDisplay';

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
