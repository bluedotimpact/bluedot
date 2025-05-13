import clsx from 'clsx';
import { FaceTiles, Section } from '@bluedot/ui';
import { P } from '../Text';

const faces = [
  { src: '/images/graduates/matthew.png', alt: 'Matthew' },
  { src: '/images/graduates/sarah.png', alt: 'Sarah' },
  { src: '/images/graduates/kendrea.png', alt: 'Kendrea' },
];

const logos = [
  { src: '/images/third-party-logos/openai.svg', alt: 'OpenAI' },
  { src: '/images/third-party-logos/', alt: 'AI Security Institute' },
  { src: '/images/third-party-logos/', alt: 'United Nations' },
  { src: '/images/third-party-logos/anthropic.svg', alt: 'Anthropic', customClassName: '!h-3' },
  { src: '/images/third-party-logos/', alt: 'Amnesty International' },
  { src: '/images/third-party-logos/', alt: 'Time' },
  { src: '/images/third-party-logos/deepmind.svg', alt: 'Google DeepMind' },
  { src: '/images/third-party-logos/', alt: 'NATO' },
  { src: '/images/third-party-logos/', alt: 'OECD' },
  { src: '/images/third-party-logos/', alt: 'Stanford University: Human Centered Artificial Intelligence Institute' },
  { src: '/images/third-party-logos/', alt: 'Apple' },
  { src: '/images/third-party-logos/', alt: 'Harvard Kennedy School' },
];

const GraduateSection = () => {
  return (
    <Section className="graduate-section !py-8">
      <div className="graduate-section__container flex flex-col md:flex-row gap-6 items-center">
        <div className="graduate-section__header flex items-center gap-2 shrink-0">
          <FaceTiles faces={faces} />
          <P className="graduate-section__text flex-shrink-0">Our graduates work at</P>
        </div>
        <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-200px),transparent_100%)]">
          <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none">
            {logos.map((logo) => (
              <li key={logo.src}><img className={clsx('h-6', logo.customClassName)} src={logo.src} alt={logo.alt} /></li>
            ))}
          </ul>
          <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none" aria-hidden="true">
            {logos.map((logo) => (
              <li key={logo.src}><img className={clsx('h-6', logo.customClassName)} src={logo.src} alt={logo.alt} /></li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
};

export default GraduateSection;
