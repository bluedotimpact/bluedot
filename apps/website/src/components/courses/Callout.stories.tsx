import type { Meta, StoryObj } from '@storybook/react';

import Callout from './Callout';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';

const meta = {
  title: 'website/Callout',
  component: Callout,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicCallout: Story = {
  args: {
    title: 'Bonus content: Want to know something cool?',
    children: 'Voyager 1\'s famous "Pale Blue Dot" photograph traveled nearly 6 billion kilometers through space, taking over five hours at light speed to reach Earth—capturing our entire planet as a tiny speck against the vastness of space.',
  },
};

export const MdxCallout: Story = {
  args: {
    title: 'Markdown Example',
    children: `## Formatted Content

If you use a Callout within a \`MarkdownExtendedRenderer\`, content passed to the callout is automatically handled as **MDX** so you can use:

- Bullet points
- *Italic text*
- [Links](https://example.com)

And even other components!

<Embed url="https://www.youtube.com/embed/dQw4w9WgXcQ" />`,
  },
  render: (args) => <MarkdownExtendedRenderer>{`<Callout title="${args.title}" className="${args.className ?? ''}">\n${args.children as string}\n</Callout>`}</MarkdownExtendedRenderer>,
};

export const CustomStylesCallout: Story = {
  args: {
    title: 'Want to know how this was done?',
    children: 'The `className` prop was used to apply custom styles to the callout container.',
    className: '!bg-red-100 !border-red-500',
  },
};
