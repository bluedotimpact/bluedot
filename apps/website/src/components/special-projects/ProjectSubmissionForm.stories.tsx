import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { http, HttpResponse, delay } from 'msw';
import ProjectSubmissionForm from './ProjectSubmissionForm';
import { SPECIAL_PROJECTS_ENDPOINT } from '../../lib/special-projects';

const meta = {
  title: 'website/special-projects/ProjectSubmissionForm',
  component: ProjectSubmissionForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ProjectSubmissionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [http.post(SPECIAL_PROJECTS_ENDPOINT, () => HttpResponse.json({ received: true, reference: 'recExample' }))],
    },
  },
};

export const SlowSubmission: Story = {
  parameters: {
    msw: {
      handlers: [http.post(SPECIAL_PROJECTS_ENDPOINT, async () => {
        await delay(5000);
        return HttpResponse.json({ received: true, reference: 'recExample' });
      })],
    },
  },
};

export const Unavailable: Story = {
  parameters: {
    msw: {
      handlers: [http.post(SPECIAL_PROJECTS_ENDPOINT, () => HttpResponse.json({ error: 'Unavailable' }, { status: 503 }))],
    },
  },
};
