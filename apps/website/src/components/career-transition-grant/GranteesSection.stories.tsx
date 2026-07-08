import type { Meta, StoryObj } from '@storybook/react';
import GranteesSection from './GranteesSection';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import type { PublicCareerTransitionGrant } from '../../server/routers/grants';

const mockGrantees: PublicCareerTransitionGrant[] = [
  {
    granteeName: 'Alex Romero',
    imageUrl: 'https://picsum.photos/seed/alex/200/200',
    bio: 'Former staff engineer at a US fintech. 8 years building production ML.',
    grantPlan: 'Spending the next six months exploring technical AI safety roles, focusing on evals work.',
    profileUrl: 'https://www.linkedin.com/in/example-alex',
  },
  {
    granteeName: 'Priya Desai',
    imageUrl: 'https://picsum.photos/seed/priya/200/200',
    bio: 'Policy advisor, UK Cabinet Office. MSc in Public Policy.',
    grantPlan: 'Building a network across AI policy in the US and UK while testing fit with frontier policy roles.',
    profileUrl: 'https://www.linkedin.com/in/example-priya',
  },
  {
    granteeName: 'Jonas Werner',
    imageUrl: 'https://picsum.photos/seed/jonas/200/200',
    bio: 'PhD in computational neuroscience, ETH Zurich.',
    grantPlan: 'Skilling up on interpretability with a view to applying to MATS, Anthropic, or Apollo.',
  },
  {
    granteeName: 'Sara Lindqvist',
    imageUrl: 'https://picsum.photos/seed/sara/200/200',
    bio: 'Former operator at a YC startup. Generalist.',
    grantPlan: 'Exploring ops and chief-of-staff roles at AI safety orgs while running pilot field-building projects.',
    profileUrl: 'https://www.linkedin.com/in/example-sara',
  },
  {
    granteeName: 'Marcus Adeyemi',
    imageUrl: 'https://picsum.photos/seed/marcus/200/200',
    bio: 'Senior SWE at a hyperscaler. 10+ years in distributed systems.',
    grantPlan: 'Transitioning to safety-focused infrastructure engineering. Targeting Anthropic, GDM, and METR.',
  },
  {
    granteeName: 'Hana Suzuki',
    imageUrl: 'https://picsum.photos/seed/hana/200/200',
    bio: 'Journalist covering tech policy. BA in International Relations.',
    grantPlan: 'Producing investigative pieces on frontier lab governance while exploring comms roles at AISIs.',
    profileUrl: 'https://www.linkedin.com/in/example-hana',
  },
  // No imageUrl — renders the initials fallback avatar.
  {
    granteeName: 'Tomás Ferreira',
    profileUrl: 'https://www.linkedin.com/in/example-tomas',
  },
  // No imageUrl and no profileUrl — initials avatar, non-linked card.
  {
    granteeName: 'Wei Chen',
  },
  {
    granteeName: 'Amara Okafor',
    imageUrl: 'https://picsum.photos/seed/amara/200/200',
    profileUrl: 'https://www.linkedin.com/in/example-amara',
  },
  {
    granteeName: 'Ravi Menon',
    imageUrl: 'https://picsum.photos/seed/ravi/200/200',
  },
  {
    granteeName: 'Elena Novak',
    imageUrl: 'https://picsum.photos/seed/elena/200/200',
    profileUrl: 'https://www.linkedin.com/in/example-elena',
  },
];

const meta: Meta<typeof GranteesSection> = {
  title: 'website/CareerTransitionGrant/GranteesSection',
  component: GranteesSection,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        trpcStorybookMsw.grants.getAllPublicCareerTransitionGrantees.query(() => mockGrantees),
      ],
    },
    docs: {
      description: {
        component: 'Grid of career transition grant recipients on /career-transition-grant. Cards link to a profile URL when present, and fall back to an initials avatar when a grantee has no headshot. Collapses to three rows with a "Show more" toggle once there are more than that.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.grants.getAllPublicCareerTransitionGrantees.query(() => []),
      ],
    },
  },
};
