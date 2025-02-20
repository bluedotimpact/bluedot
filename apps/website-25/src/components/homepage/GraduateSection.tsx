import { FaceTiles, Section } from '@bluedot/ui';

const faces = [
  { src: '/images/graduates/matthew.png', alt: 'Matthew' },
  { src: '/images/graduates/sarah.png', alt: 'Sarah' },
  { src: '/images/graduates/kendrea.png', alt: 'Kendrea' },
];

const organizations = [
  { src: '/images/third-party-logos/anthropic.svg', alt: 'Anthropic' },
  { src: '/images/third-party-logos/aisi.png', alt: 'UK AI Safety Institute' },
  { src: '/images/third-party-logos/openai.svg', alt: 'OpenAI' },
  { src: '/images/third-party-logos/stanford-hai.png', alt: 'Stanford HAI' },
  { src: '/images/third-party-logos/deepmind.svg', alt: 'Google DeepMind' },
  { src: '/images/third-party-logos/carnegie.png', alt: 'Carnegie Endowment for International Peace' },
  { src: '/images/third-party-logos/meta.png', alt: 'Meta' },
  { src: '/images/third-party-logos/fas.png', alt: 'Federation of American Scientists' },
  { src: '/images/third-party-logos/govai.png', alt: 'EU AI Office' },
  { src: '/images/third-party-logos/scsp.png', alt: 'Special Competitive Studies Project' },
  { src: '/images/third-party-logos/apple.png', alt: 'Apple' },
  { src: '/images/third-party-logos/harvard.svg', alt: 'Harvard Kennedy School' },
  { src: '/images/third-party-logos/atlantic.png', alt: 'Atlantic Council' },
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
            {organizations.map((org) => (
              <li key={org.alt}><img className="h-6" src={org.src} alt={org.alt} /></li>
            ))}
          </ul>
          <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none" aria-hidden="true">
            {organizations.map((org) => (
              <li key={org.alt}><img className="h-6" src={org.src} alt={org.alt} /></li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
};

export default GraduateSection;
