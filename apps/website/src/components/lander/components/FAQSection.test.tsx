import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FAQSection from './FAQSection';

const mockProps = {
  title: 'Frequently Asked Questions',
  items: [
    {
      id: 'technical',
      question: 'How much technical background do I need?',
      answer: 'You should understand the basics of how LLMs are trained.',
    },
    {
      id: 'agi-strategy',
      question: 'Do I need to take the AGI strategy course first?',
      answer: "It's not required, but strongly recommended.",
    },
    {
      id: 'bluedot',
      question: 'Who is BlueDot Impact?',
      answer: "We're a London-based startup focused on AI safety education.",
    },
  ],
};

describe('FAQSection', () => {
  it('renders correctly', () => {
    const { container } = render(<FAQSection {...mockProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the section title', () => {
    const { getByText } = render(<FAQSection {...mockProps} />);
    expect(getByText('Frequently Asked Questions')).toBeDefined();
  });

  it('renders all FAQ questions', () => {
    const { getByText } = render(<FAQSection {...mockProps} />);

    expect(mockProps.items.length).toBeGreaterThan(0);
    mockProps.items.forEach((item) => {
      expect(getByText(item.question)).toBeDefined();
    });
  });
});
