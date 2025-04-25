import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import BeliefsSection from './BeliefsSection';

describe('BeliefsSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<BeliefsSection />);
    expect(container).toMatchSnapshot();
  });
});
