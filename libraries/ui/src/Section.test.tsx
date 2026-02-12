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
    const { container, getByText } = render(<Section
      title="This is the title"
      subtitle="This is the subtitle"
    >
      <p>This is the yield</p>
    </Section>);

    expect(container).toMatchSnapshot();

    expect(getByText('This is the title')).not.toBeNull();
    expect(getByText('This is the subtitle')).not.toBeNull();
    expect(getByText('This is the yield')).not.toBeNull();
  });
});
