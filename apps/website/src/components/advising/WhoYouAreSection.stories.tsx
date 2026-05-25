import type { Meta, StoryObj } from '@storybook/react';
import WhoYouAreSection from './WhoYouAreSection';

const meta = {
  title: 'website/Advising/WhoYouAreSection',
  component: WhoYouAreSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Persona list describing the kinds of people that get the most value from a 1-1 advising call.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WhoYouAreSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
