import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { CTALink } from './CTALink';

describe('CTALink', () => {
  test('renders primary variant as expected', () => {
    const { container } = render(
      <CTALink
        href="https://example.com"
        variant="primary"
      >
        Click me
      </CTALink>,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders secondary variant as expected', () => {
    const { container } = render(
      <CTALink
        href="https://example.com"
        variant="secondary"
      >
        Click me
      </CTALink>,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with chevron as expected', () => {
    const { container } = render(
      <CTALink
        href="https://example.com"
        withChevron
      >
        Click me
      </CTALink>,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with custom className', () => {
    const { container } = render(
      <CTALink
        href="https://example.com"
        className="custom-class"
      >
        Click me
      </CTALink>,
    );
    expect(container).toMatchSnapshot();
  });
});
