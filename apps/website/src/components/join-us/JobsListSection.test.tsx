import { render } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import * as deviceDetect from 'react-device-detect';
import JobsListSection from './JobsListSection';

const mockJobs = [
  {
    id: '1',
    title: 'Software Engineer',
    department: 'Engineering',
    team: 'Frontend',
    employmentType: 'Full-time',
    location: 'Remote',
    shouldDisplayCompensationOnJobPostings: false,
    publishedAt: new Date().toISOString(),
    isListed: true,
    isRemote: true,
    descriptionHtml: '<p>Job description</p>',
  },
  {
    id: '2',
    title: 'Product Manager',
    department: 'Product',
    team: 'Core',
    employmentType: 'Full-time',
    location: 'London, UK',
    shouldDisplayCompensationOnJobPostings: false,
    publishedAt: new Date().toISOString(),
    isListed: true,
    isRemote: false,
    descriptionHtml: '<p>Job description</p>',
  },
];

describe('JobsListSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<JobsListSection ashbyJobs={mockJobs} cmsJobs={[]} />);

    // Check if job titles and locations are rendered
    const content = container.textContent;
    expect(content).toContain('Software Engineer');
    expect(content).toContain('Product Manager');
    expect(content).toContain('Remote');
    expect(content).toContain('London, UK');
    expect(content).toContain('Learn more');

    // Check if there are two job listings
    const jobListings = container.querySelectorAll('.jobs-list__listing');
    expect(jobListings.length).toBe(2);
  });

  test('renders mobile as expected', () => {
    vi.spyOn(deviceDetect, 'isMobile', 'get').mockReturnValue(true);
    const { container } = render(<JobsListSection ashbyJobs={mockJobs} cmsJobs={[]} />);

    // Check if job titles and locations are rendered
    const content = container.textContent;
    expect(content).toContain('Software Engineer');
    expect(content).toContain('Product Manager');
    expect(content).toContain('Remote');
    expect(content).toContain('London, UK');
    expect(content).toContain('Learn more');

    // Check if there are two job listings
    const jobListings = container.querySelectorAll('.jobs-list__listing');
    expect(jobListings.length).toBe(2);

    vi.clearAllMocks();
  });

  test('renders empty state when no jobs are provided', () => {
    const { container } = render(<JobsListSection ashbyJobs={[]} cmsJobs={[]} />);
    expect(container.textContent).toContain("We're not currently running any open hiring rounds at the moment.");
  });
});
