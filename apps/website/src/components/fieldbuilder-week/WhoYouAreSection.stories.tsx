import type { Meta, StoryObj } from '@storybook/react';
import WhoYouAreSection from './WhoYouAreSection';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const meta: Meta<typeof WhoYouAreSection> = {
  title: 'website/FieldbuilderWeek/WhoYouAreSection',
  component: WhoYouAreSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Narrative section describing the ideal Fieldbuilder Week applicant, with an inline application link.',
      },
    },
    msw: {
      handlers: [
        trpcStorybookMsw.programs.getBySlug.query(() => ({
          id: 'rec-fieldbuilder-week',
          slug: 'fieldbuilder-week',
          name: 'Fieldbuilder Week',
          description: null,
          applicationForm: 'https://example.com/apply/fieldbuilder-week',
          category: null,
          status: 'Active',
          order: '1',
        })),
      ],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
