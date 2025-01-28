import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { ValueCard } from './ValueCard';

describe('ValueCard', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <ValueCard
        icon="/icons/test-icon.svg"
        title="Test Title"
        description="Test description"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with all props correctly', () => {
    const { container } = render(
      <ValueCard
        icon="/icons/custom-icon.svg"
        title="Custom Title"
        description="Custom description text that is longer"
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
