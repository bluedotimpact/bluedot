import type React from 'react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

export type Quote = {
  // Required
  quote: string;
  name: string;
  imageSrc: string;
  // Optional
  role?: string;
};

export type QuoteCarouselProps = {
  // Required
  quotes: Quote[];
  // Optional
  className?: string;
};

export const QuoteCarousel: React.FC<QuoteCarouselProps> = ({
  quotes,
  className,
}) => {
  const [active, setActive] = useState(0);
  const [autorotate, setAutorotate] = useState(true);
  const autorotateTiming = 7000;

  useEffect(() => {
    if (!autorotate) {
      return undefined;
    }

    const interval = setInterval(() => {
      setActive((prevActive) => {
        if (prevActive + 1 === quotes.length) {
          return 0;
        }

        return prevActive + 1;
      });
    }, autorotateTiming);
    return () => clearInterval(interval);
  }, [autorotate, quotes.length]);

  return (
    <div
      className={clsx(
        'quote-carousel text-center',
        className,
      )}
    >
      {/* Testimonial image */}
      <div className="relative quote-carousel__image-section h-28 flex justify-center mb-4">
        {quotes.map((quote, index) => (
          <div
            key={quote.name}
            className={clsx(
              'quote-carousel__image-container flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.68,-0.3,0.32,1)]',
              active === index
                ? 'quote-carousel__image-container--active block opacity-100 rotate-0 scale-100'
                : 'hidden opacity-0 -rotate-12 scale-95 pointer-events-none',
            )}
          >
            <img
              className="quote-carousel__image rounded-full object-cover size-14"
              src={quote.imageSrc}
              alt={quote.name}
            />
            <div className="quote-carousel__author-name mt-1">
              {quote.name}
            </div>
            {quote.role && (
              <div className="quote-carousel__author-role text-size-xs uppercase font-bold mt-1">
                {quote.role}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Text */}
      <div className="quote-carousel__quote-section flex flex-col mb-9 transition-all delay-300 duration-150 ease-in-out">
        {quotes.map((quote, index) => (
          <div
            key={quote.name}
            className={clsx(
              'quote-carousel__quote-block w-full transition-all duration-500',
              active === index
                ? 'quote-carousel__quote-block--active block opacity-100 translate-x-0'
                : 'hidden opacity-0 -translate-x-4 pointer-events-none',
            )}
          >
            <div className="quote-carousel__quote text-2xl font-bold">
              {quote.quote}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {quotes.length > 1 && (
        <div className="quote-carousel__btn-section mt-4 flex flex-row gap-2 justify-center">
          {quotes.map((quote, index) => (
            <button
              key={quote.name}
              type="button"
              className={clsx(
                'size-3 rounded-full transition-all duration-150 hover:cursor-pointer',
                active === index
                  ? 'bg-bluedot-normal'
                  : 'bg-transparent border-2 border-bluedot-normal',
              )}
              onClick={() => {
                setActive(index);
                setAutorotate(false);
              }}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuoteCarousel;
