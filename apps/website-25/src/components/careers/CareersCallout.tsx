import React from 'react';

const Callout: React.FC = () => {
  const title = 'Join us in our mission to ensure humanity safely navigates the transition to transformative AI.';
  const ctaLabel = 'View our careers';
  const ctaLink = '/careers';

  return (
    <div className="callout bg-[radial-gradient(ellipse_at_30%,_#fff_0%,_#6687ff_100%)] rounded-lg py-16 px-8 m-8 flex flex-col items-center">
      <h2 className="callout__title mb-4 text-center">{title}</h2>
      <button
        type="button"
        className="callout__cta bg-bluedot-normal text-white rounded-lg px-4 py-2 font-semibold text-base hover:bg-bluedot-darker flex items-center"
        onClick={() => window.open(ctaLink, '_blank')}
      >
        <span>{ctaLabel}</span>
        <img
          src="/icons/chevron_white.svg"
          alt="→"
          className="ml-3 w-2 h-2"
        />
      </button>
    </div>
  );
};

export default Callout;
