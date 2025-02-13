import { FaceTiles, Section } from '@bluedot/ui';

const faces = [
  { src: '/images/graduates/matthew.png', alt: 'Matthew' },
  { src: '/images/graduates/sarah.png', alt: 'Sarah' },
  { src: '/images/graduates/kendrea.png', alt: 'Kendrea' },
];

const GraduateSection = () => {
  return (
    <Section className="graduate-section !py-8">
      <div className="graduate-section__container flex flex-col md:flex-row gap-6 items-center">
        <div className="graduate-section__header flex items-center gap-2 shrink-0">
          <FaceTiles faces={faces} />
          <p className="graduate-section__text flex-shrink-0">Our graduates work at</p>
        </div>
        <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-200px),transparent_100%)]">
          <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none">
            <li><img className="h-3" src="/images/third-party-logos/anthropic.svg" alt="Anthropic" /></li>
            <li><img className="h-6" src="/images/third-party-logos/exrisk.svg" alt="Centre for the Study of Existential Risk" /></li>
            <li><img className="h-6" src="/images/third-party-logos/openai.svg" alt="OpenAI" /></li>
            <li><img className="h-6" src="/images/third-party-logos/deepmind.svg" alt="Google DeepMind" /></li>
            <li><img className="h-6" src="/images/third-party-logos/govai.png" alt="Centre for Governance of AI" /></li>
            <li><img className="h-6" src="/images/third-party-logos/metr.png" alt="METR" /></li>
          </ul>
          <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none" aria-hidden="true">
            <li><img className="h-3" src="/images/third-party-logos/anthropic.svg" alt="Anthropic" /></li>
            <li><img className="h-6" src="/images/third-party-logos/exrisk.svg" alt="Centre for the Study of Existential Risk" /></li>
            <li><img className="h-6" src="/images/third-party-logos/openai.svg" alt="OpenAI" /></li>
            <li><img className="h-6" src="/images/third-party-logos/deepmind.svg" alt="Google DeepMind" /></li>
            <li><img className="h-6" src="/images/third-party-logos/govai.png" alt="Centre for Governance of AI" /></li>
            <li><img className="h-6" src="/images/third-party-logos/metr.png" alt="METR" /></li>
          </ul>
        </div>
      </div>
    </Section>
  );
};

export default GraduateSection;
