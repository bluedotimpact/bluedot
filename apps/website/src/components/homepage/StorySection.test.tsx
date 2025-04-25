import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import StorySection from './StorySection';

describe('StorySection', () => {
  test('renders default as expected', () => {
    const { container } = render(<StorySection />);
    expect(container).toMatchSnapshot();
  });
});
