import { FaceTiles, Section } from '@bluedot/ui';

const faces = [
  { src: '/images/graduates/matthew.png', alt: 'Matthew' },
  { src: '/images/graduates/sarah.png', alt: 'Sarah' },
  { src: '/images/graduates/kendrea.png', alt: 'Kendrea' },
];

const GraduateSection = () => {
  return (
    <Section className="graduate-section">
      <div className="graduate-section__container flex flex-col md:flex-row gap-6 items-center">
        <div className="graduate-section__header flex items-center gap-2 shrink-0">
          <FaceTiles faces={faces} />
          <p className="graduate-section__text flex-shrink-0">Our graduates work at</p>
        </div>
        <div className="relative w-full overflow-hidden flex-1">
          <div className="absolute top-0 bottom-0 left-0 w-24 z-10 bg-gradient-to-r from-white to-transparent"></div>
          <div className="absolute top-0 bottom-0 right-0 w-24 z-10 bg-gradient-to-l from-white to-transparent"></div>
          
          <div className="infinite-scroll-wrapper">
            <div className="flex items-center justify-around min-w-full">
              <img className="h-3 mx-3" src="/images/third-party-logos/anthropic.svg" alt="Anthropic" />
              <img className="h-6 mx-3" src="/images/third-party-logos/exrisk.svg" alt="Centre for the Study of Existential Risk" />
              <img className="h-6 mx-3" src="/images/third-party-logos/openai.svg" alt="OpenAI" />
              <img className="h-6 mx-3" src="/images/third-party-logos/deepmind.svg" alt="Google DeepMind" />
              <img className="h-6 mx-3" src="/images/third-party-logos/govai.png" alt="Centre for Governance of AI" />
              <img className="h-6 mx-3" src="/images/third-party-logos/metr.png" alt="METR" />
            </div>
            <div className="flex items-center justify-around min-w-full">
              <img className="h-3 mx-3" src="/images/third-party-logos/anthropic.svg" alt="Anthropic" />
              <img className="h-6 mx-3" src="/images/third-party-logos/exrisk.svg" alt="Centre for the Study of Existential Risk" />
              <img className="h-6 mx-3" src="/images/third-party-logos/openai.svg" alt="OpenAI" />
              <img className="h-6 mx-3" src="/images/third-party-logos/deepmind.svg" alt="Google DeepMind" />
              <img className="h-6 mx-3" src="/images/third-party-logos/govai.png" alt="Centre for Governance of AI" />
              <img className="h-6 mx-3" src="/images/third-party-logos/metr.png" alt="METR" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default GraduateSection;
