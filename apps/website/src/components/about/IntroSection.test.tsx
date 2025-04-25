import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import IntroSection from './IntroSection';

describe('IntroSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<IntroSection />);
    expect(container).toMatchSnapshot();
  });
});
