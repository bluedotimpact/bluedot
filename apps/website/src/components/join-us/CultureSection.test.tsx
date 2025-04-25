import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import CultureSection from './CultureSection';

describe('CultureSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<CultureSection />);
    expect(container).toMatchSnapshot();
  });
});
