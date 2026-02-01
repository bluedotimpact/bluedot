import type { Meta, StoryObj } from '@storybook/react';
import GroupResponses, { type GroupData } from './GroupResponses';

const longResponse = 'A better future means access to meaningful work and stronger local institutions. I\'d love to see more investment in public infrastructure — not just roads and transit, but libraries, community centres, and green spaces that bring people together. I think technology can help here, but only if we\'re intentional about how we deploy it. Too often we optimise for efficiency at the expense of human connection. I\'d also like to see education systems that teach critical thinking and adaptability rather than rote memorisation. The pace of change is accelerating, and we need people who can navigate uncertainty with confidence. Ultimately, I think a better future is one where people have more agency over their own lives — more time, more autonomy, and more opportunities to contribute to something larger than themselves.';

const shortResponse = 'I think the most important thing is reducing the barriers to cooperation across borders. Many of our biggest challenges are global, but our institutions are still largely national.';

const defaultGroups: GroupData[] = [{
  id: '1',
  name: 'Group 01',
  totalParticipants: 5,
  responses: [
    { name: 'Alice Thompson', response: longResponse },
    { name: 'Ben Rivera', response: shortResponse },
    { name: 'Priya Sharma', response: 'I want a future where scientific research is better funded and more accessible.' },
  ],
}];

const meta: Meta<typeof GroupResponses> = {
  title: 'Exercises/GroupResponses',
  component: GroupResponses,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    groups: defaultGroups,
  },
};

export default meta;
type Story = StoryObj<typeof GroupResponses>;

export const Default: Story = {};

export const WithGroupDropdown: Story = {
  args: {
    groups: [
      defaultGroups[0]!,
      {
        id: '2', name: 'Group 02 - Carlos Mendez', totalParticipants: 4, responses: [],
      },
      {
        id: '3', name: 'Group 03 - Fatima Al-Rashid', totalParticipants: 3, responses: [{ name: 'Fatima Al-Rashid', response: shortResponse }],
      },
    ],
  },
};

export const EmptyResponses: Story = {
  args: {
    groups: [{
      id: '1', name: 'Group 01', totalParticipants: 4, responses: [],
    }],
  },
};
