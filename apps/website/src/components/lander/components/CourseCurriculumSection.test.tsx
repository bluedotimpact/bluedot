import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CourseCurriculumSection from './CourseCurriculumSection';
import { TrpcProvider } from '../../../__tests__/trpcProvider';

const mockProps = {
  title: 'Curriculum Overview',
  courseSlug: 'agi-strategy',
};

describe('CourseCurriculumSection', () => {
  it('renders correctly', () => {
    const { container } = render(<CourseCurriculumSection {...mockProps} />, { wrapper: TrpcProvider });
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the section title', () => {
    const { getByText } = render(<CourseCurriculumSection {...mockProps} />, { wrapper: TrpcProvider });
    expect(getByText('Curriculum Overview')).toBeDefined();
  });
});
