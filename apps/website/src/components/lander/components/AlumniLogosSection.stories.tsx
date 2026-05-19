import type { Meta, StoryObj } from '@storybook/react';
import AlumniLogosSection, { type AlumniOrg } from './AlumniLogosSection';

const meta = {
  title: 'website/CourseLander/AlumniLogosSection',
  component: AlumniLogosSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A subtle section showcasing organizations where course graduates now work, displayed as a row of muted logos.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Heading shown above the logos',
      control: 'text',
    },
    organizations: {
      description: 'Array of alumni employer organizations to display',
      control: 'object',
    },
  },
} satisfies Meta<typeof AlumniLogosSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleOrganizations: AlumniOrg[] = [
  {
    name: 'Anthropic',
    logo: '/images/third-party-logos/anthropic.svg',
    url: 'https://www.anthropic.com/',
  },
  {
    name: 'OpenAI',
    logo: '/images/third-party-logos/openai.svg',
    url: 'https://openai.com/',
  },
  {
    name: 'Google DeepMind',
    logo: '/images/third-party-logos/deepmind.svg',
    url: 'https://deepmind.google/',
  },
  {
    name: 'UK AISI',
    logo: '/images/third-party-logos/aisi.webp',
    url: 'https://www.aisi.gov.uk/',
  },
  {
    name: 'Stanford HAI',
    logo: '/images/third-party-logos/hai.webp',
    url: 'https://hai.stanford.edu/',
  },
];

export const Default: Story = {
  args: {
    title: 'Our graduates work at',
    organizations: sampleOrganizations,
  },
};
