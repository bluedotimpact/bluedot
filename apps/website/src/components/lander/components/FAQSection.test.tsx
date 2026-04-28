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

    it('uses answerText for JSX answers when provided', () => {
      const items = [
        {
          id: 'jsx-item',
          question: 'JSX question?',
          answer: <span>JSX answer</span>,
          answerText: 'Plain text version',
        },
        { id: 'string-item', question: 'String question?', answer: 'String answer' },
      ];
      const { container } = render(<FAQSection title="FAQ" items={items} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd.mainEntity).toHaveLength(2);
      expect(jsonLd.mainEntity[0].acceptedAnswer.text).toBe('Plain text version');
      expect(jsonLd.mainEntity[1].acceptedAnswer.text).toBe('String answer');
    });

    it('falls back to empty string for JSX answers without answerText', () => {
      const items = [
        { id: 'jsx-item', question: 'JSX question?', answer: <span>JSX answer</span> },
      ];
      const { container } = render(<FAQSection title="FAQ" items={items} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd.mainEntity[0].acceptedAnswer.text).toBe('');
    });

    it('escapes </script> in answer to prevent script injection', () => {
      const items = [{ id: 'xss', question: 'Q?', answer: '</script><script>alert(1)</script>' }];
      const { container } = render(<FAQSection title="FAQ" items={items} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).not.toContain('</script>');
      expect(() => JSON.parse(script?.textContent ?? '')).not.toThrow();
    });

    it('escapes Unicode line terminators to prevent JS parsing errors', () => {
      const sep = '\u2028';
      const paraSep = '\u2029';
      const items = [{ id: 'uni', question: 'Q?', answer: `text${sep}newline${paraSep}para` }];
      const { container } = render(<FAQSection title="FAQ" items={items} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).not.toMatch(/\u2028|\u2029/);
      expect(() => JSON.parse(script?.textContent ?? '')).not.toThrow();
    });
  });
});
