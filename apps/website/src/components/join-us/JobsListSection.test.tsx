import { render, screen } from '@testing-library/react';
import {
  describe, expect, test,
} from 'vitest';
import JobsListSection from './JobsListSection';

const mockCmsJobs = [
  {
    id: '1',
    slug: 'software-engineer',
    title: 'Software Engineer',
    subtitle: 'Remote',
    applicationUrl: 'https://example.com/apply/software-engineer',
    publicationStatus: 'Published' as const,
    publishedAt: Date.now() / 1000,
    category: null,
  },
  {
    id: '2',
    slug: 'product-manager',
    title: 'Product Manager',
    subtitle: 'London, UK',
    applicationUrl: 'https://example.com/apply/product-manager',
    publicationStatus: 'Published' as const,
    publishedAt: Date.now() / 1000,
    category: null,
  },
];

describe('JobsListSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<JobsListSection jobs={mockCmsJobs} />);

    // Check if job titles and locations are rendered
    const content = container.textContent;
    expect(content).toContain('Software Engineer');
    expect(content).toContain('Product Manager');
    expect(content).toContain('Remote');
    expect(content).toContain('London, UK');
    expect(content).toContain('Learn more');

    // Check if there are two job listings
    const jobListings = screen.getAllByRole('listitem');
    expect(jobListings.length).toBe(2);
  });

  test('renders mobile as expected', () => {
    const { container } = render(<JobsListSection jobs={mockCmsJobs} />);

    // Check if job titles and locations are rendered
    const content = container.textContent;
    expect(content).toContain('Software Engineer');
    expect(content).toContain('Product Manager');
    expect(content).toContain('Remote');
    expect(content).toContain('London, UK');
    expect(content).toContain('Learn more');

    // Check if there are two job listings
    const jobListings = screen.getAllByRole('listitem');
    expect(jobListings.length).toBe(2);
  });

  test('renders empty state when no jobs are provided', () => {
    const { container } = render(<JobsListSection jobs={[]} />);
    expect(container.textContent).toContain('We\'re not currently running any open hiring rounds at the moment.');
  });
});
