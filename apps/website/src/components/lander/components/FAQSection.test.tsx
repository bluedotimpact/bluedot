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
      answer: 'It\'s not required, but strongly recommended.',
    },
    {
      id: 'bluedot',
      question: 'Who is BlueDot Impact?',
      answer: 'We\'re a London-based startup focused on AI safety education.',
    },
  ],
};

const getJsonLd = (container: HTMLElement) => {
  const script = container.querySelector('script[type="application/ld+json"]');
  return script ? JSON.parse(script.textContent ?? '') : null;
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

  describe('JSON-LD structured data', () => {
    it('renders a JSON-LD script tag', () => {
      const { container } = render(<FAQSection {...mockProps} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).not.toBeNull();
    });

    it('sets FAQPage type', () => {
      const { container } = render(<FAQSection {...mockProps} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd['@type']).toBe('FAQPage');
      expect(jsonLd['@context']).toBe('https://schema.org');
    });

    it('includes string answers in structured data', () => {
      const { container } = render(<FAQSection {...mockProps} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd.mainEntity).toHaveLength(3);
      expect(jsonLd.mainEntity[0]).toEqual({
        '@type': 'Question',
        name: 'How much technical background do I need?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You should understand the basics of how LLMs are trained.',
        },
      });
    });

    it('extracts plain text from JSX answers', () => {
      const items = [
        { id: 'jsx-item', question: 'JSX question?', answer: <span>JSX answer</span> },
        { id: 'string-item', question: 'String question?', answer: 'String answer' },
      ];
      const { container } = render(<FAQSection title="FAQ" items={items} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd.mainEntity).toHaveLength(2);
      expect(jsonLd.mainEntity[0].acceptedAnswer.text).toBe('JSX answer');
      expect(jsonLd.mainEntity[1].acceptedAnswer.text).toBe('String answer');
    });

    it('strips HTML tags from JSX answers', () => {
      const items = [
        {
          id: 'jsx-item',
          question: 'JSX question?',
          answer: (
            <>
              First paragraph.<br />
              <a href="https://example.com">A link</a> with text.
            </>
          ),
        },
      ];
      const { container } = render(<FAQSection title="FAQ" items={items} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd.mainEntity[0].acceptedAnswer.text).toBe('First paragraph. A link with text.');
    });
  });
});
