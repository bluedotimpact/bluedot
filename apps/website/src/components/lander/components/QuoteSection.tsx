import {
  useState, useRef, useCallback,
} from 'react';
import { type Quote } from '@bluedot/ui';
import { useAboveBreakpoint } from '@bluedot/ui/src/hooks/useBreakpoint';

export type QuoteWithUrl = Quote & {
  /** Source URL for the quote */
  url: string;
  /** Role/title of the person being quoted - required for lander quotes */
  role: string;
};

export type QuoteSectionProps = {
  /** Array of quotes to display in the carousel */
  quotes: QuoteWithUrl[];
  /** Background color for the quote card (only used by the `card` variant). Defaults to '#ECF0FF' */
  cardBackgroundColor?: string;
  /** Accent color for the active navigation indicator. Defaults to bluedot-normal */
  accentColor?: string;
  /**
   * `card`: original lavender-card-with-side-image layout.
   * `editorial`: white background, left-aligned pull-quote, byline with small avatar, tight pagination — matches /programs and /events house style.
   */
  variant?: 'card' | 'editorial';
};

// Design constants - these stay consistent across all courses
const DEFAULT_COLORS = {
  background: '#FFFFFF',
  cardBg: '#ECF0FF',
  text: 'var(--bluedot-navy)',
  accent: 'var(--bluedot-normal)',
};

// Font sizing configuration
const FONT_SIZE_THRESHOLDS = {
  EXTRA_LONG: 400, // Characters threshold for smallest font
  LONG: 200, // Characters threshold for medium font
} as const;

const FONT_SIZE_CLASSES = {
  EXTRA_LONG: 'text-[12px] sm:text-[14px] bd-md:text-[16px] lg:text-[16px] xl:text-[20px]', // For quotes > 400 chars
  LONG: 'text-[16px] sm:text-[18px] bd-md:text-[20px] lg:text-[20px] xl:text-[24px]', // For quotes 200-400 chars
  DEFAULT: 'text-[20px] bd-md:text-[24px] lg:text-[28px] xl:text-[32px]', // For quotes < 200 chars
} as const;

// Automatically determine font size based on quote length
const getFontSizeForQuote = (quote: string): string => {
  const { length } = quote;

  if (length > FONT_SIZE_THRESHOLDS.EXTRA_LONG) {
    return FONT_SIZE_CLASSES.EXTRA_LONG;
  }

  if (length > FONT_SIZE_THRESHOLDS.LONG) {
    return FONT_SIZE_CLASSES.LONG;
  }

  return FONT_SIZE_CLASSES.DEFAULT;
};

