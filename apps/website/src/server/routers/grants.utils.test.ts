import { describe, expect, test } from 'vitest';
import { mapPublicGrants } from './grants.utils';

describe('mapPublicGrants', () => {
  test('filters incomplete rows, trims fields, sanitizes links, and sorts by project title', () => {
    const result = mapPublicGrants([
      {
        granteeName: '  Alice  ',
        projectTitle: '  Zebra Project ',
        amountUsd: 5000,
        projectSummary: '  Useful work  ',
        link: ' https://example.com/zebra ',
      },
      {
        granteeName: 'Bob',
        projectTitle: 'Alpha Project',
        amountUsd: null,
        projectSummary: '',
        link: '   ',
      },
      {
        granteeName: 'Missing Summary',
        projectTitle: 'No Summary Project',
        amountUsd: 1000,
        projectSummary: '   ',
        link: '',
      },
      {
        granteeName: 'Mallory',
        projectTitle: 'Javascript Link',
        amountUsd: 10,
        projectSummary: 'Unsafe link should be dropped',
        link: ['javascript', 'alert(1)'].join(':'),
      },
      {
        granteeName: 'Eve',
        projectTitle: 'Mailto Link',
        amountUsd: 20,
        projectSummary: 'Unsupported protocol should be dropped',
        link: 'mailto:test@example.com',
      },
      {
        granteeName: '   ',
        projectTitle: 'Should Drop',
        amountUsd: 1000,
        projectSummary: 'Has summary',
        link: '',
      },
    ]);

    expect(result).toEqual([
      {
        granteeName: 'Bob',
        projectTitle: 'Alpha Project',
        amountUsd: null,
        projectSummary: undefined,
        link: undefined,
      },
      {
        granteeName: 'Mallory',
        projectTitle: 'Javascript Link',
        amountUsd: 10,
        projectSummary: 'Unsafe link should be dropped',
        link: undefined,
      },
      {
        granteeName: 'Eve',
        projectTitle: 'Mailto Link',
        amountUsd: 20,
        projectSummary: 'Unsupported protocol should be dropped',
        link: undefined,
      },
      {
        granteeName: 'Missing Summary',
        projectTitle: 'No Summary Project',
        amountUsd: 1000,
        projectSummary: undefined,
        link: undefined,
      },
      {
        granteeName: 'Alice',
        projectTitle: 'Zebra Project',
        amountUsd: 5000,
        projectSummary: 'Useful work',
        link: 'https://example.com/zebra',
      },
    ]);
  });
});
