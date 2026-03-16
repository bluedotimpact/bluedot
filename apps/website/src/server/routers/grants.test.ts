import { describe, expect, test } from 'vitest';
import { mapPublicGrants } from './grants';

describe('mapPublicGrants', () => {
  test('filters incomplete rows, trims fields, sanitizes links, and sorts by project title', () => {
    const result = mapPublicGrants([
      {
        id: '1',
        granteeName: '  Alice  ',
        projectTitle: '  Zebra Project ',
        amountUsd: 5000,
        projectSummary: '  Useful work  ',
        link: ' https://example.com/zebra ',
      },
      {
        id: '2',
        granteeName: 'Bob',
        projectTitle: 'Alpha Project',
        amountUsd: null,
        projectSummary: '',
        link: '   ',
      },
      {
        id: '3',
        granteeName: 'Missing Summary',
        projectTitle: 'No Summary Project',
        amountUsd: 1000,
        projectSummary: '   ',
        link: '',
      },
      {
        id: '4',
        granteeName: 'Mallory',
        projectTitle: 'Javascript Link',
        amountUsd: 10,
        projectSummary: 'Unsafe link should be dropped',
        link: ['javascript', 'alert(1)'].join(':'),
      },
      {
        id: '5',
        granteeName: 'Eve',
        projectTitle: 'Mailto Link',
        amountUsd: 20,
        projectSummary: 'Unsupported protocol should be dropped',
        link: 'mailto:test@example.com',
      },
      {
        id: '6',
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
