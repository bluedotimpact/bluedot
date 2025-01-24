import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Section } from './Section';

describe('Section', () => {
  test('renders default as expected', () => {
    const { container } = render(<Section title="This is the title" />);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional subtitle', () => {
    const { container } = render(
      <Section
        title="This is the title"
        subtitle="This is the subtitle"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with children content', () => {
    const { container } = render(
      <Section title="This is the title">
        <p>This is the yield</p>
      </Section>,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with CTA link', () => {
    const { container } = render(
      <Section
        title="This is the title"
        ctaText="Click me"
        ctaUrl="/some-path"
      />,
    );
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
});
