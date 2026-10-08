import type { Meta, StoryObj } from '@storybook/react';
import HowItWorksSection from './HowItWorksSection';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const statsHandler = (averageDaysToDecision: number | null) => trpcStorybookMsw.grants.getRapidGrantStats.query(() => ({
  count: 1004,
  totalAmountUsd: 2691905.71,
  averageDaysToDecision,
}));

const meta: Meta<typeof HowItWorksSection> = {
  title: 'Website/RapidGrants/HowItWorksSection',
  component: HowItWorksSection,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: {
        program: trpcStorybookMsw.programs.getBySlug.query(() => null),
        stats: statsHandler(5.26),
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SameDay: Story = { parameters: { msw: { handlers: { stats: statsHandler(0) } } } };
export const NoTimedDecisions: Story = { parameters: { msw: { handlers: { stats: statsHandler(null) } } } };
export const Unavailable: Story = {
  parameters: { msw: { handlers: { stats: trpcStorybookMsw.grants.getRapidGrantStats.query(() => null) } } },
};
