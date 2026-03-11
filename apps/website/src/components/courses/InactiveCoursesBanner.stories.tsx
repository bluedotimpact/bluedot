import type { Meta, StoryObj } from '@storybook/react';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import { InactiveCoursesBanner } from './InactiveCoursesBanner';

const meta = {
  title: 'website/courses/InactiveCoursesBanner',
  component: InactiveCoursesBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof InactiveCoursesBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.meetPerson.getInactiveCourseRegistrations.query(() => [
          { courseRegistrationId: 'rec123456789', courseSlug: 'agi-safety-fundamentals', roundId: 'round-1' },
        ]),
      ],
    },
  },
};
