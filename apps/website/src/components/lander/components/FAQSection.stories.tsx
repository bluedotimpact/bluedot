import type { Meta, StoryObj } from '@storybook/react';
import FAQSection from './FAQSection';

const meta = {
  title: 'website/CourseLander/FAQSection',
  component: FAQSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'An accordion-style FAQ section with expandable questions. Multiple questions can be open simultaneously. Supports rich content (JSX) in answers.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Section heading displayed at the top',
      control: 'text',
    },
    items: {
      description: 'Array of FAQ items with id, question, and answer',
      control: 'object',
    },
  },
} satisfies Meta<typeof FAQSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultFaqItems = [
  {
    id: 'technical',
    question: 'How much technical background do I need?',
    answer: (
      <>
        You should understand the basics of how LLMs are trained/fine-tuned, that AI development is driven by data, algorithms and compute, and that the reward function for neural networks is optimised through gradient descent.
        <br /><br />
        Our 2-hour, self-paced <a href="https://example.com/ai-foundations" target="_blank" rel="noopener noreferrer" className="underline">AI Foundations course</a> will give you enough background.
      </>
    ),
  },
  {
    id: 'agi-strategy',
    question: 'Do I need to take the AGI strategy course first?',
    answer: (
      <>
        It&apos;s not required, but strongly recommended. The AGI Strategy course provides essential context that this course builds on. While you can start here directly, you&apos;ll get more value if you understand how technical safety fits into the broader landscape of making AI go well.
      </>
    ),
  },
  {
    id: 'bluedot',
    question: 'Who is BlueDot Impact?',
    answer: (
      <>
        We&apos;re a London-based startup. Since 2022, we&apos;ve trained 5,000 people, with ~1,000 now working on making AI go well.
        <br /><br />
        Our courses are the main entry point into the AI safety field.
        <br /><br />
        We&apos;re an intense 4-person team. We&apos;ve raised $35M in total, including $25M in 2025.
      </>
    ),
  },
];

export const Default: Story = {
  args: {
    title: 'Frequently Asked Questions',
    items: defaultFaqItems,
  },
};

export const SingleItem: Story = {
  args: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'funding',
        question: 'Can I just apply for funding?',
        answer: 'Funding is only available for graduates of the course.',
      },
    ],
  },
};

export const WithRichContent: Story = {
  args: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'resources',
        question: 'What resources are included?',
        answer: (
          <>
            The course includes:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Curated readings from leading AI safety researchers</li>
              <li>Interactive exercises and reflection prompts</li>
              <li>Live facilitated discussions with experts</li>
              <li>Access to our alumni Slack community</li>
              <li>Optional career support and mentorship matching</li>
            </ul>
          </>
        ),
      },
      {
        id: 'contact',
        question: 'How can I contact support?',
        answer: (
          <>
            You can reach us through:
            <br /><br />
            <strong>Email:</strong> <a href="mailto:support@bluedot.org" className="text-[#2244BB] underline">support@bluedot.org</a>
            <br />
            <strong>Twitter:</strong> <a href="https://twitter.com/bluedotimpact" target="_blank" rel="noopener noreferrer" className="text-[#2244BB] underline">@bluedotimpact</a>
            <br />
            <strong>Response time:</strong> Within 48 hours
          </>
        ),
      },
      {
        id: 'refund',
        question: 'What is your refund policy?',
        answer: (
          <>
            Since the course operates on a <em>pay-what-you-want</em> model, refunds work as follows:
            <br /><br />
            <strong>Before the course starts:</strong> Full refund, no questions asked.
            <br />
            <strong>During the first week:</strong> Pro-rated refund available.
            <br />
            <strong>After the first week:</strong> No refunds, but you can defer to a future cohort.
            <br /><br />
            Contact <a href="mailto:support@bluedot.org" className="text-[#2244BB] underline">support@bluedot.org</a> for any concerns.
          </>
        ),
      },
    ],
  },
};
