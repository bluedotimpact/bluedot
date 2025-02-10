import { FaceTiles, Section } from '@bluedot/ui';

const faces = [
  { src: '/images/graduates/matthew.png', alt: 'Matthew' },
  { src: '/images/graduates/sarah.png', alt: 'Sarah' },
  { src: '/images/graduates/kendrea.png', alt: 'Kendrea' },
];

const GraduateSection = () => {
  return (
    <Section className="graduate-section">
      <div className="graduate-section__container flex flex-row gap-6 items-center">
        <FaceTiles faces={faces} />
        <p className="graduate-section__text flex-shrink-0">Our graduates work at</p>
        <div className="graduate-section__logos-container flex flex-row gap-6 items-center">
          <img className="graduate-section__logo h-3" src="/images/third-party-logos/anthropic.svg" alt="Anthropic" />
          <img className="graduate-section__logo h-6" src="/images/third-party-logos/openai.svg" alt="OpenAI" />
          <img className="graduate-section__logo h-6" src="/images/third-party-logos/deepmind.svg" alt="Google DeepMind" />
          <img className="graduate-section__logo h-6" src="/images/third-party-logos/govai.png" alt="Centre for Governance of AI" />
          <img className="graduate-section__logo h-6" src="/images/third-party-logos/exrisk.svg" alt="Centre for the Study of Existential Risk" />
          <img className="graduate-section__logo h-6" src="/images/third-party-logos/metr.png" alt="METR" />
        </div>
      </div>
    </Section>
  );
};

export default GraduateSection;
