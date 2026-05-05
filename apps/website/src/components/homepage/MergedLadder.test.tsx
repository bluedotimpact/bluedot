import { render, waitFor } from '@testing-library/react';
import {
  describe, expect, test, beforeEach,
} from 'vitest';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { createMockCourse } from '../../__tests__/testUtils';
import MergedLadder from './MergedLadder';

const mockCourses = [
  createMockCourse({
    id: 'course-agi',
    slug: 'agi-strategy',
    title: 'AGI Strategy',
    shortDescription: 'A deep dive into the incentives driving the AI companies.',
    durationHours: 25,
    isFeatured: true,
  }),
  createMockCourse({
    id: 'course-tas',
    slug: 'technical-ai-safety',
    title: 'Technical AI Safety',
    shortDescription: 'For technical talent.',
    durationHours: 30,
    isFeatured: false,
  }),
  createMockCourse({
    id: 'course-gov',
    slug: 'ai-governance',
    title: 'Frontier AI Governance',
    shortDescription: 'Learn about the policy landscape.',
    durationHours: 25,
    isFeatured: false,
  }),
  createMockCourse({
    id: 'course-bio',
    slug: 'biosecurity',
    title: 'Biosecurity',
    shortDescription: 'Defend against AI-enabled bioattacks.',
    durationHours: 30,
    isFeatured: false,
  }),
];

describe('MergedLadder', () => {
  beforeEach(() => {
    server.use(trpcMsw.courses.getAll.query(() => mockCourses));
  });

  test('renders three rungs once cohort courses load', async () => {
    const { findByText, getByText } = render(<MergedLadder />, { wrapper: TrpcProvider });

    expect(getByText('See where AI is going')).toBeDefined();
    expect(getByText('Pick a specialism')).toBeDefined();
    expect(getByText('Start contributing')).toBeDefined();
    expect(getByText('The Future of AI')).toBeDefined();

    await findByText('AGI Strategy');
    await waitFor(() => {
      expect(getByText('Technical AI Safety')).toBeDefined();
      expect(getByText('Frontier AI Governance')).toBeDefined();
      expect(getByText('Biosecurity')).toBeDefined();
    });
  });

  test('rung 3 grant links carry homepage UTM params', async () => {
    const { container } = render(<MergedLadder />, { wrapper: TrpcProvider });

    await waitFor(() => {
      const grantLinks = Array.from(container.querySelectorAll('a'))
        .filter((a) => a.getAttribute('href')?.includes('utm_campaign=homepage-programs'));
      expect(grantLinks.length).toBeGreaterThan(0);
      grantLinks.forEach((a) => {
        const href = a.getAttribute('href') ?? '';
        expect(href).toContain('utm_source=website');
        expect(href).toContain('utm_campaign=homepage-programs');
      });
    });
  });
});
