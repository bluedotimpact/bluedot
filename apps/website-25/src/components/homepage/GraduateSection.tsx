import { FaceTiles } from '@bluedot/ui';

const faces = [
  { src: '/images/face-tiles/facetile-1.png', alt: 'Person 1' },
  { src: '/images/face-tiles/facetile-2.png', alt: 'Person 2' },
  { src: '/images/face-tiles/facetile-3.png', alt: 'Person 3' },
];

const GraduateSection = () => {
  return (
    <div className="graduate-section mx-16 my-8">
      <div className="graduate-section__container flex flex-row mx-6 my-8 gap-6 items-center">
        <FaceTiles faces={faces} />
        <p className="graduate-section__text">Our graduates work at</p>
        <div className="graduate-section__logos-container flex flex-row gap-6 items-center">
          <img className="graduate-section__logo h-3" src="/images/third-party-logos/anthropic.svg" alt="Anthropic" />
          <img className="graduate-section__logo h-6" src="/images/third-party-logos/openai.svg" alt="OpenAI" />
          <img className="graduate-section__logo h-6" src="/images/third-party-logos/deepmind.svg" alt="Google DeepMind" />
          <img className="graduate-section__logo h-6" src="/images/third-party-logos/govai.png" alt="Centre for Governance of AI" />
          <img className="graduate-section__logo h-6" src="/images/third-party-logos/exrisk.png" alt="Centre for the Study of Existential Risk" />
          <img className="graduate-section__logo h-6" src="/images/third-party-logos/metr.png" alt="METR" />
        </div>
      </div>
    </div>
  );
};

export default GraduateSection;
