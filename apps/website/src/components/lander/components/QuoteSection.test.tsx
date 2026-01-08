import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import QuoteSection from './QuoteSection';

const mockProps = {
  quotes: [
    {
      quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
      name: 'Dario Amodei',
      role: 'CEO, Anthropic',
      imageSrc: '/images/lander/foai/dario.webp',
      url: 'https://example.com/source',
    },
    {
      quote: '"The downside is, at some point, humanity loses control."',
      name: 'Sundar Pichai',
      role: 'CEO, Google',
      imageSrc: '/images/agi-strategy/sundar.webp',
      url: 'https://example.com/source2',
    },
  ],
};

describe('QuoteSection', () => {
  it('renders correctly with default colors', () => {
    const { container } = render(<QuoteSection {...mockProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the first quote', () => {
    const { getAllByText } = render(<QuoteSection {...mockProps} />);
    expect(getAllByText(mockProps.quotes[0]!.quote).length).toBeGreaterThan(0);
  });

  it('renders the quote author name and role', () => {
    const { getAllByText } = render(<QuoteSection {...mockProps} />);
    expect(getAllByText('Dario Amodei').length).toBeGreaterThan(0);
    expect(getAllByText('CEO, Anthropic').length).toBeGreaterThan(0);
  });

  it('renders navigation indicators', () => {
    const { getAllByRole } = render(<QuoteSection {...mockProps} />);
    const indicators = getAllByRole('button', { name: /Go to quote/ });

    expect(mockProps.quotes.length).toBeGreaterThan(0);
    expect(indicators).toHaveLength(mockProps.quotes.length);
  });

  it('renders with custom card background color (AGI Strategy purple)', () => {
    const { container } = render(
      <QuoteSection
        {...mockProps}
        cardBackgroundColor="#f3e8ff"
        accentColor="#9177dc"
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom card background color (Biosecurity green)', () => {
    const { container } = render(
      <QuoteSection
        {...mockProps}
        cardBackgroundColor="#e5faea"
        accentColor="#3da462"
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom card background color (Future of AI cream)', () => {
    const { container } = render(
      <QuoteSection
        {...mockProps}
        cardBackgroundColor="#faf6e1"
        accentColor="#8c8146"
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('applies custom card background color to quote card', () => {
    const customBgColor = '#e5faea';
    const { container } = render(
      <QuoteSection
        {...mockProps}
        cardBackgroundColor={customBgColor}
      />,
    );
    const quoteCard = container.querySelector(`[style*="background-color: ${customBgColor}"]`);
    expect(quoteCard).toBeInTheDocument();
  });

  it('applies custom accent color to active navigation indicator', () => {
    const customAccentColor = '#3da462';
    const { container } = render(
      <QuoteSection
        {...mockProps}
        accentColor={customAccentColor}
      />,
    );
    const activeIndicator = container.querySelector(`[style*="background-color: ${customAccentColor}"]`);
    expect(activeIndicator).toBeInTheDocument();
  });
});
