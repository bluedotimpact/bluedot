import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import CommunityValuesSection from './CommunityValuesSection';

describe('CommunityValuesSection', () => {
  test('renders as expected', () => {
    const { container } = render(<CommunityValuesSection />);
    expect(container).toMatchSnapshot();
  });

  test('displays correct number of projects', () => {
    const { container } = render(<CommunityValuesSection />);
    const testimonialCards = container.querySelectorAll('.community-values-section__value');
    expect(testimonialCards).toHaveLength(4);
  });
});
