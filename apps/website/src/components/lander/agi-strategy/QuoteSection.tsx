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
    quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
    name: 'Dario Amodei',
    role: 'CEO, Anthropic',
    imageSrc: '/images/lander/foai/dario.jpeg',
  },
  {
    quote: '"We must take the risks of AI as seriously as other major global challenges, like climate change."',
    name: 'Demis Hassabis',
    role: 'CEO, Google DeepMind',
    imageSrc: '/images/lander/foai/demis.jpeg',
  },
];

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
            {/* Quote text */}
            <blockquote
              className="text-[20px] lg:text-[32px] leading-[1.4] lg:leading-tight font-semibold text-center lg:text-left"
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
