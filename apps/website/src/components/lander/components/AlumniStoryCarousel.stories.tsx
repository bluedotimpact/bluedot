import type { Meta, StoryObj } from '@storybook/react';
import AlumniStoryCarousel, { type AlumniStory } from './AlumniStoryCarousel';

const meta = {
  title: 'website/CourseLander/AlumniStoryCarousel',
  component: AlumniStoryCarousel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A horizontally scrolling carousel of detailed alumni stories with auto-advance and infinite-loop behaviour. Each card shows a photo, name, role, and longer-form story.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Section heading shown above the carousel',
      control: 'text',
    },
    subtitle: {
      description: 'Optional italic subtitle shown below the heading',
      control: 'text',
    },
    stories: {
      description: 'Array of alumni stories to display in the carousel',
      control: 'object',
    },
  },
} satisfies Meta<typeof AlumniStoryCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleStories: AlumniStory[] = [
  {
    name: 'Adam Jones',
    role: 'Research Engineer, Anthropic',
    story: 'After taking the course, I landed a research engineering role at Anthropic working on alignment. The course gave me the technical vocabulary and the network I needed to make the move from product engineering into safety research.',
    imageSrc: '/images/graduates/adam.webp',
    url: 'https://example.com/adam',
  },
  {
    name: 'Ana Rodriguez',
    role: 'Policy Lead, UK AISI',
    story: 'I was working in government policy and knew AI mattered, but I did not know where to plug in. The course showed me how technical evaluations connect to policy levers, and I now lead a small policy team at the UK AI Safety Institute.',
    imageSrc: '/images/graduates/ana.webp',
  },
  {
    name: 'Belle Chen',
    role: 'Founder, Safe Systems Lab',
    story: 'The course was the kick I needed. Within six months of finishing I had co-founded a small research lab focused on dangerous capability evaluations, with funding from BlueDot Rapid Grants and a follow-on from a seed-stage VC.',
    imageSrc: '/images/graduates/belle.webp',
    url: 'https://example.com/belle',
  },
  {
    name: 'Cameron Patel',
    role: 'PhD Student, MILA',
    story: 'I came into the course with a strong ML background but a fuzzy picture of safety. I left with a sharper sense of the open problems, and that directly shaped my PhD research agenda on mechanistic interpretability.',
    imageSrc: '/images/graduates/cameron.webp',
  },
  {
    name: 'Catherine Nguyen',
    role: 'Senior Engineer, Google DeepMind',
    story: 'I spent five years at a frontier lab building infrastructure. The course gave me a map of the broader safety landscape and the confidence to advocate internally for more investment in evals and red-teaming.',
    imageSrc: '/images/graduates/catherine.webp',
  },
];

export const Default: Story = {
  args: {
    title: 'People who took this path',
    stories: sampleStories,
  },
};
