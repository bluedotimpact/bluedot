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
    subtitle: 'Full-time position',
    slug: 'software-engineer',
    applicationUrl: 'https://example.com/apply/software-engineer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Product Manager',
    subtitle: 'Full-time position',
    slug: 'product-manager',
    applicationUrl: 'https://example.com/apply/product-manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('JobsListSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<JobsListSection jobs={mockJobs} />);
    expect(container).toMatchSnapshot();
  });

  test('renders mobile as expected', () => {
    vi.spyOn(deviceDetect, 'isMobile', 'get').mockReturnValue(true);
    const { container } = render(<JobsListSection jobs={mockJobs} />);
    expect(container).toMatchSnapshot();
    vi.clearAllMocks();
  });

  test('renders empty state when no jobs are provided', () => {
    const { container } = render(<JobsListSection jobs={[]} />);
    expect(container.textContent).toContain("We're not currently running any open hiring rounds at the moment.");
    expect(container).toMatchSnapshot();
  });
});
