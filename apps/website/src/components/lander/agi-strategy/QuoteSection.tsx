import { useState, useEffect } from 'react';
import { Quote } from '@bluedot/ui';

const COLORS = {
  background: '#FAFAF7',
  cardBg: '#ECF0FF',
  text: '#13132E',
  accent: '#2244BB',
};

const testimonialQuotes: Quote[] = [
  {
    quote: '"We should not underestimate the real threats coming from AI [while] we have a narrowing window of opportunity to guide this technology responsibly."',
    name: 'Ursula von der Leyen',
    role: 'President, European Commission',
    imageSrc: '/images/agi-strategy/ursula.png',
  },
  {
    quote: '"I\'ve always thought of AI as the most profound technology humanity is working on. More profound than fire or electricity or anything that we\'ve done in the past… The downside is, at some point, that humanity loses control of the technology it\'s developing."',
    name: 'Sundar Pichai',
    role: 'CEO, Google',
    imageSrc: '/images/agi-strategy/sundar.png',
  },
  {
    quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
    name: 'Dario Amodei',
    role: 'CEO, Anthropic',
    imageSrc: '/images/lander/foai/dario.jpeg',
  },
  {
    quote: '"I\'m all in favor of accelerating technological progress, but there is something unsettling about the way OpenAI explicitly declares its mission to be the creation of AGI. AI is a wonderful tool for the betterment of humanity; AGI is a potential successor species … To the extent the mission produces extra motivation for the team to ship good products, it\'s a positive. To the extent it might actually succeed, it\'s a reason for concern."',
    name: 'David Sacks',
    role: 'White House AI and Crypto Czar',
    imageSrc: '/images/agi-strategy/david.png',
  },
];

// Font sizing configuration
const FONT_SIZE_THRESHOLDS = {
  EXTRA_LONG: 400, // Characters threshold for smallest font
  LONG: 200, // Characters threshold for medium font
} as const;

const FONT_SIZE_CLASSES = {
  EXTRA_LONG: 'text-[13px] lg:text-[20px]', // For quotes > 400 chars
  LONG: 'text-[16px] lg:text-[24px]', // For quotes 200-400 chars
  DEFAULT: 'text-[20px] lg:text-[32px]', // For quotes < 200 chars
} as const;

// Automatically determine font size based on quote length
const getFontSizeForQuote = (quote: string): string => {
  const { length } = quote;

  if (length > FONT_SIZE_THRESHOLDS.EXTRA_LONG) {
    return FONT_SIZE_CLASSES.EXTRA_LONG;
  } if (length > FONT_SIZE_THRESHOLDS.LONG) {
    return FONT_SIZE_CLASSES.LONG;
  }
  return FONT_SIZE_CLASSES.DEFAULT;
};

const QuoteSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const autorotateTiming = 7000;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % testimonialQuotes.length);
    }, autorotateTiming);
    return () => clearInterval(interval);
  }, []);

  const handleIndicatorClick = (index: number) => {
    setActiveIndex(index);
  };

  const activeQuote = testimonialQuotes[activeIndex];

  if (!activeQuote) {
    return null;
  }

  return (
    <section
      className="flex flex-col items-center w-full py-6 px-5 lg:p-12"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Main content container - Mobile: 350px, Desktop: 1120px */}
      <div className="flex flex-col items-center gap-8 w-full max-w-[350px] lg:max-w-[1120px] mx-auto">
        {/* Quote card with content */}
        <div
          className="flex flex-col lg:flex-row w-full rounded-xl overflow-hidden h-[409px] lg:h-[385px]"
          style={{ backgroundColor: COLORS.cardBg }}
        >
          {/* Quote and author info - Mobile: center aligned, Desktop: left aligned */}
          <div className="flex flex-col items-center lg:items-start p-8 px-6 lg:p-16 gap-12 flex-grow justify-between lg:justify-start">
            {/* Quote text - sizing automatically determined by content length */}
            <blockquote
              className={`${getFontSizeForQuote(activeQuote.quote)} leading-[1.4] lg:leading-tight font-semibold text-center lg:text-left`}
              style={{ color: COLORS.text }}
            >
              {activeQuote.quote}
            </blockquote>

            {/* Author info container - bottom aligned on mobile */}
            <div className="flex flex-col items-center lg:items-start gap-4 lg:gap-0">
              {/* Avatar - mobile only */}
              <img
                src={activeQuote.imageSrc}
                alt={activeQuote.name}
                className="size-16 object-cover rounded-full lg:hidden"
              />

              {/* Name and role */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="text-[18px] leading-tight font-semibold" style={{ color: COLORS.text }}>
                  {activeQuote.name}
                </div>
                <div className="text-[16px] leading-[1.6] opacity-80" style={{ color: COLORS.text }}>
                  {activeQuote.role}
                </div>
              </div>
            </div>
          </div>

          {/* Large image - desktop only */}
          <img
            src={activeQuote.imageSrc}
            alt={activeQuote.name}
            className="hidden lg:block w-80 h-[385px] object-cover flex-shrink-0"
          />
        </div>

        {/* Pagination indicators */}
        <div className="flex gap-2">
          {testimonialQuotes.map((quote, index) => (
            <button
              type="button"
              key={`indicator-${quote.name}`}
              onClick={() => handleIndicatorClick(index)}
              className={`h-1.5 w-12 rounded transition-all duration-300 ${
                index === activeIndex
                  ? 'opacity-100'
                  : 'opacity-15'
              }`}
              style={{
                backgroundColor: index === activeIndex ? COLORS.accent : COLORS.text,
              }}
              aria-label={`Go to quote ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuoteSection;
