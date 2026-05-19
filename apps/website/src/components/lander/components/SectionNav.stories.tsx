import type { Meta, StoryObj } from '@storybook/react';
import SectionNav, { type SectionNavItem } from './SectionNav';

const meta = {
  title: 'website/CourseLander/SectionNav',
  component: SectionNav,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A sticky in-page navigation bar that appears after the user scrolls past the hero. Highlights the active section as the user scrolls. Exposes an optional apply CTA on the right.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minHeight: '200vh' }}>
        <div style={{
          height: '600px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          Scroll down to reveal the SectionNav. It only appears once you scroll past ~500px.
        </div>
        <Story />
        <div id="who" style={{ minHeight: '600px', padding: '40px' }}>Section: Who this is for</div>
        <div id="outcomes" style={{ minHeight: '600px', padding: '40px' }}>Section: Outcomes</div>
        <div id="structure" style={{ minHeight: '600px', padding: '40px' }}>Section: Structure</div>
        <div id="pathways" style={{ minHeight: '600px', padding: '40px' }}>Section: Pathways</div>
        <div id="faq" style={{ minHeight: '600px', padding: '40px' }}>Section: FAQ</div>
      </div>
    ),
  ],
  argTypes: {
    sections: {
      description: 'Array of section anchors to expose in the nav',
      control: 'object',
    },
    applyUrl: {
      description: 'Optional URL for the right-aligned apply CTA',
      control: 'text',
    },
  },
} satisfies Meta<typeof SectionNav>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleSections: SectionNavItem[] = [
  { id: 'who', label: 'Who this is for' },
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'structure', label: 'Structure' },
  { id: 'pathways', label: 'Pathways' },
  { id: 'faq', label: 'FAQ' },
];

export const Default: Story = {
  args: {
    sections: sampleSections,
    applyUrl: 'https://example.com/apply',
  },
};

export const WithoutCta: Story = {
  args: {
    sections: sampleSections,
  },
};
