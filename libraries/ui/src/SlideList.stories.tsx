import type { Meta, StoryObj } from '@storybook/react';
import { SlideList } from './SlideList';

const meta = {
  title: 'ui/SlideList',
  component: SlideList,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SlideList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    maxItemsPerSlide: 3,
    minItemWidth: 300,
    maxRows: 1,
    className: 'w-[60vw]!',
    children: [
      <div key="1" className="border rounded-sm p-4">Slide 1</div>,
      <div key="2" className="border rounded-sm p-4">Slide 2</div>,
      <div key="3" className="border rounded-sm p-4">Slide 3</div>,
      <div key="4" className="border rounded-sm p-4">Slide 4</div>,
      <div key="5" className="border rounded-sm p-4">Slide 5</div>,
      <div key="6" className="border rounded-sm p-4">Slide 6</div>,
      <div key="7" className="border rounded-sm p-4">Slide 7</div>,
      <div key="8" className="border rounded-sm p-4">Slide 8</div>,
    ],
  },
};

export const MultipleRows: Story = {
  args: {
    maxItemsPerSlide: 3,
    minItemWidth: 300,
    maxRows: 2,
    className: 'w-[60vw]!',
    children: [
      <div key="1" className="border p-4 rounded-lg">Item 1</div>,
      <div key="2" className="border p-4 rounded-lg">Item 2</div>,
      <div key="3" className="border p-4 rounded-lg">Item 3</div>,
      <div key="4" className="border p-4 rounded-lg">Item 4</div>,
    ],
  },
};

export const SingleSlide: Story = {
  args: {
    className: 'w-[60vw]!',
    children: [
      <div key="1" className="size-full">
        <div className="border p-4 rounded-lg">Only Item</div>
      </div>,
    ],
  },
};
