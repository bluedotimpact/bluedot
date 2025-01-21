import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Section } from './Section';

describe('Section', () => {
  test('renders default as expected', () => {
    const { container } = render(<Section title="This is the title" />);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { container } = render(
      <Section
        title="This is the title"
        subtitle="This is the subtitle"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with optional yield', () => {
    const { container } = render(
      <Section title="This is the title">
        <p>This is the yield</p>
      </Section>,
    );
    expect(container).toMatchSnapshot();
  });
});
