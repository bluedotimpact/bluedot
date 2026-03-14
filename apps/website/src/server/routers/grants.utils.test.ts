import { describe, expect, test } from 'vitest';
import { mapPublicGrantGrantees } from './grants.utils';

describe('mapPublicGrantGrantees', () => {
  test('filters incomplete rows, trims fields, sanitizes links, and sorts by project name', () => {
    const result = mapPublicGrantGrantees([
      {
        name: '  Alice  ',
        projectName: '  Zebra Project ',
        amountUsd: 5000,
        projectSummary: '  Useful work  ',
        profileOrProjectUrl: ' https://example.com/zebra ',
      },
      {
        name: 'Bob',
        projectName: 'Alpha Project',
        amountUsd: null,
        projectSummary: '',
        profileOrProjectUrl: '   ',
      },
      {
        name: 'Missing Summary',
        projectName: 'No Summary Project',
        amountUsd: 1000,
        projectSummary: '   ',
        profileOrProjectUrl: '',
      },
      {
        name: 'Mallory',
        projectName: 'Javascript Link',
        amountUsd: 10,
        projectSummary: 'Unsafe link should be dropped',
        profileOrProjectUrl: ['javascript', 'alert(1)'].join(':'),
      },
      {
        name: 'Eve',
        projectName: 'Mailto Link',
        amountUsd: 20,
        projectSummary: 'Unsupported protocol should be dropped',
        profileOrProjectUrl: 'mailto:test@example.com',
      },
      {
        name: '   ',
        projectName: 'Should Drop',
        amountUsd: 1000,
        projectSummary: 'Has summary',
        profileOrProjectUrl: '',
      },
    ]);

    expect(result).toEqual([
      {
        name: 'Bob',
        projectName: 'Alpha Project',
        amountUsd: null,
        projectSummary: undefined,
        profileOrProjectUrl: undefined,
      },
      {
        name: 'Mallory',
        projectName: 'Javascript Link',
        amountUsd: 10,
        projectSummary: 'Unsafe link should be dropped',
        profileOrProjectUrl: undefined,
      },
      {
        name: 'Eve',
        projectName: 'Mailto Link',
        amountUsd: 20,
        projectSummary: 'Unsupported protocol should be dropped',
        profileOrProjectUrl: undefined,
      },
      {
        name: 'Missing Summary',
        projectName: 'No Summary Project',
        amountUsd: 1000,
        projectSummary: undefined,
        profileOrProjectUrl: undefined,
      },
      {
        name: 'Alice',
        projectName: 'Zebra Project',
        amountUsd: 5000,
        projectSummary: 'Useful work',
        profileOrProjectUrl: 'https://example.com/zebra',
      },
    ]);
  });
});
