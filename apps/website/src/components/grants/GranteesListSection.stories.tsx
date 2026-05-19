import type { Meta, StoryObj } from '@storybook/react';
import GranteesListSection from './GranteesListSection';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import type { PublicRapidGrant } from '../../server/routers/grants';

const mockGrantees: PublicRapidGrant[] = [
  {
    granteeName: 'Alice Chen',
    projectTitle: 'AI Safety Workshop Series',
    amountUsd: 4500,
    projectSummary: 'Six-session reading group on mechanistic interpretability for early-career researchers.',
    link: 'https://example.com/workshop',
    monthLabel: 'Mar 2026',
  },
  {
    granteeName: 'Bilal Patel',
    projectTitle: 'Compute for evals project',
    amountUsd: 7500,
    projectSummary: 'API credits and compute to extend an open-source evals harness covering sandbagging.',
    monthLabel: 'Feb 2026',
  },
  {
    granteeName: 'Camila Rivas',
    projectTitle: 'AI Safety Lisbon meetup',
    amountUsd: 1200,
    projectSummary: 'Venue and catering for a recurring AI safety meetup in Lisbon.',
    link: 'https://example.com/lisbon',
    monthLabel: 'Feb 2026',
  },
  {
    granteeName: 'Daniel Ortiz',
    projectTitle: 'Travel to MATS extension',
    amountUsd: 2300,
    projectSummary: 'Flights and accommodation to continue research with a MATS mentor.',
    monthLabel: 'Jan 2026',
  },
  {
    granteeName: 'Eve Larsen',
    projectTitle: 'Policy field-building zine',
    amountUsd: 3500,
    projectSummary: 'Print and distribution of a short zine introducing AI policy careers to UK undergrads.',
    link: 'https://example.com/zine',
    monthLabel: 'Jan 2026',
  },
  {
    granteeName: 'Farid Haidari',
    projectTitle: 'Safety benchmarks tooling',
    amountUsd: 6000,
    projectSummary: 'Engineering time to ship a public dashboard tracking benchmark results across labs.',
    monthLabel: 'Dec 2025',
  },
  {
    granteeName: 'Gabriela Souza',
    projectTitle: 'AI safety reading group, São Paulo',
    amountUsd: 800,
    projectSummary: 'Materials and venue for a 12-week reading group on AI alignment fundamentals.',
    monthLabel: 'Dec 2025',
  },
];

const meta = {
  title: 'website/Grants/GranteesListSection',
  component: GranteesListSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'List of public rapid grant recipients. Supports an optional `limit` with a "Show more" toggle, an optional heading, and an optional title + subtitle.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GranteesListSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'Projects we\'ve funded',
    limit: 4,
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.grants.getAllPublicRapidGrantees.query(() => mockGrantees),
      ],
    },
  },
};

export const WithTitleAndSubtitle: Story = {
  args: {
    title: 'Projects we\'ve funded',
    subtitle: 'A selection of community projects funded through Rapid Grants in the last six months.',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.grants.getAllPublicRapidGrantees.query(() => mockGrantees),
      ],
    },
  },
};

export const Empty: Story = {
  args: {
    heading: 'Projects we\'ve funded',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.grants.getAllPublicRapidGrantees.query(() => []),
      ],
    },
  },
};
