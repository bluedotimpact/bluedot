import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { FaChevronRight } from 'react-icons/fa6';

import {
  HeroSection, HeroH1, HeroCTAContainer,
} from './HeroSection';
import { Button } from './Button';

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
      <HeroH1>Make AI go well</HeroH1>
      <HeroCTAContainer>
        <Button variant="primary" url="https://example.com">
          Explore our courses
          <FaChevronRight aria-hidden className="size-4" />
        </Button>
      </HeroCTAContainer>
    </HeroSection>
  ),
};

export const WithCustomClasses: Story = {
  render: () => (
    <HeroSection className="min-h-[500px]">
      <HeroH1 className="text-size-2xl">Custom Hero Title</HeroH1>
      <HeroCTAContainer className="gap-4">
        <Button variant="primary">
          Primary CTA
          <FaChevronRight aria-hidden className="size-4" />
        </Button>
        <Button variant="secondary">
          Secondary CTA
        </Button>
      </HeroCTAContainer>
    </HeroSection>
  ),
};

export const WithLink: Story = {
  render: () => (
    <HeroSection>
      <HeroH1>Hero with Link</HeroH1>
      <HeroCTAContainer>
        <Button
          variant="primary"
          url="https://example.com"
        >
          Learn More
          <FaChevronRight aria-hidden className="size-4" />
        </Button>
      </HeroCTAContainer>
    </HeroSection>
  ),
};
