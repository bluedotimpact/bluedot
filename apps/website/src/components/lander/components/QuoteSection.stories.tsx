import type { Meta, StoryObj } from '@storybook/react';
import QuoteSection, { QuoteWithUrl } from './QuoteSection';

const meta = {
  title: 'website/CourseLander/QuoteSection',
  component: QuoteSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A carousel section displaying quotes from notable figures. Features auto-rotation, swipe gestures on mobile, and keyboard navigation. Font size automatically adjusts based on quote length.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    quotes: {
      description: 'Array of quotes to display in the carousel',
      control: 'object',
    },
  },
} satisfies Meta<typeof QuoteSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleQuotes: QuoteWithUrl[] = [
  {
    quote: '"We should not underestimate the real threats coming from AI [while] we have a narrowing window of opportunity to guide this technology responsibly."',
    name: 'Ursula von der Leyen',
    role: 'President, European Commission',
    imageSrc: '/images/agi-strategy/ursula.webp',
    url: 'https://neighbourhood-enlargement.ec.europa.eu/news/2023-state-union-address-president-von-der-leyen-2023-09-13_en',
  },
  {
    quote: '"I\'ve always thought of AI as the most profound technology humanity is working on. More profound than fire or electricity or anything that we\'ve done in the past… The downside is, at some point, that humanity loses control of the technology it\'s developing."',
    name: 'Sundar Pichai',
    role: 'CEO, Google',
    imageSrc: '/images/agi-strategy/sundar.webp',
    url: 'https://garrisonlovely.substack.com/p/a-compilation-of-tech-executives',
  },
  {
    quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
    name: 'Dario Amodei',
    role: 'CEO, Anthropic',
    imageSrc: '/images/lander/foai/dario.webp',
    url: 'https://arstechnica.com/ai/2025/01/anthropic-chief-says-ai-could-surpass-almost-all-humans-at-almost-everything-shortly-after-2027/',
  },
  {
    quote: '"I\'m all in favor of accelerating technological progress, but there is something unsettling about the way OpenAI explicitly declares its mission to be the creation of AGI. AI is a wonderful tool for the betterment of humanity; AGI is a potential successor species … To the extent the mission produces extra motivation for the team to ship good products, it\'s a positive. To the extent it might actually succeed, it\'s a reason for concern."',
    name: 'David Sacks',
    role: 'White House AI and Crypto Czar',
    imageSrc: '/images/agi-strategy/david-sacks.webp',
    url: 'https://x.com/HumanHarlan/status/1864858286065111298',
  },
];

export const Default: Story = {
  args: {
    quotes: sampleQuotes,
  },
};

export const ShortQuotes: Story = {
  args: {
    quotes: [
      {
        quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
        name: 'Dario Amodei',
        role: 'CEO, Anthropic',
        imageSrc: '/images/lander/foai/dario.webp',
        url: 'https://example.com',
      },
      {
        quote: '"The downside is, at some point, humanity loses control."',
        name: 'Sundar Pichai',
        role: 'CEO, Google',
        imageSrc: '/images/agi-strategy/sundar.webp',
        url: 'https://example.com',
      },
    ],
  },
};

export const LongQuotes: Story = {
  args: {
    quotes: [
      {
        quote: '"I\'m all in favor of accelerating technological progress, but there is something unsettling about the way OpenAI explicitly declares its mission to be the creation of AGI. AI is a wonderful tool for the betterment of humanity; AGI is a potential successor species … To the extent the mission produces extra motivation for the team to ship good products, it\'s a positive. To the extent it might actually succeed, it\'s a reason for concern."',
        name: 'David Sacks',
        role: 'White House AI and Crypto Czar',
        imageSrc: '/images/agi-strategy/david-sacks.webp',
        url: 'https://example.com',
      },
      {
        quote: '"I\'ve always thought of AI as the most profound technology humanity is working on. More profound than fire or electricity or anything that we\'ve done in the past. The downside is, at some point, that humanity loses control of the technology it\'s developing. We need to be thoughtful about how we proceed with this transformative technology that will reshape every aspect of human civilization."',
        name: 'Sundar Pichai',
        role: 'CEO, Google',
        imageSrc: '/images/agi-strategy/sundar.webp',
        url: 'https://example.com',
      },
    ],
  },
};
