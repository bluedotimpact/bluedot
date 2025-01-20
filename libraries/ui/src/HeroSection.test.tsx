import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { HeroSection } from './HeroSection';

describe('Footer', () => {
  test('renders default as expected', () => {
    const { container } = render(<HeroSection />);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { container } = render(
      <HeroSection
        title="This is the title"
        subtitle="This is the subtitle"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with optional yield', () => {
    const { container } = render(
      <HeroSection>
        <p>This is the yield</p>
      </HeroSection>,
    );
    expect(container).toMatchSnapshot();
  });
});
