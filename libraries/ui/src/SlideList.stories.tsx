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
    minItemWidth: 200,
    className: 'w-[60vw]',
    children: [
      <div key="1" className="size-full">Slide 1</div>,
      <div key="2" className="size-full">Slide 2</div>,
      <div key="3" className="size-full">Slide 3</div>,
    ],
  },
};

export const WithFeaturedSlot: Story = {
  args: {
    title: 'Example with Featured',
    description: 'Shows how the featured slot appears',
    featuredSlot: <div className="bg-bluedot-lighter p-8 rounded-lg h-full">Featured Content</div>,
    maxItemsPerSlide: 3,
    minItemWidth: 300,
    className: 'w-[60vw]',
    children: [
      <div key="1" className="size-full">Slide 1</div>,
      <div key="2" className="size-full">Slide 2</div>,
    ],
  },
};

export const MultipleItemsPerSlide: Story = {
  args: {
    subtitle: 'Max number of items per slide',
    maxItemsPerSlide: 2,
    minItemWidth: 300,
    className: 'w-[60vw]',
    children: [
      <div key="1" className="size-full">
        <div className="border p-4 rounded-lg">Item 1</div>
      </div>,
      <div key="2" className="size-full">
        <div className="border p-4 rounded-lg">Item 2</div>
      </div>,
      <div key="3" className="size-full">
        <div className="border p-4 rounded-lg">Item 3</div>
      </div>,
      <div key="4" className="size-full">
        <div className="border p-4 rounded-lg">Item 4</div>
      </div>,
    ],
  },
};

export const SingleSlide: Story = {
  args: {
    subtitle: 'Single Slide',
    description: 'Navigation buttons should be disabled',
    className: 'w-[60vw]',
    children: [
      <div key="1" className="size-full">
        <div className="border p-4 rounded-lg">Only Item</div>
      </div>,
    ],
  },
};
