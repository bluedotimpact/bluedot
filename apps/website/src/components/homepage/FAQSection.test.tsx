import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import FAQSection from './FAQSection';

describe('FAQSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<FAQSection />);
    expect(container).toMatchSnapshot();
  });
});
