import type { Meta, StoryObj } from '@storybook/react';
import { SlideList, SlideItem } from './SlideList';

const meta = {
  title: 'Components/SlideList',
  component: SlideList,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SlideList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Example Slides',
    description: 'This is a description of the slides',
    children: [
      <SlideItem key="1">Slide 1</SlideItem>,
      <SlideItem key="2">Slide 2</SlideItem>,
      <SlideItem key="3">Slide 3</SlideItem>,
    ],
  },
};

export const WithFeaturedSlot: Story = {
  args: {
    title: 'Example with Featured',
    description: 'Shows how the featured slot appears',
    featuredSlot: <div className="bg-bluedot-lighter p-8 rounded-lg h-full">Featured Content</div>,
    children: [
      <SlideItem key="1">Slide 1</SlideItem>,
      <SlideItem key="2">Slide 2</SlideItem>,
    ],
  },
};

export const MultipleItemsPerSlide: Story = {
  args: {
    title: 'Multiple Items Per Slide',
    itemsPerSlide: 2,
    children: [
      <SlideItem key="1">
        <div className="border p-4 rounded-lg">Item 1</div>
      </SlideItem>,
      <SlideItem key="2">
        <div className="border p-4 rounded-lg">Item 2</div>
      </SlideItem>,
      <SlideItem key="3">
        <div className="border p-4 rounded-lg">Item 3</div>
      </SlideItem>,
      <SlideItem key="4">
        <div className="border p-4 rounded-lg">Item 4</div>
      </SlideItem>,
    ],
  },
};

export const SingleSlide: Story = {
  args: {
    title: 'Single Slide',
    description: 'Navigation buttons should be disabled',
    children: [
      <SlideItem key="1">
        <div className="border p-4 rounded-lg">Only Item</div>
      </SlideItem>,
    ],
  },
};

export const CustomWidth: Story = {
  args: {
    title: 'Custom Width',
    slidesWrapperWidth: '600px',
    children: [
      <SlideItem key="1">Slide 1</SlideItem>,
      <SlideItem key="2">Slide 2</SlideItem>,
    ],
  },
};
