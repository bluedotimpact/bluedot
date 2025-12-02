import type { Meta, StoryObj } from '@storybook/react';
import {
  PiRocketLaunch, PiUsersThree, PiHandCoins,
} from 'react-icons/pi';
import CourseBenefitsSection from './CourseBenefitsSection';

const meta = {
  title: 'website/CourseLander/CourseBenefitsSection',
  component: CourseBenefitsSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A section displaying course benefits as cards with icons, titles, and descriptions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Section heading text',
      control: 'text',
    },
    benefits: {
      description: 'Array of benefit cards to display',
      control: 'object',
    },
  },
} satisfies Meta<typeof CourseBenefitsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'How this course will benefit you',
    benefits: [
      {
        icon: PiRocketLaunch,
        title: 'Take action in less than 30 hours',
        description: "You don't need another degree. This AGI Strategy course replaces years of self-study with three frameworks: incentive mapping to understand the AGI race, kill chains to analyse AI threats, and defence-in-depth to design interventions that counter them. You'll finish with a fundable plan.",
      },
      {
        icon: PiUsersThree,
        title: 'Join a network of builders',
        description: "This course isn't for everyone. We're building a community of people who are energised to take ambitious actions to make AI go well, including starting new companies, policy entrepreneurship, and high-impact research bets. Completing this course will give you access to this community.",
      },
      {
        icon: PiHandCoins,
        title: 'Get funded to accelerate your impact',
        description: "If your final course proposal is strong, you'll receive $10-50k to kickstart your transition into impactful work, and you'll be invited to co-work with us in London for 1-2 weeks. We'll do whatever it takes to accelerate your journey.",
      },
    ],
  },
};
