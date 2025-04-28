import type { Meta, StoryObj } from '@storybook/react';

import { CTALinkOrButton } from './CTALinkOrButton';

const meta = {
  title: 'ui/CTALinkOrButton',
  component: CTALinkOrButton,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    children: 'Testing',
    variant: 'primary',
    withChevron: false,
    url: '',
  },
} satisfies Meta<typeof CTALinkOrButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    // eslint-disable-next-line no-console
    onClick: (e) => console.log('Button click event: ', e),
  },
};

export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'primary',
    url: 'https://www.google.com',
  },
  parameters: {
    design: {
      type: 'figma',
      url: "https://www.figma.com/design/s4dNR4ELGKPbja6GkHLVJy/Website-Laura's-Working-File?node-id=7760-3365&",
    },
  },
};