const QuoteCard = ({ quote, isActive = true, cardBackgroundColor }: {
  quote: QuoteWithUrl;
  isActive?: boolean;
  cardBackgroundColor?: string;
}) => {
  const cardContent = (
    <div className="flex flex-col lg:flex-row-reverse w-full h-[465px] bd-md:!h-[377px] lg:h-[385px]">
      {/* Quote and author info */}
      <div className="flex flex-col items-center lg:items-start py-8 px-6 bd-md:!py-8 bd-md:!px-6 lg:!p-16 gap-6 sm:gap-8 bd-md:gap-12 flex-grow justify-between">
        {/* Quote text - sizing automatically determined by content length */}
        <blockquote
          className={`${getFontSizeForQuote(quote.quote)} leading-normal lg:leading-tight font-semibold text-center lg:text-left`}
          style={{ color: DEFAULT_COLORS.text }}
        >
          {quote.quote}
        </blockquote>

        {/* Author info container */}
        <div className="flex flex-col items-center lg:items-start gap-4 lg:gap-0">
          {/* Avatar - mobile only */}
          {quote.url && isActive ? (
            <a href={quote.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <img
                src={quote.imageSrc}
                alt={quote.name}
                className="size-12 sm:size-16 object-cover rounded-full lg:hidden"
              />
            </a>
          ) : (
            <img
              src={quote.imageSrc}
              alt={quote.name}
              className="size-12 sm:size-16 object-cover rounded-full lg:hidden"
            />
          )}

          {/* Name and role */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="text-[18px] leading-tight font-semibold" style={{ color: DEFAULT_COLORS.text }}>
              {quote.name}
            </div>
            <div className="text-[16px] leading-[1.6] opacity-80 text-center lg:text-left lg:px-0" style={{ color: DEFAULT_COLORS.text }}>
              {quote.role}
            </div>
          </div>
        </div>
      </div>

      {/* Large image - desktop only with left-side rounded corners */}
      <div className="hidden lg:block w-80 h-[385px] flex-shrink-0 overflow-hidden rounded-l-xl">
        {quote.url && isActive ? (
          <a
            href={quote.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block size-full cursor-pointer"
          >
            <img
              src={quote.imageSrc}
              alt={quote.name}
              className="size-full object-cover rounded-l-xl"
            />
          </a>
        ) : (
          <img
            src={quote.imageSrc}
            alt={quote.name}
            className="size-full object-cover rounded-l-xl"
          />
        )}
      </div>
    </div>
  );

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      style={{ backgroundColor: cardBackgroundColor || DEFAULT_COLORS.cardBg }}
    >
      {cardContent}
    </div>
  );
};

// Editorial variant font sizing: smaller and tighter than the card-variant scale,
// since text sits on a white background with no card to fill.
const getEditorialFontSize = (quote: string): string => {
  if (quote.length > FONT_SIZE_THRESHOLDS.EXTRA_LONG) {
    return 'text-[18px] bd-md:text-[20px] lg:text-[22px]';
  }

  if (quote.length > FONT_SIZE_THRESHOLDS.LONG) {
    return 'text-[20px] bd-md:text-[22px] lg:text-[24px]';
  }

  return 'text-[22px] bd-md:text-[24px] lg:text-[28px]';
};

const QuoteSection = ({
  quotes, cardBackgroundColor, accentColor, variant = 'card',
}: QuoteSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const isDesktop = useAboveBreakpoint(680); // 680px is the design breakpoint specified

  // Auto-rotation removed: distracting. Manual nav buttons, arrow keys, and swipe still work.

  const handleIndicatorClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handlePrevious = useCallback(() => {
    setActiveIndex((prevIndex) => (prevIndex === 0 ? quotes.length - 1 : prevIndex - 1));
  }, [quotes.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % quotes.length);
  }, [quotes.length]);

  // Touch/swipe handling for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) {
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const activeQuote = quotes[activeIndex];

  if (!activeQuote) {
    return null;
  }

  if (variant === 'editorial') {
    const dotActiveColor = accentColor ?? DEFAULT_COLORS.accent;
    const Byline = (
      <>
        <img
          src={activeQuote.imageSrc}
          alt={activeQuote.name}
          className="size-16 bd-md:size-20 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex flex-col">
          <div className="text-[16px] bd-md:text-[17px] font-semibold leading-[1.4] text-bluedot-navy group-hover:text-bluedot-normal transition-colors">
            {activeQuote.name}
          </div>
          <div className="text-[15px] bd-md:text-[16px] leading-[1.5] text-bluedot-navy/60">
            {activeQuote.role}
          </div>
        </div>
      </>
    );

    return (
      <section
        className="w-full bg-white"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label="Quote carousel"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="max-w-max-width mx-auto px-5 py-12 bd-md:px-8 bd-md:py-16 lg:px-spacing-x xl:py-24">
          <div className="w-full bd-md:max-w-[840px] bd-md:mx-auto flex flex-col gap-8">
            <blockquote
              className={`${getEditorialFontSize(activeQuote.quote)} leading-[1.5] font-medium text-bluedot-navy`}
            >
              {activeQuote.quote}
            </blockquote>

            {activeQuote.url ? (
              <a
                href={activeQuote.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group self-start"
              >
                {Byline}
              </a>
            ) : (
              <div className="flex items-center gap-4 group self-start">
                {Byline}
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={handlePrevious}
                className="size-10 rounded-full flex items-center justify-center bg-bluedot-navy/8 hover:bg-bluedot-navy/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bluedot-normal"
                aria-label="Previous quote"
              >
                <span className="text-bluedot-navy text-[16px] leading-none" style={{ transform: 'scaleX(-1)' }}>→</span>
              </button>

              <div className="flex items-center gap-2 mx-1">
                {quotes.map((quote, index) => (
                  <button
                    type="button"
                    key={`indicator-${quote.name}`}
                    onClick={() => handleIndicatorClick(index)}
                    className="size-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bluedot-normal"
                    style={{
                      backgroundColor: index === activeIndex ? dotActiveColor : 'rgba(11, 21, 53, 0.15)',
                    }}
                    aria-label={`Go to quote ${index + 1}`}
                    aria-current={index === activeIndex ? 'true' : 'false'}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="size-10 rounded-full flex items-center justify-center bg-bluedot-navy/8 hover:bg-bluedot-navy/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bluedot-normal"
                aria-label="Next quote"
              >
                <span className="text-bluedot-navy text-[16px] leading-none">→</span>
              </button>

              <span className="text-[14px] text-bluedot-navy/50 ml-auto tabular-nums">
                {activeIndex + 1} / {quotes.length}
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative w-full py-12 px-5 sm:px-5 bd-md:py-16 bd-md:px-8 lg:py-12 xl:py-24 overflow-x-hidden"
      style={{ backgroundColor: DEFAULT_COLORS.background }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Quote carousel"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Main content container */}
      <div className="flex flex-col items-center gap-8 w-full max-w-[calc(100vw-40px)] bd-md:max-w-none bd-md:w-[calc(100vw-64px)] lg:w-auto lg:max-w-none mx-auto overflow-visible">
        {/* Quote cards container */}
        <div className="relative w-full">
          {/* Mobile and Tablet layout (below 1024px) */}
          <div className="lg:hidden relative">
            {/* Main quote card - centered */}
            <div className="flex justify-center w-full">
              <div className="w-[calc(100vw-40px)] bd-md:w-[calc(100vw-64px)] relative z-10">
                <QuoteCard quote={activeQuote} isActive cardBackgroundColor={cardBackgroundColor} />
              </div>
            </div>
          </div>

          {/* Desktop layout (1024px+) */}
          <div className="hidden lg:block relative">
            {/* Main quote card - centered */}
            <div className="flex justify-center w-full">
              <div className="lg:w-[928px] xl:w-[1120px] relative z-10">
                <QuoteCard quote={activeQuote} isActive cardBackgroundColor={cardBackgroundColor} />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation controls - Match 680px Figma specs exactly */}
        <div className="flex items-center justify-center w-[calc(100vw-40px)] bd-md:gap-8 bd-md:w-[calc(100vw-64px)] lg:w-[928px] lg:h-[38px] lg:gap-8 relative z-10">
          {isDesktop && (
            <button
              type="button"
              onClick={handlePrevious}
              className="size-12 rounded-full flex items-center justify-center bg-bluedot-navy/8 transition-all duration-200 opacity-80 hover:opacity-100 hover:bg-bluedot-navy/15 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bluedot-normal"
              aria-label="Previous quote"
            >
              <span
                className="text-bluedot-navy text-[22.4px] font-medium select-none"
                style={{
                  transform: 'scaleX(-1)',
                }}
              >
                →
              </span>
            </button>
          )}

          {/* Selector container - Mobile: 280px width, 64px indicators | Desktop: 408px width, 96px indicators */}
          <div className="flex gap-2 w-[280px] h-[38px] bd-md:w-[408px] bd-md:h-[38px] lg:w-[408px] lg:h-[38px]">
            {quotes.map((quote, index) => (
              <button
                type="button"
                key={`indicator-${quote.name}`}
                onClick={() => handleIndicatorClick(index)}
                className="flex-1 py-4 h-[38px] bd-md:flex-none bd-md:w-24 bd-md:h-[38px] lg:w-24 lg:h-[38px] cursor-pointer transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bluedot-normal"
                aria-label={`Go to quote ${index + 1}`}
              >
                <div
                  className="w-full bd-md:w-24 h-1.5 rounded transition-all duration-300"
                  style={{
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    backgroundColor: index === activeIndex ? (accentColor || DEFAULT_COLORS.accent) : DEFAULT_COLORS.text,
                    opacity: index === activeIndex ? 1 : 0.15,
                  }}
                />
              </button>
            ))}
          </div>

          {isDesktop && (
            <button
              type="button"
              onClick={handleNext}
              className="size-12 rounded-full flex items-center justify-center bg-bluedot-navy/8 transition-all duration-200 opacity-80 hover:opacity-100 hover:bg-bluedot-navy/15 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bluedot-normal"
              aria-label="Next quote"
            >
              <span
                className="text-bluedot-navy text-[22.4px] font-medium select-none"
              >
                →
              </span>
            </button>
          )}
        </div>
      </div>

    </section>
  );
};

export default QuoteSection;
