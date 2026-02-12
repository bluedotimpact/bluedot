import type { Meta, StoryObj } from '@storybook/react';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ErrorSection } from './ErrorSection';

const meta = {
  title: 'Components/ErrorSection',
  component: ErrorSection,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorSection>;

export default meta;
type Story = StoryObj<typeof ErrorSection>;

export const SimpleError: Story = {
  args: {
    error: new Error('You done messed up'),
  },
};

export const StringError: Story = {
  args: {
    error: 'This was a string',
  },
};

export const NestedError: Story = {
  args: {
    error: new Error('Some outer error', {
      cause: new Error('Some the cause of that problem', {
        cause: new Error('Some root cause'),
      }),
    }),
  },
};

export const NetworkError: Story = {
  args: {
    error: new AxiosError(
      'Request failed with status code 404',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {
          url: '/api/some/route',
          method: 'get',
        } as InternalAxiosRequestConfig,
        data: { error: 'Exercise not found' },
      },
    ),
  },
};

export const ArbitraryError: Story = {
  args: {
    error: { wahoo: 'This component accepts any value, even this crazy thing. But it does much better with actual errors, especially ones from Axios calling the API.', arr: [1, 2, 3] },
  },
};

export const StupidLongError: Story = {
  args: {
    error: new Error(`${'NA '.repeat(1000)}BATMAN!`),
  },
};
