import type { Meta, StoryObj } from '@storybook/react';

import MarkdownExtendedRenderer, { getSupportedComponents } from './MarkdownExtendedRenderer';

const meta = {
  title: 'website/MarkdownExtendedRenderer',
  component: MarkdownExtendedRenderer,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof MarkdownExtendedRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicMarkdown: Story = {
  args: {
    children: `# Standard markdown formatting

This component supports standard markdown formatting

## Text

You can use **bold**, *italic*, and ~~strikethrough~~ text.

You can include links to [interesting resources](https://www.youtube.com/watch?v=6MUrF_G7KlM).

Code:

\`\`\`mdx
You can use **bold**, *italic*, and ~~strikethrough~~ text.

You can include links to [interesting resources](https://www.youtube.com/watch?v=6MUrF_G7KlM).
\`\`\`

## Images

You can also show images!

![Pale Blue Dot, the first ever portrait of the solar system taken by the Voyager 1 spacecraft](https://upload.wikimedia.org/wikipedia/commons/7/73/Pale_Blue_Dot.png)

Code:

\`\`\`mdx
![Pale Blue Dot, the first ever portrait of the solar system taken by the Voyager 1 spacecraft](https://upload.wikimedia.org/wikipedia/commons/7/73/Pale_Blue_Dot.png)
\`\`\`

Tip: To insert an image in the Airtable editor, write text that describe the image that will be used by screenreaders and search engines ([more details](https://accessibility.huit.harvard.edu/describe-content-images)). Then, create a link from that text to the image source. Finally, pop an exclamation mark before the whole thing. It won't render in Airtable, but will in this component.

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

Code:

\`\`\`mdx
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
\`\`\`

## Code

Inline: \`const example = "hello world";\`

Block:
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

Code:

\`\`\`\`mdx
Inline: \`const example = "hello world";\`

Block:
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`
\`\`\`\`
    `,
  },
};

export const WithComponents: Story = {
  args: {
    children: `# Using Components

The following components are supported within your markdown content:

${Object.keys(getSupportedComponents()).map((componentName) => `- \`${componentName}\``).join('\n')}

See their Storybook pages for usage details.

(to add to this list, add to \`getSupportedComponents\` in \`MarkdownExtendedRenderer.tsx\`)

## Example

Below is an example of using the Callout and Embed components:

<Callout title="Want to see something cool?">
  This is some markdown extended content, using _components_!

  And you can nest components as you like too:

  <Embed url="https://www.youtube.com/embed/dQw4w9WgXcQ" />
</Callout>

Code:

\`\`\`mdx
<Callout title="Want to see something cool?">
  This is some markdown extended content, using _components_!

  And you can nest components as you like too:

  <Embed url="https://www.youtube.com/embed/dQw4w9WgXcQ" />
</Callout>
\`\`\`

## Escaping

Component properties will be unescaped when rendered. For example the input:

\`\`\`mdx
<Embed url="https://example.com/some\\_underscored\\_path" />
\`\`\`

Will actually render the following MDX:

\`\`\`mdx
<Embed url="https://example.com/some_underscored_path" />
\`\`\`

This is because by default most Markdown editors aren't aware of components, and so will escape special markdown characters everywhere - including in component properties. This includes the Airtable markdown editor.

If you do really want backslashes, escape them:

\`\`\`mdx
<Callout title="The backslash symbol (\\\\) is often used to escape other characters" />
\`\`\`

<Callout title="The backslash symbol (\\\\) is often used to escape other characters" />

This only affects components, and not markdown text. So escaping works normally in markdown:

\`\`\`mdx
- _normal italics_
- \\_escaped italics\\_
\`\`\`

- _normal italics_
- \\_escaped italics\\_
`,
  },
};

export const MarkdownRenderingFixes: Story = {
  name: 'Markdown Rendering Fixes',
  args: {
    children: `# Markdown Rendering Fixes

---

## Issue #1: Text with < Characters

Medical <countermeasures (MCMs) such as vaccines and therapeutics are essential tools for pandemic preparedness.

This platform is used by <2000 users worldwide, serving populations <5000 people in remote areas.

**Expected:** All text with \`<\` characters displays correctly without breaking the page.

---

## Issue #2: Autolinks Work

Visit <https://greendale.edu/ai-soc/ai-alignment> for course information.

Documentation: <https://docs.example.com/guide>

**Expected:** URLs in angle brackets are clickable links that open in a new tab.

---

## Issue #3: Single Line Breaks

First line of text
Second line appears on a new line (not same line)
Third line also appears separately

**Expected:** Single newlines create visible line breaks.

---

## Issue #4: Bolded Headers Maintain Size

### **This entire H3 header is bolded**

Regular H3 header for comparison

**Expected:** Bolded headers maintain the same size as regular headers.

---

## Real-World Example

### **Bolded Header Example**

This platform is used by <2000 users worldwide.
Visit <https://example.com> for more details.

Key points:
First consideration
Second consideration
Third consideration

<Embed url="https://www.youtube.com/embed/dQw4w9WgXcQ" />
`,
  },
};
