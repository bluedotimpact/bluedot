import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import {
  HeroSection, HeroH1, HeroH2, HeroCTAContainer,
} from './HeroSection';
import { CTALinkOrButton } from './CTALinkOrButton';

describe('HeroSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<HeroSection />);
    expect(container).toMatchSnapshot();
  });

  test('renders with titles', () => {
    const { container } = render(<HeroSection>
      <HeroH1>This is the title</HeroH1>
      <HeroH2>This is the subtitle</HeroH2>
    </HeroSection>);
    expect(container).toMatchSnapshot();
  });

  test('renders with buttons', () => {
    const { container } = render(<HeroSection>
      <HeroH1>This is the title</HeroH1>
      <HeroH2>This is the subtitle</HeroH2>
      <HeroCTAContainer>
        <CTALinkOrButton url="https://example.com">Do a thing</CTALinkOrButton>
      </HeroCTAContainer>
    </HeroSection>);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional yield', () => {
    const { container } = render(<HeroSection>
      <p>This is the yield</p>
    </HeroSection>);
    expect(container).toMatchSnapshot();
  });
});
