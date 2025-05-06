import type { Meta, StoryObj } from '@storybook/react';

import MarkdownEditor from './MarkdownEditor';

const meta = {
  title: 'website/MarkdownEditor',
  component: MarkdownEditor,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} as Meta<typeof MarkdownEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicMarkdown: Story = {
  args: {
    children: `# Editor example
The editor supports various text formatting options:

- **Bold text** is created with double asterisks.
- *Italic text* is created with single asterisks.
- ~~Strikethrough~~ is created with double tildes.

You can also create [links](https://example.com).

And you can combine formatting, like **bold and _italic_** text.

## Code Examples

Inline code: \`const greeting = "Hello, world!";\`

Code blocks:

\`\`\`javascript
function sayHello(name) {
  return \`Hello, \${name}!\`;
}
console.log(sayHello("User"));
\`\`\`

## Lists

Unordered list:
- Item 1
- Item 2
  - Nested item
  - Another nested item
- Item 3

Ordered list:
1. First item
2. Second item
3. Third item

## Getting the output

Pass in an \`onChange\` prop to get the output.

In storybook we use \`console.log\` by default, so you can see the markdown output in the browser console.`,
    // eslint-disable-next-line no-console
    onChange: console.log,
  },
};
