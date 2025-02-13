import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';

import {
  HeroSection, HeroH1, HeroH2, HeroCTAContainer,
} from './HeroSection';
import { CTALinkOrButton } from './CTALinkOrButton';

const meta = {
  title: 'ui/HeroSection',
  component: HeroSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HeroSection>
      <HeroH1>Welcome to Bluedot</HeroH1>
      <HeroH2>Discover amazing possibilities</HeroH2>
    </HeroSection>
  ),
};

export const WithCustomClasses: Story = {
  render: () => (
    <HeroSection className="min-h-[500px]">
      <HeroH1 className="text-4xl">Custom Hero Title</HeroH1>
      <HeroH2 className="italic">With custom styling</HeroH2>
      <HeroCTAContainer className="gap-4">
        <CTALinkOrButton variant="primary" withChevron>
          Primary CTA
        </CTALinkOrButton>
        <CTALinkOrButton variant="secondary">
          Secondary CTA
        </CTALinkOrButton>
      </HeroCTAContainer>
    </HeroSection>
  ),
};

export const WithLink: Story = {
  render: () => (
    <HeroSection>
      <HeroH1>Hero with Link</HeroH1>
      <HeroH2>Click below to explore</HeroH2>
      <HeroCTAContainer>
        <CTALinkOrButton
          variant="primary"
          withChevron
          url="https://example.com"
          isExternalUrl
        >
          Learn More
        </CTALinkOrButton>
      </HeroCTAContainer>
    </HeroSection>
  ),
};
