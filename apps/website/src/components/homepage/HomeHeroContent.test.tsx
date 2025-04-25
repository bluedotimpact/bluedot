import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import HomeHeroContent from './HomeHeroContent';

describe('HomeHeroContent', () => {
  test('renders as expected', () => {
    const { container } = render(<HomeHeroContent />);
    expect(container).toMatchSnapshot();
  });
});
