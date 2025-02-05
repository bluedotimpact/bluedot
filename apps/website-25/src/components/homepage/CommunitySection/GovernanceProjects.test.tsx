import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import GovernanceProjects from './GovernanceProjects';

describe('GovernanceProjects', () => {
  test('renders as expected', () => {
    const { container } = render(<GovernanceProjects />);
    expect(container).toMatchSnapshot();
  });

  test('displays correct number of projects', () => {
    const { container } = render(<GovernanceProjects />);
    const testimonialCards = container.querySelectorAll('.governance-projects__project');
    expect(testimonialCards).toHaveLength(4);
  });
});
