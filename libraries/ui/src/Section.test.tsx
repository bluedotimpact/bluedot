import {
  describe, expect, test, afterEach,
} from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Section } from './Section';

describe('Section', () => {
  afterEach(() => {
    cleanup();
  });

  test('renders default as expected', () => {
    const { container } = render(<Section title="This is the title" />);
    expect(container).toMatchSnapshot();
  });

  test('renders with all optional props', () => {
    const { container } = render(
      <Section
        title="This is the title"
        subtitle="This is the subtitle"
        ctaText="Click me"
        ctaUrl="/some-path"
      >
        <p>This is the yield</p>
      </Section>,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders CTA link with correct attributes', () => {
    const { getByTestId } = render(
      <Section
        title="This is the title"
        ctaText="Click me"
        ctaUrl="/some-path"
      />,
    );

    const ctaLink = getByTestId('cta-link');
    expect(ctaLink.getAttribute('href')).toBe('/some-path');
  });
});
