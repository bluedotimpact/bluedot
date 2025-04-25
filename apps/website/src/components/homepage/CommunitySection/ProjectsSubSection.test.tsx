import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import ProjectsSubSection from './ProjectsSubSection';

describe('ProjectsSubSection', () => {
  test('renders as expected', () => {
    const { container } = render(<ProjectsSubSection />);
    expect(container).toMatchSnapshot();
  });

  test('displays correct number of projects', () => {
    const { container } = render(<ProjectsSubSection />);
    const testimonialCards = container.querySelectorAll('.projects__project');
    expect(testimonialCards).toHaveLength(4);
  });
});
