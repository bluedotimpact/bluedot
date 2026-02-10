import {
  render,
  screen,
  fireEvent,
  act,
} from '@testing-library/react';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { QuoteCarousel } from './QuoteCarousel';

const mockQuotes = [
  {
    quote: 'First quote',
    name: 'First Author',
    imageSrc: '/test1.jpg',
    role: 'CEO',
  },
  {
    quote: 'Second quote',
    name: 'Second Author',
    imageSrc: '/test2.jpg',
    role: 'CTO',
  },
  {
    quote: 'Third quote',
    name: 'Third Author',
    imageSrc: '/test3.jpg',
  },
];

const verifyActiveQuote = (container: HTMLElement, expectedQuote: typeof mockQuotes[0]) => {
  const activeQuoteContainer = container.querySelector('.quote-carousel__quote-block--active');
  const activeImageContainer = container.querySelector('.quote-carousel__image-container--active');

  const activeQuote = activeQuoteContainer?.querySelector('.quote-carousel__quote');
  const activeImage = activeImageContainer?.querySelector<HTMLImageElement>('.quote-carousel__image');
  const activeAuthor = activeImageContainer?.querySelector('.quote-carousel__author-name');
  const activeRole = activeImageContainer?.querySelector('.quote-carousel__author-role');

  expect(activeQuote?.textContent).toBe(expectedQuote.quote);
  expect(activeImage?.src).toBe(window.location.origin + expectedQuote.imageSrc);
  expect(activeAuthor?.textContent).toBe(expectedQuote.name);
  expect(activeRole?.textContent).toBe(expectedQuote.role);
};

describe('QuoteCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the first quote by default', () => {
    const { container } = render(<QuoteCarousel quotes={mockQuotes} />);

    expect(container).toMatchSnapshot();
    verifyActiveQuote(container, mockQuotes[0]!);
  });

  it('switches quotes when clicking pagination buttons', () => {
    const { container } = render(<QuoteCarousel quotes={mockQuotes} />);

    const buttons = screen.getAllByRole('button');
    const secondButton = buttons[1];
    if (!secondButton) {
      throw new Error('Button not found');
    }

    fireEvent.click(secondButton);

    verifyActiveQuote(container, mockQuotes[1]!);
  });

  it('automatically rotates quotes', () => {
    const { container } = render(<QuoteCarousel quotes={mockQuotes} />);

    // Initially shows first quote
    verifyActiveQuote(container, mockQuotes[0]!);

    // Advance time by autorotate timing (7000ms)
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    // Should now show second quote
    verifyActiveQuote(container, mockQuotes[1]!);
  });

  it('stops autorotation after manual navigation', () => {
    const { container } = render(<QuoteCarousel quotes={mockQuotes} />);

    const buttons = screen.getAllByRole('button');
    const secondButton = buttons[1];
    if (!secondButton) {
      throw new Error('Button not found');
    }

    fireEvent.click(secondButton);

    // Advance time by autorotate timing
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    // Should still show second quote (no rotation)
    verifyActiveQuote(container, mockQuotes[1]!);
  });
});
