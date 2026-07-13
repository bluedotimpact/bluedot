import type { Meta, StoryObj } from '@storybook/react';

import {
  H1, H2, H3, H4, P, A,
} from './Text';

const meta = {
  title: 'ui/Text',
  component: H1,
  tags: ['autodocs'],
} satisfies Meta<typeof H1>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <H1>Heading 1 — page title</H1>
      <H2>Heading 2 — section title</H2>
      <H3>Heading 3 — subsection</H3>
      <H4>Heading 4 — label</H4>
      <P>
        Body paragraph. Free courses and career support for beneficial AI. Default style: 16px,
        regular weight, relaxed line-height, navy. <A href="#">This is a link.</A>
      </P>
    </div>
  ),
};

// The same recipes are available as utility classes for non-heading tags.
export const UtilityClassEquivalents: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <H1>H1 component</H1>
      <div className="bluedot-h1">div.bluedot-h1 — same styles</div>
      <H2>H2 component</H2>
      <div className="bluedot-h2">div.bluedot-h2 — same styles</div>
    </div>
  ),
};
