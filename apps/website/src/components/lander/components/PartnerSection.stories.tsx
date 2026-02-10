import type { Meta, StoryObj } from '@storybook/react';
import PartnerSection, { type Partner } from './PartnerSection';

const meta = {
  title: 'website/CourseLander/PartnerSection',
  component: PartnerSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A section showcasing partner organizations. Features an infinite-scrolling carousel on mobile/tablet and a responsive grid on desktop. Each partner card shows a logo and description.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Section heading displayed at the top',
      control: 'text',
    },
    partners: {
      description: 'Array of partner organizations to display',
      control: 'object',
    },
  },
} satisfies Meta<typeof PartnerSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const samplePartners: Partner[] = [
  {
    name: 'Entrepreneur First',
    url: 'https://www.joinef.com/',
    logo: '/images/agi-strategy/ef.svg',
    descriptionShort: 'We collaborate with EF to host AI safety hackathons.',
    descriptionFull: 'A London-based startup incubation programme. We collaborate with EF to host AI safety and def/acc hackathons.',
  },
  {
    name: 'Institute for Progress',
    url: 'https://ifp.org/',
    logo: '/images/agi-strategy/ifp.svg',
    descriptionShort: 'We collaborate with IFP to get impactful projects off the ground.',
    descriptionFull: 'IFP is a science and innovation think tank. We collaborate with IFP to get impactful projects from their Launch Sequence off the ground.',
  },
  {
    name: '50 Years',
    url: 'https://www.fiftyyears.com/',
    logo: '/images/agi-strategy/fifty-years.svg',
    descriptionShort: 'We fast-track entrepreneurs into their 5050 AI cohorts.',
    descriptionFull: 'A pre-seed and seed VC firm. We fast-track our most promising entrepreneurs into their 5050 AI cohorts, focused on building an aligned AI future.',
  },
  {
    name: 'Seldon Lab',
    url: 'https://seldonlab.com/',
    logo: '/images/agi-strategy/seldon-lab.svg',
    descriptionShort: 'We help community members get ready to join future Seldon batches.',
    descriptionFull: 'Seldon offers guidance and investments in the next generation of AGI security startups. We help our most entrepreneurial community members get ready to join future Seldon batches.',
  },
  {
    name: 'Halcyon Futures',
    url: 'https://halcyonfutures.org/',
    logo: '/images/agi-strategy/halcyon-futures.svg',
    descriptionShort: 'We introduce our most promising leaders to Halcyon.',
    descriptionFull: 'Halcyon identifies leaders from business, policy, and academia, and helps them take on new ambitious projects. We introduce our most promising leaders to Halcyon.',
  },
];

export const Default: Story = {
  args: {
    title: 'Co-created with our network of leading AI industry partners',
    partners: samplePartners,
  },
};
