import type { Meta, StoryObj } from '@storybook/react';
import {
  PiBank,
  PiCode,
  PiGraduationCap,
  PiRocketLaunch,
} from 'react-icons/pi';
import PathwaysSection, { type Pathway } from './PathwaysSection';
import { TAS_COLORS } from '../course-content/TechnicalAiSafetyContent';

const externalLinkClassName = 'font-medium underline underline-offset-2 hover:text-bluedot-normal';

const meta = {
  title: 'website/CourseLander/PathwaysSection',
  component: PathwaysSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A two-column grid of post-course pathway cards, each with an icon, title, description, and optional link. Supports an optional callout block beneath the grid.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      description: 'Optional anchor id for in-page navigation',
      control: 'text',
    },
    title: {
      description: 'Section heading',
      control: 'text',
    },
    intro: {
      description: 'Intro content rendered below the heading',
      control: false,
    },
    pathways: {
      description: 'Array of pathway cards',
      control: 'object',
    },
    callout: {
      description: 'Optional callout content rendered below the grid',
      control: false,
    },
  },
} satisfies Meta<typeof PathwaysSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const samplePathways: Pathway[] = [
  {
    icon: PiCode,
    title: 'Frontier AI labs',
    description: 'Anthropic, OpenAI, Google DeepMind, and others all have dedicated technical safety teams working on interpretability, evaluations, and alignment. These roles require both deep technical fluency and strategic clarity about which safety problems matter most.',
    accentColor: TAS_COLORS.iconBackground,
  },
  {
    icon: PiGraduationCap,
    title: 'Fellowships',
    description: 'MATS, Astra, Anthropic Fellows, LASR, ERA, Pivotal, ARENA, SPAR. These are competitive, and this course is designed to make you a strong candidate. Alumni from our courses have gone on to all of them.',
    accentColor: TAS_COLORS.iconBackground,
  },
  {
    icon: PiBank,
    title: 'Technical policy',
    description: 'AISI, NIST, and lab policy teams are all hiring people who actually understand the systems being regulated. The people shaping AI policy need technical advisors — and there aren\'t enough of them.',
    accentColor: TAS_COLORS.iconBackground,
  },
  {
    icon: PiRocketLaunch,
    title: 'Start something new',
    description: 'Some participants realize the highest-leverage move is to build: a research project, policy initiative, community, tool, or company. BlueDot runs Rapid Grants and incubator programming for people who come out ready to launch.',
    accentColor: TAS_COLORS.iconBackground,
  },
];

export const Default: Story = {
  args: {
    title: 'Where this leads — and how we help',
    intro: 'This course doesn\'t end at Unit 6. Here\'s where our alumni go — and how we help them get there.',
    pathways: samplePathways,
  },
};

export const WithCallout: Story = {
  args: {
    title: 'Where this leads — and how we help',
    intro: (
      <>
        <p className="mb-5">This course doesn&apos;t end at Unit 6. Here&apos;s where our alumni go — and how we help them get there.</p>
        <div className="rounded-2xl border border-bluedot-navy/10 bg-bluedot-navy/[0.03] p-6 md:p-8 text-left">
          <p className="text-size-sm font-semibold leading-normal text-bluedot-navy mb-3">We don&apos;t just teach</p>
          <p className="text-size-sm leading-relaxed text-bluedot-navy/80">
            BlueDot runs a talent pipeline, not just a course. We actively scout for high-potential participants during the course, facilitate introductions to hiring managers and fellowship leads, and run a
            {' '}
            <a href="/programs/rapid-grants" className={externalLinkClassName}>Rapid Grants program</a>
            {' '}
            to fund participants who come out ready to build something.
          </p>
        </div>
      </>
    ),
    pathways: samplePathways,
    callout: (
      <>
        <p className="text-size-sm font-semibold leading-normal text-bluedot-navy mb-3">Technical AI Safety Project Sprint</p>
        <p className="text-size-sm leading-relaxed text-bluedot-navy/80">
          After completing this course, you can apply for our
          {' '}
          <a href="/courses/technical-ai-safety-project" className={externalLinkClassName}>Project Sprint</a>
          : a focused program where you work with an AI safety expert to produce a real contribution to the field.
        </p>
      </>
    ),
  },
};
