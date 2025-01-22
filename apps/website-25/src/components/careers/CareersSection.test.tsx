import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import CareersSection from './CareersSection';

describe('CareersSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<CareersSection />);
    expect(container).toMatchSnapshot();
  });
});
