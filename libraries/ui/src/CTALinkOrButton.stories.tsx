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
      url: 'https://www.figma.com/design/s4dNR4ELGKPbja6GkHLVJy/Website-Laura\'s-Working-File?node-id=7760-3365&',
    },
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Black: Story = {
  args: {
    children: 'Black Button',
    variant: 'black',
  },
};

export const OutlineBlack: Story = {
  args: {
    children: 'Outline Black Button',
    variant: 'outline-black',
  },
};

export const WithChevron: Story = {
  args: {
    children: 'With Chevron',
    variant: 'primary',
    withChevron: true,
  },
};

export const WithBackChevron: Story = {
  args: {
    children: 'With Back Chevron',
    variant: 'primary',
    withBackChevron: true,
  },
};

export const BlackWithChevron: Story = {
  args: {
    children: 'Black With Chevron',
    variant: 'black',
    withChevron: true,
  },
};

export const BlackWithBackChevron: Story = {
  args: {
    children: 'Black With Back Chevron',
    variant: 'black',
    withBackChevron: true,
  },
};

export const OutlineBlackWithChevron: Story = {
  args: {
    children: 'Outline Black With Chevron',
    variant: 'outline-black',
    withChevron: true,
  },
};

export const OutlineBlackWithBackChevron: Story = {
  args: {
    children: 'Outline Black With Back Chevron',
    variant: 'outline-black',
    withBackChevron: true,
  },
};

export const SmallPrimary: Story = {
  args: {
    children: 'Small Primary',
    variant: 'primary',
    size: 'small',
  },
};

export const SmallSecondary: Story = {
  args: {
    children: 'Small Secondary',
    variant: 'secondary',
    size: 'small',
  },
};

export const SmallBlack: Story = {
  args: {
    children: 'Small Black',
    variant: 'black',
    size: 'small',
  },
};

export const SmallOutlineBlack: Story = {
  args: {
    children: 'Small Outline Black',
    variant: 'outline-black',
    size: 'small',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

export const SmallGhost: Story = {
  args: {
    children: 'Small Ghost',
    variant: 'ghost',
    size: 'small',
  },
};

export const SmallWithChevron: Story = {
  args: {
    children: 'Small With Chevron',
    variant: 'primary',
    size: 'small',
    withChevron: true,
  },
};

export const DisabledButton: Story = {
  args: {
    children: 'Disabled Button',
    variant: 'primary',
    disabled: true,
  },
};

export const DisabledLink: Story = {
  args: {
    children: 'Disabled Link',
    variant: 'primary',
    url: 'https://www.google.com',
    disabled: true,
  },
};

export const CustomStyles: Story = {
  args: {
    children: 'Custom Styles',
    variant: 'primary',
    className: 'bg-[#2244BB] hover:bg-[color-mix(in_oklab,#2244BB,#000_30%)] text-white hover:text-white',
  },
};
